# Kiosk Handling Guide for WackBid Auction Platform

## Overview

The WackBid auction platform properly implements Sui Kiosk standards for NFT handling. This guide explains how NFTs are managed through kiosks during auction creation and finalization.

## Key Concepts

### What is a Sui Kiosk?

A Sui Kiosk is a decentralized commerce system on Sui that:
- Stores NFTs securely
- Enables trading with transfer policy enforcement
- Maintains ownership until transfer is complete
- Enforces creator royalties and rules

### Kiosk Ownership

- Each kiosk is controlled by a `KioskOwnerCap`
- Only the cap holder can place, take, or list items in their kiosk
- Kiosks are shared objects that anyone can read but only the owner can modify

## Auction Flow with Kiosks

### 1. Creating an Auction

When a user creates an auction:

```
User's Kiosk → Platform Kiosk (temporary storage during auction)
```

**Two scenarios:**

#### A. Unlocked NFT (Regular Transfer)
```move
public entry fun create_auction_from_kiosk<T, CoinType>(
    auction_house: &AuctionHouse,
    user_kiosk: &mut sui::kiosk::Kiosk,
    user_kiosk_cap: sui::kiosk::KioskOwnerCap,
    platform_kiosk: &mut sui::kiosk::Kiosk,
    nft_id: ID,
    expiry_time: u64,
    clock: &Clock,
    ctx: &mut TxContext
)
```

- NFT is taken from user's kiosk
- Placed in platform kiosk
- User's kiosk cap is returned to them

#### B. Locked NFT (Transfer Policy Required)
```move
public entry fun create_auction_from_kiosk_with_lock<T, CoinType>(
    auction_house: &AuctionHouse,
    user_kiosk: &mut sui::kiosk::Kiosk,
    user_kiosk_cap: sui::kiosk::KioskOwnerCap,
    platform_kiosk: &mut sui::kiosk::Kiosk,
    policy: &sui::transfer_policy::TransferPolicy<T>,
    nft_id: ID,
    expiry_time: u64,
    clock: &Clock,
    ctx: &mut TxContext
)
```

- NFT is purchased from user's kiosk for 0 SUI
- Transfer request is confirmed with policy
- NFT is locked in platform kiosk
- User's kiosk cap is returned

### 2. Finalizing an Auction

There are **FOUR** finalization methods available:

#### Method 1: Finalize and Create New Kiosk (RECOMMENDED)

```move
public entry fun finalize_and_create_kiosk<T, CoinType>(
    auction_house: &mut AuctionHouse,
    platform_kiosk: &mut sui::kiosk::Kiosk,
    auction: Auction<T, CoinType>,
    creator_kiosk: &mut sui::kiosk::Kiosk,
    creator_kiosk_cap: &sui::kiosk::KioskOwnerCap,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**When to use:** When winner doesn't have a kiosk or for simplicity

**Flow:**
- If auction has bids:
  - Creates new kiosk for winner
  - Places NFT in winner's new kiosk
  - Shares kiosk publicly
  - Transfers kiosk cap to winner
  - Processes payment to creator (minus fees)
  
- If auction has NO bids:
  - Returns NFT to creator's original kiosk
  - Requires creator's kiosk + cap

**Advantages:**
- Winner doesn't need pre-existing kiosk
- Can be called by anyone
- Winner receives kiosk + cap automatically
- Ready for future trading

#### Method 2: Finalize to Existing Kiosk

```move
public entry fun finalize_to_kiosk<T, CoinType>(
    auction_house: &mut AuctionHouse,
    platform_kiosk: &mut sui::kiosk::Kiosk,
    auction: Auction<T, CoinType>,
    recipient_kiosk: &mut sui::kiosk::Kiosk,
    recipient_kiosk_cap: &sui::kiosk::KioskOwnerCap,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**When to use:** When winner already has a kiosk

**Flow:**
- Winner (or someone acting for them) must provide their kiosk + cap
- NFT is placed in winner's existing kiosk
- Verifies kiosk ownership matches winner

#### Method 3: Finalize to Wallet (Legacy)

```move
public entry fun finalize_to_wallet<T, CoinType>(
    auction_house: &mut AuctionHouse,
    platform_kiosk: &mut sui::kiosk::Kiosk,
    auction: Auction<T, CoinType>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**When to use:** For simple transfers, but NOT recommended

**Flow:**
- NFT is transferred directly to winner's wallet
- Winner will need to manually place NFT in a kiosk for future trading
- Simpler but less composable

⚠️ **Warning:** NFTs transferred to wallets may need manual kiosk placement before they can be sold again.

#### Method 4: Locked NFT Variants

For NFTs with transfer policies:
- `finalize_and_create_kiosk_with_lock` - Creates new kiosk, locks NFT
- `finalize_to_kiosk_with_lock` - Places in existing kiosk, locks NFT
- `finalize_to_wallet_with_lock` - Transfers to wallet (not recommended)

## Important Notes

### Kiosk Does Not Follow NFT

**Common Misconception:** "The NFT's original kiosk should follow it to the winner"

**Reality:** According to Sui Kiosk design:
- Kiosks are personal storage for multiple NFTs
- When an NFT is sold, it moves to the buyer's kiosk (or a new one)
- The original kiosk stays with the original owner
- This allows sellers to continue using their kiosk for other NFTs

### No-Bid Auctions

When an auction expires without bids:
- NFT must return to creator's **original kiosk**
- Requires creator to provide their kiosk + cap
- Cannot create new kiosk (creator already has one)
- Auction struct stores `creator_kiosk_id` for verification

### Creator's Kiosk ID Storage

The auction stores the creator's kiosk ID:
```move
public struct Auction<phantom T, phantom CoinType> has key, store {
    ...
    creator_kiosk_id: ID,  // For no-bid returns
    ...
}
```

This ensures no-bid NFTs return to the correct kiosk.

## Frontend Implementation

### Recommended Approach

Use `finalize_and_create_kiosk` or `finalize_and_create_kiosk_with_lock` for all finalizations:

```typescript
// For unlocked NFTs
await signAndExecuteTransaction({
  transaction: tx,
  options: {
    showEffects: true,
  },
});

// Transaction building
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::auction::finalize_and_create_kiosk`,
  arguments: [
    tx.object(AUCTION_HOUSE_ID),
    tx.object(PLATFORM_KIOSK_ID),
    tx.object(auctionId),
    tx.object(creatorKioskId), // For no-bid returns
    tx.object(creatorKioskCapId), // For no-bid returns
    tx.object('0x6'), // Clock
  ],
  typeArguments: [nftType, 'sui::sui::SUI'],
});
```

### Handling No-Bid Auctions

The frontend must:
1. Detect if auction has bids
2. If no bids, creator must finalize
3. Creator must provide their kiosk + cap
4. Verify kiosk ID matches `creator_kiosk_id` in auction

## Error Codes

```move
const EWrongKioskOwner: u64 = 1001;  // Kiosk owner doesn't match expected address
const EWrongCreatorKiosk: u64 = 1002; // Wrong kiosk ID for no-bid return
```

## Best Practices

1. **Always use kiosk-based finalization** for proper Sui ecosystem integration
2. **Create new kiosks for winners** who don't have one
3. **Store creator kiosk ID** at auction creation for no-bid returns
4. **Verify kiosk ownership** before finalizing
5. **Lock NFTs with transfer policies** to enforce royalties

## Testing

See `TESTNET_SETUP_GUIDE.md` for testing kiosk flows on testnet.

## Questions?

This implementation follows Sui Kiosk standards as documented in the official Sui documentation. The key principle is that kiosks are personal storage spaces, not containers that travel with individual NFTs.
