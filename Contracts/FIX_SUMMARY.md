# Auction Contract Fix - KioskOwnerCap Parameter Issue

## Problem

When creating auctions from user kiosks, the transaction was failing with:
```
ArgumentError { arg_idx: 2, kind: TypeMismatch } in command 0
```

The error occurred at argument index 2, which corresponds to the `user_kiosk_cap` parameter.

## Root Cause

In Sui Move, there's a fundamental limitation with how owned objects can be passed to entry functions:

- **Shared objects** can be passed by reference (`&` or `&mut`) 
- **Owned objects** can only be passed by value (moved into the function)

The original contract had:
```move
public entry fun create_auction_from_kiosk<T: store + key, CoinType>(
    auction_house: &AuctionHouse,
    user_kiosk: &mut sui::kiosk::Kiosk,
    user_kiosk_cap: &sui::kiosk::KioskOwnerCap,  // ❌ WRONG: Can't pass owned object by reference
    ...
```

The `KioskOwnerCap` is an **owned object** (owned by the user's wallet), so it cannot be passed by reference (`&KioskOwnerCap`) to an entry function. This caused a type mismatch error when building the transaction.

## Solution

Changed the function signature to accept `KioskOwnerCap` **by value** (ownership transfer), use it, and then **return it back** to the sender:

```move
public entry fun create_auction_from_kiosk<T: store + key, CoinType>(
    auction_house: &AuctionHouse,
    user_kiosk: &mut sui::kiosk::Kiosk,
    user_kiosk_cap: sui::kiosk::KioskOwnerCap,  // ✅ CORRECT: Accept by value
    platform_kiosk: &mut sui::kiosk::Kiosk,
    nft_id: ID,
    expiry_time: u64,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Use the cap with a reference
    let nft = sui::kiosk::take<T>(user_kiosk, &user_kiosk_cap, nft_id);
    
    // ... create auction ...
    
    // Return the kiosk cap back to the sender
    transfer::public_transfer(user_kiosk_cap, sui::tx_context::sender(ctx));
}
```

## Changes Made

### 1. `auction.move` - Modified Functions

- **`create_auction_from_kiosk`** (line 94-119)
  - Changed `user_kiosk_cap: &sui::kiosk::KioskOwnerCap` → `user_kiosk_cap: sui::kiosk::KioskOwnerCap`
  - Added `transfer::public_transfer(user_kiosk_cap, sender)` at the end

- **`create_auction_from_kiosk_with_lock`** (line 157-195)
  - Changed `user_kiosk_cap: &sui::kiosk::KioskOwnerCap` → `user_kiosk_cap: sui::kiosk::KioskOwnerCap`
  - Added `transfer::public_transfer(user_kiosk_cap, sender)` at the end

### 2. Frontend - No Changes Needed

The frontend transaction code already correctly passes owned objects using `tx.object()`:
```typescript
tx.moveCall({
  target: `${PACKAGE_ID}::auction::create_auction_from_kiosk`,
  arguments: [
    tx.object(AUCTION_HOUSE_ID),
    tx.object(kioskData.kioskId),
    tx.object(kioskData.kioskOwnerCapId),  // Correctly passes as owned object
    // ... other args
  ],
});
```

### 3. Deployment

New deployment on mainnet:
- **Package ID**: `0x81218dcaf73d16099461cf36a7872f30a7acb23d36bba1126c3c0013d993a98d`
- **Auction House ID**: `0xe2af576d8f49f75e0cbad1e1148483d01670746f0fc752e143866860aab73b7a`
- **Platform Kiosk ID**: `0x0104fc61487709b66e8685c937ea3cab9c046aef909e459e070c8d2a5be14544`

## Pattern to Remember

When working with Sui Move entry functions and owned objects:

✅ **DO**: Accept owned objects by value and return them
```move
public entry fun my_function(owned_obj: MyOwnedType, ctx: &mut TxContext) {
    // Use owned_obj
    transfer::public_transfer(owned_obj, sender(ctx));
}
```

❌ **DON'T**: Try to pass owned objects by reference
```move
public entry fun my_function(owned_obj: &MyOwnedType) {  // Won't work!
    // ...
}
```

## Testing

After the fix, users can now:
1. Select an NFT from their kiosk
2. Create an auction successfully (both locked and unlocked NFTs)
3. The KioskOwnerCap is automatically returned to their wallet after the auction is created

The "TypeMismatch" error is now resolved.
