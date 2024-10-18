const { MongoClient } = require('mongodb');
const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
// MongoDB connection URI
const uri = 'mongodb://localhost:27017'; // Replace with your MongoDB URI

async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases();
    // console.log("Databases:");
    // databasesList.databases.forEach(db => console.log(`- ${db.name}`));
    return databasesList.databases.map(db => db.name);
}

async function listFolders() {
    // Assuming the 'backup' folder is in the root of the project
    const backupDir = path.join(__dirname, '..', 'backups'); // Go up one directory and then access 'backup'
    // console.log('backupDir:', backupDir)

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

const checkMongoDB = async (req, res) => {
    const params = req.params
    console.log('dbName:', params.dbName)
    const client = new MongoClient(uri);

    try {
        // Connect to MongoDB
        await client.connect();

        // List all databases
        const databases = await listDatabases(client);

        if (databases.includes(params.dbName)) {
            res.json({ message: `Database ${params.dbName} found` })
        } else {
            res.json({ message: `Database '${params.dbName}' not found.` })
        }
    } catch (error) {
        res.json({ message: error.message })
    }
}

const importMongoDB = async (req, res) => {
    const client = new MongoClient(uri);

    try {
        const { folderName, dbName } = req.params;
        const sortedFolders = await listFolders();
        const folderLength = sortedFolders.filter((v) => v.folderName === folderName);
        console.log('folderLength:', folderLength);

        if (folderLength.length !== 1) {
            res.json({ message: 'Folder name is wrong:', folderName });
            return;
        }

        await client.connect();
        const databases = await listDatabases(client);
        if (databases.includes(dbName)) {
            res.json({ message: `Database already exists. Delete the database before import.` });
            return;
        }

        // Construct the mongorestore command
        const command = `mongorestore --gzip --nsInclude=${dbName}.* --dir=${folderLength[0]?.folderPath}`;
        console.log('command:', command);

        // Execute the shell command using shelljs
        if (shell.exec(command).code !== 0) {
            throw new Error('MongoDB restore failed');
        }

        res.json({ message: 'MongoDB restore completed successfully', dbName, folderName });

    } catch (error) {
        res.json({ message: error.message });
    } finally {
        await client.close(); // Ensure the client is closed after the operation
    }
};


const getAllDatabase = async (req, res) => {
    const client = new MongoClient(uri);

    try {
        // Connect to MongoDB
        await client.connect();
        // List all databases
        const databases = await listDatabases(client);
        res.json({ Database: databases })
    } catch (error) {
        res.json({ message: error.message })
    }
}

const getAllBackupFolderList = async (req, res) => {
    try {
        const sortedFolders = await listFolders()
        res.json({ Folders: sortedFolders });
    } catch (error) {
        res.json({ message: error.message });
    }
}

const deleteDatabase = async (req, res) => {
    const params = req.params
    const dbName = params.dbName
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const databases = await listDatabases(client);

        if (databases.includes(dbName)) {
            await client.db(dbName).dropDatabase();
            res.json({ message: `Database ${dbName} Deleted` })
        } else {
            res.json({ message: `Database '${params.dbName}' not found.` })
        }
    } catch (error) {
        res.json({ message: error.message });

    }
}

module.exports = { checkMongoDB, importMongoDB, getAllDatabase, getAllBackupFolderList, deleteDatabase }