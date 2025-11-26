# T0kenRent: Decentralized Rental Tokenization Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![BSV](https://img.shields.io/badge/Built%20on-BSV-blue)](https://bitcoinsv.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green)](https://nodejs.org/)

**BSV Hackathon 2025 Submission | Team: ChibiTech**

## Overview

T0kenRent is a revolutionary decentralized platform built on the BSV blockchain that tokenizes everyday rental assets—from cameras and tools to bicycles and books. By leveraging HTTP 402 Payment Required protocol and Bitcoin Script smart contracts, T0kenRent eliminates intermediaries, reduces transaction costs, and creates a trustless peer-to-peer rental marketplace.

### Key Innovation: HTTP 402 Payment Gating

T0kenRent uses the HTTP 402 "Payment Required" status code to create seamless micropayment gates, allowing asset owners to monetize detailed rental information access while renters pay minimal amounts only for assets they're seriously considering.

## Features

- **Asset Tokenization**: BRC-76 compliant tokens representing physical rental items
- **HTTP 402 Micropayments**: Seamless content gating with instant BSV payments
- **Smart Contract Escrows**: Trustless security deposit management
- **Overlay Services**: Real-time state management and transaction monitoring
- **Global Accessibility**: Borderless marketplace without traditional payment barriers
- **Near-Zero Fees**: Minimal transaction costs compared to traditional platforms (3-5%)

## Architecture

T0kenRent follows the BSV 3-Layer Mandala Network architecture:

1. **Protocol Layer (BSV)**: Transaction logic and data integrity
2. **Overlay Services**: State enforcement and lookup services
3. **Application Layer**: Client interfaces and API endpoints

For detailed architecture diagrams, see [docs/architecture.md](docs/architecture.md).

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- BSV wallet (for testing)
- Docker (optional, for containerized deployment)

## Installation

### Clone the Repository

```bash
git clone https://github.com/ChibiTech/T0kenRent.git
cd T0kenRent
```

### Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install overlay service dependencies
cd ../overlay-service
npm install
```

### Environment Setup

Create `.env` files in each service directory:

```bash
# backend/.env
cp .env.example .env

# frontend/.env
cp .env.example .env

# overlay-service/.env
cp .env.example .env
```

Edit the `.env` files with your configuration.

## Quick Start

### Development Mode

```bash
# Start all services using npm scripts
npm run dev
```

Or start services individually:

```bash
# Terminal 1: Start overlay service
cd overlay-service
npm run dev

# Terminal 2: Start backend API
cd backend
npm run dev

# Terminal 3: Start frontend
cd frontend
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Documentation

- [Whitepaper](docs/T0kenRent-Whitepaper-v1.0.pdf) - Complete technical specification
- [API Documentation](docs/api.md) - REST API endpoints and usage
- [Workshop Integration](docs/workshop-integration.md) - Open Run Workshop concepts applied
- [Open Run Workshop PDF](docs/Open_Run_Workshop_1.pdf) - BSV advanced concepts (154 pages)
- [HTTP 402 Protocol](docs/http402.md) - Payment gating implementation
- [Smart Contracts](docs/smart-contracts.md) - Escrow contract specifications
- [Development Guide](docs/development.md) - Contributing and development setup

## Project Structure

```
T0kenRent/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── api/            # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # HTTP 402 middleware
│   │   └── utils/          # Helper functions
│   └── package.json
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client services
│   │   └── utils/          # Utility functions
│   └── package.json
├── overlay-service/        # BSV overlay monitoring service
│   ├── src/
│   │   ├── monitors/       # Transaction monitors
│   │   ├── validators/     # State validators
│   │   └── indexers/       # UTXO indexers
│   └── package.json
├── smart-contracts/        # Bitcoin Script contracts
│   ├── escrow/            # Escrow contract templates
│   └── tokens/            # Token issuance scripts
├── docs/                  # Documentation
├── scripts/               # Utility scripts
└── tests/                 # Test suites
```

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- backend
npm test -- frontend
npm test -- integration

# Run with coverage
npm run test:coverage
```

## Security

T0kenRent implements multiple security layers:

- **Smart Contract Security**: Audited Bitcoin Script templates
- **Payment Validation**: On-chain transaction verification
- **Time-Limited Access**: Expiring access tokens
- **Rate Limiting**: API endpoint protection
- **Replay Attack Prevention**: Unique payment references

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

### Phase 1: MVP (Hackathon) ✅
- [x] Asset tokenization (BRC-76)
- [x] HTTP 402 payment gating
- [x] Basic escrow contracts
- [x] Simple frontend UI
- [x] Whitepaper completion

### Phase 2: Beta Launch (Q2 2025)
- [ ] Advanced dispute resolution
- [ ] Multi-asset support
- [ ] Mobile application
- [ ] Enhanced security features

### Phase 3: Production (Q3 2025)
- [ ] IoT integration
- [ ] Insurance contracts
- [ ] Fractional ownership
- [ ] Cross-chain bridges

### Phase 4: Ecosystem (Q4 2025)
- [ ] Developer SDK
- [ ] Partner integrations
- [ ] Decentralized arbitration network
- [ ] Carbon credit tracking

## Use Cases

- **Photography Equipment**: Rent professional cameras, lenses, and lighting
- **Tools & Equipment**: Share power tools, construction equipment
- **Sports Equipment**: Bicycles, kayaks, camping gear
- **Electronics**: Laptops, tablets, gaming consoles
- **Books & Media**: Physical books, vinyl records
- **Event Supplies**: Party equipment, decorations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Team
- Shesly-Jhaey Peregrina
- Gwyneth Manalo
- Nash Benedict Paredes
- Leiana Xylen Dilag
- Jerick Lance Pacorales

**ChibiTech**
- Technical Lead: Gwyneth Manalo
- Smart Contract Developer: Shesly-Jhaey Peregrina & Jerick Lance Pacorales
- Frontend Developer: Nash Benedict Paredes
- Documentation: Leiana Xylen Dilag

## Acknowledgments

- BSV Association for the hackathon opportunity
- BSV SDK contributors
- Open-source community

## Contact

- Website: 
- Email: 
- Twitter: 

---

**Built with ❤️ on Bitcoin SV**

*T0kenRent is a hackathon project demonstrating the power of HTTP 402 Payment Required and BSV blockchain technology. Not yet ready for production use.*
