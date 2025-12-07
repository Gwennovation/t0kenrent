#!/bin/bash

API_BASE="http://localhost:3000/api"
OWNER="demo-owner-$(date +%s)"
RENTER="demo-renter-$(date +%s)"

echo "=== FULL RENTAL FLOW TEST ==="
echo ""

# Step 1: Create Asset
echo "1️⃣ Creating asset..."
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/assets/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Full Flow Test Camera",
    "description": "Testing complete rental flow",
    "category": "electronics",
    "rentalRatePerDay": 75,
    "depositAmount": 300,
    "city": "San Francisco",
    "state": "CA",
    "address": "123 Test Street",
    "ownerKey": "'"$OWNER"'",
    "walletType": "demo"
  }')

ASSET_ID=$(echo "$CREATE_RESPONSE" | jq -r '.asset.id // empty')
echo "   Asset ID: $ASSET_ID"
echo "   Response: $(echo "$CREATE_RESPONSE" | jq -c '{success, assetName: .asset.name, status: .asset.status}')"

if [ -z "$ASSET_ID" ]; then
  echo "   ❌ Failed to create asset"
  echo "   Error: $(echo "$CREATE_RESPONSE" | jq -r '.error // .message')"
  exit 1
fi

echo ""

# Step 2: Verify in My Listings
echo "2️⃣ Checking 'My Listings' (should show 1 asset)..."
MY_ASSETS=$(curl -s "$API_BASE/assets/my?owner=$OWNER")
ASSET_COUNT=$(echo "$MY_ASSETS" | jq '.assets | length')
echo "   Assets in 'My Listings': $ASSET_COUNT"
echo "   Asset: $(echo "$MY_ASSETS" | jq -c '.assets[0] | {name, status}')"
echo ""

# Step 3: Create Rental
echo "3️⃣ Creating rental..."
START_DATE=$(date -d "+1 day" +%Y-%m-%d)
END_DATE=$(date -d "+3 days" +%Y-%m-%d)

RENTAL_RESPONSE=$(curl -s -X POST "$API_BASE/rentals/create" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "'"$ASSET_ID"'",
    "renterKey": "'"$RENTER"'",
    "startDate": "'"$START_DATE"'",
    "endDate": "'"$END_DATE"'",
    "walletType": "demo"
  }')

RENTAL_ID=$(echo "$RENTAL_RESPONSE" | jq -r '.rental.id // empty')
echo "   Rental ID: $RENTAL_ID"
echo "   Response: $(echo "$RENTAL_RESPONSE" | jq -c '{success, status: .rental.status, totalAmount: .rental.totalAmount}')"

if [ -z "$RENTAL_ID" ]; then
  echo "   ❌ Failed to create rental"
  echo "   Error: $(echo "$RENTAL_RESPONSE" | jq -r '.error // .message')"
  exit 1
fi

echo ""

# Step 4: Check My Listings Again (should still show asset as 'rented')
echo "4️⃣ Checking 'My Listings' after rental (asset should still be there, status: rented)..."
MY_ASSETS_AFTER=$(curl -s "$API_BASE/assets/my?owner=$OWNER")
ASSET_COUNT_AFTER=$(echo "$MY_ASSETS_AFTER" | jq '.assets | length')
ASSET_STATUS=$(echo "$MY_ASSETS_AFTER" | jq -r '.assets[0].status')
echo "   Assets in 'My Listings': $ASSET_COUNT_AFTER"
echo "   Asset Status: $ASSET_STATUS"

if [ "$ASSET_COUNT_AFTER" = "0" ]; then
  echo "   ❌ PROBLEM: Asset disappeared from 'My Listings'"
else
  echo "   ✅ SUCCESS: Asset still in 'My Listings' (as expected)"
fi

echo ""

# Step 5: Check Owner's Rentals
echo "5️⃣ Checking owner's 'My Rentals' (role=owner)..."
OWNER_RENTALS=$(curl -s "$API_BASE/rentals/my?userKey=$OWNER&role=owner")
OWNER_RENTAL_COUNT=$(echo "$OWNER_RENTALS" | jq '.rentals | length')
echo "   Owner's rentals: $OWNER_RENTAL_COUNT"
echo "   Rental: $(echo "$OWNER_RENTALS" | jq -c '.rentals[0] | {assetName, status, renterKey}')"
echo ""

# Step 6: Check Renter's Rentals
echo "6️⃣ Checking renter's 'My Rentals' (role=renter)..."
RENTER_RENTALS=$(curl -s "$API_BASE/rentals/my?userKey=$RENTER&role=renter")
RENTER_RENTAL_COUNT=$(echo "$RENTER_RENTALS" | jq '.rentals | length')
echo "   Renter's rentals: $RENTER_RENTAL_COUNT"
echo "   Rental: $(echo "$RENTER_RENTALS" | jq -c '.rentals[0] | {assetName, status, ownerKey}')"
echo ""

# Step 7: Complete Rental
echo "7️⃣ Completing rental..."
COMPLETE_RESPONSE=$(curl -s -X POST "$API_BASE/rentals/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "rentalId": "'"$RENTAL_ID"'",
    "userKey": "'"$OWNER"'"
  }')

echo "   Response: $(echo "$COMPLETE_RESPONSE" | jq -c '{success, status: .rental.status}')"
echo ""

# Step 8: Final Check
echo "8️⃣ Final verification..."
FINAL_ASSETS=$(curl -s "$API_BASE/assets/my?owner=$OWNER")
FINAL_ASSET_STATUS=$(echo "$FINAL_ASSETS" | jq -r '.assets[0].status')
echo "   Asset status after completion: $FINAL_ASSET_STATUS (should be 'available')"

FINAL_RENTALS=$(curl -s "$API_BASE/rentals/my?userKey=$OWNER&role=all")
FINAL_RENTAL_STATUS=$(echo "$FINAL_RENTALS" | jq -r '.rentals[0].status')
echo "   Rental status: $FINAL_RENTAL_STATUS (should be 'completed')"
echo ""

# Summary
echo "=== TEST SUMMARY ==="
echo "✅ Asset Creation: $([ ! -z "$ASSET_ID" ] && echo "PASS" || echo "FAIL")"
echo "✅ Asset in My Listings: $([ "$ASSET_COUNT_AFTER" != "0" ] && echo "PASS" || echo "FAIL")"
echo "✅ Rental Creation: $([ ! -z "$RENTAL_ID" ] && echo "PASS" || echo "FAIL")"
echo "✅ Owner Can See Rental: $([ "$OWNER_RENTAL_COUNT" != "0" ] && echo "PASS" || echo "FAIL")"
echo "✅ Renter Can See Rental: $([ "$RENTER_RENTAL_COUNT" != "0" ] && echo "PASS" || echo "FAIL")"
echo "✅ Rental Completion: $([ "$FINAL_RENTAL_STATUS" = "completed" ] && echo "PASS" || echo "FAIL")"
echo "✅ Asset Back to Available: $([ "$FINAL_ASSET_STATUS" = "available" ] && echo "PASS" || echo "FAIL")"
echo ""
echo "🎯 Full rental flow test complete!"

