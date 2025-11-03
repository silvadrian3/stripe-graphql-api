"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const stripe_1 = require("./stripe");
const dynamodb_client_1 = __importDefault(require("./dynamodb-client"));
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const uuid_1 = require("uuid");
/**
 * Safely marshall data for DynamoDB by removing undefined values
 * This prevents the error: "Pass options.removeUndefinedValues=true to remove undefined values"
 */
const marshallSafely = (data) => {
    return (0, util_dynamodb_1.marshall)(data, { removeUndefinedValues: true });
};
const types_1 = require("./types");
const USERS_TABLE = process.env.USERS_TABLE || "stripe-graphql-api-users-dev";
const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE || "stripe-graphql-api-subscriptions-dev";
const ORDERS_TABLE = process.env.ORDERS_TABLE || "stripe-graphql-api-orders-dev";
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "stripe-graphql-api-products-dev";
const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE || "stripe-graphql-api-payments-dev";
async function createStripeSubscription(ctx) {
    // create customer from user context
    const customer = await stripe_1.stripe.customers.create({
        name: ctx.identity.username,
    });
    let price;
    switch (ctx.arguments.plan) {
        case types_1.Plan.STARTER:
            price = "price_1Kvv6bKfsnO6FKLvWmtNLe6j";
            break;
        case types_1.Plan.PRO:
            price = "price_1KvbGMKfsnO6FKLva9EtEJn7";
            break;
        case types_1.Plan.PARTNER:
            price = "price_1KvbEIKfsnO6FKLvdzHnPXpj";
            break;
        default:
            throw new Error(`Invalid plan: ${ctx.arguments.plan}`);
    }
    // create the subscription
    const subscription = await stripe_1.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
    });
    // Type assertion for expanded fields
    const latestInvoice = subscription.latest_invoice;
    const paymentIntent = latestInvoice.payment_intent;
    return {
        id: subscription.id,
        clientSecret: paymentIntent.client_secret || undefined,
    };
}
// DynamoDB User CRUD Operations
async function createUser(ctx) {
    try {
        const { input } = ctx.arguments;
        const now = new Date().toISOString();
        const user = {
            id: (0, uuid_1.v4)(),
            name: input.name,
            username: input.username,
            email: input.email,
            address: input.address,
            createdAt: now,
            updatedAt: now,
            type: "user", // Required for TypeIndex GSI
        };
        console.log("Creating user:", user);
        const command = new client_dynamodb_1.PutItemCommand({
            TableName: USERS_TABLE,
            Item: marshallSafely(user),
        });
        await dynamodb_client_1.default.send(command);
        console.log(`User created: ${user.id}`);
        return user;
    }
    catch (e) {
        console.error("Error creating user:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to create user");
    }
}
// DynamoDB Subscription CRUD Operations
async function createSubscription(ctx) {
    try {
        const { input } = ctx.arguments;
        const now = new Date().toISOString();
        const subscription = {
            id: (0, uuid_1.v4)(),
            userId: input.userId,
            plan: input.plan,
            status: input.status,
            stripeSubscriptionId: input.stripeSubscriptionId,
            stripeCustomerId: input.stripeCustomerId,
            startDate: input.startDate,
            endDate: input.endDate,
            createdAt: now,
            updatedAt: now,
            type: "subscription", // Required for TypeIndex GSI
        };
        console.log("Creating subscription:", subscription);
        const command = new client_dynamodb_1.PutItemCommand({
            TableName: SUBSCRIPTIONS_TABLE,
            Item: marshallSafely(subscription),
        });
        await dynamodb_client_1.default.send(command);
        console.log(`Subscription created: ${subscription.id}`);
        return subscription;
    }
    catch (e) {
        console.error("Error creating subscription:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to create subscription");
    }
}
async function updateSubscription(ctx) {
    try {
        const { input } = ctx.arguments;
        const now = new Date().toISOString();
        console.log("Updating subscription:", input.id);
        // Build update expression dynamically
        const updateExpressions = ["updatedAt = :updatedAt"];
        const expressionAttributeValues = {
            ":updatedAt": now,
        };
        if (input.plan !== undefined) {
            updateExpressions.push("plan = :plan");
            expressionAttributeValues[":plan"] = input.plan;
        }
        if (input.status !== undefined) {
            updateExpressions.push("#status = :status");
            expressionAttributeValues[":status"] = input.status;
        }
        if (input.stripeSubscriptionId !== undefined) {
            updateExpressions.push("stripeSubscriptionId = :stripeSubscriptionId");
            expressionAttributeValues[":stripeSubscriptionId"] = input.stripeSubscriptionId;
        }
        if (input.endDate !== undefined) {
            updateExpressions.push("endDate = :endDate");
            expressionAttributeValues[":endDate"] = input.endDate;
        }
        const command = new client_dynamodb_1.UpdateItemCommand({
            TableName: SUBSCRIPTIONS_TABLE,
            Key: marshallSafely({ id: input.id }),
            UpdateExpression: `SET ${updateExpressions.join(", ")}`,
            ExpressionAttributeNames: {
                "#status": "status", // 'status' is a reserved word in DynamoDB
            },
            ExpressionAttributeValues: marshallSafely(expressionAttributeValues),
            ReturnValues: "ALL_NEW",
        });
        const result = await dynamodb_client_1.default.send(command);
        if (!result.Attributes) {
            throw new Error("Subscription not found");
        }
        const updated = (0, util_dynamodb_1.unmarshall)(result.Attributes);
        console.log(`Subscription updated: ${input.id}`);
        return updated;
    }
    catch (e) {
        console.error("Error updating subscription:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to update subscription");
    }
}
async function deleteSubscription(ctx) {
    try {
        const { id } = ctx.arguments;
        console.log("Deleting subscription:", id);
        // First get the item to return it
        const getCommand = new client_dynamodb_1.GetItemCommand({
            TableName: SUBSCRIPTIONS_TABLE,
            Key: marshallSafely({ id }),
        });
        const getResult = await dynamodb_client_1.default.send(getCommand);
        if (!getResult.Item) {
            throw new Error("Subscription not found");
        }
        const subscription = (0, util_dynamodb_1.unmarshall)(getResult.Item);
        // Now delete it
        const deleteCommand = new client_dynamodb_1.DeleteItemCommand({
            TableName: SUBSCRIPTIONS_TABLE,
            Key: marshallSafely({ id }),
        });
        await dynamodb_client_1.default.send(deleteCommand);
        console.log(`Subscription deleted: ${id}`);
        return subscription;
    }
    catch (e) {
        console.error("Error deleting subscription:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to delete subscription");
    }
}
// DynamoDB Order CRUD Operations
async function createOrder(ctx) {
    try {
        const { input } = ctx.arguments;
        const orderId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const order = {
            PK: `ORDER#${orderId}`,
            SK: "METADATA",
            orderId,
            customerId: input.customerId,
            items: input.items,
            totalAmount: input.totalAmount,
            status: "pending",
            createdAt: now,
            updatedAt: now,
            type: "order", // Required for TypeIndex GSI
        };
        console.log("Creating order:", order);
        const command = new client_dynamodb_1.PutItemCommand({
            TableName: ORDERS_TABLE,
            Item: marshallSafely(order),
        });
        await dynamodb_client_1.default.send(command);
        console.log(`Order created: ${orderId}`);
        return order;
    }
    catch (e) {
        console.error("Error creating order:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to create order");
    }
}
async function updateOrderStatus(ctx) {
    try {
        const { orderId, status } = ctx.arguments;
        console.log(`Updating order ${orderId} status to ${status}`);
        const command = new client_dynamodb_1.UpdateItemCommand({
            TableName: ORDERS_TABLE,
            Key: marshallSafely({ PK: `ORDER#${orderId}`, SK: "METADATA" }),
            UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
            ExpressionAttributeNames: {
                "#status": "status",
            },
            ExpressionAttributeValues: marshallSafely({
                ":status": status,
                ":updatedAt": new Date().toISOString(),
            }),
            ReturnValues: "ALL_NEW",
        });
        const result = await dynamodb_client_1.default.send(command);
        if (!result.Attributes) {
            throw new Error("Order not found");
        }
        const updated = (0, util_dynamodb_1.unmarshall)(result.Attributes);
        console.log(`Order status updated: ${orderId}`);
        return updated;
    }
    catch (e) {
        console.error("Error updating order status:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to update order status");
    }
}
// DynamoDB Product CRUD Operations
async function createProduct(ctx) {
    try {
        const { input } = ctx.arguments;
        const productId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const product = {
            PK: `PRODUCT#${productId}`,
            SK: "METADATA",
            productId,
            name: input.name,
            description: input.description,
            price: input.price,
            stockCount: input.stockCount,
            lowStockThreshold: input.lowStockThreshold,
            category: input.category,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            type: "product", // Required for TypeIndex GSI
        };
        // Only set lowStock to "true" (string) if stock is low
        // DynamoDB GSI requires string type, not boolean
        if (product.stockCount < product.lowStockThreshold) {
            product.lowStock = "true";
        }
        console.log("Creating product:", product);
        const command = new client_dynamodb_1.PutItemCommand({
            TableName: PRODUCTS_TABLE,
            Item: marshallSafely(product),
        });
        await dynamodb_client_1.default.send(command);
        console.log(`Product created: ${productId}`);
        return product;
    }
    catch (e) {
        console.error("Error creating product:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to create product");
    }
}
async function updateProduct(ctx) {
    try {
        const { input } = ctx.arguments;
        console.log("Updating product:", input.productId);
        // Get the current product state to determine if lowStock status needs to change.
        // Note: This two-step process (get then update) is not atomic.
        const getCommand = new client_dynamodb_1.GetItemCommand({
            TableName: PRODUCTS_TABLE,
            Key: marshallSafely({ PK: `PRODUCT#${input.productId}`, SK: "METADATA" }),
        });
        const { Item } = await dynamodb_client_1.default.send(getCommand);
        if (!Item) {
            throw new Error("Product not found");
        }
        const currentProduct = (0, util_dynamodb_1.unmarshall)(Item);
        // Build update expression dynamically
        const updateExpressions = ["updatedAt = :updatedAt"];
        const removeExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {
            ":updatedAt": new Date().toISOString(),
        };
        if (input.name !== undefined) {
            updateExpressions.push("#name = :name");
            expressionAttributeNames["#name"] = "name";
            expressionAttributeValues[":name"] = input.name;
        }
        if (input.description !== undefined) {
            updateExpressions.push("description = :description");
            expressionAttributeValues[":description"] = input.description;
        }
        if (input.price !== undefined) {
            updateExpressions.push("price = :price");
            expressionAttributeValues[":price"] = input.price;
        }
        if (input.stockCount !== undefined) {
            updateExpressions.push("stockCount = :stockCount");
            expressionAttributeValues[":stockCount"] = input.stockCount;
        }
        if (input.lowStockThreshold !== undefined) {
            updateExpressions.push("lowStockThreshold = :lowStockThreshold");
            expressionAttributeValues[":lowStockThreshold"] = input.lowStockThreshold;
        }
        if (input.category !== undefined) {
            updateExpressions.push("category = :category");
            expressionAttributeValues[":category"] = input.category;
        }
        if (input.isActive !== undefined) {
            updateExpressions.push("isActive = :isActive");
            expressionAttributeValues[":isActive"] = input.isActive;
        }
        const newStockCount = input.stockCount ?? currentProduct.stockCount;
        const newLowStockThreshold = input.lowStockThreshold ?? currentProduct.lowStockThreshold;
        if (newStockCount < newLowStockThreshold) {
            updateExpressions.push("lowStock = :lowStock");
            expressionAttributeValues[":lowStock"] = "true";
        }
        else {
            removeExpressions.push("lowStock");
        }
        let updateExpression = `SET ${updateExpressions.join(", ")}`;
        if (removeExpressions.length > 0) {
            updateExpression += ` REMOVE ${removeExpressions.join(", ")}`;
        }
        const command = new client_dynamodb_1.UpdateItemCommand({
            TableName: PRODUCTS_TABLE,
            Key: marshallSafely({ PK: `PRODUCT#${input.productId}`, SK: "METADATA" }),
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0
                ? expressionAttributeNames
                : undefined,
            ExpressionAttributeValues: marshallSafely(expressionAttributeValues),
            ReturnValues: "ALL_NEW",
        });
        const result = await dynamodb_client_1.default.send(command);
        if (!result.Attributes) {
            throw new Error("Product not found");
        }
        const updated = (0, util_dynamodb_1.unmarshall)(result.Attributes);
        console.log(`Product updated: ${input.productId}`);
        return updated;
    }
    catch (e) {
        console.error("Error updating product:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to update product");
    }
}
async function deleteProduct(ctx) {
    try {
        const { productId } = ctx.arguments;
        console.log("Deleting product:", productId);
        // First get the item to return it
        const getCommand = new client_dynamodb_1.GetItemCommand({
            TableName: PRODUCTS_TABLE,
            Key: marshallSafely({ PK: `PRODUCT#${productId}`, SK: "METADATA" }),
        });
        const getResult = await dynamodb_client_1.default.send(getCommand);
        if (!getResult.Item) {
            throw new Error("Product not found");
        }
        const product = (0, util_dynamodb_1.unmarshall)(getResult.Item);
        // Now delete it
        const deleteCommand = new client_dynamodb_1.DeleteItemCommand({
            TableName: PRODUCTS_TABLE,
            Key: marshallSafely({ PK: `PRODUCT#${productId}`, SK: "METADATA" }),
        });
        await dynamodb_client_1.default.send(deleteCommand);
        console.log(`Product deleted: ${productId}`);
        return product;
    }
    catch (e) {
        console.error("Error deleting product:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to delete product");
    }
}
// DynamoDB Payment CRUD Operations
async function createPayment(ctx) {
    try {
        const { input } = ctx.arguments;
        const paymentId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const payment = {
            PK: `PAYMENT#${paymentId}`,
            SK: "METADATA",
            paymentId,
            orderId: input.orderId,
            stripeChargeId: input.stripeChargeId,
            amount: input.amount,
            currency: input.currency,
            status: input.status,
            retryCount: 0,
            metadata: input.metadata || {},
            createdAt: now,
            updatedAt: now,
        };
        console.log("Creating payment:", payment);
        const command = new client_dynamodb_1.PutItemCommand({
            TableName: PAYMENTS_TABLE,
            Item: marshallSafely(payment),
        });
        await dynamodb_client_1.default.send(command);
        console.log(`Payment created: ${paymentId}`);
        return payment;
    }
    catch (e) {
        console.error("Error creating payment:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to create payment");
    }
}
const resolvers = {
    planSubscriptionCreate: async (ctx) => {
        return createStripeSubscription(ctx);
    },
    createUser: async (ctx) => {
        return createUser(ctx);
    },
    createSubscription: async (ctx) => {
        return createSubscription(ctx);
    },
    updateSubscription: async (ctx) => {
        return updateSubscription(ctx);
    },
    deleteSubscription: async (ctx) => {
        return deleteSubscription(ctx);
    },
    createOrder: async (ctx) => {
        return createOrder(ctx);
    },
    updateOrderStatus: async (ctx) => {
        return updateOrderStatus(ctx);
    },
    createProduct: async (ctx) => {
        return createProduct(ctx);
    },
    updateProduct: async (ctx) => {
        return updateProduct(ctx);
    },
    deleteProduct: async (ctx) => {
        return deleteProduct(ctx);
    },
    createPayment: async (ctx) => {
        return createPayment(ctx);
    },
};
const handler = async (ctx) => {
    const { fieldName } = ctx.info;
    const resolver = resolvers[fieldName];
    if (resolver) {
        return await resolver(ctx);
    }
    throw new Error(`Resolver not found for mutation: ${fieldName}`);
};
exports.handler = handler;
//# sourceMappingURL=mutation.js.map