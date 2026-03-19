/**
 * ListFolderFileIds.js
 *
 * Lists all files in a given Drive folder and logs their file IDs,
 * names, and direct Drive URLs. Run from the Apps Script editor.
 *
 * Usage: Set FOLDER_ID below, then run listFolderFileIds().
 */

var FOLDER_ID = "YOUR_FOLDER_ID_HERE";

function listFolderFileIds() {
  var folder;
  try {
    folder = DriveApp.getFolderById(FOLDER_ID);
  } catch (e) {
    Logger.log("ERROR: Could not open folder '" + FOLDER_ID + "': " + e);
    return;
  }

  Logger.log("Folder: " + folder.getName() + " (" + FOLDER_ID + ")");
  Logger.log("=".repeat(80));

  var files = folder.getFiles();
  var count = 0;

  while (files.hasNext()) {
    var file = files.next();
    Logger.log(
      "Name:  " + file.getName() + "\n" +
      "ID:    " + file.getId() + "\n" +
      "URL:   https://drive.google.com/file/d/" + file.getId() + "/view\n" +
      "-".repeat(60)
    );
    count++;
  }

  Logger.log("Total files: " + count);
}

/**
 * Variant: recursively lists all files in a folder and its subfolders.
 * Output includes the subfolder path for context.
 */
function listFolderFileIdsRecursive() {
  var folder;
  try {
    folder = DriveApp.getFolderById(FOLDER_ID);
  } catch (e) {
    Logger.log("ERROR: Could not open folder '" + FOLDER_ID + "': " + e);
    return;
  }

  Logger.log("Folder: " + folder.getName() + " (" + FOLDER_ID + ")");
  Logger.log("=".repeat(80));

  var count = _listRecursive(folder, "");
  Logger.log("Total files: " + count);
}

function _listRecursive(folder, pathPrefix) {
  var count = 0;
  var path = pathPrefix ? pathPrefix + "/" + folder.getName() : folder.getName();

  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    Logger.log(
      "Path:  " + path + "/" + file.getName() + "\n" +
      "ID:    " + file.getId() + "\n" +
      "-".repeat(60)
    );
    count++;
  }

  var subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    count += _listRecursive(subfolders.next(), path);
  }

  return count;
}
