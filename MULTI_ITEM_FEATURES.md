# Multi-Item Features Documentation

## Overview
T0kenRent now supports listing and renting multiple items at once, improving efficiency for both asset owners and renters.

---

## New Features Added

### 1. Real Estate & Staycations Category
Added a new category specifically for rental properties and vacation homes.

#### Category Details
- **ID**: `realestate`
- **Name**: Real Estate & Staycations
- **Icon**: House/home SVG icon
- **Use Cases**:
  - Vacation homes
  - Beachfront properties
  - City apartments
  - Cabins and lodges
  - Room rentals
  - Event spaces

#### Demo Sample
Included beachfront villa demo listing:
- **Name**: Beachfront Villa - Ocean View
- **Rate**: $350/day
- **Deposit**: $1,000
- **Amenities**: Private pool, beach access, WiFi, smart TV, full kitchen, washer/dryer
- **Details**: 3-bedroom, sleeps 6, with special instructions for check-in/out

---

### 2. Batch Asset Creation API

#### Endpoint
`POST /api/assets/create-batch`

#### Purpose
Create multiple rental asset listings in a single API call.

#### Request Format
```json
{
  "assets": [
    {
      "name": "Item 1",
      "description": "...",
      "category": "photography",
      "rentalRatePerDay": 75,
      "depositAmount": 500,
      "location": {
        "city": "San Francisco",
        "state": "CA",
        "address": "123 Main St"
      },
      "ownerKey": "user_key_here",
      // ... other fields
    },
    // ... up to 20 assets
  ]
}
```

#### Response Format
```json
{
  "success": true,
  "created": 18,
  "failed": 2,
  "results": [
    {
      "success": true,
      "tokenId": "asset_123_abc",
      "ordinalId": "demo_ordinal_xyz",
      "asset": { "id": "...", "name": "...", "category": "...", "status": "available" }
    },
    {
      "success": false,
      "error": "Missing required fields for asset"
    },
    // ... one result per asset
  ]
}
```

#### Features
- ✅ Process up to 20 assets per request
- ✅ Individual validation per asset
- ✅ Ordinal linking support for each asset
- ✅ Detailed success/failure reporting
- ✅ Continues processing even if some fail
- ✅ Returns comprehensive results

#### Use Cases
- Initial marketplace setup with multiple demo items
- Bulk import from external inventory system
- Event equipment companies listing multiple items
- Vacation rental companies adding properties
- Tool rental businesses with large inventory

---

### 3. Batch Rental Creation API

#### Endpoint
`POST /api/rentals/create-batch`

#### Purpose
Create multiple rental transactions simultaneously.

#### Request Format
```json
{
  "rentals": [
    {
      "assetId": "asset_123",
      "renterKey": "renter_key",
      "ownerKey": "owner_key",
      "startDate": "2025-01-01T00:00:00Z",
      "endDate": "2025-01-02T00:00:00Z",
      "rentalDays": 1,
      "rentalFee": 75,
      "depositAmount": 500,
      "totalAmount": 575
    },
    // ... up to 20 rentals
  ]
}
```

#### Response Format
```json
{
  "success": true,
  "created": 3,
  "failed": 0,
  "results": [
    {
      "success": true,
      "rentalId": "rental_456_def",
      "assetId": "asset_123",
      "escrowId": "escrow_789_ghi"
    },
    // ... one result per rental
  ]
}
```

#### Features
- ✅ Process up to 20 rentals per request
- ✅ Automatic asset availability checking
- ✅ Escrow ID generation for each rental
- ✅ Asset status updates (available → rented)
- ✅ Individual validation and error handling
- ✅ Detailed success/failure reporting

#### Use Cases
- Renting camera kit + lighting + backdrop at once
- Booking multiple tools for construction project
- Reserving several properties for group travel
- Event planners renting multiple items
- Production companies booking equipment

---

### 4. Bulk Rent Mode UI

#### Location
Browse tab in the marketplace

#### Access
Look for "Rent Multiple Items" button above the asset grid when rentable items are available.

#### How to Use

**Step 1: Enable Bulk Mode**
```
Click "Rent Multiple Items" button
→ Toolbar expands with selection controls
→ Asset cards become selectable (checkboxes will appear in future update)
```

**Step 2: Select Items**
```
Currently: Click on each asset card individually
Future: Check boxes on cards
Alternative: Click "Select All Available"
→ Selection counter updates
```

**Step 3: Review Selection**
```
View: "X selected" counter
Options:
- Clear: Remove all selections
- Select All Available: Quick select everything
```

**Step 4: Rent Selected Items**
```
Click "Rent X Item(s)" button
→ Confirmation dialog appears
→ Shows: "Rent X item(s)? This will create X separate rental transactions."
→ Confirm to proceed
```

**Step 5: Processing**
```
System creates separate rental for each item
Each rental gets unique:
- Rental ID
- Escrow ID
- Transaction record
→ Success message shows results
```

#### UI Components

**Bulk Rent Toolbar**
```
[ 📋 Rent Multiple Items ] [ Cancel Selection ]   X selected  Clear

[ Select All Available ]  [ Rent X Items ]
```

**Features:**
- ✅ Toggle bulk mode on/off
- ✅ Selection counter
- ✅ Clear selections button
- ✅ Select all available items
- ✅ Rent selected button with count
- ✅ Confirmation dialog
- ✅ Success/failure notifications
- ✅ Auto-refresh after completion

#### Visual States

**Inactive (Default)**
```
Only shows: [ Rent Multiple Items ] button
Toolbar is compact
```

**Active (Bulk Mode ON)**
```
Shows full toolbar with all controls
Selection counter visible
Action buttons appear when items selected
```

**With Selections**
```
Counter shows: "3 selected"
Clear button appears
Rent button shows: "Rent 3 Items"
```

---

## Technical Implementation

### Frontend Changes

**Files Modified:**
- `src/components/RentalMarketplace.tsx` - Main UI implementation
- `src/components/AssetCard.tsx` - Added real estate icon
- `src/components/CreateAssetModal.tsx` - Added real estate sample

**New State Variables:**
```typescript
const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
const [bulkRentMode, setBulkRentMode] = useState(false)
```

**New Functions:**
```typescript
toggleAssetSelection(assetId: string)     // Toggle individual asset
selectAllVisibleAssets()                   // Select all available
clearSelection()                           // Clear all selections
handleBulkRent()                           // Process batch rental
```

### Backend Changes

**New API Endpoints:**
- `/api/assets/create-batch` - Batch asset creation
- `/api/rentals/create-batch` - Batch rental creation

**Validation:**
- Maximum 20 items per batch
- Individual field validation
- Asset availability checking
- Ownership verification

**Error Handling:**
- Per-item error capture
- Continues processing on partial failure
- Comprehensive error messages
- Success/failure counts in response

---

## Usage Examples

### Example 1: Vacation Rental Package
```
Scenario: Family wants to rent beach house + kayaks + beach gear

Steps:
1. Enable "Rent Multiple Items" mode
2. Select:
   - Beachfront Villa ($350/day)
   - 2x Kayak ($25/day each)
   - Beach Equipment Set ($15/day)
3. Click "Rent 4 Items"
4. Confirm rental
5. System creates 4 separate escrow contracts
6. Total: $415/day + deposits

Result: All items reserved in single action
```

### Example 2: Photography Studio Setup
```
Scenario: Photographer needs complete studio setup

Steps:
1. Search "photography" category
2. Enable bulk rent mode
3. Click "Select All Available"
4. Review selection (camera, lights, backdrops, etc.)
5. Click "Rent 8 Items"
6. Confirm batch rental

Result: Full studio equipment booked simultaneously
```

### Example 3: Construction Tool Kit
```
Scenario: Contractor needs multiple power tools

Steps:
1. Filter by "Tools & Equipment"
2. Enable bulk mode
3. Select needed items:
   - Power Drill
   - Circular Saw
   - Impact Driver
   - Reciprocating Saw
   - Grinder
4. Rent 5 items at once

Result: Complete tool set ready for pickup
```

---

## Future Enhancements

### Planned Features
- [ ] Visual checkboxes on asset cards in bulk mode
- [ ] Bulk date range selection (rent all for same period)
- [ ] Shopping cart metaphor
- [ ] Save rental packages as templates
- [ ] Bulk pricing discounts (3+ items)
- [ ] Calendar view for multi-day bulk rentals
- [ ] Package deals (predefined item bundles)
- [ ] Rental history filtering

### UI Improvements
- [ ] Drag-to-select multiple items
- [ ] Keyboard shortcuts (Ctrl+A, etc.)
- [ ] Selection preview modal
- [ ] Estimated total cost calculator
- [ ] Bulk rental scheduling calendar

### API Enhancements
- [ ] Increase batch limit to 50 items
- [ ] Batch rental with custom dates per item
- [ ] Bulk discount calculation API
- [ ] Rental package creation endpoint

---

## Testing

### Test Scenarios

**Test 1: Real Estate Category**
- [ ] Create real estate listing
- [ ] Verify house icon displays
- [ ] Filter by "Real Estate & Staycations"
- [ ] Check demo villa sample loads

**Test 2: Batch Asset Creation**
- [ ] Send batch request with 5 assets
- [ ] Verify all created successfully
- [ ] Check ordinal IDs generated
- [ ] Test with 1 invalid asset (should continue)
- [ ] Test with 21 assets (should reject)

**Test 3: Batch Rental Creation**
- [ ] Select 3 available items
- [ ] Create batch rental
- [ ] Verify all 3 rental IDs returned
- [ ] Check asset statuses updated to "rented"
- [ ] Confirm escrow IDs unique

**Test 4: Bulk Rent UI**
- [ ] Click "Rent Multiple Items"
- [ ] Select 4 items manually
- [ ] Verify counter shows "4 selected"
- [ ] Click "Select All Available"
- [ ] Clear selections
- [ ] Rent selected items
- [ ] Verify success message

**Test 5: Edge Cases**
- [ ] Bulk rent with 0 items selected
- [ ] Rent unavailable item in batch
- [ ] Bulk rent own items (should exclude)
- [ ] Cancel bulk mode with selections
- [ ] Refresh page during bulk mode

---

## Performance Considerations

### API Performance
- Batch processing reduces HTTP overhead
- Sequential processing ensures data consistency
- Individual error handling prevents cascading failures
- Maximum batch size limits server load

### UI Performance
- Set-based selection for O(1) lookups
- Memoized callbacks prevent re-renders
- Debounced search preserves responsiveness
- Lazy loading for large asset lists

### Scalability
- Batch size limit prevents timeout
- Individual validation scales linearly
- Database operations optimized per item
- Response streaming for large batches (future)

---

## API Rate Limiting

### Current Limits
- **Batch Asset Creation**: 20 assets per request
- **Batch Rental Creation**: 20 rentals per request
- **No account rate limits** (demo mode)

### Production Recommendations
- Implement per-user rate limiting
- Track daily batch operation counts
- Add cooldown period between batches
- Monitor for abuse patterns

---

## Security Considerations

### Validation
- ✅ Required field checking
- ✅ Ownership verification for assets
- ✅ Asset availability validation
- ✅ Duplicate prevention per batch

### Authorization
- ✅ User key validation
- ✅ Owner key matching
- ✅ Rental permission checks
- ✅ Escrow creation authorization

### Data Integrity
- ✅ Atomic operations per item
- ✅ Rollback on critical failures
- ✅ Unique ID generation
- ✅ Ordinal linking verification

---

## Support & Documentation

### Getting Help
- Read this documentation
- Check API response error messages
- Review commit history for changes
- Test in demo mode first

### Reporting Issues
- Provide batch size and item count
- Include error messages from API
- Share selection count screenshots
- Note browser and network conditions

---

## Summary

✅ **Real Estate category added** - Vacation rentals supported  
✅ **Batch APIs created** - List/rent up to 20 items at once  
✅ **Bulk rent UI added** - Select and rent multiple items easily  
✅ **Error handling** - Graceful per-item validation  
✅ **Success feedback** - Clear result reporting  
✅ **Demo mode compatible** - Test with sample data  

**What's Next:**
- Visual selection checkboxes on cards
- Package/bundle creation features
- Bulk discount pricing
- Multi-day scheduling for batches

---

**Last Updated**: 2025-12-01  
**Version**: 1.0.0  
**Author**: GenSpark AI Developer
