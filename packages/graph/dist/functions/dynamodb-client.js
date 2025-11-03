"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const config = process.env.IS_OFFLINE
    ? { region: "localhost", endpoint: "http://localhost:8000" }
    : {};
const client = new client_dynamodb_1.DynamoDBClient(config);
exports.default = client;
//# sourceMappingURL=dynamodb-client.js.map