const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require("@aws-sdk/client-dynamodb");

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

// Table definitions
const tables = [
  {
    TableName: `${service}-users-${stage}`,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "type", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "TypeIndex",
        KeySchema: [
          { AttributeName: "type", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  {
    TableName: `${service}-subscriptions-${stage}`,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "type", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "UserIdIndex",
        KeySchema: [
          { AttributeName: "userId", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: "TypeIndex",
        KeySchema: [
          { AttributeName: "type", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  {
    TableName: `${service}-orders-${stage}`,
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "customerId", AttributeType: "S" },
      { AttributeName: "type", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "CustomerIdIndex",
        KeySchema: [
          { AttributeName: "customerId", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: "TypeIndex",
        KeySchema: [
          { AttributeName: "type", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  {
    TableName: `${service}-products-${stage}`,
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "category", AttributeType: "S" },
      { AttributeName: "type", AttributeType: "S" },
      { AttributeName: "lowStock", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "CategoryIndex",
        KeySchema: [
          { AttributeName: "category", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: "TypeIndex",
        KeySchema: [
          { AttributeName: "type", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: "LowStockIndex",
        KeySchema: [
          { AttributeName: "lowStock", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  {
    TableName: `${service}-payments-${stage}`,
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "orderId", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "OrderIdIndex",
        KeySchema: [
          { AttributeName: "orderId", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: "StatusIndex",
        KeySchema: [
          { AttributeName: "status", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
];

async function createTables() {
  try {
    // Check existing tables
    const listCommand = new ListTablesCommand({});
    const existingTables = await client.send(listCommand);
    console.log("Existing tables:", existingTables.TableNames);

    // Create each table if it doesn't exist
    for (const tableDefinition of tables) {
      const tableName = tableDefinition.TableName;

      if (existingTables.TableNames.includes(tableName)) {
        console.log(`✓ Table ${tableName} already exists`);
      } else {
        console.log(`Creating table ${tableName}...`);
        const createCommand = new CreateTableCommand(tableDefinition);
        await client.send(createCommand);
        console.log(`✓ Table ${tableName} created successfully`);
      }
    }

    console.log("\n✅ All tables are ready!");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    process.exit(1);
  }
}

createTables();
