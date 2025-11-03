const { DynamoDBClient, DeleteTableCommand, ListTablesCommand } = require("@aws-sdk/client-dynamodb");

// Configuration for local DynamoDB
const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "local",
    secretAccessKey: "local",
  },
});

async function deleteTables() {
  try {
    // List all tables
    const listCommand = new ListTablesCommand({});
    const existingTables = await client.send(listCommand);

    console.log("Existing tables:", existingTables.TableNames);

    if (!existingTables.TableNames || existingTables.TableNames.length === 0) {
      console.log("No tables to delete.");
      return;
    }

    // Delete each table
    for (const tableName of existingTables.TableNames) {
      console.log(`Deleting table ${tableName}...`);
      const deleteCommand = new DeleteTableCommand({ TableName: tableName });
      await client.send(deleteCommand);
      console.log(`✓ Table ${tableName} deleted successfully`);
    }

    console.log("\n✅ All tables deleted!");
  } catch (error) {
    console.error("❌ Error deleting tables:", error);
    process.exit(1);
  }
}

deleteTables();
