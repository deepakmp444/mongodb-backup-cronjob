const chalk = require('chalk');
const { MongoClient } = require('mongodb');

// MongoDB connection URI
const uri = 'mongodb://localhost:27017'; // Replace with your MongoDB URI

async function listDatabases(client) {
  const databasesList = await client.db().admin().listDatabases();
  databasesList.databases.forEach(db => console.log(chalk.green(`-${db.name}`)));
  return databasesList.databases.map(db => db.name);
}

async function main() {
  const client = new MongoClient(uri);

  // Get the database name from command-line arguments
  const getDBName = process.argv[2]; // Get the third argument from the terminal

  if (!getDBName) {
    console.error("Please provide a database name to delete.");
    process.exit(1); // Exit if no database name is provided
  }

  try {
    // Connect to MongoDB
    await client.connect();

    // List all databases
    const databases = await listDatabases(client);

    // Check if the specified database exists
    if (databases.includes(getDBName)) {
      console.log(chalk.bold.green(`Database '${getDBName}' found.`))
    } else {
      console.error(`Database '${getDBName}' not found.`);
    }
  } finally {
    // Close the connection
    await client.close();
  }
}

// Run the main function and handle errors
main().catch(console.error);
