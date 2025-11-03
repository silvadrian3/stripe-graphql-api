# Stripe Subscription GraphQL Demo

A full-stack demo application showcasing Stripe subscription management through a GraphQL API, built with AWS AppSync, Lambda, and React.

## Overview

This monorepo demonstrates how to build a subscription-based application using:
- **Backend**: AWS AppSync GraphQL API with Lambda resolvers and Stripe integration
- **Frontend**: React app with AWS Amplify authentication and Stripe Elements

## Tech Stack

### Backend (`packages/graph`)
- AWS AppSync (GraphQL API)
- AWS Lambda (Node.js/TypeScript)
- Stripe API (subscription management)
- AWS Cognito (authentication)
- DynamoDB (data storage)
- Serverless Framework

### Frontend (`packages/web`)
- React 17
- AWS Amplify (auth & API)
- Stripe React Elements
- Tailwind CSS
- React Router

## Quick Start

### Prerequisites
- Node.js v14 or later
- pnpm v6.14.1 or later
- Docker Desktop
- Stripe account ([get test API keys](https://dashboard.stripe.com/test/apikeys))

### Installation

```bash
# Install dependencies
pnpm install

# Configure backend
cd packages/graph
cp .env.example .env
# Edit .env and add your STRIPE_SECRET_KEY

# Start DynamoDB (Terminal 1)
docker-compose up

# Start backend server (Terminal 2)
pnpm dev

# Start frontend (Terminal 3)
cd ../web
pnpm start
```

### Access Points

- **GraphQL Playground**: http://localhost:20002
- **Frontend App**: http://localhost:3000

## Documentation

- **[QUICKSTART.md](packages/graph/QUICKSTART.md)** - Get running in 3 steps
- **[SETUP_GUIDE.md](packages/graph/SETUP_GUIDE.md)** - Detailed setup and troubleshooting
- **[CLAUDE.md](CLAUDE.md)** - Architecture and development guidance

## Features

- User authentication with AWS Cognito
- GraphQL API with AWS AppSync
- Subscription plan selection (Starter, Pro, Partner)
- Stripe payment processing
- Local development environment with offline mode
- TypeScript throughout the backend

## Project Structure

```
├── packages/
│   ├── graph/          # Backend GraphQL API
│   │   ├── functions/  # Lambda resolvers
│   │   ├── schema.graphql
│   │   └── serverless.yml
│   └── web/            # React frontend
│       └── src/
├── pnpm-workspace.yaml
└── README.md
```

## Screenshots

<img width="1440" alt="Screen Shot 2022-05-11 at 1 47 31 PM" src="https://user-images.githubusercontent.com/29755524/167821825-8066805d-c0d1-4ea3-b18f-32c62bb4d71c.png">
<img width="1440" alt="Screen Shot 2022-05-10 at 8 36 55 PM" src="https://user-images.githubusercontent.com/29755524/167821890-1c13b518-3c31-4545-adde-a3d2ad281581.png">
