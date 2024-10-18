// app.js
const express = require('express');
const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const app = express();

// Function to create MongoDB backup
const backupMongoDB = () => {
  // Define backup directory
  const backupDir = path.join(__dirname, 'backups');
  
  // Get current timestamp
  const date = new Date();
  const timestamp = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
  
  // Directory for the dump
  const dumpDir = `${backupDir}/backup-${timestamp}`;

  const dbName = "Test"
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

// Schedule backup every 2 minutes for testing
cron.schedule('*/2 * * * *', () => {
  console.log('Running database backup...');
  backupMongoDB();
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
