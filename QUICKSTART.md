# T0kenRent Quick Start Guide

This guide will help you get T0kenRent up and running on your local machine in less than 10 minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **MongoDB** (optional for full functionality) - [Download here](https://www.mongodb.com/try/download/community)
- **Redis** (optional for caching) - [Download here](https://redis.io/download)

## Step 1: Clone the Repository

```bash
git clone https://github.com/ChibiTech/T0kenRent.git
cd T0kenRent
```

## Step 2: Install Dependencies

Install all dependencies for backend, frontend, and overlay service:

```bash
npm install
```

Or install individually:

```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Overlay Service
cd overlay-service && npm install && cd ..
```

## Step 3: Configure Environment Variables

### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```bash
# Minimum required configuration for development
NODE_ENV=development
PORT=3000

# BSV Configuration (use testnet for development)
BSV_NETWORK=testnet
BSV_PRIVATE_KEY=your_testnet_private_key_wif

# For testing without a real key, the system will generate a random one
# But you'll need a real one with funds for actual transactions

# Optional: Get a free TAAL API key at https://taal.com
TAAL_API_KEY=your_taal_api_key

# Database (optional - can use in-memory for quick testing)
MONGODB_URI=mongodb://localhost:27017/tokenrent

# Redis (optional - can use in-memory for quick testing)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secret (use a secure random string in production)
JWT_SECRET=your-secret-key-change-this
```

### Frontend Configuration

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```bash
VITE_API_URL=http://localhost:3000
VITE_BSV_NETWORK=testnet
```

## Step 4: Start the Development Servers

### Option A: Start All Services at Once

From the root directory:

```bash
npm run dev
```

This will start:
- Backend API on `http://localhost:3000`
- Frontend UI on `http://localhost:3001`
- Overlay Service on `http://localhost:3002`

### Option B: Start Services Individually

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Overlay Service (Optional):**
```bash
cd overlay-service
npm run dev
```

## Step 5: Access the Application

Open your browser and navigate to:

**Frontend:** http://localhost:3001

You should see the T0kenRent marketplace interface!

## Step 6: Test HTTP 402 Payment Flow

### 1. Generate a Test BSV Wallet

```bash
# Install BSV SDK CLI (optional)
npm install -g @bsv/sdk

# Generate a new private key
node -e "const { PrivateKey } = require('@bsv/sdk'); console.log(PrivateKey.fromRandom().toWif());"
```

Save this WIF (Wallet Import Format) private key in your backend `.env` file.

### 2. Get Testnet BSV

Visit a BSV testnet faucet to get free testnet coins:
- https://testnet.satoshisvision.network/
- https://faucet.bitcoincloud.net/

Send testnet BSV to your wallet address.

### 3. Create a Test Asset

Use the frontend UI or API to create a test rental asset:

```bash
curl -X POST http://localhost:3000/api/assets/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Canon EOS R5 Camera",
    "description": "Professional mirrorless camera",
    "category": "photography",
    "rental_rate_per_day": "50.00",
    "deposit_amount": "500.00",
    "currency": "USD"
  }'
```

### 4. Test HTTP 402 Payment

Try to access rental details (this will trigger HTTP 402):

```bash
curl -X GET http://localhost:3000/api/rental/details/ASSET_ID
```

You should receive a `402 Payment Required` response with payment details!

## Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"

**Solution:** Start MongoDB service:
```bash
# MacOS (with Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
net start MongoDB

# Or use in-memory database for testing by commenting out MONGODB_URI
```

### Issue: "Cannot connect to Redis"

**Solution:** Start Redis service:
```bash
# MacOS (with Homebrew)
brew services start redis

# Linux (systemd)
sudo systemctl start redis

# Windows
redis-server

# Or comment out Redis configuration to use in-memory cache
```

### Issue: "BSV_PRIVATE_KEY not set"

**Solution:** The system will generate a random key automatically, but you need a funded key for real transactions. Generate one and fund it with testnet BSV from a faucet.

### Issue: "Port already in use"

**Solution:** Change the PORT in your `.env` file or kill the process using that port:
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

## Next Steps

### Explore the Documentation

- [API Documentation](docs/api.md) - Complete API reference
- [HTTP 402 Protocol](docs/http402.md) - Payment gating details
- [Architecture](docs/architecture.md) - System architecture overview
- [Whitepaper](docs/T0kenRent-Whitepaper-v1.0.pdf) - Complete technical specification

### Try These Features

1. **Create a Rental Listing**
   - Navigate to "List Item" in the UI
   - Fill in item details
   - Mint asset token on BSV

2. **Browse Marketplace**
   - Search for items by category
   - View item previews (free)
   - Pay micropayment to unlock full details (HTTP 402)

3. **Book a Rental**
   - Select rental dates
   - Create escrow contract
   - Fund escrow with deposit

4. **Complete a Rental**
   - Mark item as returned
   - Co-sign escrow release
   - Receive deposit refund

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific tests
npm test -- backend
npm test -- frontend
```

### Development Tools

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Build for production
npm run build
```

## Docker Quick Start (Alternative)

If you prefer using Docker:

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Hackathon Development Mode

For rapid hackathon development, use this minimal setup:

1. **Skip Database Setup** - Use in-memory storage
2. **Skip Redis Setup** - Use in-memory cache
3. **Use Generated Keys** - Don't worry about funding testnet wallets
4. **Mock Payments** - Set `MOCK_PAYMENTS=true` in `.env`

```bash
# Backend .env for hackathon mode
NODE_ENV=development
PORT=3000
BSV_NETWORK=testnet
MOCK_PAYMENTS=true
JWT_SECRET=hackathon-secret

# Start development
npm run dev
```

## Getting Help

- **Documentation:** Check the [docs/](docs/) folder
- **Issues:** [GitHub Issues](https://github.com/ChibiTech/T0kenRent/issues)
- **Discord:** [Join our Discord](https://discord.gg/tokenrent)
- **Email:** support@tokenrent.io

## What's Next?

- Read the [Whitepaper](docs/T0kenRent-Whitepaper-v1.0.pdf) to understand the architecture
- Explore the [Contributing Guide](CONTRIBUTING.md) to start contributing
- Join our community on [Discord](https://discord.gg/tokenrent)
- Follow us on [Twitter](https://twitter.com/tokenrent)

---

Happy coding! 🚀 If you encounter any issues, please open an issue on GitHub or reach out on Discord.
