const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const shell = require('shelljs');
const fs = require('fs');
const chalk = require('chalk');

const backupDir = path.join(__dirname, 'backups');

// Function to create MongoDB backup
const backupMongoDB = () => {
  console.log(chalk.blue('Starting MongoDB backup...'));

  // Get current timestamp
  const date = new Date();
  const timestamp = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;

  const dbName = "Test2";
  // Command to take backup of MongoDB database with gzip compression
  const backupCommand = `mongodump --db=${dbName} --gzip --out=${backupDir}/backup-${timestamp}`;

  // const uri = "mongodb://username:password@localhost:27017/?authSource=admin"; // MongoDB URI with authentication
  // Command to take backup using the MongoDB URI
  // const backupCommand = `mongodump --uri="${uri}" --db=${dbName} --gzip --out=${backupDir}/backup-${timestamp}`;

  // Execute the backup command
  exec(backupCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(chalk.red(`Backup failed: ${error.message}`));
      return;
    }
    if (stderr) {
      console.error(chalk.red(`Backup error: ${stderr}`));
      return;
    }
    console.log(chalk.green(`Backup successful for ${dbName} at ${timestamp}`));
    console.log(); // Add empty line for separation

  });
};

const manageBackupFile = () => {
  console.log(chalk.blue('Managing old backup files...'));

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

  // Remove older backups, keep only the 3 most recent ones
  const remainingFolders = sortedFolders.slice(3);

  if (remainingFolders.length > 0) {
    remainingFolders.forEach((folder) => {
      console.log(chalk.red(`Deleting old backup: ${folder.folderName}`));
      // Delete the folder recursively
      shell.rm('-rf', folder.folderPath);
    });
  } else {
    console.log(chalk.yellow('No old backups to delete.'));
  }
};

// Schedule backup every 30 seconds for testing
console.log(chalk.magenta('Cron job function starting...')); // Log when cron job is first initialized
cron.schedule('*/30 * * * * *', () => {
  console.log(chalk.cyan('Cron job triggered. Running database backup...'));
  backupMongoDB();
  manageBackupFile();
  console.log(chalk.cyan('Cron job execution completed.'));
});

// Uncomment this for actual use, scheduling backup every hour
// cron.schedule('0 0 */1 * * *', () => {
//   console.log('Running database backup every hour...');
//   backupMongoDB();
//   manageBackupFile();
// });
