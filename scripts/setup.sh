#!/bin/bash

# T0kenRent Setup Script
# This script helps you set up the T0kenRent development environment

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          T0kenRent Development Environment Setup              ║"
echo "║    Decentralized Rental Tokenization Platform on BSV          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js is not installed${NC}"
        echo "Please install Node.js v18 or higher from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}✗ Node.js version is too old (v$NODE_VERSION)${NC}"
        echo "Please upgrade to Node.js v18 or higher"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}✗ npm is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"
}

# Install dependencies
install_dependencies() {
    echo ""
    echo "📦 Installing dependencies..."
    echo ""
    
    # Root dependencies
    echo "Installing root dependencies..."
    npm install
    
    # Backend dependencies
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    # Frontend dependencies
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    # Overlay service dependencies
    echo "Installing overlay service dependencies..."
    cd overlay-service && npm install && cd ..
    
    echo -e "${GREEN}✓ All dependencies installed${NC}"
}

# Setup environment files
setup_env_files() {
    echo ""
    echo "⚙️  Setting up environment files..."
    echo ""
    
    # Backend .env
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✓ Created backend/.env${NC}"
        echo -e "${YELLOW}⚠ Please edit backend/.env with your configuration${NC}"
    else
        echo -e "${YELLOW}⚠ backend/.env already exists, skipping${NC}"
    fi
    
    # Frontend .env
    if [ ! -f frontend/.env ]; then
        cp frontend/.env.example frontend/.env
        echo -e "${GREEN}✓ Created frontend/.env${NC}"
    else
        echo -e "${YELLOW}⚠ frontend/.env already exists, skipping${NC}"
    fi
    
    # Overlay service .env
    if [ ! -f overlay-service/.env ]; then
        cp overlay-service/.env.example overlay-service/.env
        echo -e "${GREEN}✓ Created overlay-service/.env${NC}"
    else
        echo -e "${YELLOW}⚠ overlay-service/.env already exists, skipping${NC}"
    fi
}

# Generate BSV key
generate_bsv_key() {
    echo ""
    read -p "Would you like to generate a new BSV testnet private key? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Generating BSV testnet private key..."
        
        # Install @bsv/sdk temporarily if not installed
        cd backend
        npm list @bsv/sdk &> /dev/null || npm install @bsv/sdk
        
        # Generate key
        PRIVATE_KEY=$(node -e "const { PrivateKey } = require('@bsv/sdk'); const key = PrivateKey.fromRandom(); console.log('WIF:', key.toWif()); console.log('Address:', key.toAddress().toString());")
        
        echo ""
        echo -e "${GREEN}✓ Generated new BSV key:${NC}"
        echo "$PRIVATE_KEY"
        echo ""
        echo -e "${YELLOW}IMPORTANT: Save this key securely!${NC}"
        echo -e "${YELLOW}Add the WIF to your backend/.env file as BSV_PRIVATE_KEY${NC}"
        echo ""
        echo "To get testnet BSV, visit:"
        echo "  - https://testnet.satoshisvision.network/"
        echo "  - https://faucet.bitcoincloud.net/"
        
        cd ..
    fi
}

# Check optional services
check_optional_services() {
    echo ""
    echo "🔍 Checking optional services..."
    echo ""
    
    # MongoDB
    if command -v mongod &> /dev/null; then
        echo -e "${GREEN}✓ MongoDB detected${NC}"
    else
        echo -e "${YELLOW}⚠ MongoDB not detected (optional - can use in-memory database)${NC}"
        echo "  Install from: https://www.mongodb.com/try/download/community"
    fi
    
    # Redis
    if command -v redis-server &> /dev/null; then
        echo -e "${GREEN}✓ Redis detected${NC}"
    else
        echo -e "${YELLOW}⚠ Redis not detected (optional - can use in-memory cache)${NC}"
        echo "  Install from: https://redis.io/download"
    fi
}

# Print next steps
print_next_steps() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                     Setup Complete! 🎉                         ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Edit your configuration files:"
    echo "   - backend/.env (add your BSV_PRIVATE_KEY)"
    echo "   - frontend/.env"
    echo ""
    echo "2. Start the development servers:"
    echo "   $ npm run dev"
    echo ""
    echo "   Or start services individually:"
    echo "   $ cd backend && npm run dev       # Backend API (port 3000)"
    echo "   $ cd frontend && npm run dev      # Frontend UI (port 3001)"
    echo "   $ cd overlay-service && npm run dev # Overlay (port 3002)"
    echo ""
    echo "3. Access the application:"
    echo "   Frontend: http://localhost:3001"
    echo "   Backend API: http://localhost:3000"
    echo ""
    echo "4. Read the documentation:"
    echo "   - QUICKSTART.md - Quick start guide"
    echo "   - docs/api.md - API documentation"
    echo "   - docs/T0kenRent-Whitepaper-v1.0.pdf - Technical whitepaper"
    echo ""
    echo "5. Get testnet BSV:"
    echo "   - https://testnet.satoshisvision.network/"
    echo "   - https://faucet.bitcoincloud.net/"
    echo ""
    echo "Need help?"
    echo "  - Documentation: docs/"
    echo "  - GitHub Issues: https://github.com/ChibiTech/T0kenRent/issues"
    echo "  - Discord: https://discord.gg/tokenrent"
    echo ""
    echo "Happy coding! 🚀"
    echo ""
}

# Main setup flow
main() {
    check_node
    check_npm
    install_dependencies
    setup_env_files
    generate_bsv_key
    check_optional_services
    print_next_steps
}

# Run main function
main
