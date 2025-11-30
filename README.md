# T0kenRent

> **Decentralized Rental Tokenization and Escrow Platform**

[![BSV Hackathon](https://img.shields.io/badge/BSV-Hackathon%202025-orange)](https://bsvhackathon.com)
[![Built on BSV](https://img.shields.io/badge/Built%20on-BSV-green)](https://bsvblockchain.org)
[![HTTP 402](https://img.shields.io/badge/HTTP-402%20Payment%20Required-purple)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402)
[![Workshop Alignment](https://img.shields.io/badge/Workshop%20Alignment-100%25-brightgreen)](docs/WORKSHOP_ALIGNMENT.md)

T0kenRent is a decentralized platform built on the BSV blockchain that enables tokenization and rental of everyday assets. By leveraging BRC-76 compliant tokens, HTTP 402 micropayment gating, sCrypt smart contracts, and payment channels, T0kenRent creates a trustless, efficient, and globally accessible rental marketplace.

## 🌟 Key Features

- **Asset Tokenization**: Mint BRC-76 compliant tokens representing rentable items (cameras, tools, vehicles, etc.)
- **HTTP 402 Payment Gating**: Micropayments unlock detailed rental information, filtering serious renters
- **sCrypt Smart Contracts**: Type-safe escrow contracts with 2-of-2 multisig and timeout protection
- **Payment Channels**: Off-chain streaming payments for hourly/minute-based rentals
- **Custom Overlay Network**: Full Topic Manager (tm_tokenrent) and Lookup Service (ls_tokenrent) implementation
- **Near-Zero Fees**: BSV's low transaction costs enable micropayment economics

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Demo Mode](#-demo-mode)
- [Architecture](#-architecture)
- [Smart Contracts](#-smart-contracts)
- [Overlay Network](#-overlay-network)
- [HTTP 402 Protocol](#-http-402-protocol)
- [Escrow System](#-escrow-system)
- [API Reference](#-api-reference)
- [Development](#-development)
- [Workshop Alignment](#-workshop-alignment)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **MongoDB** (optional - demo mode works without it)
- **BSV Wallet** with Babbage SDK support (or use demo mode)

### Installation

```bash
# Clone the repository
git clone https://github.com/Gwennovation/t0kenrent.git
cd t0kenrent

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
NODE_ENV=development
PORT=3000
MONGODB_URI="mongodb://localhost:27017/t0kenrent"  # Optional
NETWORK="testnet"
OVERLAY_URL="https://overlay-us-1.bsvb.tech"
MOCK_PAYMENTS=true  # Enable for demo mode
MOCK_WALLET=true    # Enable for demo mode
```

### Access the Application

Open [http://localhost:3000](http://localhost:3000) and connect your BSV wallet or use Demo Mode!

## 🎮 Demo Mode

Test T0kenRent without a wallet, MongoDB, or real BSV transactions:

1. Visit the application URL
2. Click **"Try Demo Mode (No Wallet Required)"** button
3. Or add `?demo=true` to any URL

**Demo Mode Features:**
- ✅ Browse marketplace with mock rental assets
- ✅ View HTTP 402 payment flow (simulated)
- ✅ Test escrow creation UI
- ✅ No wallet or MongoDB required

**Mock Assets Available:**
- Canon EOS R5 Camera Kit (50 MNEE/day)
- Trek Mountain Bike (25 MNEE/day)
- DeWalt Power Drill Set (15 MNEE/day)
- Epson Home Cinema Projector (35 MNEE/day)
- 4-Person Camping Tent (20 MNEE/day)

## 🏗️ Architecture

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
│  │  BRC-76 Tokens  │  │  sCrypt Smart Contracts         │  │
│  │  (Asset NFTs)   │  │  (RentalEscrow, PaymentChannel) │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Components

| Component | Description |
|-----------|-------------|
| **Frontend** | Next.js React application with Tailwind CSS |
| **HTTP 402 Gateway** | Micropayment-gated content delivery |
| **Wallet Interface** | Babbage SDK + BSV Desktop Wallet Bridge |
| **Topic Manager** | Custom `tm_tokenrent` overlay implementation |
| **Lookup Service** | Custom `ls_tokenrent` for state queries |
| **RentalEscrow** | sCrypt 2-of-2 multisig escrow contract |
| **PaymentChannel** | sCrypt streaming payment channel |

## 📜 Smart Contracts

### RentalEscrow Contract

Location: `src/contracts/RentalEscrow.ts`

```typescript
export class RentalEscrow extends SmartContract {
  @prop() ownerPubKey: PubKey
  @prop() renterPubKey: PubKey
  @prop() depositAmount: bigint
  @prop() timeoutBlock: bigint
  @prop(true) state: bigint  // Stateful

  @method()
  public release(ownerSig: Sig, renterSig: Sig) {
    // 2-of-2 multisig release
    assert(this.checkSig(ownerSig, this.ownerPubKey))
    assert(this.checkSig(renterSig, this.renterPubKey))
  }
  
  @method()
  public timeout(ownerSig: Sig) {
    // Owner claims after timeout
    assert(this.ctx.locktime >= this.timeoutBlock)
    assert(this.checkSig(ownerSig, this.ownerPubKey))
  }
}
```

**Features:**
- 2-of-2 multisig for normal release
- Timeout-based dispute resolution
- Refund mechanism for cancellations
- Stateful contract with state transitions

### PaymentChannel Contract

Location: `src/contracts/PaymentChannel.ts`

```typescript
export class PaymentChannel extends SmartContract {
  @prop() capacity: bigint
  @prop(true) ownerBalance: bigint
  @prop(true) renterBalance: bigint
  @prop(true) sequence: bigint

  @method()
  public update(newOwnerBalance, newRenterBalance, newSequence, ownerSig, renterSig) {
    // Off-chain updates with higher sequence
  }
  
  @method()
  public cooperativeClose(ownerSig: Sig, renterSig: Sig) {
    // Both parties agree to final settlement
  }
}
```

**Features:**
- Off-chain payment updates (no on-chain fees)
- Streaming payments for hourly rentals
- Cooperative and unilateral close
- Dispute timeout protection

## 🌐 Overlay Network

### Topic Manager (tm_tokenrent)

Location: `src/overlay/TopicManager.ts`

```typescript
export const TOPICS = {
  ASSET_CREATE: 'tokenrent.asset.create',
  ESCROW_CREATE: 'tokenrent.escrow.create',
  ESCROW_RELEASE: 'tokenrent.escrow.release',
  PAYMENT_402: 'tokenrent.payment.402'
}

const topicManager = createTopicManager()
topicManager.validateOutput(output)  // Validate transactions
topicManager.submitToOverlay(tx, topic)  // Submit to network
```

### Lookup Service (ls_tokenrent)

Location: `src/overlay/LookupService.ts`

```typescript
const lookupService = createLookupService()

// Asset queries
await lookupService.getAssetByTokenId(tokenId)
await lookupService.getAvailableAssets({ category: 'photography' })

// Escrow queries
await lookupService.getEscrowById(escrowId)
await lookupService.getActiveEscrows(userKey)

// Payment verification
await lookupService.verifyPayment(txid, expectedAmount)
```

## 💳 HTTP 402 Protocol

T0kenRent implements the HTTP 402 "Payment Required" status code:

```
Renter                          T0kenRent                       BSV Network
  │                                 │                                │
  │──── GET /rental/xyz ───────────▶│                                │
  │◀─── 402 Payment Required ──────│                                │
  │     {amount: 0.0001 BSV}        │                                │
  │                                 │                                │
  │──── Create Payment ─────────────────────────────────────────────▶│
  │                                 │                                │
  │──── POST /payment/verify ──────▶│──── Verify ──────────────────▶│
  │◀─── 200 OK + Details ──────────│                                │
```

**Benefits:**
- Spam prevention through economic cost
- Owner revenue from information access
- Demonstrates serious rental intent

## 🔒 Escrow System

### Escrow States

```
┌──────────┐    Fund     ┌────────┐   Co-sign   ┌───────────┐
│ CREATED  │────────────▶│ FUNDED │────────────▶│ RELEASED  │
└──────────┘             └────────┘             └───────────┘
                              │
                              │ Timeout/Dispute
                              ▼
                        ┌───────────┐
                        │ DISPUTED  │
                        └───────────┘
```

### Script Structure

```
# 2-of-2 Multisig
OP_2 <owner_pubkey> <renter_pubkey> OP_2 OP_CHECKMULTISIG

# With Timeout Fallback
OP_IF
    OP_2 <owner_pubkey> <renter_pubkey> OP_2 OP_CHECKMULTISIG
OP_ELSE
    <timeout_blocks> OP_CHECKSEQUENCEVERIFY OP_DROP
    <owner_pubkey> OP_CHECKSIG
OP_ENDIF
```

## 📡 API Reference

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
| `/api/payment/verify` | POST | Verify payment and unlock |

### Escrow Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/escrow/create` | POST | Create rental escrow |
| `/api/escrow/confirm` | POST | Confirm escrow funding |
| `/api/escrow/release` | POST | Sign escrow release |

See [docs/api.md](docs/api.md) for complete API documentation.

## 🛠️ Development

### Project Structure

```
t0kenrent/
├── src/
│   ├── components/           # React components
│   ├── contracts/            # sCrypt smart contracts
│   │   ├── RentalEscrow.ts
│   │   └── PaymentChannel.ts
│   ├── overlay/              # Custom overlay network
│   │   ├── TopicManager.ts
│   │   ├── LookupService.ts
│   │   └── index.ts
│   ├── pages/
│   │   ├── api/              # API routes
│   │   └── index.tsx
│   ├── lib/                  # Utilities
│   └── models/               # MongoDB schemas
├── scripts/
│   ├── wallet-bridge.js      # BSV Desktop wallet bridge
│   └── init-metanet-portal.js
├── docs/                     # Documentation
├── public/                   # Static assets
└── deployment-info.json      # BRC-102 config
```

### Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production

# Wallet Bridge
npm run bridge:setup     # Import BSV Desktop wallet key

# Smart Contracts
npm run contracts:compile  # Compile sCrypt contracts

# Code Quality
npm run lint             # Lint code
npm run test             # Run tests
```

### BSV Desktop Wallet Bridge

Connect your existing BSV wallet:

```bash
# Interactive mode
node scripts/wallet-bridge.js

# Options:
# 1. Import WIF private key
# 2. View current identity
# 3. Generate new identity
# 4. Export public key
```

## 📊 Workshop Alignment

T0kenRent achieves **100% alignment** with all Open Run Asia workshops:

| Workshop | Score | Key Implementations |
|----------|-------|---------------------|
| Workshop 1: Architecture | 100% | 3-Layer Mandala, UTXO, Overlay |
| Workshop 2: Development | 100% | Babbage SDK, PushDrop, MessageBox |
| Workshop 3: Design | 100% | Whitepaper, Wireframes, API Spec |
| Workshop 4: Use Cases | 100% | Overlay, MNEE, Certificates |
| Workshop 5: Smart Contracts | 100% | sCrypt, Payment Channels |

See [docs/WORKSHOP_ALIGNMENT.md](docs/WORKSHOP_ALIGNMENT.md) for detailed alignment report.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **BSV Blockchain** - For scalable, low-cost transactions
- **Babbage SDK** - For seamless wallet integration
- **sCrypt** - For TypeScript smart contract DSL
- **Open Run Asia** - For the hackathon opportunity

---

**Team ChibiTech** | Open Run Asia - BSV Hackathon 2025

Built with ❤️ on Bitcoin SV
