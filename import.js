const { MongoClient } = require('mongodb');
const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
// MongoDB connection URI
const uri = 'mongodb://localhost:27017';

async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases();
    return databasesList.databases.map(db => db.name);
}

async function listFolders() {
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

// Command-line function to handle MongoDB restore
const importMongoDB = async (folderName, dbName) => {
    const client = new MongoClient(uri);

    try {
        const sortedFolders = await listFolders();
        const folderLength = sortedFolders.filter((v) => v.folderName === folderName);

        if (folderLength.length !== 1) {
            console.error(`Folder name is wrong: ${folderName}`);
            return;
        }

        await client.connect();
        const databases = await listDatabases(client);
        if (databases.includes(dbName)) {
            console.error(`Database already exists. Delete the database before import.`);
            return;
        }

        // Construct the mongorestore command
        const command = `mongorestore --gzip --nsInclude=${dbName}.* --dir=${folderLength[0]?.folderPath}`;

        // Execute the shell command using shelljs
        if (shell.exec(command).code !== 0) {
            throw new Error('MongoDB restore failed');
        }

        console.log(chalk.green.bold(`MongoDB restore completed successfully for database: ${dbName} from folder: ${folderName}`))
    } catch (error) {
        console.error(`Error: ${error.message}`);
    } finally {
        await client.close(); // Ensure the client is closed after the operation
    }
};

// Command-line argument processing
const args = process.argv.slice(2); // Skips the first two arguments (node and script name)
if (args.length < 2) {
    console.error('Usage: node restoreMongoDB.js <folderName> <dbName>');
    process.exit(1);
}

const [folderName, dbName] = args;
importMongoDB(folderName, dbName);
