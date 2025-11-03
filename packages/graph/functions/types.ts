// AppSync Context Types
export interface AppSyncIdentity {
  username: string;
  sub: string;
  sourceIp: string[];
  claims: Record<string, string>;
}

export interface AppSyncInfo {
  fieldName: string;
  parentTypeName: string;
  variables: Record<string, any>;
  selectionSetList: string[];
  selectionSetGraphQL: string;
}

export interface AppSyncContext<TArguments = Record<string, any>> {
  arguments: TArguments;
  identity: AppSyncIdentity;
  source: any;
  info: AppSyncInfo;
  request: {
    headers: Record<string, string>;
  };
  prev: {
    result: any;
  };
}

// GraphQL Types
export enum Plan {
  STARTER = "STARTER",
  PRO = "PRO",
  PARTNER = "PARTNER",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  TRIAL = "TRIAL",
}

export interface PlanSubscription {
  id: string;
  clientSecret?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: Plan;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  type: string; // Required for TypeIndex GSI
}

export interface CreateSubscriptionInput {
  userId: string;
  plan: Plan;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateSubscriptionInput {
  id: string;
  plan?: Plan;
  status?: SubscriptionStatus;
  stripeSubscriptionId?: string;
  endDate?: string;
}

export interface User {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  address?: Address;
  createdAt?: string;
  updatedAt?: string;
  type: string; // Required for TypeIndex GSI
}

export interface Address {
  street?: string;
  suite?: string;
  city?: string;
  zipcode?: string;
}

export interface AddressInput {
  street?: string;
  suite?: string;
  city?: string;
  zipcode?: string;
}

export interface CreateUserInput {
  name: string;
  username: string;
  email: string;
  address?: AddressInput;
}

// Order Types
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = "pending" | "paid" | "fulfilled" | "failed";

export interface Order {
  PK: string; // "ORDER#123"
  SK: string; // "METADATA"
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  type: string; // Required for TypeIndex GSI
}

// Product Types
export interface Product {
  PK: string; // "PRODUCT#P1"
  SK: string; // "METADATA"
  productId: string;
  name: string;
  description: string;
  price: number;
  stockCount: number;
  lowStockThreshold: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  type: string; // Required for TypeIndex GSI
  lowStock?: string; // Optional string: "true" when stock is low, undefined otherwise
}

// Payment Types
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface Payment {
  PK: string; // "PAYMENT#PAY123"
  SK: string; // "METADATA"
  paymentId: string;
  orderId: string;
  stripeChargeId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  failureReason?: string;
  retryCount: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Input Types
export interface CreateOrderInput {
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  stockCount: number;
  lowStockThreshold: number;
  category: string;
}

export interface UpdateProductInput {
  productId: string;
  name?: string;
  description?: string;
  price?: number;
  stockCount?: number;
  lowStockThreshold?: number;
  category?: string;
  isActive?: boolean;
}

export interface CreatePaymentInput {
  orderId: string;
  stripeChargeId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  metadata?: Record<string, any>;
}

// Query Arguments
export interface GetSubscriptionArgs {
  id: string;
}

export interface GetSubscriptionsByUserArgs {
  userId: string;
}

export interface GetOrderArgs {
  orderId: string;
}

export interface GetOrdersByCustomerArgs {
  customerId: string;
}

export interface GetProductArgs {
  productId: string;
}

export interface GetProductsByCategoryArgs {
  category: string;
}

export interface GetPaymentArgs {
  paymentId: string;
}

export interface GetPaymentsByOrderArgs {
  orderId: string;
}

// Mutation Arguments
export interface PlanSubscriptionCreateArgs {
  plan: Plan;
}

export interface CreateUserArgs {
  input: CreateUserInput;
}

export interface CreateSubscriptionArgs {
  input: CreateSubscriptionInput;
}

export interface UpdateSubscriptionArgs {
  input: UpdateSubscriptionInput;
}

export interface DeleteSubscriptionArgs {
  id: string;
}

export interface CreateOrderArgs {
  input: CreateOrderInput;
}

export interface UpdateOrderStatusArgs {
  orderId: string;
  status: OrderStatus;
}

export interface CreateProductArgs {
  input: CreateProductInput;
}

export interface UpdateProductArgs {
  input: UpdateProductInput;
}

export interface DeleteProductArgs {
  productId: string;
}

export interface CreatePaymentArgs {
  input: CreatePaymentInput;
}

// Resolver Types
export type ResolverFunction<TArgs = any, TResult = any> = (
  ctx: AppSyncContext<TArgs>
) => Promise<TResult>;

export interface QueryResolvers {
  users: ResolverFunction<{}, User[]>;
  getSubscription: ResolverFunction<GetSubscriptionArgs, Subscription | null>;
  listSubscriptions: ResolverFunction<{}, Subscription[]>;
  getSubscriptionsByUser: ResolverFunction<
    GetSubscriptionsByUserArgs,
    Subscription[]
  >;
  getOrder: ResolverFunction<GetOrderArgs, Order | null>;
  listOrders: ResolverFunction<{}, Order[]>;
  getOrdersByCustomer: ResolverFunction<GetOrdersByCustomerArgs, Order[]>;
  getProduct: ResolverFunction<GetProductArgs, Product | null>;
  listProducts: ResolverFunction<{}, Product[]>;
  getProductsByCategory: ResolverFunction<GetProductsByCategoryArgs, Product[]>;
  getLowStockProducts: ResolverFunction<{}, Product[]>;
  getPayment: ResolverFunction<GetPaymentArgs, Payment | null>;
  getPaymentsByOrder: ResolverFunction<GetPaymentsByOrderArgs, Payment[]>;
  getFailedPayments: ResolverFunction<{}, Payment[]>;
}

export interface MutationResolvers {
  planSubscriptionCreate: ResolverFunction<
    PlanSubscriptionCreateArgs,
    PlanSubscription
  >;
  createUser: ResolverFunction<CreateUserArgs, User>;
  createSubscription: ResolverFunction<CreateSubscriptionArgs, Subscription>;
  updateSubscription: ResolverFunction<UpdateSubscriptionArgs, Subscription>;
  deleteSubscription: ResolverFunction<DeleteSubscriptionArgs, Subscription>;
  createOrder: ResolverFunction<CreateOrderArgs, Order>;
  updateOrderStatus: ResolverFunction<UpdateOrderStatusArgs, Order>;
  createProduct: ResolverFunction<CreateProductArgs, Product>;
  updateProduct: ResolverFunction<UpdateProductArgs, Product>;
  deleteProduct: ResolverFunction<DeleteProductArgs, Product>;
  createPayment: ResolverFunction<CreatePaymentArgs, Payment>;
}
