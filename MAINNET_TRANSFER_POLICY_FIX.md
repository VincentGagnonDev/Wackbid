# Mainnet TransferPolicy Fix - UPDATED ANALYSIS

## The Kiosk State Problem

### Kiosk Asset States (from Sui docs)
1. **PLACED**: Can withdraw with `kiosk::take` (owner privilege)
2. **LOCKED**: Cannot withdraw - must use purchase flow with TransferPolicy
3. **LISTED**: For sale, limited operations
4. **LISTED EXCLUSIVELY**: Locked by extension

### The Original Error
```
MoveAbort in transfer_policy::confirm_request, error code 0 (EIllegalRule)
```

This happened because:
1. NFT was likely **LOCKED** (has kiosk_lock_rule in TransferPolicy)
2. We used `list + purchase(0 SUI) + confirm_request`
3. **confirm_request failed** because TransferPolicy rules weren't satisfied

## Why confirm_request Fails with 0 SUI

TransferPolicy can have multiple rules:
- **kiosk_lock_rule**: Requires purchase from kiosk (satisfied ✅)
- **royalty_rule**: Requires minimum payment (NOT satisfied with 0 SUI ❌)
- **floor_price_rule**: Requires minimum price (NOT satisfied with 0 SUI ❌)

## The Real Question

**Are the mainnet NFTs actually LOCKED or just have a TransferPolicy?**

Two scenarios:

### Scenario A: NFTs are PLACED (have TransferPolicy but not locked)
- `kiosk::take` works ✅
- No policy enforcement needed
- Simple solution (current fix)

### Scenario B: NFTs are LOCKED (have kiosk_lock_rule)
- `kiosk::take` FAILS ❌ (cannot withdraw locked items)
- Must use `purchase` flow
- Need to satisfy ALL policy rules including royalties

## Current Implementation (Hybrid Approach)

```move
let is_locked = sui::kiosk::is_locked(user_kiosk, nft_id);

if (is_locked) {
    // Use purchase flow - but this STILL fails with royalty rules!
    sui::kiosk::list<T>(user_kiosk, &user_kiosk_cap, nft_id, 0);
    let zero_coin = coin::zero<sui::sui::SUI>(ctx);
    let (item, request) = sui::kiosk::purchase<T>(user_kiosk, nft_id, zero_coin);
    sui::transfer_policy::confirm_request(policy, request);  // ❌ FAILS HERE
} else {
    // Simple take for PLACED items
    kiosk::take<T>(user_kiosk, &user_kiosk_cap, nft_id);  // ✅ WORKS
}
```

## The Fundamental Problem

**You CANNOT extract truly LOCKED NFTs with royalty rules using 0 SUI payment.**

### Why?
- Royalty rules require actual payment (e.g., 2.5% of sale price)
- 0 SUI * 2.5% = 0 SUI, but rules often have minimum amounts
- The `confirm_request` checks if royalty was paid

### Options

#### Option 1: Only Support PLACED NFTs (Current Simple Fix)
```move
// Just use kiosk::take - works for PLACED items only
let nft = sui::kiosk::take<T>(user_kiosk, &user_kiosk_cap, nft_id);
```
**Pros:** Simple, no policy issues
**Cons:** Can't auction truly LOCKED NFTs

#### Option 2: Support LOCKED NFTs (Complex - needs royalty handling)
Would require:
1. Paying actual royalties during auction creation (who pays?)
2. Adding proper receipts to satisfy all rules
3. Importing royalty_rule and other rule modules

**Not practical** because:
- Creator shouldn't pay royalties to themselves
- Would need to calculate and pay actual amounts
- Complex implementation

#### Option 3: Require Users to PLACE Items Before Auctioning
- Users manually `kiosk::take` then `kiosk::place` before creating auction
- All NFTs in PLACED state when auctioning
- Simple contract, user does the work

## Most Likely Mainnet Scenario

Based on the error, I believe mainnet NFTs are:
- **PLACED in kiosks** (not locked)
- **Have TransferPolicy** (for royalties on sales)
- **Our simple `kiosk::take` fix should work**

The old code failed because it unnecessarily tried to use the purchase flow even for PLACED items.

## Recommendation

**Test the simple fix first:**
```move
let nft = sui::kiosk::take<T>(user_kiosk, &user_kiosk_cap, nft_id);
```

If this fails with "item is locked", then we know NFTs are truly LOCKED and need the complex solution.

Most likely, it will work fine because mainnet NFTs are probably PLACED with TransferPolicy (not LOCKED with kiosk_lock_rule).

## Update After Testing

[To be filled after mainnet testing]
- Did `kiosk::take` work? 
- Or did it fail with locked item error?
- This will tell us the true state of mainnet NFTs
