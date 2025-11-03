# Backend Setup and Execution Guide

## Prerequisites

Before running the backend, ensure you have the following installed:

- **Node.js v14 or later** - [Download](https://nodejs.org/en/)
- **pnpm v6.14.1 or later** - Install with: `npm install -g pnpm`
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Watchman** (optional, for file watching) - [Installation Guide](https://facebook.github.io/watchman/docs/install.html)

## Step-by-Step Setup

### 1. Install Dependencies

From the **project root directory** (`/Users/aqs/Documents/GitHub/stripe-graphql-api`):

```bash
pnpm install
```

This will install dependencies for all packages in the monorepo.

### 2. Configure Environment Variables

Navigate to the backend directory:

```bash
cd packages/graph
```

Create a `.env` file based on the example:

```bash
cp .env.example .env
```

Edit the `.env` file and add your Stripe secret key:

```env
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key
IS_OFFLINE=true
```

**To get your Stripe secret key:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your "Secret key" (starts with `sk_test_`)
3. Paste it in the `.env` file

### 3. Start DynamoDB Local

The backend uses DynamoDB for local development. Start it with Docker:

```bash
docker-compose up
```

This will:
- Start a local DynamoDB instance on port 8000
- Create a persistent data volume in `./docker/dynamodb`

**Keep this terminal running** - you'll need it for the database.

### 4. Run the Backend

Open a **new terminal** and navigate to the backend directory:

```bash
cd packages/graph
```

Start the development server:

```bash
pnpm dev
```

This will:
- Compile TypeScript code with webpack
- Start the serverless offline plugin
- Start the AppSync simulator
- Watch for file changes and auto-reload

### 5. Access the GraphQL Playground

Once running, you'll see output showing the AppSync Simulator URL, typically:

```
http://localhost:20002
```

Open this URL in your browser to access the GraphQL playground.

## Available Scripts

In the `packages/graph` directory:

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm type-check` - Check TypeScript types without compiling
- `pnpm test` - Run tests (needs to be configured)

## Project Structure

```
packages/graph/
├── functions/
│   ├── dynamodb-client.ts   # DynamoDB client configuration
│   ├── stripe.ts             # Stripe client setup
│   ├── query.ts              # GraphQL query resolvers
│   ├── mutation.ts           # GraphQL mutation resolvers
│   └── types.ts              # TypeScript type definitions
├── mapping-templates/        # AppSync velocity templates
├── schema.graphql            # GraphQL schema definition
├── serverless.yml            # Serverless framework config
├── webpack.config.js         # Webpack + TypeScript config
├── tsconfig.json             # TypeScript configuration
└── .env                      # Environment variables (create this)
```

## Testing the API

### Example GraphQL Queries

**Query Users:**
```graphql
query {
  users {
    id
    name
    email
  }
}
```

**Query Posts:**
```graphql
query {
  posts {
    id
    title
    body
    author {
      name
    }
  }
}
```

**Create Subscription (requires authentication):**
```graphql
mutation {
  planSubscriptionCreate(plan: STARTER) {
    id
    clientSecret
  }
}
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

**For DynamoDB (port 8000):**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

**For AppSync Simulator (port 20002):**
```bash
lsof -ti:20002 | xargs kill -9
```

### TypeScript Errors

Run type checking to see all errors:
```bash
pnpm type-check
```

### Docker Not Running

Make sure Docker Desktop is running:
- Open Docker Desktop application
- Wait for it to fully start (whale icon in menu bar)
- Then run `docker-compose up`

### Missing Dependencies

If you get module not found errors:
```bash
# From project root
pnpm install

# Or from packages/graph
cd packages/graph
pnpm install
```

### Node.js Version Compatibility

**Error: `error:0308010C:digital envelope routines::unsupported`**

This error was fixed by upgrading to Webpack 5. If you still encounter it:

1. Make sure you've run `pnpm install` to get the latest dependencies
2. The project now uses Webpack 5 which is compatible with Node.js v17+
3. You're currently using Node.js v23, which is fully supported

If issues persist, try:
```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

## Deployment

To deploy to AWS (requires AWS credentials configured):

```bash
# Deploy to AWS
pnpm serverless deploy

# Or specific stage
pnpm serverless deploy --stage production
```

## Additional Resources

- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [AWS AppSync Docs](https://docs.aws.amazon.com/appsync/)
- [Stripe API Docs](https://stripe.com/docs/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
