/**
 * BOARD EMAIL CONFIGURATION — SETUP INSTRUCTIONS
 *
 * The service account private key is NO LONGER stored in this file.
 * Instead, it's stored securely in PropertiesService (Google Apps Script built-in storage).
 *
 * WHY THE CHANGE?
 * - Private keys should never be in version control (even in .claspignore files)
 * - PropertiesService survives clasp push/pull operations
 * - One-time setup, then the key persists indefinitely
 * - More secure than file-based storage
 *
 * INITIAL SETUP (One Time Only):
 * =================================
 * 1. In Google Apps Script editor, open the console (View > Logs)
 * 2. Run this command to initialize the service account:
 *
 *    initializeBoardServiceAccount({
 *      "type": "service_account",
 *      "project_id": "gea-association-platform",
 *      "private_key_id": "21635e6bf1258cc6085c4b6faad6e84e58534ca6",
 *      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDB9pF+vI2INUhE\nRCgi8NyJ2wlqaBW2OMaa+mRwqmTeAnbaXo5zR8GFQgnsbqmgOHhHqo2FmMrQINJH\ndd2O9UxZQKzY50w4Fs/DdXoeYlYs0QRq5ZzpfLg+EUZb5CTaxI76pc+hF6R0Mc+z\nGNWabvBNHShcwfXiw1f5aI4ZVOMmUbnmedYJX6/h7ZTnabnmpvgMo6hwCKyIQ023\n5zsdKVp+rhwyfi89rwj+uzndAmydWhZIJrVKkDnbZnRCLZhi2az/4FYnmEOjPHtx\nAEfyFdwraqvdi8PnWfVJW7ybqZlICaLYTfsNAVQOfmYuWbu+kpdTQ3MTYRL0TtHZ\nXaUiTLO1AgMBAAECggEAMsnF+joUE0Tkad+w5MlN7hj5I7Aic0b1ljIXZ7ruU4Ww\nqmhVA5GX9jU/FPY7G1V+BUH+8ar6/DmD5itSOvM3LS22tMsH1a3/dA5ITjlwmCaY\n8gayqh66vaHXWwtnrRMH31DYh7WBnd1HJf3MPLZs3LxUS8mMAXcmC4wZnT9xhSAv\nNpb1vnpgG+PIJGE8SkEQtuQ6EyyU+lx7PAH8NXV1zpsonYOvwMUBlt5NhgfcrH+v\njZUqVnITzeCbVyxyabgstgwE0NtZQhcy4qwRCY8OBWDvsbJTEIknMXXFiSowHS5z\nRKuFqWv8vZza2svPPRjCpcMwkvcSGfJ5bUbWap9BtwKBgQDwRC17lFLCDB08Brdo\nEkY+AzwRkRpa1riqtAyapIDjh6QGLn82rz9d3pLzf+FYDRGGsmVfSv4QKNxRZoZt\n+W7XnpEHVv7bwX7a7NbQStQ5D8PePzthbbwS0aAlbZPGhURE5uKiuGBqvjLMd7oG\nt4MnYL823zoQoEuLpLbHvXS9uwKBgQDOqio3Tc6V48dZ5a5Vgc0wN7X/rbbUVMRp\npetvqRgfL8XimSQ1rQ8XcIHWKSJh8fu/V0Sbnm8MuEycdS8/BqThYsLIVMM77UfK\nTa6m6WEEE2zJPO3cyD8EjbjvadIqhI34RIuhS5YGuvy+lp9RmcOEG8/bWpgG1zFj\nOZA3aNyFTwKBgGQQINkc1rKWFP7Q1UV0huiAtF2kjtNSJaqCPdWRuVQJQ5iHeNev\neLaBYbYjhhgDqU7tsSZUtybHvanxBv96KF2IXmIuKwoetdQ7WuN4ppX1KN/AedyD\ntRYpU4cC8c515g7EEZMvMoiCGenp2wG9H9QgiMIziZ0vBQdtW+onzxzNAoGBAMGw\nPeyjIZDdcALS/nbpNlOQgyRjvMx3vbV+aY+3HQJtlbrv6D3eOhyvtx/uYWkGj/ke\nYxCuhkmXmUWxllwtb+5Ez2VN+8R4eCYkdCG+7MwTIIvibNPVYSp1YPQRa4Wpwh0C\nsRK0cqFQMny1Ug/6WoHARyjAWWdf28uxMXac8sCFAoGBAN0IXfZr8C2n7ae7YqJk\nanXMt9RucOgFaCHdvDMC+4pGbWdIfTJcSKdb4wYDt5MAzolpKiJe6HorvP43bao2\nNA+44b15kKSys3frZHwuYKFbhqS6Ywsw0nqyR7vwVhFCVQ/pzvbZDRGIAej6nQOR\nMuW0qeF2R36au+Uy4h1Iwhbi\n-----END PRIVATE KEY-----\n",
 *      "client_email": "gea-apps-script@gea-association-platform.iam.gserviceaccount.com",
 *      "client_id": "103447254506932885625",
 *      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
 *      "token_uri": "https://oauth2.googleapis.com/token",
 *      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
 *      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/gea-apps-script%40gea-association-platform.iam.gserviceaccount.com"
 *    });
 *
 * 3. Check the Logs output: "Successfully stored Board service account credentials in PropertiesService"
 * 4. Done! The key is now securely stored and will survive all clasp operations.
 *
 * RECOVERY (If Key Is Lost):
 * ===========================
 * The key is safe in PropertiesService and will NOT be lost by:
 * - clasp push or clasp pull
 * - Browser refresh or Apps Script editor close
 * - Cloning the repo to a new machine
 *
 * To verify it's stored:
 *   var account = _getBoardServiceAccount();
 *   if (account) { Logger.log("Service account is initialized"); }
 *
 * If you NEED to change the key:
 * 1. Get the new service account JSON from Google Cloud Console
 * 2. Run initializeBoardServiceAccount() again with the new key
 * 3. The old key is automatically replaced
 *
 * RELATED CONFIGURATION:
 * ======================
 * Also stored in PropertiesService:
 * - None (only the service account JSON)
 *
 * Configuration still in code (see Config.js):
 * - BOARD_SERVICE_ACCOUNT_EMAIL (can be hardcoded, it's not secret)
 * - BOARD_EMAIL_TO_SEND_FROM
 * - BOARD_EMAIL_DISPLAY_NAME
 * - BOARD_EMAIL_DELEGATED_USER
 */

// Service account email that has Domain-Wide Delegation enabled
// (No longer needs to be paired with private key in same file)
var BOARD_SERVICE_ACCOUNT_EMAIL = "gea-apps-script@gea-association-platform.iam.gserviceaccount.com";

// Email address to send from (via delegated impersonation)
var BOARD_EMAIL_TO_SEND_FROM = "board@geabotswana.org";

// Friendly display name in From header
var BOARD_EMAIL_DISPLAY_NAME = "GEA Executive Board";

// User account that has "Send As" delegation for board@geabotswana.org
// This account will be impersonated by the service account
var BOARD_EMAIL_DELEGATED_USER = "treasurer@geabotswana.org";

// Google Cloud project ID
var GCP_PROJECT_ID = "gea-association-platform";
