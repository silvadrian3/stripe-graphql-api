"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_client_1 = __importDefault(require("./dynamodb-client"));
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const USERS_TABLE = process.env.USERS_TABLE || "stripe-graphql-api-users-dev";
const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE || "stripe-graphql-api-subscriptions-dev";
const ORDERS_TABLE = process.env.ORDERS_TABLE || "stripe-graphql-api-orders-dev";
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "stripe-graphql-api-products-dev";
const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE || "stripe-graphql-api-payments-dev";
// DynamoDB User Operations
async function fetchUsers() {
    try {
        console.log("Fetching users from DynamoDB");
        const command = new client_dynamodb_1.QueryCommand({
            TableName: USERS_TABLE,
            IndexName: "TypeIndex",
            KeyConditionExpression: "#type = :type",
            ExpressionAttributeNames: {
                "#type": "type",
            },
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                ":type": "user",
            }),
        });
        const result = await dynamodb_client_1.default.send(command);
        const users = result.Items?.map((item) => (0, util_dynamodb_1.unmarshall)(item)) || [];
        console.log(`Retrieved ${users.length} users from DynamoDB`);
        return users;
    }
    catch (e) {
        console.error("Error fetching users:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to fetch users");
    }
}
// DynamoDB Subscription Operations
async function getSubscription(id) {
    try {
        console.log(`Getting subscription with id: ${id}`);
        const command = new client_dynamodb_1.GetItemCommand({
            TableName: SUBSCRIPTIONS_TABLE,
            Key: (0, util_dynamodb_1.marshall)({ id }),
        });
        const result = await dynamodb_client_1.default.send(command);
        if (!result.Item) {
            console.log(`Subscription ${id} not found`);
            return null;
        }
        const subscription = (0, util_dynamodb_1.unmarshall)(result.Item);
        console.log(`Retrieved subscription: ${id}`);
        return subscription;
    }
    catch (e) {
        console.error("Error getting subscription:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to get subscription");
    }
}
async function listSubscriptions() {
    try {
        console.log("Listing all subscriptions");
        const command = new client_dynamodb_1.QueryCommand({
            TableName: SUBSCRIPTIONS_TABLE,
            IndexName: "TypeIndex",
            KeyConditionExpression: "#type = :type",
            ExpressionAttributeNames: {
                "#type": "type",
            },
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                ":type": "subscription",
            }),
        });
        const result = await dynamodb_client_1.default.send(command);
        const subscriptions = result.Items?.map((item) => (0, util_dynamodb_1.unmarshall)(item)) || [];
        console.log(`Retrieved ${subscriptions.length} subscriptions`);
        return subscriptions;
    }
    catch (e) {
        console.error("Error listing subscriptions:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to list subscriptions");
    }
}
async function getSubscriptionsByUser(userId) {
    try {
        console.log(`Getting subscriptions for user: ${userId}`);
        const command = new client_dynamodb_1.QueryCommand({
            TableName: SUBSCRIPTIONS_TABLE,
            IndexName: "UserIdIndex",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                ":userId": userId,
            }),
        });
        const result = await dynamodb_client_1.default.send(command);
        const subscriptions = result.Items?.map((item) => (0, util_dynamodb_1.unmarshall)(item)) || [];
        console.log(`Retrieved ${subscriptions.length} subscriptions for user ${userId}`);
        return subscriptions;
    }
    catch (e) {
        console.error(`Error getting subscriptions for user ${userId}:`, e);
        throw new Error(e instanceof Error ? e.message : "Failed to get user subscriptions");
    }
}
// DynamoDB Order Operations
async function getOrder(orderId) {
    try {
        console.log(`Getting order with id: ${orderId}`);
        const command = new client_dynamodb_1.GetItemCommand({
            TableName: ORDERS_TABLE,
            Key: (0, util_dynamodb_1.marshall)({ PK: `ORDER#${orderId}`, SK: "METADATA" }),
        });
        const result = await dynamodb_client_1.default.send(command);
        if (!result.Item) {
            console.log(`Order ${orderId} not found`);
            return null;
        }
        const order = (0, util_dynamodb_1.unmarshall)(result.Item);
        console.log(`Retrieved order: ${orderId}`);
        return order;
    }
    catch (e) {
        console.error("Error getting order:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to get order");
    }
}
async function listOrders() {
    try {
        console.log("Listing all orders");
        const command = new client_dynamodb_1.QueryCommand({
            TableName: ORDERS_TABLE,
            IndexName: "TypeIndex",
            KeyConditionExpression: "#type = :type",
            ExpressionAttributeNames: {
                "#type": "type",
            },
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                ":type": "order",
            }),
        });
        const result = await dynamodb_client_1.default.send(command);
        const orders = result.Items?.map((item) => (0, util_dynamodb_1.unmarshall)(item)) || [];
        console.log(`Retrieved ${orders.length} orders`);
        return orders;
    }
    catch (e) {
        console.error("Error listing orders:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to list orders");
    }
}
async function getOrdersByCustomer(customerId) {
    try {
        console.log(`Getting orders for customer: ${customerId}`);
        const command = new client_dynamodb_1.QueryCommand({
            TableName: ORDERS_TABLE,
            IndexName: "CustomerIdIndex",
            KeyConditionExpression: "customerId = :customerId",
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                ":customerId": customerId,
            }),
        });
        const result = await dynamodb_client_1.default.send(command);
        const orders = result.Items?.map((item) => (0, util_dynamodb_1.unmarshall)(item)) || [];
        console.log(`Retrieved ${orders.length} orders for customer ${customerId}`);
        return orders;
    }
    catch (e) {
        console.error(`Error getting orders for customer ${customerId}:`, e);
        throw new Error(e instanceof Error ? e.message : "Failed to get customer orders");
    }
}
// DynamoDB Product Operations
async function getProduct(productId) {
    try {
        console.log(`Getting product with id: ${productId}`);
        const command = new client_dynamodb_1.GetItemCommand({
            TableName: PRODUCTS_TABLE,
            Key: (0, util_dynamodb_1.marshall)({ PK: `PRODUCT#${productId}`, SK: "METADATA" }),
        });
        const result = await dynamodb_client_1.default.send(command);
        if (!result.Item) {
            console.log(`Product ${productId} not found`);
            return null;
        }
        const product = (0, util_dynamodb_1.unmarshall)(result.Item);
        console.log(`Retrieved product: ${productId}`);
        return product;
    }
    catch (e) {
        console.error("Error getting product:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to get product");
    }
}
async function listProducts() {
    try {
        console.log("Listing all products");
        const command = new client_dynamodb_1.QueryCommand({
            TableName: PRODUCTS_TABLE,
            IndexName: "TypeIndex",
            KeyConditionExpression: "#type = :type",
            ExpressionAttributeNames: {
                "#type": "type",
            },
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                ":type": "product",
            }),
        });
        const result = await dynamodb_client_1.default.send(command);
        const products = result.Items?.map((item) => (0, util_dynamodb_1.unmarshall)(item)) || [];
        console.log(`Retrieved ${products.length} products`);
        return products;
    }
    catch (e) {
        console.error("Error listing products:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to list products");
    }
}
async function getProductsByCategory(category) {
    try {
        console.log(`Getting products for category: ${category}`);
        const command = new client_dynamodb_1.QueryCommand({
            TableName: PRODUCTS_TABLE,
            IndexName: "CategoryIndex",
            KeyConditionExpression: "category = :category",
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                ":category": category,
            }),
        });
        const result = await dynamodb_client_1.default.send(command);
        const products = result.Items?.map((item) => (0, util_dynamodb_1.unmarshall)(item)) || [];
        console.log(`Retrieved ${products.length} products for category ${category}`);
        return products;
    }
    catch (e) {
        console.error(`Error getting products for category ${category}:`, e);
        throw new Error(e instanceof Error ? e.message : "Failed to get products by category");
    }
}
async function getLowStockProducts() {
    try {
        console.log("Getting low stock products");
        const command = new client_dynamodb_1.QueryCommand({
            TableName: PRODUCTS_TABLE,
            IndexName: "LowStockIndex",
            KeyConditionExpression: "lowStock = :lowStock",
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                ":lowStock": "true",
            }),
        });
        const result = await dynamodb_client_1.default.send(command);
        const products = result.Items?.map((item) => (0, util_dynamodb_1.unmarshall)(item)) || [];
        console.log(`Retrieved ${products.length} low stock products`);
        return products;
    }
    catch (e) {
        console.error("Error getting low stock products:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to get low stock products");
    }
}
// DynamoDB Payment Operations
async function getPayment(paymentId) {
    try {
        console.log(`Getting payment with id: ${paymentId}`);
        const command = new client_dynamodb_1.GetItemCommand({
            TableName: PAYMENTS_TABLE,
            Key: (0, util_dynamodb_1.marshall)({ PK: `PAYMENT#${paymentId}`, SK: "METADATA" }),
        });
        const result = await dynamodb_client_1.default.send(command);
        if (!result.Item) {
            console.log(`Payment ${paymentId} not found`);
            return null;
        }
        const payment = (0, util_dynamodb_1.unmarshall)(result.Item);
        console.log(`Retrieved payment: ${paymentId}`);
        return payment;
    }
    catch (e) {
        console.error("Error getting payment:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to get payment");
    }
}
async function getPaymentsByOrder(orderId) {
    try {
        console.log(`Getting payments for order: ${orderId}`);
        const command = new client_dynamodb_1.QueryCommand({
            TableName: PAYMENTS_TABLE,
            IndexName: "OrderIdIndex",
            KeyConditionExpression: "orderId = :orderId",
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                ":orderId": orderId,
            }),
        });
        const result = await dynamodb_client_1.default.send(command);
        const payments = result.Items?.map((item) => (0, util_dynamodb_1.unmarshall)(item)) || [];
        console.log(`Retrieved ${payments.length} payments for order ${orderId}`);
        return payments;
    }
    catch (e) {
        console.error(`Error getting payments for order ${orderId}:`, e);
        throw new Error(e instanceof Error ? e.message : "Failed to get order payments");
    }
}
async function getFailedPayments() {
    try {
        console.log("Getting failed payments");
        const command = new client_dynamodb_1.QueryCommand({
            TableName: PAYMENTS_TABLE,
            IndexName: "StatusIndex",
            KeyConditionExpression: "#status = :status",
            ExpressionAttributeNames: {
                "#status": "status",
            },
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                ":status": "failed",
            }),
        });
        const result = await dynamodb_client_1.default.send(command);
        const payments = result.Items?.map((item) => (0, util_dynamodb_1.unmarshall)(item)) || [];
        console.log(`Retrieved ${payments.length} failed payments`);
        return payments;
    }
    catch (e) {
        console.error("Error getting failed payments:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to get failed payments");
    }
}
const queryResolvers = {
    users: async (_ctx) => {
        return fetchUsers();
    },
    getSubscription: async (ctx) => {
        return getSubscription(ctx.arguments.id);
    },
    listSubscriptions: async (_ctx) => {
        return listSubscriptions();
    },
    getSubscriptionsByUser: async (ctx) => {
        return getSubscriptionsByUser(ctx.arguments.userId);
    },
    getOrder: async (ctx) => {
        return getOrder(ctx.arguments.orderId);
    },
    listOrders: async (_ctx) => {
        return listOrders();
    },
    getOrdersByCustomer: async (ctx) => {
        return getOrdersByCustomer(ctx.arguments.customerId);
    },
    getProduct: async (ctx) => {
        return getProduct(ctx.arguments.productId);
    },
    listProducts: async (_ctx) => {
        return listProducts();
    },
    getProductsByCategory: async (ctx) => {
        return getProductsByCategory(ctx.arguments.category);
    },
    getLowStockProducts: async (_ctx) => {
        return getLowStockProducts();
    },
    getPayment: async (ctx) => {
        return getPayment(ctx.arguments.paymentId);
    },
    getPaymentsByOrder: async (ctx) => {
        return getPaymentsByOrder(ctx.arguments.orderId);
    },
    getFailedPayments: async (_ctx) => {
        return getFailedPayments();
    },
};
const handler = async (ctx) => {
    const { parentTypeName, fieldName } = ctx.info;
    console.log("=== Lambda Handler Invoked ===");
    console.log(`Type: ${parentTypeName}, Field: ${fieldName}`);
    console.log(`Context:`, JSON.stringify(ctx, null, 2));
    // Handle Query resolvers
    if (parentTypeName === "Query") {
        console.log(`Routing to Query resolver: ${fieldName}`);
        const resolver = queryResolvers[fieldName];
        if (resolver) {
            const result = await resolver(ctx);
            console.log(`Query ${fieldName} completed, returned ${Array.isArray(result) ? result.length : 1} item(s)`);
            return result;
        }
    }
    console.error(`ERROR: Resolver not found for ${parentTypeName}.${fieldName}`);
    throw new Error(`Resolver not found for ${parentTypeName}.${fieldName}`);
};
exports.handler = handler;
//# sourceMappingURL=query.js.map