# T0kenRent

**Decentralized Peer-to-Peer Rental Platform on BSV Blockchain**

T0kenRent is a revolutionary decentralized marketplace for renting anything - from cameras and tools to vacation homes. Built on the BSV blockchain, it eliminates middlemen and provides secure, trustless transactions through smart contract escrow and micropayments.

### Why T0kenRent?

- **No Platform Fees** - Direct peer-to-peer transactions
- **Secure Escrow** - Funds held in 2-of-2 multisig contracts
- **Instant Payments** - Fast BSV micropayments
- **Transparent Records** - All transactions on-chain
- **Global Access** - No geographical restrictions
- **Own Your Data** - No centralized database required

## Live Demo

**[Try T0kenRent Live](https://t0kenrent.vercel.app/)** - Experience the platform in action!

Try the demo mode to explore features without connecting a wallet - just click "Try Demo Mode" or add `?demo=true` to the URL.


## Quick Start

Want to try it instantly? **[Launch Live Demo](https://t0kenrent.vercel.app/)** and explore the platform without any setup!

## Features

- **Multi-Wallet Support**: Connect using HandCash, MetaNet/Babbage, or Paymail
- **HTTP 402 Micropayments**: Unlock rental details with small payments (approximately $0.001)
- **2-of-2 Multisig Escrow**: Deposits protected by smart contracts requiring both parties to sign
- **On-Chain Transaction Records**: All transactions recorded on the BSV blockchain
- **1Sat Ordinal Integration**: Assets can be linked to ordinals for ownership verification
- **Overlay Network**: Transaction broadcasting through BSV overlay services
- **Multi-Item Rentals**: Batch creation and rental of multiple items at once
- **Real Estate Category**: Support for vacation rentals and staycations

## Requirements

- Node.js version 18 or higher
- npm or yarn package manager
- MongoDB (optional - the application functions without it in demo mode)
- BSV Wallet: HandCash, MetaNet, or Paymail address

## Installation

**For detailed setup instructions with complete project structure, see [PROJECT_SETUP.md](PROJECT_SETUP.md)**

### Quick Install

```bash
# Clone the repository
git clone https://github.com/Gwennovation/t0kenrent.git
cd t0kenrent

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Start development server
npm run dev
```

Open http://localhost:3000 to view the application.

## Environment Variables

Create a `.env.local` file with the following configuration:

```bash
# HandCash Connect (obtain from https://dashboard.handcash.io)
NEXT_PUBLIC_HANDCASH_APP_ID=your_app_id
HANDCASH_APP_SECRET=your_app_secret
NEXT_PUBLIC_HANDCASH_REDIRECT_URL=http://localhost:3000

# MongoDB (optional - application works without it)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/t0kenrent

# BSV Network
NETWORK=main
WHATSONCHAIN_API=https://api.whatsonchain.com/v1/bsv/main

# Overlay Network
OVERLAY_URL=https://overlay.example.com

# HTTP 402 Settings
DEFAULT_UNLOCK_FEE_BSV=0.0001
PAYMENT_EXPIRY_MINUTES=5

# Security
JWT_SECRET=your_secret_key
```

## Demo Mode

Test T0kenRent without connecting a wallet - perfect for exploring features risk-free!

**Three ways to access demo mode:**
1. **Direct Link**: [Open Demo Mode](https://t0kenrent.vercel.app/?demo=true)
2. **Demo Button**: Click "Try Demo Mode" on the homepage
3. **URL Parameter**: Add `?demo=true` to any page URL

**Sample assets available in demo mode:**
- Canon EOS R5 Camera Kit ($75/day)
- Trek Mountain Bike ($45/day)
- Milwaukee Power Tool Set ($35/day)
- Epson 4K Projector ($55/day)
- DJI Mavic 3 Pro Drone ($95/day)
- Beachfront Villa - Malibu ($450/day)

**What you can test in demo mode:**
- Browse and search the marketplace
- Filter by category and price
- Create new asset listings
- Initiate rental agreements
- View the rental dashboard
- Test multi-item rental features
- Experience the full user interface

## Architecture

```
Frontend (Next.js)
  - Marketplace: Browse and filter rental listings
  - Dashboard: Manage rentals and view history
  - Wallet Auth: HandCash, MetaNet, Paymail connections
      |
API Routes (Next.js)
  - /api/auth/*: Authentication endpoints
  - /api/assets/*: Asset management
  - /api/402/*: Micropayment gateway
  - /api/escrow/*: Smart contract escrow
  - /api/payment/*: Payment processing
  - /api/rentals/*: Rental management
      |
Data Layer
  - MongoDB: Production database
  - In-Memory: Demo mode storage
  - BSV Chain: On-chain records via overlay
```

## Database Models

| Model | Description |
|-------|-------------|
| User | User accounts with wallet information and statistics |
| RentalAsset | Asset listings with HTTP 402 payment support |
| Rental | Rental agreements with status tracking |
| Escrow | 2-of-2 multisig escrow contracts |

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/handcash` | POST | HandCash OAuth callback |
| `/api/auth/paymail` | POST | Paymail resolution |

### Assets

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/assets/create` | POST | Create new rental asset |
| `/api/assets/list` | GET | List marketplace assets |
| `/api/assets/my` | GET | Get user-owned assets |
| `/api/assets/unlock` | POST | Unlock asset details |

### HTTP 402 Payments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/402/initiate` | POST | Initiate 402 payment request |
| `/api/402/callback` | POST | Payment callback |
| `/api/payment/initiate` | POST | Create payment request |
| `/api/payment/verify` | POST | Verify payment transaction |
| `/api/payment/handcash` | POST | HandCash payment |

### Escrow

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/escrow/create` | POST | Create 2-of-2 escrow |
| `/api/escrow/fund` | POST | Fund escrow contract |
| `/api/escrow/confirm` | POST | Confirm funding |
| `/api/escrow/status` | GET | Get escrow status |
| `/api/escrow/release` | POST | Release escrow funds |

### Rentals

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rentals/create` | POST | Create rental record |
| `/api/rentals/my` | GET | Get user rentals |
| `/api/rentals/complete` | POST | Complete rental |
| `/api/rentals/mint-proof` | POST | Mint rental proof |
| `/api/rentals/submit-overlay` | POST | Submit to overlay |

### User

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/profile` | GET/POST | User profile |
| `/api/user/stats` | GET | User statistics |

## Project Structure

```
t0kenrent/
├── src/
│   ├── components/           # React components
│   │   ├── AssetCard.tsx
│   │   ├── CreateAssetModal.tsx
│   │   ├── EscrowModal.tsx
│   │   ├── HTTP402Modal.tsx
│   │   ├── RentalCard.tsx
│   │   ├── RentalDashboard.tsx
│   │   ├── RentalMarketplace.tsx
│   │   ├── WalletSelector.tsx
│   │   └── Portal.tsx
│   ├── models/               # MongoDB schemas
│   │   ├── User.ts
│   │   ├── RentalAsset.ts
│   │   ├── Rental.ts
│   │   └── Escrow.ts
│   ├── lib/                  # Utilities
│   │   ├── handcash.ts
│   │   ├── escrow.ts
│   │   ├── http402.ts
│   │   ├── mongodb.ts
│   │   ├── overlay.ts
│   │   ├── ordinals.ts
│   │   ├── pushdrop.ts
│   │   └── storage.ts
│   ├── pages/
│   │   ├── api/              # API routes
│   │   ├── index.tsx
│   │   ├── _app.tsx
│   │   └── _document.tsx
│   ├── context/
│   └── styles/
├── config/
│   └── deployment-info.json
├── docs/
│   ├── CONTRIBUTING.md
│   ├── QUICKSTART.md
│   ├── api.md
│   ├── architecture.md
│   ├── http402.md
│   └── wallet-integration.md
├── public/
└── scripts/
```

## Wallet Integration

### HandCash
1. Create an application at dashboard.handcash.io
2. Add your redirect URL to the application settings
3. Configure `NEXT_PUBLIC_HANDCASH_APP_ID` and `HANDCASH_APP_SECRET`

### MetaNet/Babbage
- Uses babbage-sdk for transaction signing
- Requires MetaNet Portal extension or compatible wallet

### Paymail
- Enter your paymail address (e.g., user@handcash.io)
- System resolves public key via paymail protocol

## HTTP 402 Payment Flow

```
1. User clicks "Unlock Contact Info" on asset
2. Frontend calls POST /api/402/initiate
3. API returns 402 status with payment details
4. User wallet creates payment transaction
5. Frontend calls POST /api/payment/verify with transaction ID
6. API verifies on-chain payment, returns access token
7. Asset details unlocked for 30 minutes
```

## Escrow Flow

```
1. Renter selects dates and clicks "Rent Now"
2. POST /api/escrow/create creates 2-of-2 multisig
3. Renter funds escrow via wallet
4. POST /api/escrow/fund records funding transaction
5. Rental becomes active
6. Both parties sign to release
7. POST /api/escrow/release distributes funds
```

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Documentation

### Setup & Deployment
| Document | Description |
|----------|-------------|
| [PROJECT_SETUP.md](PROJECT_SETUP.md) | Complete setup guide with project structure |
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | Quick start guide for developers |
| [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Deployment guide for multiple platforms |
| [docs/VERCEL_ENV_VARS.md](docs/VERCEL_ENV_VARS.md) | Vercel environment variables reference |
| [docs/TROUBLESHOOTING_HANDCASH.md](docs/TROUBLESHOOTING_HANDCASH.md) | HandCash authentication troubleshooting |

### Technical Documentation
| Document | Description |
|----------|-------------|
| [docs/architecture.md](docs/architecture.md) | Technical architecture details |
| [docs/api.md](docs/api.md) | API endpoint reference |
| [docs/http402.md](docs/http402.md) | HTTP 402 payment protocol |
| [docs/wallet-integration.md](docs/wallet-integration.md) | Wallet integration guide |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Contribution guidelines |

## Contributing

See docs/CONTRIBUTING.md for detailed guidelines.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add your feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open Pull Request

## Technologies Used

### Blockchain & Payments
- **BSV Blockchain** - Scalable, low-cost transactions
- **HandCash SDK** - Wallet integration and authentication
- **Babbage SDK** - MetaNet wallet support
- **PushDrop** - Token protocol implementation
- **WhatsOnChain API** - Blockchain explorer and verification

### Frontend
- **Next.js 14** - React framework with SSR/SSG
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React 18** - UI library with hooks

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - Optional persistent storage
- **JWT** - Session management
- **In-Memory Storage** - Demo mode support

## License

MIT License - see LICENSE for details.

## Acknowledgments

Special thanks to the BSV ecosystem and the open-source community for making decentralized applications possible.

- **BSV Blockchain** - Enabling scalable blockchain applications
- **HandCash** - Seamless wallet integration
- **Babbage SDK** - MetaNet infrastructure
- **GenSpark** - AI-powered development assistance

## Support & Community

- **Issues**: [GitHub Issues](https://github.com/Gwennovation/t0kenrent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Gwennovation/t0kenrent/discussions)
- **Documentation**: [/docs](/docs)
- **Live Demo**: [https://t0kenrent.vercel.app](https://t0kenrent.vercel.app)

---

**Built on BSV Blockchain** | **Powered by GenSpark AI**
