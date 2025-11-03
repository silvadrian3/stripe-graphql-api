import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const config = process.env.IS_OFFLINE
  ? { region: "localhost", endpoint: "http://localhost:8000" }
  : {};

const client = new DynamoDBClient(config);

export default client;
