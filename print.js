const shell = require('shelljs');
const path = require('path');
const fs = require('fs');

// Define the path to the 'backup' folder
const backupFolderPath = path.join(__dirname, 'backups');

// Get the list of all folders inside the 'backup' folder
const folders = shell.ls('-d', `${backupFolderPath}/*/`);

// Create an array of objects with folder name and modification time
const folderObjects = folders.map((folder) => {
  const stats = fs.statSync(folder); // Get folder stats
  return {
    folderName: path.basename(folder),
    folderPath: folder, // Save the full path of the folder
    modifiedTime: stats.mtime, // Get the modification time of the folder
  };
});

// Sort the folders by their modification time (most recent first)
const sortedFolders = folderObjects.sort((a, b) => b.modifiedTime - a.modifiedTime);

// Get the recent three folders
const recentThreeFolders = sortedFolders.slice(0, 3);

// Get the remaining folders
const remainingFolders = sortedFolders.slice(3);

// Print the most recent three folders
console.log("Recent Three Folders:");
console.log(recentThreeFolders);

// Print and delete the remaining folders
console.log("\nRemaining Folders (Deleting):");

remainingFolders.forEach((folder) => {
  console.log(`Deleting folder: ${folder.folderName}`);
  // Delete the folder recursively
  shell.rm('-rf', folder.folderPath);
});

console.log("Deletion complete.");
