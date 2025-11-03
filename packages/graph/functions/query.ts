import client from "./dynamodb-client";
import {
  GetItemCommand,
  QueryCommand,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";
import {
  AppSyncContext,
  QueryResolvers,
  User,
  Subscription,
  Order,
  Product,
  Payment,
  GetSubscriptionArgs,
  GetSubscriptionsByUserArgs,
  GetOrderArgs,
  GetOrdersByCustomerArgs,
  GetProductArgs,
  GetProductsByCategoryArgs,
  GetPaymentArgs,
  GetPaymentsByOrderArgs,
} from "./types";

const USERS_TABLE = process.env.USERS_TABLE || "stripe-graphql-api-users-dev";
const SUBSCRIPTIONS_TABLE =
  process.env.SUBSCRIPTIONS_TABLE || "stripe-graphql-api-subscriptions-dev";
const ORDERS_TABLE =
  process.env.ORDERS_TABLE || "stripe-graphql-api-orders-dev";
const PRODUCTS_TABLE =
  process.env.PRODUCTS_TABLE || "stripe-graphql-api-products-dev";
const PAYMENTS_TABLE =
  process.env.PAYMENTS_TABLE || "stripe-graphql-api-payments-dev";

// DynamoDB User Operations
async function fetchUsers(): Promise<User[]> {
  try {
    console.log("Fetching users from DynamoDB");
    const command = new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: "TypeIndex",
      KeyConditionExpression: "#type = :type",
      ExpressionAttributeNames: {
        "#type": "type",
      },
      ExpressionAttributeValues: marshall({
        ":type": "user",
      }),
    });

    const result = await client.send(command);
    const users =
      result.Items?.map(
        (item: Record<string, AttributeValue>) => unmarshall(item) as User
      ) || [];

    console.log(`Retrieved ${users.length} users from DynamoDB`);
    return users;
  } catch (e) {
    console.error("Error fetching users:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to fetch users");
  }
}

// DynamoDB Subscription Operations
async function getSubscription(id: string): Promise<Subscription | null> {
  try {
    console.log(`Getting subscription with id: ${id}`);
    const command = new GetItemCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      Key: marshall({ id }),
    });

    const result = await client.send(command);

    if (!result.Item) {
      console.log(`Subscription ${id} not found`);
      return null;
    }

    const subscription = unmarshall(result.Item) as Subscription;
    console.log(`Retrieved subscription: ${id}`);
    return subscription;
  } catch (e) {
    console.error("Error getting subscription:", e);
    throw new Error(
      e instanceof Error ? e.message : "Failed to get subscription"
    );
  }
}

async function listSubscriptions(): Promise<Subscription[]> {
  try {
    console.log("Listing all subscriptions");
    const command = new QueryCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      IndexName: "TypeIndex",
      KeyConditionExpression: "#type = :type",
      ExpressionAttributeNames: {
        "#type": "type",
      },
      ExpressionAttributeValues: marshall({
        ":type": "subscription",
      }),
    });

    const result = await client.send(command);
    const subscriptions =
      result.Items?.map(
        (item: Record<string, AttributeValue>) =>
          unmarshall(item) as Subscription
      ) || [];

    console.log(`Retrieved ${subscriptions.length} subscriptions`);
    return subscriptions;
  } catch (e) {
    console.error("Error listing subscriptions:", e);
    throw new Error(
      e instanceof Error ? e.message : "Failed to list subscriptions"
    );
  }
}

async function getSubscriptionsByUser(userId: string): Promise<Subscription[]> {
  try {
    console.log(`Getting subscriptions for user: ${userId}`);
    const command = new QueryCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      IndexName: "UserIdIndex",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: marshall({
        ":userId": userId,
      }),
    });

    const result = await client.send(command);
    const subscriptions =
      result.Items?.map(
        (item: Record<string, AttributeValue>) =>
          unmarshall(item) as Subscription
      ) || [];

    console.log(
      `Retrieved ${subscriptions.length} subscriptions for user ${userId}`
    );
    return subscriptions;
  } catch (e) {
    console.error(`Error getting subscriptions for user ${userId}:`, e);
    throw new Error(
      e instanceof Error ? e.message : "Failed to get user subscriptions"
    );
  }
}

// DynamoDB Order Operations
async function getOrder(orderId: string): Promise<Order | null> {
  try {
    console.log(`Getting order with id: ${orderId}`);
    const command = new GetItemCommand({
      TableName: ORDERS_TABLE,
      Key: marshall({ PK: `ORDER#${orderId}`, SK: "METADATA" }),
    });

    const result = await client.send(command);

    if (!result.Item) {
      console.log(`Order ${orderId} not found`);
      return null;
    }

    const order = unmarshall(result.Item) as Order;
    console.log(`Retrieved order: ${orderId}`);
    return order;
  } catch (e) {
    console.error("Error getting order:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to get order");
  }
}

async function listOrders(): Promise<Order[]> {
  try {
    console.log("Listing all orders");
    const command = new QueryCommand({
      TableName: ORDERS_TABLE,
      IndexName: "TypeIndex",
      KeyConditionExpression: "#type = :type",
      ExpressionAttributeNames: {
        "#type": "type",
      },
      ExpressionAttributeValues: marshall({
        ":type": "order",
      }),
    });

    const result = await client.send(command);
    const orders =
      result.Items?.map(
        (item: Record<string, AttributeValue>) => unmarshall(item) as Order
      ) || [];

    console.log(`Retrieved ${orders.length} orders`);
    return orders;
  } catch (e) {
    console.error("Error listing orders:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to list orders");
  }
}

async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  try {
    console.log(`Getting orders for customer: ${customerId}`);
    const command = new QueryCommand({
      TableName: ORDERS_TABLE,
      IndexName: "CustomerIdIndex",
      KeyConditionExpression: "customerId = :customerId",
      ExpressionAttributeValues: marshall({
        ":customerId": customerId,
      }),
    });

    const result = await client.send(command);
    const orders =
      result.Items?.map(
        (item: Record<string, AttributeValue>) => unmarshall(item) as Order
      ) || [];

    console.log(`Retrieved ${orders.length} orders for customer ${customerId}`);
    return orders;
  } catch (e) {
    console.error(`Error getting orders for customer ${customerId}:`, e);
    throw new Error(
      e instanceof Error ? e.message : "Failed to get customer orders"
    );
  }
}

// DynamoDB Product Operations
async function getProduct(productId: string): Promise<Product | null> {
  try {
    console.log(`Getting product with id: ${productId}`);
    const command = new GetItemCommand({
      TableName: PRODUCTS_TABLE,
      Key: marshall({ PK: `PRODUCT#${productId}`, SK: "METADATA" }),
    });

    const result = await client.send(command);

    if (!result.Item) {
      console.log(`Product ${productId} not found`);
      return null;
    }

    const product = unmarshall(result.Item) as Product;
    console.log(`Retrieved product: ${productId}`);
    return product;
  } catch (e) {
    console.error("Error getting product:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to get product");
  }
}

async function listProducts(): Promise<Product[]> {
  try {
    console.log("Listing all products");
    const command = new QueryCommand({
      TableName: PRODUCTS_TABLE,
      IndexName: "TypeIndex",
      KeyConditionExpression: "#type = :type",
      ExpressionAttributeNames: {
        "#type": "type",
      },
      ExpressionAttributeValues: marshall({
        ":type": "product",
      }),
    });

    const result = await client.send(command);
    const products =
      result.Items?.map(
        (item: Record<string, AttributeValue>) => unmarshall(item) as Product
      ) || [];

    console.log(`Retrieved ${products.length} products`);
    return products;
  } catch (e) {
    console.error("Error listing products:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to list products");
  }
}

async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    console.log(`Getting products for category: ${category}`);
    const command = new QueryCommand({
      TableName: PRODUCTS_TABLE,
      IndexName: "CategoryIndex",
      KeyConditionExpression: "category = :category",
      ExpressionAttributeValues: marshall({
        ":category": category,
      }),
    });

    const result = await client.send(command);
    const products =
      result.Items?.map(
        (item: Record<string, AttributeValue>) => unmarshall(item) as Product
      ) || [];

    console.log(
      `Retrieved ${products.length} products for category ${category}`
    );
    return products;
  } catch (e) {
    console.error(`Error getting products for category ${category}:`, e);
    throw new Error(
      e instanceof Error ? e.message : "Failed to get products by category"
    );
  }
}

async function getLowStockProducts(): Promise<Product[]> {
  try {
    console.log("Getting low stock products");
    const command = new QueryCommand({
      TableName: PRODUCTS_TABLE,
      IndexName: "LowStockIndex",
      KeyConditionExpression: "lowStock = :lowStock",
      ExpressionAttributeValues: marshall({
        ":lowStock": "true",
      }),
    });

    const result = await client.send(command);
    const products =
      result.Items?.map(
        (item: Record<string, AttributeValue>) => unmarshall(item) as Product
      ) || [];

    console.log(`Retrieved ${products.length} low stock products`);
    return products;
  } catch (e) {
    console.error("Error getting low stock products:", e);
    throw new Error(
      e instanceof Error ? e.message : "Failed to get low stock products"
    );
  }
}

// DynamoDB Payment Operations
async function getPayment(paymentId: string): Promise<Payment | null> {
  try {
    console.log(`Getting payment with id: ${paymentId}`);
    const command = new GetItemCommand({
      TableName: PAYMENTS_TABLE,
      Key: marshall({ PK: `PAYMENT#${paymentId}`, SK: "METADATA" }),
    });

    const result = await client.send(command);

    if (!result.Item) {
      console.log(`Payment ${paymentId} not found`);
      return null;
    }

    const payment = unmarshall(result.Item) as Payment;
    console.log(`Retrieved payment: ${paymentId}`);
    return payment;
  } catch (e) {
    console.error("Error getting payment:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to get payment");
  }
}

async function getPaymentsByOrder(orderId: string): Promise<Payment[]> {
  try {
    console.log(`Getting payments for order: ${orderId}`);
    const command = new QueryCommand({
      TableName: PAYMENTS_TABLE,
      IndexName: "OrderIdIndex",
      KeyConditionExpression: "orderId = :orderId",
      ExpressionAttributeValues: marshall({
        ":orderId": orderId,
      }),
    });

    const result = await client.send(command);
    const payments =
      result.Items?.map(
        (item: Record<string, AttributeValue>) => unmarshall(item) as Payment
      ) || [];

    console.log(`Retrieved ${payments.length} payments for order ${orderId}`);
    return payments;
  } catch (e) {
    console.error(`Error getting payments for order ${orderId}:`, e);
    throw new Error(
      e instanceof Error ? e.message : "Failed to get order payments"
    );
  }
}

async function getFailedPayments(): Promise<Payment[]> {
  try {
    console.log("Getting failed payments");
    const command = new QueryCommand({
      TableName: PAYMENTS_TABLE,
      IndexName: "StatusIndex",
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: marshall({
        ":status": "failed",
      }),
    });

    const result = await client.send(command);
    const payments =
      result.Items?.map(
        (item: Record<string, AttributeValue>) => unmarshall(item) as Payment
      ) || [];

    console.log(`Retrieved ${payments.length} failed payments`);
    return payments;
  } catch (e) {
    console.error("Error getting failed payments:", e);
    throw new Error(
      e instanceof Error ? e.message : "Failed to get failed payments"
    );
  }
}

const queryResolvers: QueryResolvers = {
  users: async (_ctx: AppSyncContext) => {
    return fetchUsers();
  },

  getSubscription: async (ctx: AppSyncContext<GetSubscriptionArgs>) => {
    return getSubscription(ctx.arguments.id);
  },
  listSubscriptions: async (_ctx: AppSyncContext) => {
    return listSubscriptions();
  },
  getSubscriptionsByUser: async (
    ctx: AppSyncContext<GetSubscriptionsByUserArgs>
  ) => {
    return getSubscriptionsByUser(ctx.arguments.userId);
  },
  getOrder: async (ctx: AppSyncContext<GetOrderArgs>) => {
    return getOrder(ctx.arguments.orderId);
  },
  listOrders: async (_ctx: AppSyncContext) => {
    return listOrders();
  },
  getOrdersByCustomer: async (ctx: AppSyncContext<GetOrdersByCustomerArgs>) => {
    return getOrdersByCustomer(ctx.arguments.customerId);
  },
  getProduct: async (ctx: AppSyncContext<GetProductArgs>) => {
    return getProduct(ctx.arguments.productId);
  },
  listProducts: async (_ctx: AppSyncContext) => {
    return listProducts();
  },
  getProductsByCategory: async (
    ctx: AppSyncContext<GetProductsByCategoryArgs>
  ) => {
    return getProductsByCategory(ctx.arguments.category);
  },
  getLowStockProducts: async (_ctx: AppSyncContext) => {
    return getLowStockProducts();
  },
  getPayment: async (ctx: AppSyncContext<GetPaymentArgs>) => {
    return getPayment(ctx.arguments.paymentId);
  },
  getPaymentsByOrder: async (ctx: AppSyncContext<GetPaymentsByOrderArgs>) => {
    return getPaymentsByOrder(ctx.arguments.orderId);
  },
  getFailedPayments: async (_ctx: AppSyncContext) => {
    return getFailedPayments();
  },
};

export const handler = async (ctx: AppSyncContext): Promise<any> => {
  const { parentTypeName, fieldName } = ctx.info;

  console.log("=== Lambda Handler Invoked ===");
  console.log(`Type: ${parentTypeName}, Field: ${fieldName}`);
  console.log(`Context:`, JSON.stringify(ctx, null, 2));

  // Handle Query resolvers
  if (parentTypeName === "Query") {
    console.log(`Routing to Query resolver: ${fieldName}`);
    const resolver = queryResolvers[fieldName as keyof QueryResolvers];
    if (resolver) {
      const result = await (resolver as any)(ctx);
      console.log(
        `Query ${fieldName} completed, returned ${
          Array.isArray(result) ? result.length : 1
        } item(s)`
      );
      return result;
    }
  }

  console.error(`ERROR: Resolver not found for ${parentTypeName}.${fieldName}`);
  throw new Error(`Resolver not found for ${parentTypeName}.${fieldName}`);
};
