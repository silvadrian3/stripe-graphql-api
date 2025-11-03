"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const config = process.env.IS_OFFLINE
    ? { region: "localhost", endpoint: "http://localhost:8000" }
    : {};
const client = new DynamoDBClient(config);
exports.default = client;
//# sourceMappingURL=dynamodb-client.js.map