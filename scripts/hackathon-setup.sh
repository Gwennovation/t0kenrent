#!/bin/bash

# T0kenRent Hackathon Quick Setup Script
# Run this to prepare for the 10-hour hackathon

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       T0kenRent - BSV Hackathon Quick Setup                    ║"
echo "║       Preparing for 10-hour execution plan                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Phase 1: Check Prerequisites
echo "📋 Phase 1: Checking Prerequisites..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Install from: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) found${NC}"

# Check MongoDB (optional)
if command -v mongod &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB found${NC}"
else
    echo -e "${YELLOW}⚠ MongoDB not found (will use Docker or Atlas)${NC}"
fi

echo ""

# Phase 2: Install Dependencies
echo "📦 Phase 2: Installing Dependencies..."
echo ""

# Root dependencies
echo "Installing root dependencies..."
npm install --silent

# Backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install --silent
cd ..

# Frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

# Overlay service dependencies
echo "Installing overlay service dependencies..."
cd overlay-service
npm install --silent
cd ..

echo -e "${GREEN}✓ All dependencies installed${NC}"
echo ""

# Phase 3: Create Environment Files
echo "⚙️  Phase 3: Creating Environment Files..."
echo ""

# Backend .env
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓ Created backend/.env${NC}"
    echo -e "${YELLOW}  → Edit backend/.env to add your BSV testnet private key${NC}"
else
    echo -e "${YELLOW}⚠ backend/.env already exists${NC}"
fi

# Frontend .env
if [ ! -f frontend/.env ]; then
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3000
VITE_OVERLAY_URL=http://localhost:3002
VITE_BSV_NETWORK=testnet
EOF
    echo -e "${GREEN}✓ Created frontend/.env${NC}"
else
    echo -e "${YELLOW}⚠ frontend/.env already exists${NC}"
fi

# Overlay service .env
if [ ! -f overlay-service/.env ]; then
    cat > overlay-service/.env << EOF
NODE_ENV=development
PORT=3002
BSV_NETWORK=testnet
MONGODB_URI=mongodb://localhost:27017/tokenrent
REDIS_HOST=localhost
REDIS_PORT=6379
EOF
    echo -e "${GREEN}✓ Created overlay-service/.env${NC}"
else
    echo -e "${YELLOW}⚠ overlay-service/.env already exists${NC}"
fi

echo ""

# Phase 4: Create Hackathon Directory Structure
echo "📁 Phase 4: Creating Hackathon Work Directories..."
echo ""

mkdir -p hackathon/diagrams
mkdir -p hackathon/wireframes
mkdir -p hackathon/api-specs
mkdir -p hackathon/test-data
mkdir -p hackathon/notes

echo -e "${GREEN}✓ Hackathon directories created${NC}"
echo ""

# Phase 5: Generate Test Data
echo "🧪 Phase 5: Generating Test Data..."
echo ""

# Create sample rental token data
cat > hackathon/test-data/sample-rental.json << EOF
{
  "metadata": {
    "protocol": "BRC76-T0KENRENT",
    "version": "1.0",
    "asset": {
      "id": "test-camera-001",
      "name": "Canon EOS R5 Camera",
      "description": "Professional mirrorless camera with 45MP full-frame sensor. Perfect for photography and 8K video recording.",
      "category": "photography",
      "condition": "excellent",
      "images": [
        "https://example.com/camera1.jpg"
      ],
      "serialNumber": "encrypted_serial_123"
    },
    "terms": {
      "dailyRate": 5000000,
      "depositAmount": 50000000,
      "minDuration": 1,
      "maxDuration": 7,
      "currency": "BSV",
      "lateFeePerDay": 1000000
    },
    "owner": {
      "pubKey": "YOUR_PUBLIC_KEY_HERE",
      "generalLocation": "San Francisco, CA",
      "reputation": 95
    },
    "state": {
      "status": "available"
    },
    "createdAt": $(date +%s),
    "updatedAt": $(date +%s)
  }
}
EOF

echo -e "${GREEN}✓ Test data created in hackathon/test-data/${NC}"
echo ""

# Phase 6: Create Quick Reference
echo "📝 Phase 6: Creating Quick Reference..."
echo ""

cat > hackathon/QUICK_REFERENCE.md << 'EOF'
# T0kenRent Hackathon Quick Reference

## Essential Commands

### Start Development
```bash
# Option 1: All services
npm run dev

# Option 2: Individual services
cd backend && npm run dev       # Port 3000
cd frontend && npm run dev      # Port 3001
cd overlay-service && npm run dev # Port 3002
```

### Test Endpoints
```bash
# Health checks
curl http://localhost:3000/health
curl http://localhost:3002/health

# Create rental token
curl -X POST http://localhost:3000/api/tokens/mint \
  -H "Content-Type: application/json" \
  -d @hackathon/test-data/sample-rental.json

# Query overlay
curl http://localhost:3002/api/rentals/active
```

### Wallet Setup
1. Install Yours Wallet: https://yours.org/wallet
2. Switch to testnet (Settings → Network)
3. Get testnet BSV: https://testnet.satoshisvision.network/

### MongoDB Quick Start
```bash
# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use Atlas: https://cloud.mongodb.com
```

## Hour-by-Hour Checklist

### Hour 1-2: Setup ⏰
- [ ] Wallet installed & funded
- [ ] Explored BSV app templates
- [ ] Reviewed supply chain example

### Hour 3-4: Core Dev ⏰
- [ ] Data structure defined
- [ ] Topic manager implemented
- [ ] Wallet integration working

### Hour 5-6: Token System ⏰
- [ ] Token minting functional
- [ ] HTTP 402 working
- [ ] UI for creating rentals

### Hour 7-8: Overlay ⏰
- [ ] MongoDB running
- [ ] LARS deployment configured
- [ ] SHIP/SLAP tested

### Hour 9-10: Docs ⏰
- [ ] Miro diagrams
- [ ] Figma wireframes
- [ ] API docs
- [ ] Sprint plan

## Important Links

- **Hackathon Plan**: HACKATHON_EXECUTION_PLAN.md
- **Workshop PDF**: docs/Open_Run_Workshop_1.pdf
- **API Docs**: docs/api.md
- **Whitepaper**: docs/T0kenRent-Whitepaper-v1.0.pdf

## Troubleshooting

**Wallet not connecting?**
- Check if Yours Wallet is installed
- Verify you're on testnet
- Try HandCash as alternative

**Overlay not working?**
- Check MongoDB connection
- Verify environment variables
- Check logs: `tail -f overlay-service/logs/app.log`

**Transaction failing?**
- Verify testnet balance
- Check transaction format
- Use testnet explorer: https://test.whatsonchain.com
EOF

echo -e "${GREEN}✓ Quick reference created${NC}"
echo ""

# Phase 7: MongoDB Setup Helper
echo "🗄️  Phase 7: Database Setup Options..."
echo ""

cat > hackathon/start-mongodb.sh << 'EOF'
#!/bin/bash

echo "Starting MongoDB for T0kenRent..."
echo ""
echo "Choose option:"
echo "1) Docker (recommended)"
echo "2) MongoDB Atlas (cloud)"
echo "3) Local MongoDB"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "Starting MongoDB with Docker..."
        docker run -d -p 27017:27017 --name tokenrent-mongodb mongo:latest
        echo "MongoDB started on port 27017"
        echo "Connection string: mongodb://localhost:27017/tokenrent"
        ;;
    2)
        echo "Setting up MongoDB Atlas..."
        echo "1. Go to: https://cloud.mongodb.com"
        echo "2. Create free cluster"
        echo "3. Get connection string"
        echo "4. Add to backend/.env as MONGODB_URI"
        ;;
    3)
        echo "Starting local MongoDB..."
        if command -v mongod &> /dev/null; then
            mongod --dbpath ./data/db &
            echo "MongoDB started"
        else
            echo "MongoDB not installed. Install with:"
            echo "  brew install mongodb-community  # macOS"
            echo "  sudo apt install mongodb         # Linux"
        fi
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
EOF

chmod +x hackathon/start-mongodb.sh
echo -e "${GREEN}✓ MongoDB setup helper created${NC}"
echo ""

# Final Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete! 🎉                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "1. 📖 Read the execution plan:"
echo "   cat HACKATHON_EXECUTION_PLAN.md"
echo ""
echo "2. 💰 Get testnet funds:"
echo "   https://testnet.satoshisvision.network/"
echo ""
echo "3. 🗄️  Start MongoDB:"
echo "   ./hackathon/start-mongodb.sh"
echo ""
echo "4. 🚀 Start development:"
echo "   npm run dev"
echo ""
echo "5. 📝 Track progress:"
echo "   cat hackathon/QUICK_REFERENCE.md"
echo ""
echo "Important files created:"
echo "  • hackathon/QUICK_REFERENCE.md"
echo "  • hackathon/test-data/sample-rental.json"
echo "  • hackathon/start-mongodb.sh"
echo ""
echo "Ready for the 10-hour hackathon! Good luck! 🚀"
echo ""
