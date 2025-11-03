const { DynamoDBClient, ScanCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const { v4: uuidv4 } = require("uuid");

// Configuration for local DynamoDB
const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "local",
    secretAccessKey: "local",
  },
});

const USERS_TABLE = "stripe-graphql-api-users-dev";

async function seedUsers() {
  try {
    // First, check existing users
    console.log("Checking existing users...");
    const scanCommand = new ScanCommand({
      TableName: USERS_TABLE,
    });
    const scanResult = await client.send(scanCommand);

    console.log(`Found ${scanResult.Count || 0} existing users in the database`);

    // Create sample users
    const sampleUsers = [
      {
        id: uuidv4(),
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        type: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: "Jane Smith",
        username: "janesmith",
        email: "jane@example.com",
        type: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: "Bob Johnson",
        username: "bobjohnson",
        email: "bob@example.com",
        address: {
          street: "123 Main St",
          city: "New York",
          zipcode: "10001",
        },
        type: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    console.log(`\nCreating ${sampleUsers.length} sample users...`);

    for (const user of sampleUsers) {
      const command = new PutItemCommand({
        TableName: USERS_TABLE,
        Item: marshall(user, { removeUndefinedValues: true }),
      });

      await client.send(command);
      console.log(`✓ Created user: ${user.name} (${user.email})`);
    }

    console.log("\n✅ Sample users created successfully!");
    console.log("\nYou can now query users using the GraphQL API.");

  } catch (error) {
    console.error("❌ Error seeding users:", error);
    process.exit(1);
  }
}

seedUsers();
