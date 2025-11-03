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

export interface PlanSubscription {
  id: string;
  clientSecret?: string;
}

export interface User {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  address?: Address;
}

export interface Address {
  street?: string;
  suite?: string;
  city?: string;
  zipcode?: string;
}

export interface Post {
  id: string;
  userId?: number;  // Added for JSONPlaceholder API
  author?: User;
  title?: string;
  body?: string;
}

// Field Resolver Types
export interface PostResolvers {
  author: ResolverFunction<{}, User>;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt?: string;
}

// Mutation Arguments
export interface PlanSubscriptionCreateArgs {
  plan: Plan;
}

// Resolver Types
export type ResolverFunction<TArgs = any, TResult = any> = (
  ctx: AppSyncContext<TArgs>
) => Promise<TResult>;

export interface QueryResolvers {
  todos: ResolverFunction<{}, Todo[]>;
  users: ResolverFunction<{}, User[]>;
  posts: ResolverFunction<{}, Post[]>;
}

export interface MutationResolvers {
  planSubscriptionCreate: ResolverFunction<
    PlanSubscriptionCreateArgs,
    PlanSubscription
  >;
}
