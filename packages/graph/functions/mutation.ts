import { stripe } from "./stripe";
import client from "./dynamodb-client";
import { PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";

/**
 * Safely marshall data for DynamoDB by removing undefined values
 * This prevents the error: "Pass options.removeUndefinedValues=true to remove undefined values"
 */
const marshallSafely = (data: any) => {
  return marshall(data, { removeUndefinedValues: true });
};
import {
  AppSyncContext,
  MutationResolvers,
  Plan,
  PlanSubscription,
  PlanSubscriptionCreateArgs,
  User,
  CreateUserArgs,
  Subscription,
  CreateSubscriptionArgs,
  UpdateSubscriptionArgs,
  DeleteSubscriptionArgs,
  Order,
  CreateOrderArgs,
  UpdateOrderStatusArgs,
  Product,
  CreateProductArgs,
  UpdateProductArgs,
  DeleteProductArgs,
  Payment,
  CreatePaymentArgs,
} from "./types";
import Stripe from "stripe";

const USERS_TABLE = process.env.USERS_TABLE || "stripe-graphql-api-users-dev";
const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE || "stripe-graphql-api-subscriptions-dev";
const ORDERS_TABLE = process.env.ORDERS_TABLE || "stripe-graphql-api-orders-dev";
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "stripe-graphql-api-products-dev";
const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE || "stripe-graphql-api-payments-dev";

async function createStripeSubscription(
  ctx: AppSyncContext<PlanSubscriptionCreateArgs>
): Promise<PlanSubscription> {
  // create customer from user context
  const customer = await stripe.customers.create({
    name: ctx.identity.username,
  });

  let price: string;

  switch (ctx.arguments.plan) {
    case Plan.STARTER:
      price = "price_1Kvv6bKfsnO6FKLvWmtNLe6j";
      break;
    case Plan.PRO:
      price = "price_1KvbGMKfsnO6FKLva9EtEJn7";
      break;
    case Plan.PARTNER:
      price = "price_1KvbEIKfsnO6FKLvdzHnPXpj";
      break;
    default:
      throw new Error(`Invalid plan: ${ctx.arguments.plan}`);
  }

  // create the subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price }],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  });

  // Type assertion for expanded fields
  const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

  return {
    id: subscription.id,
    clientSecret: paymentIntent.client_secret || undefined,
  };
}

// DynamoDB User CRUD Operations
async function createUser(
  ctx: AppSyncContext<CreateUserArgs>
): Promise<User> {
  try {
    const { input } = ctx.arguments;
    const now = new Date().toISOString();

    const user: User = {
      id: uuidv4(),
      name: input.name,
      username: input.username,
      email: input.email,
      address: input.address,
      createdAt: now,
      updatedAt: now,
      type: "user", // Required for TypeIndex GSI
    };

    console.log("Creating user:", user);

    const command = new PutItemCommand({
      TableName: USERS_TABLE,
      Item: marshallSafely(user),
    });

    await client.send(command);
    console.log(`User created: ${user.id}`);

    return user;
  } catch (e) {
    console.error("Error creating user:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to create user");
  }
}

// DynamoDB Subscription CRUD Operations
async function createSubscription(
  ctx: AppSyncContext<CreateSubscriptionArgs>
): Promise<Subscription> {
  try {
    const { input } = ctx.arguments;
    const now = new Date().toISOString();

    const subscription: Subscription = {
      id: uuidv4(),
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

    const command = new PutItemCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      Item: marshallSafely(subscription),
    });

    await client.send(command);
    console.log(`Subscription created: ${subscription.id}`);

    return subscription;
  } catch (e) {
    console.error("Error creating subscription:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to create subscription");
  }
}

async function updateSubscription(
  ctx: AppSyncContext<UpdateSubscriptionArgs>
): Promise<Subscription> {
  try {
    const { input } = ctx.arguments;
    const now = new Date().toISOString();

    console.log("Updating subscription:", input.id);

    // Build update expression dynamically
    const updateExpressions: string[] = ["updatedAt = :updatedAt"];
    const expressionAttributeValues: Record<string, any> = {
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

    const command = new UpdateItemCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      Key: marshallSafely({ id: input.id }),
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: {
        "#status": "status", // 'status' is a reserved word in DynamoDB
      },
      ExpressionAttributeValues: marshallSafely(expressionAttributeValues),
      ReturnValues: "ALL_NEW",
    });

    const result = await client.send(command);

    if (!result.Attributes) {
      throw new Error("Subscription not found");
    }

    const updated = unmarshall(result.Attributes) as Subscription;
    console.log(`Subscription updated: ${input.id}`);

    return updated;
  } catch (e) {
    console.error("Error updating subscription:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to update subscription");
  }
}

async function deleteSubscription(
  ctx: AppSyncContext<DeleteSubscriptionArgs>
): Promise<Subscription> {
  try {
    const { id } = ctx.arguments;

    console.log("Deleting subscription:", id);

    // First get the item to return it
    const getCommand = new GetItemCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      Key: marshallSafely({ id }),
    });

    const getResult = await client.send(getCommand);

    if (!getResult.Item) {
      throw new Error("Subscription not found");
    }

    const subscription = unmarshall(getResult.Item) as Subscription;

    // Now delete it
    const deleteCommand = new DeleteItemCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      Key: marshallSafely({ id }),
    });

    await client.send(deleteCommand);
    console.log(`Subscription deleted: ${id}`);

    return subscription;
  } catch (e) {
    console.error("Error deleting subscription:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to delete subscription");
  }
}

// DynamoDB Order CRUD Operations
async function createOrder(
  ctx: AppSyncContext<CreateOrderArgs>
): Promise<Order> {
  try {
    const { input } = ctx.arguments;
    const orderId = uuidv4();
    const now = new Date().toISOString();

    const order: Order = {
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

    const command = new PutItemCommand({
      TableName: ORDERS_TABLE,
      Item: marshallSafely(order),
    });

    await client.send(command);
    console.log(`Order created: ${orderId}`);

    return order;
  } catch (e) {
    console.error("Error creating order:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to create order");
  }
}

async function updateOrderStatus(
  ctx: AppSyncContext<UpdateOrderStatusArgs>
): Promise<Order> {
  try {
    const { orderId, status } = ctx.arguments;

    console.log(`Updating order ${orderId} status to ${status}`);

    const command = new UpdateItemCommand({
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

    const result = await client.send(command);

    if (!result.Attributes) {
      throw new Error("Order not found");
    }

    const updated = unmarshall(result.Attributes) as Order;
    console.log(`Order status updated: ${orderId}`);

    return updated;
  } catch (e) {
    console.error("Error updating order status:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to update order status");
  }
}

// DynamoDB Product CRUD Operations
async function createProduct(
  ctx: AppSyncContext<CreateProductArgs>
): Promise<Product> {
  try {
    const { input } = ctx.arguments;
    const productId = uuidv4();
    const now = new Date().toISOString();

    const product: Product = {
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

    const command = new PutItemCommand({
      TableName: PRODUCTS_TABLE,
      Item: marshallSafely(product),
    });

    await client.send(command);
    console.log(`Product created: ${productId}`);

    return product;
  } catch (e) {
    console.error("Error creating product:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to create product");
  }
}

async function updateProduct(
  ctx: AppSyncContext<UpdateProductArgs>
): Promise<Product> {
  try {
    const { input } = ctx.arguments;

    console.log("Updating product:", input.productId);

    // Get the current product state to determine if lowStock status needs to change.
    // Note: This two-step process (get then update) is not atomic.
    const getCommand = new GetItemCommand({
      TableName: PRODUCTS_TABLE,
      Key: marshallSafely({ PK: `PRODUCT#${input.productId}`, SK: "METADATA" }),
    });
    const { Item } = await client.send(getCommand);

    if (!Item) {
      throw new Error("Product not found");
    }

    const currentProduct = unmarshall(Item) as Product;

    // Build update expression dynamically
    const updateExpressions: string[] = ["updatedAt = :updatedAt"];
    const removeExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {
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
    } else {
      removeExpressions.push("lowStock");
    }

    let updateExpression = `SET ${updateExpressions.join(", ")}`;
    if (removeExpressions.length > 0) {
      updateExpression += ` REMOVE ${removeExpressions.join(", ")}`;
    }

    const command = new UpdateItemCommand({
      TableName: PRODUCTS_TABLE,
      Key: marshallSafely({ PK: `PRODUCT#${input.productId}`, SK: "METADATA" }),
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0
        ? expressionAttributeNames
        : undefined,
      ExpressionAttributeValues: marshallSafely(expressionAttributeValues),
      ReturnValues: "ALL_NEW",
    });

    const result = await client.send(command);

    if (!result.Attributes) {
      throw new Error("Product not found");
    }

    const updated = unmarshall(result.Attributes) as Product;
    console.log(`Product updated: ${input.productId}`);

    return updated;
  } catch (e) {
    console.error("Error updating product:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to update product");
  }
}

async function deleteProduct(
  ctx: AppSyncContext<DeleteProductArgs>
): Promise<Product> {
  try {
    const { productId } = ctx.arguments;

    console.log("Deleting product:", productId);

    // First get the item to return it
    const getCommand = new GetItemCommand({
      TableName: PRODUCTS_TABLE,
      Key: marshallSafely({ PK: `PRODUCT#${productId}`, SK: "METADATA" }),
    });

    const getResult = await client.send(getCommand);

    if (!getResult.Item) {
      throw new Error("Product not found");
    }

    const product = unmarshall(getResult.Item) as Product;

    // Now delete it
    const deleteCommand = new DeleteItemCommand({
      TableName: PRODUCTS_TABLE,
      Key: marshallSafely({ PK: `PRODUCT#${productId}`, SK: "METADATA" }),
    });

    await client.send(deleteCommand);
    console.log(`Product deleted: ${productId}`);

    return product;
  } catch (e) {
    console.error("Error deleting product:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to delete product");
  }
}

// DynamoDB Payment CRUD Operations
async function createPayment(
  ctx: AppSyncContext<CreatePaymentArgs>
): Promise<Payment> {
  try {
    const { input } = ctx.arguments;
    const paymentId = uuidv4();
    const now = new Date().toISOString();

    const payment: Payment = {
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

    const command = new PutItemCommand({
      TableName: PAYMENTS_TABLE,
      Item: marshallSafely(payment),
    });

    await client.send(command);
    console.log(`Payment created: ${paymentId}`);

    return payment;
  } catch (e) {
    console.error("Error creating payment:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to create payment");
  }
}

const resolvers: MutationResolvers = {
  planSubscriptionCreate: async (
    ctx: AppSyncContext<PlanSubscriptionCreateArgs>
  ) => {
    return createStripeSubscription(ctx);
  },
  createUser: async (ctx: AppSyncContext<CreateUserArgs>) => {
    return createUser(ctx);
  },
  createSubscription: async (ctx: AppSyncContext<CreateSubscriptionArgs>) => {
    return createSubscription(ctx);
  },
  updateSubscription: async (ctx: AppSyncContext<UpdateSubscriptionArgs>) => {
    return updateSubscription(ctx);
  },
  deleteSubscription: async (ctx: AppSyncContext<DeleteSubscriptionArgs>) => {
    return deleteSubscription(ctx);
  },
  createOrder: async (ctx: AppSyncContext<CreateOrderArgs>) => {
    return createOrder(ctx);
  },
  updateOrderStatus: async (ctx: AppSyncContext<UpdateOrderStatusArgs>) => {
    return updateOrderStatus(ctx);
  },
  createProduct: async (ctx: AppSyncContext<CreateProductArgs>) => {
    return createProduct(ctx);
  },
  updateProduct: async (ctx: AppSyncContext<UpdateProductArgs>) => {
    return updateProduct(ctx);
  },
  deleteProduct: async (ctx: AppSyncContext<DeleteProductArgs>) => {
    return deleteProduct(ctx);
  },
  createPayment: async (ctx: AppSyncContext<CreatePaymentArgs>) => {
    return createPayment(ctx);
  },
};

export const handler = async (ctx: AppSyncContext): Promise<any> => {
  const { fieldName } = ctx.info;
  const resolver = resolvers[fieldName as keyof MutationResolvers];

  if (resolver) {
    return await (resolver as any)(ctx);
  }

  throw new Error(`Resolver not found for mutation: ${fieldName}`);
};
