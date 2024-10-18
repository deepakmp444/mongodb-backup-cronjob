const chalk = require("chalk");
const shell = require('shelljs');
const path = require('path');
const fs = require('fs');

 const  listFolders = () => {
    // Assuming the 'backup' folder is in the root of the project
    const backupDir = path.join(__dirname, 'backups'); // Go up one directory and then access 'backup'

    const folders = shell.ls('-d', `${backupDir}/*/`);

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
    return folderObjects.sort((a, b) => b.modifiedTime - a.modifiedTime);
}

let result = listFolders()
console.log(chalk.green.bold('Folder List:\n') + chalk.blue(JSON.stringify(result, null, 2)));
