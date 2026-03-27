  const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
  const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
  const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
  const fs = require("fs");
  const path = require("path");
  const { google } = require("googleapis");

  // Spreadsheet IDs from Config.js
  const SPREADSHEETS = {
    MEMBER_DIRECTORY: "1sziizIl6-iOMDgVx5okS3uuu_s5P7caytJt650zWGKg",
    RESERVATIONS: "1ex842fsnFpAnlh-5QE-u6xaBMTO52JGQTsriaxjk2EI",
    SYSTEM_BACKEND: "1WvN4xU_ZxElwpkXQVdt0HlUkjXcCA_ZaImklSLvuzeI",
    PAYMENT_TRACKING: "1w6XxUwaEq_-sLAn3edy8JYkL2EBNwgDAfkz0GHlD8zg"
  };

  let sheetsApi = null;

  // Initialize Google Sheets API
  async function initSheets() {
    try {
  		const keyPath = path.join(__dirname, "..", ".gea", "service-account.json");
      if (!fs.existsSync(keyPath)) {
        throw new Error(`Service account key not found at ${keyPath}`);
      }

      const keyFile = JSON.parse(fs.readFileSync(keyPath, "utf8"));

      // Create JWT auth with impersonation (like Python's .with_subject())
      const auth = new google.auth.JWT({
        email: keyFile.client_email,
        key: keyFile.private_key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        subject: "treasurer@geabotswana.org"
      });

      sheetsApi = google.sheets({ version: "v4", auth });
      console.error("✓ Google Sheets API initialized");
    } catch (error) {
      console.error("Error initializing Sheets API:", error.message);
      process.exit(1);
    }
  }

  // Fetch sheet data
  async function getSheetData(spreadsheetId, range) {
    try {
      const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId,
        range
      });
      return response.data.values || [];
    } catch (error) {
      throw new Error(`Failed to read sheet: ${error.message}`);
    }
  }

  // List sheets in a spreadsheet
  async function listSheets(spreadsheetId) {
    try {
      const response = await sheetsApi.spreadsheets.get({
        spreadsheetId
      });
      return response.data.sheets.map(sheet => sheet.properties.title);
    } catch (error) {
      throw new Error(`Failed to list sheets: ${error.message}`);
    }
  }

  // Tool handlers
  async function handleGetSheet(args) {
    const { spreadsheet, sheet, range } = args;

    if (!SPREADSHEETS[spreadsheet]) {
      throw new Error(`Unknown spreadsheet: ${spreadsheet}. Available: ${Object.keys(SPREADSHEETS).join(", ")}`);
    }

    const spreadsheetId = SPREADSHEETS[spreadsheet];
    const fullRange = range ? `${sheet}!${range}` : sheet;

    const data = await getSheetData(spreadsheetId, fullRange);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async function handleListSheets(args) {
    const { spreadsheet } = args;

    if (!SPREADSHEETS[spreadsheet]) {
      throw new Error(`Unknown spreadsheet: ${spreadsheet}. Available: ${Object.keys(SPREADSHEETS).join(", ")}`);
    }

    const spreadsheetId = SPREADSHEETS[spreadsheet];
    const sheets = await listSheets(spreadsheetId);

    return {
      content: [
        {
          type: "text",
          text: `Sheets in ${spreadsheet}:\n${sheets.map(s => `  - ${s}`).join("\n")}`
        }
      ]
    };
  }

  // Start server
  async function main() {
    await initSheets();

    const server = new Server(
      {
        name: "gea-sheets-mcp",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_sheet",
            description: "Read data from a specific sheet or range",
            inputSchema: {
              type: "object",
              properties: {
                spreadsheet: {
                  type: "string",
                  description: "Spreadsheet name: MEMBER_DIRECTORY, RESERVATIONS, SYSTEM_BACKEND, or PAYMENT_TRACKING",
                  enum: Object.keys(SPREADSHEETS)
                },
                sheet: {
                  type: "string",
                  description: "Sheet name (e.g., 'Individuals', 'Households')"
                },
                range: {
                  type: "string",
                  description: "Optional cell range (e.g., 'A1:D10'). If omitted, reads entire sheet"
                }
              },
              required: ["spreadsheet", "sheet"]
            }
          },
          {
            name: "list_sheets",
            description: "List all sheets in a spreadsheet",
            inputSchema: {
              type: "object",
              properties: {
                spreadsheet: {
                  type: "string",
                  description: "Spreadsheet name: MEMBER_DIRECTORY, RESERVATIONS, SYSTEM_BACKEND, or PAYMENT_TRACKING",
                  enum: Object.keys(SPREADSHEETS)
                }
              },
              required: ["spreadsheet"]
            }
          }
        ]
      };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { params } = request;
      const { name, arguments: args } = params;

      if (name === "get_sheet") {
        return await handleGetSheet(args);
      } else if (name === "list_sheets") {
        return await handleListSheets(args);
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("GEA Sheets MCP server running on stdio");
  }

  main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
