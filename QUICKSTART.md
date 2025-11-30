# T0kenRent Quick Start Guide

Get T0kenRent up and running on your local machine in less than 10 minutes.

## Prerequisites

- **Node.js** v18+ - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **MongoDB** (optional) - [Download](https://www.mongodb.com/try/download/community)
- **BSV Wallet** - [Babbage](https://babbage.systems/) or compatible

## Step 1: Clone and Install

```bash
git clone https://github.com/ChibiTech/T0kenRent.git
cd T0kenRent
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Minimal configuration for development
NODE_ENV=development
PORT=3000

# BSV Network (use testnet for development)
NETWORK=test

# MongoDB (optional - uses in-memory for quick testing if not set)
MONGODB_URI=mongodb://localhost:27017/t0kenrent

# Overlay Network
OVERLAY_URL=https://overlay-us-1.bsvb.tech
```

## Step 3: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the T0kenRent marketplace!

## Step 4: Connect Your Wallet

1. Click "Connect BSV Wallet" in the top right
2. Approve connection in your BSV wallet (Babbage, etc.)
3. You're now authenticated!

## Step 5: Try the Features

### List an Asset

1. Click "List New Asset"
2. Fill in asset details:
   - Name: "Canon EOS R5 Camera"
   - Category: Photography
   - Daily Rate: $50
   - Deposit: $500
   - Location: San Francisco, CA
3. Click "Mint Token & List"

### Browse Marketplace

- Search for assets by name or category
- View public details (location, price)
- Note the "Pay to Unlock Details" button (HTTP 402)

### Unlock Details (HTTP 402)

1. Click "Pay to Unlock Details" on any asset
2. Review the micropayment amount
3. Click "Pay X BSV"
4. View unlocked rental details (address, access code)

### Create Escrow

1. After unlocking details, click "Create Escrow & Rent"
2. Select rental dates
3. Review cost breakdown
4. Click "Create Escrow & Fund"
5. Confirm transaction in your wallet

## Hackathon Mode

For rapid development without real transactions:

```bash
# .env
NODE_ENV=development
MOCK_PAYMENTS=true
```

This enables:
- In-memory database (no MongoDB needed)
- Mocked BSV transactions
- Auto-verified payments

## Common Issues

### "Cannot connect to MongoDB"

```bash
# Option 1: Start MongoDB
mongod --dbpath ./data/db

# Option 2: Use in-memory (comment out MONGODB_URI)
```

### "Wallet not detected"

- Ensure you have a Babbage-compatible BSV wallet installed
- Try refreshing the page
- Check browser console for errors

### "Port already in use"

```bash
# Kill process on port 3000
kill -9 $(lsof -ti:3000)
```

## Next Steps

- Read the [README.md](README.md) for full documentation
- Check [docs/api.md](docs/api.md) for API reference
- Review [docs/http402.md](docs/http402.md) for payment protocol details
- See [docs/architecture.md](docs/architecture.md) for system design

## Docker Alternative

```bash
docker-compose up -d
```

Services:
- App: http://localhost:3000
- MongoDB: localhost:27017

## Commands Reference

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm test         # Run tests
npm run lint     # Lint code
```

## Support

- [GitHub Issues](https://github.com/ChibiTech/T0kenRent/issues)
- [Discord](https://discord.gg/tokenrent)
- Email: support@tokenrent.io

---

**Team ChibiTech** | BSV Hackathon 2025
