"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_client_1 = __importDefault(require("./dynamodb-client"));
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const https_1 = __importDefault(require("https"));
// Helper function to make HTTPS GET requests
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https_1.default.get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (e) {
                    reject(new Error("Failed to parse JSON response"));
                }
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}
async function listTodos() {
    try {
        const params = {
            TableName: "TodoTable",
        };
        const command = new client_dynamodb_1.ScanCommand(params);
        const request = await dynamodb_client_1.default.send(command);
        const parseResponse = request.Items?.map((data) => (0, util_dynamodb_1.unmarshall)(data)) || [];
        return parseResponse;
    }
    catch (e) {
        console.error("Error listing todos:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to list todos");
    }
}
async function fetchUsers() {
    try {
        const users = await httpsGet("https://jsonplaceholder.typicode.com/users");
        console.log(`Fetched ${users.length} users from JSONPlaceholder`);
        return users;
    }
    catch (e) {
        console.error("Error fetching users:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to fetch users");
    }
}
async function fetchPosts() {
    try {
        const posts = await httpsGet("https://jsonplaceholder.typicode.com/posts");
        console.log(`Fetched ${posts.length} posts from JSONPlaceholder`);
        return posts;
    }
    catch (e) {
        console.error("Error fetching posts:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to fetch posts");
    }
}
async function fetchUserById(userId) {
    try {
        const user = await httpsGet(`https://jsonplaceholder.typicode.com/users/${userId}`);
        console.log(`Fetched user ${userId} from JSONPlaceholder`);
        return user;
    }
    catch (e) {
        console.error(`Error fetching user ${userId}:`, e);
        throw new Error(e instanceof Error ? e.message : `Failed to fetch user ${userId}`);
    }
}
const queryResolvers = {
    todos: async (_ctx) => {
        return listTodos();
    },
    users: async (_ctx) => {
        return fetchUsers();
    },
    posts: async (_ctx) => {
        return fetchPosts();
    },
};
const postResolvers = {
    author: async (ctx) => {
        const post = ctx.source;
        if (!post.userId) {
            throw new Error("Post does not have a userId");
        }
        return fetchUserById(post.userId);
    },
};
const handler = async (ctx) => {
    const { parentTypeName, fieldName } = ctx.info;
    // Handle Query resolvers
    if (parentTypeName === "Query") {
        const resolver = queryResolvers[fieldName];
        if (resolver) {
            return await resolver(ctx);
        }
    }
    // Handle Post field resolvers
    if (parentTypeName === "Post") {
        const resolver = postResolvers[fieldName];
        if (resolver) {
            return await resolver(ctx);
        }
    }
    throw new Error(`Resolver not found for ${parentTypeName}.${fieldName}`);
};
exports.handler = handler;
//# sourceMappingURL=query.js.map