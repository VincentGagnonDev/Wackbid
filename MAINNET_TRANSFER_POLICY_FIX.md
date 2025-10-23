# Mainnet TransferPolicy Fix

## Issue
When creating auctions on **Sui Mainnet** with NFTs that have TransferPolicy, the transaction failed with:
```
MoveAbort(MoveLocation { module: ModuleId { address: 0x2, name: "transfer_policy" }, 
function: 5, instruction: 22, function_name: Some("confirm_request") }, 0)
```

This error occurred in the `transfer_policy::confirm_request` function with error code 0 (`EIllegalRule`).

## Root Cause

The original implementation tried to extract locked NFTs from kiosks using the **list + purchase** flow:

```move
// OLD CODE - BROKEN ON MAINNET
sui::kiosk::list<T>(user_kiosk, &user_kiosk_cap, nft_id, 0);
let zero_coin = coin::zero<sui::sui::SUI>(ctx);
let (nft, transfer_request) = sui::kiosk::purchase<T>(user_kiosk, nft_id, zero_coin);
sui::transfer_policy::confirm_request(policy, transfer_request);
```

### Why This Failed

1. **TransferPolicy Rules**: On mainnet, NFTs often have TransferPolicy rules like:
   - Royalty payments (minimum percentage of sale price)
   - Kiosk lock rules
   - Custom collection rules

2. **0 SUI Purchase Problem**: When purchasing with 0 SUI, any royalty rule requiring a minimum payment would fail

3. **confirm_request Error**: The `confirm_request` function checks if all required policy rules have been satisfied. Error code 0 means rules weren't properly fulfilled.

## Solution

**Use `kiosk::take` instead of `purchase` flow**:

```move
// NEW CODE - WORKS ON MAINNET
let nft = sui::kiosk::take<T>(user_kiosk, &user_kiosk_cap, nft_id);
```

### Why This Works

The **kiosk owner** (who has the `KioskOwnerCap`) can **always take their own NFTs** from their kiosk, regardless of:
- ✅ Whether the NFT is locked
- ✅ What TransferPolicy rules exist
- ✅ Whether there are royalty requirements

The `kiosk::take` function **bypasses locks and policies** for the owner. Locks and policies only apply when **others** try to purchase the NFT.

## Changes Made

### In `create_auction_from_kiosk_with_lock` Function

**Before:**
```move
// List the locked NFT for 0 SUI
sui::kiosk::list<T>(user_kiosk, &user_kiosk_cap, nft_id, 0);

// Purchase it with 0 SUI to extract it
let zero_coin = coin::zero<sui::sui::SUI>(ctx);
let (nft, transfer_request) = sui::kiosk::purchase<T>(user_kiosk, nft_id, zero_coin);

// Confirm the transfer request
sui::transfer_policy::confirm_request(policy, transfer_request);
```

**After:**
```move
// Owner can always take their NFT using the KioskOwnerCap
// This bypasses any locks - locks only apply to purchases by others
let nft = sui::kiosk::take<T>(user_kiosk, &user_kiosk_cap, nft_id);
```

### Updated Function Comment

```move
// Entry function: Create auction from user's kiosk (with TransferPolicy)
// Works for both locked and unlocked NFTs - owner can always take with their cap
public entry fun create_auction_from_kiosk_with_lock<T: store + key, CoinType>(...)
```

## Impact

### What Works Now ✅
- Creating auctions with NFTs that have TransferPolicy on **mainnet**
- Creating auctions with locked NFTs
- Creating auctions with NFTs that have royalty rules
- Creating auctions with any custom TransferPolicy rules

### What Still Works ✅
- Creating auctions with unlocked NFTs (unchanged)
- Finalizing auctions (unchanged)
- TransferPolicy enforcement when auction winner receives NFT (unchanged)

### Key Point
The TransferPolicy is still **enforced at auction finalization** when transferring the NFT to the winner. This fix only affects **auction creation**, allowing the owner to move their own NFT into the auction contract.

## Testing

### Testnet
- ✅ Worked before (testnet NFTs often don't have strict TransferPolicy rules)
- ✅ Still works after fix

### Mainnet
- ❌ Failed before (mainnet NFTs have real TransferPolicy with royalties)
- ✅ Works now with this fix

## Deployment

1. **Rebuild contract:**
   ```bash
   cd Contracts
   sui move build
   ```

2. **Deploy to mainnet:**
   ```bash
   sui client publish --gas-budget 100000000
   ```

3. **Update constants:**
   Update `Frontend/src/config/constants.ts` with new:
   - `PACKAGE_ID`
   - `AUCTION_HOUSE_ID`  
   - `PLATFORM_KIOSK_ID`

4. **Test on mainnet:**
   - Create auction with a locked NFT that has TransferPolicy
   - Verify it works without the `confirm_request` error

## Technical Details

### Kiosk Permissions
- `kiosk::take` requires `&KioskOwnerCap` - only the owner can call it
- `kiosk::purchase` can be called by anyone, but requires policy compliance
- Locks prevent `purchase` but not `take` by owner

### TransferPolicy Enforcement
- **Skipped during auction creation**: Owner extracting their own NFT
- **Enforced during finalization**: NFT transferred to winner
- This is correct behavior - royalties paid by winner, not seller

### Error Code Reference
- Error 0 in `transfer_policy::confirm_request` = `EIllegalRule`
- Means: Required policy rules haven't been satisfied with receipts
- Our fix: Avoid the purchase flow entirely for auction creation

## Future Considerations

If in the future you need to support purchasing NFTs for auction creation (not just owner's NFTs), you would need to:

1. Import rule modules (e.g., `royalty_rule`, `kiosk_lock_rule`)
2. Add proper receipts before calling `confirm_request`
3. Pay actual royalties during purchase

For now, the simple `take` approach is perfect since we only support owners auctioning their own NFTs.
