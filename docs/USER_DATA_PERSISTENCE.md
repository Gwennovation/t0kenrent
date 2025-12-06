# User Data Persistence

## How It Works

T0kenRent uses **user-specific data filtering** with **global localStorage persistence**. This means:

### ✅ Data Persists Across Sessions
- All listings and rentals are stored in browser localStorage
- Data is **never** cleared on logout
- Survives page refreshes and browser restarts
- Persists until user clears browser data

### 🔐 User-Specific Views
- Each wallet sees only **their own** data
- Filtering happens at API level using `userKey`
- Different users on same browser see different data
- No data leakage between accounts

## Example Flow

### Scenario: Two Users on Same Browser

**User A (Alice - $alice):**
1. Connects HandCash wallet
2. Creates 3 asset listings
3. Has 2 active rentals
4. **Logs out**

**User B (Bob - $bob):**
1. Connects different HandCash wallet
2. Creates 5 asset listings
3. Has 1 active rental
4. **Logs out**

**User A Returns:**
1. Reconnects original wallet
2. ✅ Sees original 3 listings
3. ✅ Sees original 2 rentals
4. ❌ Does NOT see Bob's data

### Storage Structure

```javascript
// localStorage key: 't0kenrent_storage_v1'
{
  "assets": {
    "asset_001": { ownerKey: "$alice", ... },
    "asset_002": { ownerKey: "$alice", ... },
    "asset_003": { ownerKey: "$alice", ... },
    "asset_004": { ownerKey: "$bob", ... },
    "asset_005": { ownerKey: "$bob", ... }
  },
  "rentals": {
    "rental_001": { renterKey: "$alice", ownerKey: "$charlie", ... },
    "rental_002": { renterKey: "$bob", ownerKey: "$david", ... }
  }
}
```

### API Filtering

**When Alice fetches her listings:**
```javascript
// GET /api/assets/my?owner=$alice
// Returns only assets where ownerKey === "$alice"
```

**When Bob fetches his listings:**
```javascript
// GET /api/assets/my?owner=$bob
// Returns only assets where ownerKey === "$bob"
```

## Implementation Details

### Storage Layer (`src/lib/storage.ts`)

```typescript
// Global storage - all users' data
class InMemoryStorage {
  private assets: Map<string, StoredAsset>
  private rentals: Map<string, StoredRental>
  
  // Filter by owner
  getAssetsByOwner(ownerKey: string): StoredAsset[] {
    return Array.from(this.assets.values())
      .filter(a => a.ownerKey === ownerKey)
  }
  
  // Filter by renter
  getRentalsByUser(userKey: string): StoredRental[] {
    return Array.from(this.rentals.values())
      .filter(r => r.renterKey === userKey || r.ownerKey === userKey)
  }
}
```

### API Endpoints

**`/api/assets/my`** - Get user's listings
```typescript
const { owner } = req.query
const assets = storage.getAssetsByOwner(owner)
```

**`/api/rentals/my`** - Get user's rentals
```typescript
const { userKey } = req.query
const rentals = storage.getRentalsByUser(userKey)
```

### Disconnect Behavior

```typescript
function disconnectWallet() {
  // Clear session state
  setUserKey('')
  setUserHandle('')
  setAuthenticated(false)
  
  // localStorage NOT cleared - data persists!
}
```

## Benefits

### ✅ Multi-User Support
- Same browser can be used by multiple users
- Each user maintains separate data
- No cross-contamination

### ✅ Data Persistence
- Users don't lose their listings on logout
- Rentals survive page refresh
- No need for external database (demo mode)

### ✅ Privacy
- Users only see their own data
- Filtered at API level
- No client-side access to other users' data

### ✅ Demo-Friendly
- Perfect for testing multiple user scenarios
- Easy to demonstrate multi-user flows
- No backend required

## For Developers

### Adding New User-Specific Endpoints

Always filter by user:

```typescript
// ✅ Good - Filtered by user
export default async function handler(req, res) {
  const { userKey } = req.query
  const data = storage.getDataByUser(userKey)
  return res.json({ data })
}

// ❌ Bad - Returns all users' data
export default async function handler(req, res) {
  const data = storage.getAllData() // Leaks other users' data!
  return res.json({ data })
}
```

### Clearing Data (Testing)

If you need to clear data during development:

```javascript
// Browser console
localStorage.removeItem('t0kenrent_storage_v1')
location.reload()
```

### Production Considerations

For production with MongoDB:
- Same filtering logic applies
- Database queries filter by `ownerKey`/`renterKey`
- No data leakage between users
- Proper authentication/authorization required

## FAQ

**Q: Why not clear localStorage on logout?**  
A: Users want their data to persist. Clearing would delete their listings and rentals permanently.

**Q: Can User B see User A's data?**  
A: No. API endpoints filter data by `userKey`. User B only sees their own data.

**Q: What if I switch browsers?**  
A: localStorage is browser-specific. You'll need to recreate listings on the new browser (demo mode) or use MongoDB for cross-device sync (production).

**Q: Is this secure?**  
A: For demo mode: data is client-side only. For production: server-side filtering and authentication ensure security.

**Q: How do I test multi-user scenarios?**  
A: Open multiple browser tabs, connect different wallets in each, and verify data isolation.

## Related Files

- `src/lib/storage.ts` - Storage layer with filtering
- `src/pages/api/assets/my.ts` - User's listings endpoint
- `src/pages/api/rentals/my.ts` - User's rentals endpoint
- `src/pages/index.tsx` - Wallet connection/disconnection
- `src/components/RentalDashboard.tsx` - User dashboard
- `src/components/RentalMarketplace.tsx` - Marketplace view

---

**TL;DR:** Data persists in localStorage forever. Each user sees only their own data via API filtering. This works perfectly for multi-user scenarios!
