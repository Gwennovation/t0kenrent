#!/bin/bash

echo "🚀 T0kenRent Vercel Deployment Script"
echo "====================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔐 Logging into Vercel..."
vercel login

echo ""
echo "📤 Deploying to Vercel..."
echo ""

# Deploy to production
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy your Vercel URL (e.g., https://t0kenrent.vercel.app)"
echo "2. Go to https://dashboard.handcash.io/"
echo "3. Update your app redirect URL to your Vercel URL"
echo "4. Go to your Vercel project settings"
echo "5. Add these environment variables:"
echo ""
echo "   HANDCASH_APP_SECRET=0d0f7416bd5ab0a54ebe443c524a5b753a90894d46925ac8ed5291cd19eae66f"
echo "   NEXT_PUBLIC_HANDCASH_REDIRECT_URL=<YOUR_VERCEL_URL>"
echo "   NETWORK=main"
echo "   WHATSONCHAIN_API=https://api.whatsonchain.com/v1/bsv/main"
echo "   DEFAULT_UNLOCK_FEE_BSV=0.0001"
echo "   PAYMENT_EXPIRY_MINUTES=5"
echo "   ACCESS_TOKEN_EXPIRY_MINUTES=30"
echo "   JWT_SECRET=t0kenrent_secure_jwt_secret_key_change_in_production_min_32_chars"
echo "   NODE_ENV=production"
echo "   NEXT_PUBLIC_APP_URL=<YOUR_VERCEL_URL>"
echo ""
echo "6. Redeploy from Vercel dashboard to apply env vars"
echo ""
echo "🎉 Your app will be live at your Vercel URL!"
