// app.js
const express = require('express');
const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const shell = require('shelljs');
const fs = require('fs');
const manageMongoDB = require('./router/manageRoute')
const app = express();

const backupDir = path.join(__dirname, 'backups');
// Function to create MongoDB backup
const backupMongoDB = () => {

  // Get current timestamp
  const date = new Date();
  const timestamp = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;

  // Directory for the dump
  const dumpDir = `${backupDir}/backup-${timestamp}`;

  const dbName = "Test2"
  // Command to take backup of all MongoDB databases with gzip compression
  const backupCommand = `mongodump --db=${dbName} --gzip --out=${backupDir}/backup-${timestamp}`;
  //   mongorestore --gzip --nsInclude="Test.*" --dir=/Users/deepakkumar/Desktop/App/Test/mongodbbackup/backups/backup-2024-10-16-14-32-0;
  // Execute the backup command
  exec(backupCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Backup failed: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Backup error: ${stderr}`);
      return;
    }
    console.log(`Backup successful: ${stdout}`);

  });
};

const manageBackupFile = () => {

  // Get the list of all folders inside the 'backup' folder
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
  const sortedFolders = folderObjects.sort((a, b) => b.modifiedTime - a.modifiedTime);

  const remainingFolders = sortedFolders.slice(3);
  console.log('remainingFolders:', remainingFolders)

  remainingFolders.forEach((folder) => {
    console.log(`Deleting folder: ${folder.folderName}`);
    // Delete the folder recursively
    shell.rm('-rf', folder.folderPath);
  });

}
// Schedule backup every 2 minutes for testing
// cron.schedule('*/30 * * * * *', () => {
//   console.log('Running database backup...');
//   backupMongoDB();
//   manageBackupFile()
// });

cron.schedule('0 0 */1 * * *', () => {
  console.log('Running database backup every hour...');
  backupMongoDB();
  manageBackupFile();
});

app.use("/api", manageMongoDB)
// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
