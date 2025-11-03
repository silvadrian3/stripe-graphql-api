# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Stripe subscription demo using GraphQL, built with a monorepo architecture containing:
- **Backend** (`packages/graph`): AWS AppSync GraphQL API with Lambda resolvers, Stripe integration
- **Frontend** (`packages/web`): React app with AWS Amplify, Stripe Elements, and Tailwind CSS

## Development Setup

### Prerequisites
- Node.js v14+
- pnpm v6.14.1+ (monorepo package manager)
- Docker Desktop (for local DynamoDB)

### Quick Start

From project root:
```bash
# Install all dependencies
pnpm install

# Start backend
cd packages/graph
docker-compose up                    # Terminal 1: Start DynamoDB
pnpm dev                             # Terminal 2: Start AppSync simulator

# Start frontend (separate terminal)
cd packages/web
pnpm start
```

### Backend Commands (`packages/graph`)

```bash
pnpm dev          # Start serverless offline + AppSync simulator (http://localhost:20002)
pnpm build        # Compile TypeScript with webpack
pnpm type-check   # TypeScript type checking without compilation
```

**Environment Setup**: Create `packages/graph/.env` with `STRIPE_SECRET_KEY=sk_test_...` and `IS_OFFLINE=true`

### Frontend Commands (`packages/web`)

```bash
pnpm start        # Development server (http://localhost:3000)
pnpm build        # Production build
pnpm test         # Jest tests in watch mode
```

## Architecture

### Backend Structure (`packages/graph`)

The backend uses **AWS AppSync** with Lambda resolvers in a serverless architecture:

- **GraphQL Schema** (`schema.graphql`): Defines types and operations
  - Query: `users`, `posts` (demo endpoints using JSONPlaceholder)
  - Mutation: `planSubscriptionCreate` (Stripe subscription creation)

- **Lambda Functions** (`functions/`):
  - `query.ts`: Query resolvers
  - `mutation.ts`: Mutation resolvers (Stripe subscription logic)
  - `types.ts`: TypeScript types for AppSync context and resolvers
  - `stripe.ts`: Stripe client initialization
  - `dynamodb-client.ts`: DynamoDB client setup

- **Resolver Pattern**: Each Lambda function exports a `handler` that:
  1. Receives AppSync context (`ctx.info.parentTypeName` contains field name)
  2. Routes to appropriate resolver based on field name
  3. Returns data matching GraphQL schema types

- **Data Sources** (defined in `serverless.yml`):
  - `LambdaQueryDS`: Routes to `query-fn` Lambda
  - `LambdaMutationDS`: Routes to `mutation-fn` Lambda
  - `HTTP_JSON_PLACEHOLDER`: Direct HTTP resolver for demo queries

- **Mapping Templates** (`mapping-templates/`): VTL templates for AppSync HTTP resolvers (used for JSONPlaceholder integration)

- **Infrastructure** (`resources.yml`): CloudFormation for:
  - Cognito User Pool (authentication)
  - Cognito Identity Pool (federated identities)
  - IAM roles for authenticated/unauthenticated access

### Frontend Structure (`packages/web`)

React app using Create React App with:
- **AWS Amplify**: Configured for Cognito auth and AppSync GraphQL (`configureAmplify.js`)
- **Stripe Elements**: Payment form integration (`Payment.jsx`)
- **Routing**: `react-router-dom` v5 for navigation
- **Styling**: Tailwind CSS with PostCSS

Key components:
- `Login.jsx`: Cognito authentication UI
- `Plans.jsx`: Subscription plan selection
- `Payment.jsx`: Stripe payment form with Elements

### Build System

**Backend (`packages/graph`)**:
- **Webpack 5** + **ts-loader**: Bundles TypeScript for Lambda
- **serverless-webpack**: Integrates webpack with Serverless Framework
- **Output**: Compiled code to `.webpack/` directory
- **Config**: `webpack.config.js` with `transpileOnly: true` for fast builds

**Frontend (`packages/web`)**:
- **react-scripts** (Create React App): Standard CRA build pipeline
- **Tailwind CSS**: PostCSS processing via `tailwind.config.js`

### Local Development

The serverless offline setup runs:
1. **DynamoDB Local** on port 8000 (via Docker)
2. **AppSync Simulator** on port 20002 (GraphQL playground)
3. **Lambda Functions** executed locally via serverless-offline

## Key Patterns

### Adding a New GraphQL Mutation

1. Update `packages/graph/schema.graphql` with mutation definition
2. Add resolver function in `packages/graph/functions/mutation.ts`:
   ```typescript
   const resolvers: MutationResolvers = {
     yourNewMutation: async (ctx: AppSyncContext<YourArgs>) => {
       // Implementation
     }
   };
   ```
3. Add types to `packages/graph/functions/types.ts` if needed
4. Update `serverless.yml` mapping templates if using VTL

### Stripe Integration

Stripe subscriptions use **price IDs** (hardcoded in `mutation.ts`):
- STARTER: `price_1Kvv6bKfsnO6FKLvWmtNLe6j`
- PRO: `price_1KvbGMKfsnO6FKLva9EtEJn7`
- PARTNER: `price_1KvbEIKfsnO6FKLvdzHnPXpj`

To update pricing:
1. Create products/prices in Stripe Dashboard
2. Update price IDs in `mutation.ts`
3. Update plan display in `packages/web/src/Plans.jsx`

### AppSync Context Structure

Lambda resolvers receive AppSync context with:
```typescript
{
  arguments: { /* GraphQL field arguments */ },
  identity: { username, sub, /* Cognito user info */ },
  info: {
    parentTypeName: "Query" | "Mutation",
    fieldName: "specificFieldName"
  }
}
```

## Common Tasks

### Troubleshooting Port Conflicts

```bash
# DynamoDB (port 8000)
lsof -ti:8000 | xargs kill -9

# AppSync Simulator (port 20002)
lsof -ti:20002 | xargs kill -9
```

### Clearing Build Artifacts

```bash
# Backend
cd packages/graph
rm -rf .webpack node_modules
pnpm install

# Frontend
cd packages/web
rm -rf build node_modules
pnpm install
```

### Testing GraphQL Mutations Locally

Access the AppSync simulator at http://localhost:20002 and use the GraphQL playground. Note that mutations requiring authentication will need proper Cognito headers in offline mode.

## Deployment

Backend deployment (requires AWS credentials):
```bash
cd packages/graph
pnpm serverless deploy --stage production
```

This deploys:
- Lambda functions
- AppSync API
- Cognito resources
- DynamoDB tables
- IAM roles

Frontend deployment: Follow standard React deployment (build to static files and host).
