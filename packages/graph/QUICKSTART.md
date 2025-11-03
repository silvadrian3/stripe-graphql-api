# Quick Start Guide

## TL;DR - Get Running in 3 Steps

### 1. Install & Configure

```bash
# From project root
pnpm install

# Navigate to backend
cd packages/graph

# Create environment file
cp .env.example .env
# Edit .env and add your STRIPE_SECRET_KEY
```

### 2. Start DynamoDB

```bash
# Terminal 1 - Start database
docker-compose up
```

### 3. Run Backend

```bash
# Terminal 2 - Start server
pnpm run dev
```

### 4. Open GraphQL Playground

Open the URL shown in terminal (usually http://localhost:20002)

---

## What You Need

- Node.js 14+
- pnpm
- Docker Desktop (running)
- Stripe API key from https://dashboard.stripe.com/test/apikeys

## Common Issues

**"Port 8000 already in use"**

```bash
lsof -ti:8000 | xargs kill -9
```

**"Docker not running"**

- Open Docker Desktop app and wait for it to start

**"Module not found"**

```bash
pnpm install
```

For more details, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)
