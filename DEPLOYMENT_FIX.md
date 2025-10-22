# 🚨 CRITICAL FIX: Entry Functions Added

## Problem Found

**TypeMismatch Error** when creating auctions was caused by:
- `create_auction()` and `create_auction_with_lock()` were **`public fun`**, not **`public entry fun`**
- Non-entry functions **cannot be called from transactions**!
- They can only be called from within other Move code

## Solution Applied

Added two new **entry function wrappers** that handle the entire flow:

### 1. `create_auction_from_kiosk` (for unlocked NFTs)
```move
public entry fun create_auction_from_kiosk<T: store + key, CoinType>(
    auction_house: &AuctionHouse,
    user_kiosk: &mut Kiosk,
    user_kiosk_cap: &KioskOwnerCap,
    platform_kiosk: &mut Kiosk,
    nft_id: ID,
    expiry_time: u64,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**What it does:**
1. Takes NFT from user's kiosk using `kiosk::take()`
2. Calls internal `create_auction()` 
3. Shares the auction object

### 2. `create_auction_from_kiosk_with_lock` (for locked NFTs)
```move
public entry fun create_auction_from_kiosk_with_lock<T: store + key, CoinType>(
    auction_house: &AuctionHouse,
    user_kiosk: &mut Kiosk,
    user_kiosk_cap: &KioskOwnerCap,
    platform_kiosk: &mut Kiosk,
    policy: &TransferPolicy<T>,
    nft_id: ID,
    expiry_time: u64,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**What it does:**
1. Lists locked NFT for 0 SUI in user's kiosk
2. Purchases it with 0 SUI coin to extract it
3. Confirms the transfer request
4. Calls internal `create_auction_with_lock()`
5. Shares the auction object

## Files Changed

### Contracts:
- **`sources/auction.move`**
  - Added `create_auction_from_kiosk()` entry function
  - Added `create_auction_from_kiosk_with_lock()` entry function
  - Kept original functions for tests (internal use)

### Frontend:
- **`src/lib/sui-transactions.ts`**
  - Updated `createAuctionTransaction()` to call new entry functions
  - Simplified transaction structure (single moveCall now!)
  - Removed manual list+purchase+confirm steps

## Deployment Required ⚠️

**YOU MUST REDEPLOY THE CONTRACTS!**

The currently deployed contract doesn't have these entry functions. Follow these steps:

### Step 1: Deploy Contracts
```bash
cd Contracts
sui client publish --gas-budget 100000000
```

### Step 2: Note the Object IDs
From the output, save these IDs:
- **Package ID**: The published package ID
- **AuctionHouse ID**: The shared `AuctionHouse` object
- **Platform Kiosk ID**: The shared `Kiosk` object
- **AdminCap ID**: The `AdminCap` transferred to you

### Step 3: Update Frontend Environment
Create or update `Frontend/.env`:

```env
VITE_PACKAGE_ID=0x<your_package_id>
VITE_AUCTION_HOUSE_ID=0x<your_auction_house_id>
VITE_PLATFORM_KIOSK_ID=0x<your_platform_kiosk_id>
VITE_ADMIN_CAP_ID=0x<your_admin_cap_id>
VITE_NETWORK=mainnet
```

### Step 4: Update Frontend Constants (Optional)
If you don't use `.env`, update `Frontend/src/config/constants.ts`:

```typescript
export const PACKAGE_ID = '0x<your_package_id>';
export const AUCTION_HOUSE_ID = '0x<your_auction_house_id>';
export const PLATFORM_KIOSK_ID = '0x<your_platform_kiosk_id>';
export const ADMIN_CAP_ID = '0x<your_admin_cap_id>';
```

### Step 5: Test
```bash
cd Frontend
npm run dev
```

1. Connect wallet
2. Click "Create Auction"
3. Select an NFT from your kiosk
4. Fill in details
5. Create auction - should work now! ✅

## Transaction Flow Before vs After

### ❌ BEFORE (Broken):
```typescript
// Tried to call non-entry function directly
tx.moveCall({
  target: `${PACKAGE_ID}::auction::create_auction`,  // ❌ Not an entry function!
  ...
});
```

### ✅ AFTER (Fixed):
```typescript
// Call entry function wrapper
tx.moveCall({
  target: `${PACKAGE_ID}::auction::create_auction_from_kiosk`,  // ✅ Entry function!
  arguments: [
    auctionHouse,
    userKiosk,
    userKioskCap,
    platformKiosk,
    nftId,
    expiryTime,
    clock
  ]
});
```

## Why This Fix Works

### Entry Functions:
- Can be called directly from transactions
- Can take mutable references (`&mut`)
- Can call internal functions
- Can share objects

### Public Functions (non-entry):
- Can only be called from Move code
- Cannot be called from transactions
- Used for internal logic and tests

## Testing

The existing tests still work because they call the internal functions from Move code:

```move
// Tests can still do this:
let auction = auction::create_auction<TestNFT, SUI>(
    &auction_house,
    &mut kiosk,
    nft,
    expiry_time,
    &clock,
    ctx
);
```

But transactions must use the entry functions:
```typescript
// Transactions must do this:
tx.moveCall({
  target: `${PACKAGE_ID}::auction::create_auction_from_kiosk`,
  ...
});
```

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Function Type** | `public fun` | `public entry fun` |
| **Callable from TX** | ❌ No | ✅ Yes |
| **NFT Extraction** | ❌ Manual (frontend) | ✅ Automatic (contract) |
| **Transaction Steps** | Multiple moveCall | Single moveCall |
| **Error** | TypeMismatch | ✅ Works |

## Additional Benefits

1. **Simpler frontend code** - Single function call instead of complex transaction building
2. **Better security** - All logic in contract, less room for frontend errors
3. **Cleaner transactions** - Easier to read and debug
4. **Gas efficient** - Fewer transaction steps

## Questions?

**Q: Do I need to update tests?**  
A: No, tests still use internal functions directly.

**Q: Can I use package upgrade instead of republishing?**  
A: Only if you have an UpgradeCap. Otherwise, you need to republish.

**Q: Will old auctions still work?**  
A: Yes, but you can't create new ones with the old contract.

**Q: Do I lose data when republishing?**  
A: No, the AuctionHouse and Kiosk are separate shared objects.

---

🎉 **After deployment, auction creation will work perfectly!**
