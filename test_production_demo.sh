#!/bin/bash

API_BASE="https://t0kenrent.vercel.app/api"
OWNER="prod-owner-$(date +%s)"

echo "=== TESTING PRODUCTION SITE ==="
echo "URL: https://t0kenrent.vercel.app"
echo ""

# Test 1: Environment Check
echo "1️⃣ Checking environment..."
ENV_CHECK=$(curl -s "$API_BASE/test-env")
ENV_STATUS=$(echo "$ENV_CHECK" | jq -r '.status // "ERROR"')
echo "   Status: $ENV_STATUS"
echo ""

# Test 2: Create Asset
echo "2️⃣ Creating test asset..."
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/assets/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Test Camera",
    "description": "Testing production demo",
    "category": "electronics",
    "rentalRatePerDay": 100,
    "depositAmount": 400,
    "city": "New York",
    "state": "NY",
    "address": "456 Production Ave",
    "ownerKey": "'"$OWNER"'",
    "walletType": "demo"
  }')

# Check if response is HTML (error page) or JSON
if echo "$CREATE_RESPONSE" | grep -q "<!DOCTYPE"; then
  echo "   ❌ ERROR: Got HTML error page instead of JSON"
  echo "   This usually means:"
  echo "      - Server is still deploying"
  echo "      - Or there's a server error"
  echo ""
  echo "   Response preview:"
  echo "$CREATE_RESPONSE" | head -5
else
  ASSET_ID=$(echo "$CREATE_RESPONSE" | jq -r '.asset.id // empty')
  SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r '.success')
  
  if [ "$SUCCESS" = "true" ]; then
    echo "   ✅ SUCCESS: Asset created!"
    echo "   Asset ID: $ASSET_ID"
    echo "   Name: $(echo "$CREATE_RESPONSE" | jq -r '.asset.name')"
    echo "   Status: $(echo "$CREATE_RESPONSE" | jq -r '.asset.status')"
  else
    echo "   ❌ FAILED: $(echo "$CREATE_RESPONSE" | jq -r '.error // .message')"
  fi
fi

echo ""

# Test 3: List Assets
echo "3️⃣ Listing assets..."
LIST_RESPONSE=$(curl -s "$API_BASE/assets/list?category=all&limit=5")
if echo "$LIST_RESPONSE" | grep -q "<!DOCTYPE"; then
  echo "   ❌ ERROR: Got HTML error page"
else
  ASSET_COUNT=$(echo "$LIST_RESPONSE" | jq -r '.count // 0')
  echo "   Total assets: $ASSET_COUNT"
  
  if [ "$ASSET_COUNT" -gt 0 ]; then
    echo "   Recent asset: $(echo "$LIST_RESPONSE" | jq -r '.assets[0].name')"
  fi
fi

echo ""
echo "=== TEST COMPLETE ==="
echo ""
echo "🌐 Visit the live site: https://t0kenrent.vercel.app"
echo "📝 To test manually:"
echo "   1. Click 'Demo Mode' button"
echo "   2. Go to 'List Item' tab"
echo "   3. Create an asset"
echo "   4. Check 'My Listings' tab"
echo "   5. Browse assets and rent one"
echo "   6. Check 'My Rentals' tab"
echo "   7. Complete the rental"
echo "   8. Verify data persists after refresh"

