# T0kenRent - Complete Project Setup Guide

**Last Updated**: December 6, 2025 
**Version**: 1.0.0 
**Live Demo**: https://3000-i302m5njfk0occat3d5wz-c81df28e.sandbox.novita.ai

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Running the Application](#running-the-application)
6. [Testing Features](#testing-features)
7. [Environment Configuration](#environment-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Additional Resources](#additional-resources)

---

## Project Overview

T0kenRent is a decentralized peer-to-peer rental marketplace built on the BSV blockchain. The platform enables users to rent and list assets with:

- **Secure Escrow**: 2-of-2 multisig smart contracts
- **Micropayments**: HTTP 402 payment protocol
- **Multi-Wallet Support**: HandCash, MetaNet/Babbage, Paymail
- **On-Chain Records**: All transactions stored on BSV blockchain
- **Demo Mode**: Full-featured testing without wallet connection

### Technology Stack

- **Frontend**: Next.js 14.2, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: MongoDB (optional - works in-memory for demo)
- **Blockchain**: BSV with HandCash SDK and Babbage SDK
- **Smart Contracts**: 2-of-2 Multisig Escrow
- **Payments**: HTTP 402 Protocol, Micropayments

---

## Project Structure

```
t0kenrent/
src/ # Source code directory
components/ # React UI components
RentalMarketplace.tsx # Main marketplace interface
AssetCard.tsx # Individual asset display card
CreateAssetModal.tsx # Asset listing creation form
EscrowModal.tsx # Escrow creation & management
HTTP402Modal.tsx # Micropayment unlock interface
RentalCard.tsx # Rental agreement display
RentalDashboard.tsx # User dashboard for rentals
WalletSelector.tsx # Wallet connection interface
Portal.tsx # Modal portal component
ThemeToggle.tsx # Light/dark theme switcher

pages/ # Next.js pages & routes
index.tsx # Landing/homepage
_app.tsx # App wrapper with providers
_document.tsx # HTML document structure
api/ # API endpoints (backend)
assets/ # Asset management endpoints
create.ts # POST - Create new asset
batch-create.ts # POST - Create multiple assets
list.ts # GET - List all assets
my.ts # GET - User's assets
unlock.ts # POST - Unlock asset details

auth/ # Authentication endpoints
handcash.ts # HandCash OAuth callback
paymail.ts # Paymail resolution

402/ # HTTP 402 payment protocol
initiate.ts # POST - Start 402 payment
callback.ts # POST - Payment callback

payment/ # Payment processing
initiate.ts # POST - Create payment request
verify.ts # POST - Verify transaction
handcash.ts # POST - HandCash payment

escrow/ # Escrow smart contracts
create.ts # POST - Create escrow
fund.ts # POST - Fund escrow
confirm.ts # POST - Confirm funding
status.ts # GET - Escrow status
release.ts # POST - Release funds

rentals/ # Rental management
create.ts # POST - Create rental
batch-create.ts # POST - Create multiple rentals
my.ts # GET - User's rentals
complete.ts # POST - Complete rental
mint-proof.ts # POST - Mint rental proof
submit-overlay.ts # POST - Submit to overlay

user/ # User management
profile.ts # GET/POST - User profile
stats.ts # GET - User statistics

lib/ # Utility libraries
handcash.ts # HandCash SDK integration
escrow.ts # Escrow contract logic
http402.ts # HTTP 402 implementation
mongodb.ts # MongoDB connection
overlay.ts # BSV overlay network
ordinals.ts # 1Sat ordinals integration
pushdrop.ts # PushDrop token protocol
storage.ts # In-memory storage (demo)

models/ # MongoDB data schemas
User.ts # User account schema
RentalAsset.ts # Asset listing schema
Rental.ts # Rental agreement schema
Escrow.ts # Escrow contract schema

context/ # React context providers
AuthContext.tsx # Authentication state

styles/ # Global styles
globals.css # Tailwind CSS & custom styles

types/ # TypeScript definitions
index.ts # Shared type definitions

public/ # Static assets
favicon.ico # Website icon
images/ # Image assets

docs/ # Documentation
QUICKSTART.md # Quick start guide
architecture.md # Technical architecture
api.md # API reference
http402.md # HTTP 402 protocol docs
wallet-integration.md # Wallet integration guide
CONTRIBUTING.md # Contribution guidelines

config/ # Configuration files
deployment-info.json # Deployment metadata

scripts/ # Utility scripts
setup.sh # Setup automation script

.env.example # Environment variables template
.gitignore # Git ignore rules
package.json # NPM dependencies
package-lock.json # Locked dependencies
next.config.js # Next.js configuration
tailwind.config.js # Tailwind CSS configuration
tsconfig.json # TypeScript configuration
postcss.config.js # PostCSS configuration
Dockerfile # Docker container setup
docker-compose.yml # Docker Compose setup
README.md # Main documentation
PROJECT_SETUP.md # This file
LICENSE # MIT License
DEPLOYMENT_STATUS.md # Deployment information
```

### Key Directories Explained

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `src/components/` | React UI components for the interface | RentalMarketplace, AssetCard, WalletSelector |
| `src/pages/api/` | Backend API endpoints (serverless functions) | assets/*, rentals/*, escrow/*, payment/* |
| `src/lib/` | Utility functions and integrations | handcash.ts, escrow.ts, http402.ts |
| `src/models/` | MongoDB schemas for data persistence | User, RentalAsset, Rental, Escrow |
| `docs/` | Comprehensive project documentation | QUICKSTART, architecture, API docs |
| `public/` | Static files served directly | Images, icons, fonts |

---

## Prerequisites

Before setting up T0kenRent, ensure you have the following installed:

### Required Software

1. **Node.js** (v18.0.0 or higher)
- Download: https://nodejs.org/
- Check version: `node --version`
- Required for running Next.js and npm

2. **npm** (v9.0.0 or higher)
- Comes bundled with Node.js
- Check version: `npm --version`
- Package manager for dependencies

3. **Git** (v2.30 or higher)
- Download: https://git-scm.com/
- Check version: `git --version`
- Version control system

### Optional Software

4. **MongoDB** (v6.0 or higher) - Optional
- Download: https://www.mongodb.com/try/download/community
- Only needed if you want persistent storage
- App works perfectly without it using in-memory storage

5. **Docker** (v20.10 or higher) - Optional
- Download: https://www.docker.com/get-started
- For containerized deployment
- Includes Docker Compose

### BSV Wallet (Pick One)

6. **HandCash Account** (Recommended)
- Sign up: https://handcash.io/
- Create app: https://dashboard.handcash.io/
- Best for beginners

7. **MetaNet Portal** (Advanced)
- Install: https://www.babbage.systems/
- Browser extension wallet
- For developers

8. **Paymail Address**
- Any BSV paymail (e.g., user@handcash.io)
- Simplest option for testing

---

## Step-by-Step Setup

Follow these steps to get T0kenRent running on your local machine:

### Step 1: Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/Gwennovation/t0kenrent.git

# Navigate into the project directory
cd t0kenrent

# Verify you're in the correct directory
pwd
# Should show: /path/to/t0kenrent
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# This will install:
# - Next.js framework
# - React and React DOM
# - Tailwind CSS
# - HandCash SDK
# - Babbage SDK
# - MongoDB driver
# - All other dependencies

# Wait for installation to complete (may take 2-5 minutes)
```

**Expected Output:**
```
added 523 packages, and audited 524 packages in 3m
found 0 vulnerabilities
```

### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Open .env.local in your text editor
nano .env.local
# or
code .env.local
# or
vim .env.local
```

**Minimum Configuration (for demo mode):**

```bash
# .env.local - Minimal setup for demo mode

# HandCash (optional for demo mode)
NEXT_PUBLIC_HANDCASH_APP_ID="demo_app_id"
HANDCASH_APP_SECRET="demo_app_secret"
NEXT_PUBLIC_HANDCASH_REDIRECT_URL="http://localhost:3000"

# Network
NETWORK="main"
WHATSONCHAIN_API="https://api.whatsonchain.com/v1/bsv/main"

# HTTP 402
DEFAULT_UNLOCK_FEE_BSV="0.0001"
PAYMENT_EXPIRY_MINUTES="5"

# Security
JWT_SECRET="your_random_secret_key_here_at_least_32_characters_long"
```

**Full Production Configuration:**

```bash
# .env.local - Production setup

# Database (optional - app works without it)
MONGODB_URI="mongodb://localhost:27017/t0kenrent"
# or MongoDB Atlas:
# MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/t0kenrent"

# HandCash Connect (get from https://dashboard.handcash.io)
NEXT_PUBLIC_HANDCASH_APP_ID="your_actual_app_id"
HANDCASH_APP_SECRET="your_actual_app_secret"
NEXT_PUBLIC_HANDCASH_REDIRECT_URL="http://localhost:3000"

# BSV Network
NETWORK="main"
WHATSONCHAIN_API="https://api.whatsonchain.com/v1/bsv/main"

# ARC API (for transaction broadcasting)
ARC_API_KEY="mainnet_your_api_key_here"

# Overlay Network
OVERLAY_URL="https://overlay-us-1.bsvb.tech"

# HTTP 402 Micropayments
DEFAULT_UNLOCK_FEE_BSV="0.0001"
PAYMENT_EXPIRY_MINUTES="5"
ACCESS_TOKEN_EXPIRY_MINUTES="30"
WAB_SERVER_URL="http://localhost:3000/api/402/callback"

# 1Sat Ordinals
ONESAT_API_URL="https://ordinals.gorillapool.io/api"

# Security
JWT_SECRET="generate_a_secure_random_string_here_at_least_32_chars"
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
RATE_LIMIT_RPM="100"

# Application
PORT=3000
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 4: Set Up HandCash (Optional but Recommended)

If you want to use real wallet integration:

1. **Create HandCash Account**
- Go to https://handcash.io/
- Sign up for a free account
- Install the mobile app (iOS or Android)

2. **Create HandCash App**
- Visit https://dashboard.handcash.io/
- Click "Create New App"
- Fill in app details:
- Name: "T0kenRent Local Dev"
- Redirect URL: `http://localhost:3000`
- Save and copy your App ID and App Secret

3. **Update .env.local**
```bash
NEXT_PUBLIC_HANDCASH_APP_ID="your_copied_app_id"
HANDCASH_APP_SECRET="your_copied_app_secret"
```

### Step 5: Set Up MongoDB (Optional)

Only if you want persistent storage:

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# Mac (Homebrew):
brew install mongodb-community@6.0
brew services start mongodb-community@6.0

# Ubuntu:
sudo apt install mongodb-org
sudo systemctl start mongod

# Windows: Download installer from mongodb.com

# Verify MongoDB is running
mongosh
# Should connect successfully
```

**Option B: MongoDB Atlas (Cloud)**
```bash
# 1. Go to https://www.mongodb.com/cloud/atlas
# 2. Create free account
# 3. Create cluster (M0 free tier)
# 4. Create database user
# 5. Whitelist IP (0.0.0.0/0 for dev)
# 6. Get connection string
# 7. Update .env.local with connection string
```

---

## Running the Application

### Development Mode (Recommended)

```bash
# Start the Next.js development server
npm run dev

# Server will start on http://localhost:3000
# Watch for this output:
```

**Expected Output:**
```
> t0kenrent@1.0.0 dev
> next dev

Next.js 14.2.33
- Local: http://localhost:3000

Starting...
Ready in 1886ms
```

**Access the Application:**
- Open your browser
- Navigate to: http://localhost:3000
- You should see the T0kenRent landing page

### Production Build

```bash
# Build for production
npm run build

# Expected output:
# Compiled successfully
# Collecting page data
# Generating static pages

# Start production server
npm run start

# Access at http://localhost:3000
```

### Using Different Port

```bash
# Run on port 3001 instead of 3000
PORT=3001 npm run dev

# Access at http://localhost:3001
```

### Docker Deployment

```bash
# Build Docker image
docker build -t t0kenrent:latest .

# Run container
docker run -p 3000:3000 --env-file .env.local t0kenrent:latest

# Or use Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## Testing Features

### Demo Mode (No Wallet Required)

The easiest way to test all features without any setup:

1. **Access Demo Mode**
- Click "Try Demo Mode" button on homepage
- Or navigate to: http://localhost:3000/?demo=true

2. **Sample Assets Available**
- Canon EOS R5 Camera Kit - $75/day
- Trek Mountain Bike - $45/day
- Milwaukee Power Tool Set - $35/day
- Epson 4K Projector - $55/day
- DJI Mavic 3 Pro Drone - $95/day
- Beachfront Villa - Malibu - $450/day

3. **Test Features in Demo Mode**
- Browse marketplace
- Search and filter assets
- View asset details
- Create new asset listings
- Initiate rental agreements
- View rental dashboard
- Test multi-item rentals
- Experience full UI/UX

### Testing with HandCash Wallet

1. **Connect Wallet**
- Click "Connect Wallet" button
- Select "HandCash"
- Authorize in popup window
- Return to app (authenticated)

2. **Create an Asset**
- Click "List Asset" button
- Fill in asset details:
- Name: "Test Camera"
- Description: "Professional camera for rent"
- Category: "Photography"
- Daily Rate: $50
- Deposit: $500
- Click "Create Asset"

3. **Test HTTP 402 Payment**
- Browse marketplace
- Find any asset
- Click "Unlock Contact Info"
- Approve micropayment (~$0.001)
- View unlocked details

4. **Test Escrow Rental**
- Find unlocked asset
- Click "Rent Now"
- Select dates
- Review deposit + rental fee
- Fund escrow
- Rental activated!

### Testing API Endpoints

```bash
# Test asset listing API
curl http://localhost:3000/api/assets/list

# Test asset creation API
curl -X POST http://localhost:3000/api/assets/create \
-H "Content-Type: application/json" \
-d '{
"name": "Test Item",
"description": "Test Description",
"category": "electronics",
"rentalRatePerDay": 50,
"depositAmount": 500
}'

# Test health check
curl http://localhost:3000/api/health
```

---

## Environment Configuration

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | No | In-memory | MongoDB connection string |
| `NEXT_PUBLIC_HANDCASH_APP_ID` | For HandCash | - | HandCash App ID |
| `HANDCASH_APP_SECRET` | For HandCash | - | HandCash App Secret |
| `NEXT_PUBLIC_HANDCASH_REDIRECT_URL` | For HandCash | - | OAuth redirect URL |
| `NETWORK` | No | `main` | BSV network (main/test) |
| `WHATSONCHAIN_API` | No | WhatsOnChain | Blockchain API URL |
| `ARC_API_KEY` | No | - | TAAL ARC API key |
| `OVERLAY_URL` | No | - | BSV overlay service URL |
| `DEFAULT_UNLOCK_FEE_BSV` | No | `0.0001` | HTTP 402 unlock fee |
| `PAYMENT_EXPIRY_MINUTES` | No | `5` | Payment timeout |
| `ACCESS_TOKEN_EXPIRY_MINUTES` | No | `30` | Access token validity |
| `JWT_SECRET` | Yes | - | JWT signing secret (32+ chars) |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | App URL |

### Getting API Keys

**HandCash:**
1. Visit https://dashboard.handcash.io/
2. Create account
3. Create new app
4. Copy App ID and Secret

**TAAL ARC:**
1. Visit https://arc.taal.com/
2. Sign up for account
3. Generate API key
4. Copy to `ARC_API_KEY`

**MongoDB Atlas:**
1. Visit https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI`

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "Port 3000 already in use"

**Problem:** Another application is using port 3000

**Solution:**
```bash
# Option 1: Use different port
PORT=3001 npm run dev

# Option 2: Kill process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill -9

# Option 3: Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### 2. "Cannot find module 'next'"

**Problem:** Dependencies not installed

**Solution:**
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

#### 3. "HandCash login not working"

**Problem:** Incorrect HandCash configuration

**Solution:**
- Verify App ID and Secret in .env.local
- Check redirect URL matches in HandCash Dashboard
- Ensure redirect URL is `http://localhost:3000` (no trailing slash)
- Clear browser cookies and try again

#### 4. "MongoDB connection failed"

**Problem:** MongoDB not running or wrong connection string

**Solution:**
```bash
# Check MongoDB is running (Mac/Linux)
brew services list
sudo systemctl status mongod

# Start MongoDB
brew services start mongodb-community
sudo systemctl start mongod

# Or remove MONGODB_URI from .env.local to use in-memory storage
```

#### 5. "Module not found: Can't resolve 'crypto'"

**Problem:** Next.js webpack configuration issue

**Solution:**
Already configured in `next.config.js`. If issue persists:
```bash
npm install --save-dev crypto-browserify stream-browserify
```

#### 6. "Failed to compile - Syntax error"

**Problem:** TypeScript or syntax error in code

**Solution:**
```bash
# Check for errors
npm run lint

# View detailed error
npm run dev
# Read error message carefully - it shows file and line number
```

#### 7. "ECONNREFUSED connecting to overlay network"

**Problem:** Overlay service unavailable or wrong URL

**Solution:**
- Check `OVERLAY_URL` in .env.local
- Try different region:
- US: `https://overlay-us-1.bsvb.tech`
- EU: `https://overlay-eu-1.bsvb.tech`
- Asia: `https://overlay-asia-1.bsvb.tech`
- Or comment out overlay features for testing

### Debugging Tips

**Enable Debug Logging:**
```bash
# Set debug mode
NODE_ENV=development DEBUG=* npm run dev
```

**Check Browser Console:**
- Open DevTools (F12)
- Go to Console tab
- Look for error messages

**Check Server Logs:**
- Terminal shows server-side errors
- API errors appear here

**Clear Next.js Cache:**
```bash
rm -rf .next
npm run dev
```

---

## Additional Resources

### Documentation Files

- **[README.md](README.md)** - Main project documentation
- **[docs/QUICKSTART.md](docs/QUICKSTART.md)** - Quick start guide
- **[docs/architecture.md](docs/architecture.md)** - Technical architecture
- **[docs/api.md](docs/api.md)** - API endpoint reference
- **[docs/http402.md](docs/http402.md)** - HTTP 402 protocol details
- **[docs/wallet-integration.md](docs/wallet-integration.md)** - Wallet integration guide
- **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Contribution guidelines
- **[DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md)** - Current deployment status

### Online Resources

- **Live Demo**: https://3000-i302m5njfk0occat3d5wz-c81df28e.sandbox.novita.ai
- **GitHub Repository**: https://github.com/Gwennovation/t0kenrent
- **Issue Tracker**: https://github.com/Gwennovation/t0kenrent/issues
- **Discussions**: https://github.com/Gwennovation/t0kenrent/discussions

### External Documentation

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **HandCash SDK**: https://docs.handcash.io/
- **Babbage SDK**: https://docs.babbage.systems/
- **BSV Blockchain**: https://wiki.bitcoinsv.io/
- **MongoDB**: https://docs.mongodb.com/

### Community & Support

- **BSV Discord**: Join the BSV developer community
- **GitHub Issues**: Report bugs or request features
- **Email**: Contact repository owner via GitHub

---

## Next Steps

After successfully setting up T0kenRent, you can:

1. **Explore the Application**
- Try demo mode to understand the flow
- Create test assets
- Test the rental process

2. **Customize for Your Needs**
- Modify UI components in `src/components/`
- Add new categories or features
- Adjust payment amounts

3. **Deploy to Production**
- Choose hosting platform (Vercel, Netlify, AWS, etc.)
- Configure production environment variables
- Set up MongoDB for persistent storage
- Register production HandCash app

4. **Contribute**
- Read [CONTRIBUTING.md](docs/CONTRIBUTING.md)
- Fork the repository
- Submit pull requests

5. **Learn More**
- Read technical architecture docs
- Understand HTTP 402 protocol
- Explore BSV blockchain integration

---

## Setup Verification Checklist

Use this checklist to verify your setup is complete:

- [ ] Node.js v18+ installed
- [ ] npm v9+ installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install` successful)
- [ ] `.env.local` file created
- [ ] JWT_SECRET set in `.env.local`
- [ ] Development server starts successfully (`npm run dev`)
- [ ] Application loads at http://localhost:3000
- [ ] Demo mode accessible
- [ ] Can browse sample assets
- [ ] Can create test asset (in demo mode)
- [ ] No console errors in browser
- [ ] API endpoints responding

**Optional (for production):**
- [ ] HandCash app created
- [ ] HandCash credentials in `.env.local`
- [ ] MongoDB configured (or in-memory mode working)
- [ ] HandCash wallet connection working
- [ ] Can unlock asset details with micropayment
- [ ] Can create and fund escrow

---

## Support

If you encounter any issues not covered in this guide:

1. **Check Existing Documentation**
- Review README.md and docs/ folder
- Search GitHub issues

2. **Enable Debug Mode**
- Run with `DEBUG=* npm run dev`
- Check browser console (F12)

3. **Ask for Help**
- Open GitHub issue with:
- Detailed error message
- Steps to reproduce
- Environment info (OS, Node version, etc.)
- Screenshots if applicable

4. **Community Resources**
- BSV Discord community
- GitHub Discussions

---

**Built on BSV Blockchain** | **Powered by GenSpark AI**

---

Last Updated: December 6, 2025 
Version: 1.0.0 
License: MIT
