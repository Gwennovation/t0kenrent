# T0kenRent

> **Decentralized Rental Tokenization and Escrow Platform**

[![BSV Hackathon](https://img.shields.io/badge/BSV-Hackathon%202025-orange)](https://bsvhackathon.com)
[![Built on BSV](https://img.shields.io/badge/Built%20on-BSV-green)](https://bsvblockchain.org)
[![HTTP 402](https://img.shields.io/badge/HTTP-402%20Payment%20Required-purple)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402)

T0kenRent is a decentralized platform built on the BSV blockchain that enables tokenization and rental of everyday assets. By leveraging BRC-76 compliant tokens, HTTP 402 micropayment gating, and smart contract escrows, T0kenRent creates a trustless, efficient, and globally accessible rental marketplace.

## Key Features

- **Asset Tokenization**: Mint BRC-76 compliant tokens representing rentable items (cameras, tools, vehicles, etc.)
- **HTTP 402 Payment Gating**: Micropayments unlock detailed rental information, filtering serious renters
- **Smart Contract Escrows**: 2-of-2 multisig escrows secure deposits without intermediaries
- **Overlay Network Integration**: Real-time transaction monitoring and state management
- **Near-Zero Fees**: BSV's low transaction costs enable micropayment economics

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [HTTP 402 Protocol](#http-402-protocol)
- [Escrow System](#escrow-system)
- [API Reference](#api-reference)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **MongoDB** (optional for full functionality)
- **BSV Wallet** with Babbage SDK support

### Installation

```bash
# Clone the repository
git clone https://github.com/ChibiTech/T0kenRent.git
cd T0kenRent

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start development server
npm run dev
```

### Environment Configuration

```bash
# .env
MONGODB_URI="mongodb://localhost:27017/t0kenrent"
NETWORK="main"
ARC_API_KEY="your_api_key"
OVERLAY_URL="https://overlay-us-1.bsvb.tech"
```

### Access the Application

Open [http://localhost:3000](http://localhost:3000) and connect your BSV wallet to start!

## Architecture

T0kenRent follows the BSV 3-Layer Mandala Network architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 3: Application                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Frontend   │  │  HTTP 402   │  │  Wallet Interface   │ │
│  │  (Next.js)  │  │  Gateway    │  │  (Babbage SDK)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                  Layer 2: Overlay Services                   │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │  Topic Manager  │  │  Lookup Service (UTXO Set)      │  │
│  │  (tm_tokenrent) │  │  - Asset tokens                 │  │
│  └─────────────────┘  │  - Escrow status               │  │
│                       │  - Payment verification         │  │
│                       └─────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                Layer 1: BSV Protocol                         │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │  BRC-76 Tokens  │  │  Bitcoin Script Escrows         │  │
│  │  (Asset NFTs)   │  │  (2-of-2 Multisig)              │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Components

| Component | Description |
|-----------|-------------|
| **Frontend** | Next.js React application with Tailwind CSS |
| **HTTP 402 Gateway** | Micropayment-gated content delivery |
| **Wallet Interface** | Babbage SDK integration for BSV transactions |
| **Topic Manager** | Monitors BSV transactions matching T0kenRent protocol |
| **Lookup Service** | Maintains current state of assets and escrows |
| **BRC-76 Tokens** | NFT representation of rentable assets |
| **Escrow Scripts** | Bitcoin Script predicates for deposit security |

## HTTP 402 Protocol

T0kenRent implements the HTTP 402 "Payment Required" status code to gate access to sensitive rental information.

### Flow

```
Renter                          T0kenRent Server                    BSV Network
  │                                    │                                 │
  │──── GET /rental/details/xyz ──────▶│                                 │
  │                                    │                                 │
  │◀─── 402 Payment Required ─────────│                                 │
  │     {amount: 0.0001 BSV,          │                                 │
  │      address: owner_address,       │                                 │
  │      reference: pay_123}           │                                 │
  │                                    │                                 │
  │──── Create BSV Transaction ───────────────────────────────────────▶ │
  │                                    │                                 │
  │──── POST /payment/verify ─────────▶│                                 │
  │     {txid, reference}              │                                 │
  │                                    │──── Verify Transaction ────────▶│
  │                                    │◀─── Confirmed ─────────────────│
  │                                    │                                 │
  │◀─── 200 OK ───────────────────────│                                 │
  │     {rentalDetails: {...},         │                                 │
  │      accessToken: "xyz"}           │                                 │
```

### Benefits

- **Spam Prevention**: Economic cost filters casual browsers
- **Owner Revenue**: Asset owners earn from information access
- **Renter Intent**: Demonstrates serious rental interest
- **Micropayment Efficiency**: BSV enables cost-effective tiny payments

## Escrow System

Security deposits are protected by Bitcoin Script smart contracts.

### Escrow States

```
┌──────────┐    Fund     ┌────────┐   Co-sign   ┌───────────┐
│ CREATED  │────────────▶│ FUNDED │────────────▶│ COMPLETED │
└──────────┘             └────────┘             └───────────┘
                              │
                              │ Dispute
                              ▼
                        ┌───────────┐  Arbitrate  ┌────────────┐
                        │ DISPUTED  │────────────▶│ ARBITRATED │
                        └───────────┘             └────────────┘
```

### Script Structure

```
# 2-of-2 Multisig for standard release
OP_2 <owner_pubkey> <renter_pubkey> OP_2 OP_CHECKMULTISIG

# With timeout fallback (owner recovery after N blocks)
OP_IF
    OP_2 <owner_pubkey> <renter_pubkey> OP_2 OP_CHECKMULTISIG
OP_ELSE
    <timeout_blocks> OP_CHECKSEQUENCEVERIFY OP_DROP
    <owner_pubkey> OP_CHECKSIG
OP_ENDIF
```

## API Reference

### Authentication

All authenticated endpoints require a JWT token obtained via wallet signature.

```bash
POST /api/auth/login
{
  "wallet_address": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
  "signature": "signed_message_proof"
}
```

### Asset Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/assets/create` | POST | Mint new rental asset token |
| `/api/assets/list` | GET | List marketplace assets |
| `/api/assets/my` | GET | List user's assets |

### Payment Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payment/initiate` | POST | Initiate HTTP 402 payment |
| `/api/payment/verify` | POST | Verify payment and unlock details |

### Escrow Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/escrow/create` | POST | Create rental escrow |
| `/api/escrow/confirm` | POST | Confirm escrow funding |
| `/api/escrow/release` | POST | Sign escrow release |

See [docs/api.md](docs/api.md) for complete API documentation.

## Development

### Project Structure

```
T0kenRent/
├── src/
│   ├── components/       # React components
│   │   ├── RentalMarketplace.tsx
│   │   ├── AssetCard.tsx
│   │   ├── HTTP402Modal.tsx
│   │   ├── EscrowModal.tsx
│   │   └── ...
│   ├── pages/
│   │   ├── api/          # API routes
│   │   │   ├── assets/
│   │   │   ├── payment/
│   │   │   └── escrow/
│   │   └── index.tsx
│   ├── lib/              # Utilities
│   │   ├── mnee.ts       # MNEE token handling
│   │   ├── overlay.ts    # Overlay network
│   │   └── mongodb.ts    # Database connection
│   ├── models/           # MongoDB schemas
│   │   ├── RentalAsset.ts
│   │   └── Escrow.ts
│   └── types/            # TypeScript definitions
├── docs/                 # Documentation
├── public/               # Static assets
└── Config/               # Configuration files
```

### Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server

# Testing
npm run test             # Run tests
npm run test:e2e         # End-to-end tests

# Code Quality
npm run lint             # Lint code
npm run lint:fix         # Fix lint errors
```

### Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Blockchain**: BSV via @bsv/sdk
- **Wallet**: Babbage SDK
- **Styling**: Tailwind CSS

## Hackathon Demo

For rapid hackathon testing:

```bash
# Enable demo mode (no real transactions required)
NODE_ENV=development
MOCK_PAYMENTS=true

npm run dev
```

Demo mode features:
- In-memory database (no MongoDB required)
- Mocked BSV transactions
- Auto-verified payments

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **BSV Blockchain** - For scalable, low-cost transactions
- **Babbage SDK** - For seamless wallet integration
- **BSV Hackathon** - For the opportunity to build

---

**Team ChibiTech** | BSV Hackathon 2025

Built with :heart: on Bitcoin SV
