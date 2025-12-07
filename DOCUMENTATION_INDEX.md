# T0kenRent Complete Documentation Index

Welcome to the T0kenRent documentation! This guide will help you navigate all available documentation.

---

## Quick Links

- **Live Demo**: https://t0kenrent.vercel.app
- **GitHub Repository**: https://github.com/Gwennovation/t0kenrent
- **Main README**: [README.md](./README.md)

---

## Documentation Structure

### **Getting Started**

| Document | Description | Link |
|----------|-------------|------|
| **README.md** | Main project overview, features, quick start | [View](./README.md) |
| **docs/QUICKSTART.md** | Quick 5-minute setup guide | [View](./docs/QUICKSTART.md) |
| **PROJECT_SETUP.md** | Complete development setup with project structure | [View](./PROJECT_SETUP.md) |

**Start here if you're new to the project!**

---

### **Technical Documentation**

| Document | Description | Link |
|----------|-------------|------|
| **docs/architecture.md** | System architecture, design patterns, data flow | [View](./docs/architecture.md) |
| **docs/api.md** | Complete API endpoint reference | [View](./docs/api.md) |
| **docs/http402.md** | HTTP 402 micropayment protocol implementation | [View](./docs/http402.md) |
| **docs/wallet-integration.md** | Multi-wallet integration guide (HandCash, MetaNet, Paymail) | [View](./docs/wallet-integration.md) |
| **docs/USER_DATA_PERSISTENCE.md** | Data persistence architecture (localStorage + MongoDB) | [View](./docs/USER_DATA_PERSISTENCE.md) |

**For understanding how T0kenRent works under the hood.**

---

### **Deployment & Configuration**

| Document | Description | Link |
|----------|-------------|------|
| **docs/DEPLOYMENT_GUIDE.md** | Production deployment to Vercel | [View](./docs/DEPLOYMENT_GUIDE.md) |
| **docs/VERCEL_ENV_VARS.md** | Required environment variables for Vercel | [View](./docs/VERCEL_ENV_VARS.md) |

**For deploying T0kenRent to production.**

---

### **Contributing**

| Document | Description | Link |
|----------|-------------|------|
| **docs/CONTRIBUTING.md** | Contribution guidelines, code standards, PR process | [View](./docs/CONTRIBUTING.md) |

**For developers who want to contribute to the project.**

---

### **Additional Resources**

| Resource | Description | Link |
|----------|-------------|------|
| **Whitepaper** | T0kenRent technical whitepaper (PDF) | [View](./docs/T0kenRent-Whitepaper-v1.0.pdf) |
| **docs/README.md** | Documentation directory index | [View](./docs/README.md) |
| **Contracts Documentation** | Smart contract examples and templates | [View](./docs/contracts/) |
| **Overlay Documentation** | BSV overlay network integration | [View](./docs/overlay/) |

---

## Documentation by Topic

### For Hackathon Judges

**Want to understand T0kenRent quickly?**

1. Start with [README.md](./README.md) - Project overview
2. Read [docs/QUICKSTART.md](./docs/QUICKSTART.md) - Quick setup
3. Review [docs/architecture.md](./docs/architecture.md) - Technical depth
4. Check [docs/http402.md](./docs/http402.md) - Innovation showcase

### For Developers

**Want to run T0kenRent locally?**

1. Follow [PROJECT_SETUP.md](./PROJECT_SETUP.md) - Complete setup
2. Reference [docs/api.md](./docs/api.md) - API endpoints
3. Read [docs/wallet-integration.md](./docs/wallet-integration.md) - Wallet setup
4. Check [docs/VERCEL_ENV_VARS.md](./docs/VERCEL_ENV_VARS.md) - Configuration

### For Understanding the Innovation

**Want to see what makes T0kenRent unique?**

1. [docs/http402.md](./docs/http402.md) - Micropayment-gated content
2. [docs/architecture.md](./docs/architecture.md) - Blockchain escrow
3. [docs/wallet-integration.md](./docs/wallet-integration.md) - Multi-wallet support
4. [docs/USER_DATA_PERSISTENCE.md](./docs/USER_DATA_PERSISTENCE.md) - Hybrid storage

### For Deployment

**Want to deploy T0kenRent?**

1. [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) - Vercel deployment
2. [docs/VERCEL_ENV_VARS.md](./docs/VERCEL_ENV_VARS.md) - Environment setup
3. [PROJECT_SETUP.md](./PROJECT_SETUP.md) - MongoDB configuration

---

## Quick Reference

### Key Features Documentation

| Feature | Documentation | Code Location |
|---------|--------------|---------------|
| **HTTP 402 Micropayments** | [docs/http402.md](./docs/http402.md) | `src/pages/api/payment/` |
| **2-of-2 Multisig Escrow** | [docs/architecture.md](./docs/architecture.md) | `src/lib/escrow.ts` |
| **HandCash Integration** | [docs/wallet-integration.md](./docs/wallet-integration.md) | `src/lib/handcash-*.ts` |
| **MongoDB Storage** | [docs/USER_DATA_PERSISTENCE.md](./docs/USER_DATA_PERSISTENCE.md) | `src/lib/mongodb.ts` |
| **API Endpoints** | [docs/api.md](./docs/api.md) | `src/pages/api/` |

### Tech Stack Documentation

| Technology | Documentation | Purpose |
|------------|--------------|---------|
| **Next.js 14** | [PROJECT_SETUP.md](./PROJECT_SETUP.md) | Frontend framework |
| **BSV Blockchain** | [docs/architecture.md](./docs/architecture.md) | Transaction layer |
| **MongoDB** | [docs/USER_DATA_PERSISTENCE.md](./docs/USER_DATA_PERSISTENCE.md) | Database |
| **Vercel** | [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | Hosting & CDN |
| **HandCash SDK** | [docs/wallet-integration.md](./docs/wallet-integration.md) | Wallet payments |

---

## Directory Structure

```
t0kenrent/
README.md Start here!
PROJECT_SETUP.md Development setup

docs/ All documentation
README.md Index of docs
QUICKSTART.md 5-min quick start
architecture.md System design
api.md API reference
http402.md Micropayments
wallet-integration.md Multi-wallet guide
DEPLOYMENT_GUIDE.md Production deploy
VERCEL_ENV_VARS.md Environment vars
USER_DATA_PERSISTENCE.md Data architecture
CONTRIBUTING.md How to contribute
T0kenRent-Whitepaper-v1.0.pdf Whitepaper
contracts/ Smart contracts
overlay/ BSV overlay docs

src/ Source code
components/ React components
pages/ Next.js pages & API
lib/ Utilities & integrations
models/ MongoDB models
styles/ CSS & styling

public/ Static assets
```

---

## Online Documentation

### GitHub Repository
All documentation is available on GitHub:
**https://github.com/Gwennovation/t0kenrent**

### View Documentation Online

| Document | GitHub URL |
|----------|-----------|
| README | https://github.com/Gwennovation/t0kenrent/blob/main/README.md |
| Architecture | https://github.com/Gwennovation/t0kenrent/blob/main/docs/architecture.md |
| API Reference | https://github.com/Gwennovation/t0kenrent/blob/main/docs/api.md |
| HTTP 402 | https://github.com/Gwennovation/t0kenrent/blob/main/docs/http402.md |
| Wallet Integration | https://github.com/Gwennovation/t0kenrent/blob/main/docs/wallet-integration.md |
| Quick Start | https://github.com/Gwennovation/t0kenrent/blob/main/docs/QUICKSTART.md |
| Deployment | https://github.com/Gwennovation/t0kenrent/blob/main/docs/DEPLOYMENT_GUIDE.md |

---

## Learning Path

### 1. **Complete Beginner**
Start here if you're new to blockchain or T0kenRent:

```
README.md
↓
docs/QUICKSTART.md
↓
Try Live Demo (https://t0kenrent.vercel.app)
↓
docs/architecture.md (optional)
```

### 2. **Developer**
Start here if you want to run or contribute:

```
PROJECT_SETUP.md
↓
docs/api.md
↓
docs/wallet-integration.md
↓
docs/CONTRIBUTING.md
```

### 3. **Deployer**
Start here if you want to deploy your own instance:

```
docs/DEPLOYMENT_GUIDE.md
↓
docs/VERCEL_ENV_VARS.md
↓
PROJECT_SETUP.md (MongoDB setup)
```

### 4. **Researcher/Judge**
Start here for technical evaluation:

```
README.md
↓
docs/architecture.md
↓
docs/http402.md
↓
docs/T0kenRent-Whitepaper-v1.0.pdf
```

---

## Documentation Statistics

- **Total Documentation Files**: 11 markdown files + 1 PDF
- **Lines of Documentation**: ~15,000 lines
- **Code Comments**: Extensive inline documentation
- **API Endpoints Documented**: 25+ endpoints
- **Architecture Diagrams**: Included in docs/architecture.md
- **Example Code**: Included throughout documentation

---

## Search Tips

### Find Specific Information

**Looking for...**
- **Setup instructions**: PROJECT_SETUP.md or docs/QUICKSTART.md
- **API endpoints**: docs/api.md
- **Blockchain details**: docs/architecture.md
- **Payment system**: docs/http402.md
- **Wallet setup**: docs/wallet-integration.md
- **Deployment**: docs/DEPLOYMENT_GUIDE.md
- **Environment variables**: docs/VERCEL_ENV_VARS.md
- **Data persistence**: docs/USER_DATA_PERSISTENCE.md

### Use GitHub Search
Search the entire codebase and documentation:
**https://github.com/Gwennovation/t0kenrent/search**

---

## Getting Help

### Documentation Issues
If you find errors or want to improve documentation:
1. Open an issue: https://github.com/Gwennovation/t0kenrent/issues
2. Submit a PR with fixes
3. See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)

### Questions
- Check existing documentation first
- Search GitHub issues
- Open a new issue if needed

---

## Documentation Checklist

Before diving in, make sure you've reviewed:

- [ ] **README.md** - Project overview
- [ ] **docs/QUICKSTART.md** - Quick setup guide
- [ ] **Live Demo** - Try it at https://t0kenrent.vercel.app
- [ ] **docs/architecture.md** - Understand the system
- [ ] **docs/api.md** - Know the API endpoints

---

## Most Important Documents

If you only read 3 documents, read these:

1. **[README.md](./README.md)** - What is T0kenRent?
2. **[docs/architecture.md](./docs/architecture.md)** - How does it work?
3. **[docs/http402.md](./docs/http402.md)** - What makes it innovative?

---

## Full Documentation List

**11 Core Documentation Files:**

1. README.md
2. PROJECT_SETUP.md
3. docs/README.md
4. docs/QUICKSTART.md
5. docs/architecture.md
6. docs/api.md
7. docs/http402.md
8. docs/wallet-integration.md
9. docs/DEPLOYMENT_GUIDE.md
10. docs/VERCEL_ENV_VARS.md
11. docs/USER_DATA_PERSISTENCE.md
12. docs/CONTRIBUTING.md

**Additional Resources:**
- docs/T0kenRent-Whitepaper-v1.0.pdf
- docs/contracts/
- docs/overlay/

---

**Happy Learning! **

For questions or contributions, visit:
**https://github.com/Gwennovation/t0kenrent**
