const { DynamoDBClient, ScanCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

// Configuration for local DynamoDB
const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "local",
    secretAccessKey: "local",
  },
});

const stage = process.env.STAGE || "dev";
const service = "stripe-graphql-api";

const tables = [
  { name: `${service}-users-${stage}`, type: "user", keyField: "id" },
  { name: `${service}-subscriptions-${stage}`, type: "subscription", keyField: "id" },
  { name: `${service}-orders-${stage}`, type: "order", keyFields: { PK: true, SK: true } },
  { name: `${service}-products-${stage}`, type: "product", keyFields: { PK: true, SK: true } },
];

async function migrateTable(tableName, entityType, keyInfo) {
  try {
    console.log(`\n📋 Scanning table: ${tableName}`);

    const scanCommand = new ScanCommand({
      TableName: tableName,
    });

    const result = await client.send(scanCommand);
    const items = result.Items || [];

    console.log(`Found ${items.length} items`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      const unmarshalled = unmarshall(item);

      // Check if type field already exists
      if (unmarshalled.type) {
        skippedCount++;
        continue;
      }

      // Build key object based on table structure
      let key;
      if (typeof keyInfo === "string") {
        // Simple key (id)
        key = { [keyInfo]: unmarshalled[keyInfo] };
      } else {
        // Composite key (PK, SK)
        key = {
          PK: unmarshalled.PK,
          SK: unmarshalled.SK,
        };
      }

      // Update the item to add the type field
      const updateCommand = new UpdateItemCommand({
        TableName: tableName,
        Key: marshall(key),
        UpdateExpression: "SET #type = :type",
        ExpressionAttributeNames: {
          "#type": "type",
        },
        ExpressionAttributeValues: marshall({
          ":type": entityType,
        }),
      });

      await client.send(updateCommand);
      updatedCount++;
    }

    console.log(`✓ Updated: ${updatedCount} items`);
    console.log(`- Skipped: ${skippedCount} items (already have type field)`);

  } catch (error) {
    console.error(`❌ Error migrating table ${tableName}:`, error.message);
  }
}

async function migrate() {
  console.log("🔄 Starting migration to add 'type' field to all tables...\n");

  for (const table of tables) {
    const keyInfo = table.keyField || table.keyFields;
    await migrateTable(table.name, table.type, keyInfo);
  }

  console.log("\n✅ Migration completed!");
}

migrate();
