# Wackbid Auction System

A fully automated, secure auction system built on Sui blockchain with instant refunds and automatic fee collection.

## Architecture

The system consists of two main modules:

### 1. Auction House Module (`auction_house.move`)
The foundational infrastructure managing:
- **Admin Control**: `AdminCap` for privileged operations
- **Fee Management**: Configurable fee percentage (0-100% in basis points)
- **Multi-Currency Support**: Bag-based storage for fees in any coin type
- **Kiosk Integration**: Secure NFT custody using Sui's Kiosk framework
- **Transfer Policy Compliance**: Support for locked/policy-protected NFTs

### 2. Auction Module (`auction.move`)
The automated auction logic providing:
- **Time-Based Expiry**: Auctions automatically close at expiry
- **Instant Refunds**: Previous bidders are refunded immediately when outbid
- **Automated Settlement**: Anyone can finalize expired auctions
- **Fee Deduction**: Platform fees automatically deducted from final payment
- **Event Emissions**: Full transparency via on-chain events

## Key Features

### ✅ Fully Automated
- No manual intervention needed after creation
- Anyone can trigger finalization after expiry
- Automatic fund distribution to creator and winner

### ✅ Instant Refunds
- Previous highest bidder receives immediate refund when outbid
- No locked funds during auction lifecycle
- Gas-efficient single-transaction refund mechanism

### ✅ Secure Architecture
- NFTs held in secure Kiosk during auction
- Admin-only fee management
- Package-scoped internal functions
- Transfer policy compliance for royalty-enabled NFTs

### ✅ Fee System
- Configurable platform fees (0-10000 basis points / 0-100%)
- Fees deducted from winning bid
- Creator receives bid amount minus fees
- Multi-currency fee collection

## Contract Flow

### Creating an Auction

```move
// For regular NFTs
public fun create_auction<T: store + key, CoinType>(
    auction_house: &AuctionHouse,
    shared_kiosk: &mut Kiosk,
    item: T,
    expiry_time: u64,  // Timestamp in milliseconds
    clock: &Clock,
    ctx: &mut TxContext
): Auction<T, CoinType>

// For policy-protected NFTs
public fun create_auction_with_lock<T: store + key, CoinType>(
    auction_house: &AuctionHouse,
    shared_kiosk: &mut Kiosk,
    policy: &TransferPolicy<T>,
    item: T,
    expiry_time: u64,
    clock: &Clock,
    ctx: &mut TxContext
): Auction<T, CoinType>
```

**Process:**
1. NFT deposited into shared Kiosk
2. Auction object created with expiry time
3. `AuctionCreated` event emitted
4. Auction object transferred to creator

### Placing Bids

```move
public fun place_bid<T: store + key, CoinType>(
    auction: &mut Auction<T, CoinType>,
    bid: Coin<CoinType>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Process:**
1. Verify auction is active and not expired
2. Ensure new bid > current highest bid
3. **Refund previous bidder immediately** (if exists)
4. Store new bid in auction
5. Update highest bidder
6. Emit `BidPlaced` event

**Key Security:**
- Atomic refund prevents fund locking
- Strict bid validation prevents gaming
- Clock-based expiry verification

### Finalizing Auctions

```move
// For regular NFTs
public fun finalize_auction<T: store + key, CoinType>(
    auction_house: &mut AuctionHouse,
    shared_kiosk: &mut Kiosk,
    auction: Auction<T, CoinType>,
    clock: &Clock,
    ctx: &mut TxContext
)

// For policy-protected NFTs
public fun finalize_auction_with_lock<T: store + key, CoinType>(
    auction_house: &mut AuctionHouse,
    shared_kiosk: &mut Kiosk,
    auction: Auction<T, CoinType>,
    policy: &TransferPolicy<T>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Process (with bids):**
1. Verify auction has expired
2. Extract platform fee from winning bid
3. Transfer remaining funds to creator
4. Transfer NFT to winner
5. Emit `AuctionFinalized` event
6. Delete auction object

**Process (no bids):**
1. Verify auction has expired
2. Return NFT to creator
3. Emit `AuctionFinalized` event
4. Delete auction object

**Important:** Anyone can call finalize after expiry - encourages timely settlement.

## Administrative Functions

### Fee Management

```move
// Change platform fee (Admin only)
public fun change_fee_percentage(
    _admin: &AdminCap,
    auction_house: &mut AuctionHouse,
    new_fee: u64  // Basis points (100 = 1%)
)

// Withdraw collected fees (Admin only)
public fun withdraw_fee<T>(
    _admin: &AdminCap,
    auction_house: &mut AuctionHouse,
    ctx: &mut TxContext
): Coin<T>

// Create new admin capability (Admin only)
public fun new_admin_cap(
    _admin: &mut AdminCap,
    ctx: &mut TxContext
): AdminCap
```

### View Functions

```move
public fun get_highest_bid<T, CoinType>(auction: &Auction<T, CoinType>): u64
public fun get_highest_bidder<T, CoinType>(auction: &Auction<T, CoinType>): Option<address>
public fun get_creator<T, CoinType>(auction: &Auction<T, CoinType>): address
public fun get_expiry_time<T, CoinType>(auction: &Auction<T, CoinType>): u64
public fun is_active<T, CoinType>(auction: &Auction<T, CoinType>): bool
public fun get_item_id<T, CoinType>(auction: &Auction<T, CoinType>): ID
```

## Events

### AuctionCreated
```move
public struct AuctionCreated has copy, drop {
    auction_id: ID,
    item_id: ID,
    creator: address,
    expiry_time: u64,
}
```

### BidPlaced
```move
public struct BidPlaced has copy, drop {
    auction_id: ID,
    bidder: address,
    bid_amount: u64,
    previous_bidder: Option<address>,
}
```

### AuctionFinalized
```move
public struct AuctionFinalized has copy, drop {
    auction_id: ID,
    winner: Option<address>,
    final_bid: u64,
    creator_received: u64,
    fee_collected: u64,
}
```

## Security Considerations

### Access Control
- Admin functions require `AdminCap` ownership
- Item deposit/withdrawal functions are `public(package)` scoped
- Only auction creator or finalization logic can withdraw NFTs

### Economic Security
- Fee capped at 10000 basis points (100%)
- Bids must strictly increase
- Instant refunds prevent bid griefing
- No re-entrancy vectors (Move language guarantee)

### Time Security
- Sui Clock used for expiry verification
- Expired auctions cannot accept new bids
- Non-expired auctions cannot be finalized

### NFT Security
- Kiosk-based custody (Sui standard)
- Transfer policy compliance for royalties
- Atomic operations prevent item loss

## Example Usage Scenarios

### Scenario 1: Successful Auction
1. Alice creates auction for her NFT, expiry in 24 hours, fee = 250bp (2.5%)
2. Bob bids 100 SUI
3. Carol bids 150 SUI → Bob instantly receives 100 SUI refund
4. Dave bids 200 SUI → Carol instantly receives 150 SUI refund
5. Auction expires (24 hours)
6. Anyone calls finalize:
   - Fee = 200 × 2.5% = 5 SUI → Platform
   - Creator = 200 - 5 = 195 SUI → Alice
   - NFT → Dave

### Scenario 2: No Bids
1. Alice creates auction, expiry in 24 hours
2. No one bids
3. Auction expires
4. Anyone calls finalize:
   - NFT returned to Alice
   - No fees collected

### Scenario 3: Policy-Protected NFT
1. Alice creates auction with locked NFT (has royalty policy)
2. Bids processed normally
3. At finalization:
   - Transfer request generated from Kiosk
   - Policy confirmed (royalties enforced)
   - NFT transferred to winner

## Gas Optimization

- Bag storage for multi-currency fees (no per-coin objects)
- Instant refunds avoid claim mechanisms
- Single finalization transaction
- Events for off-chain indexing (reduces on-chain queries)

## Building & Testing

```bash
# Build contracts
sui move build

# Run tests
sui move test

# Deploy
sui client publish --gas-budget 100000000
```

## Integration Guide

### For Frontend Developers
1. Monitor `AuctionCreated` events for new auctions
2. Monitor `BidPlaced` events for live auction updates
3. Monitor `AuctionFinalized` events for settlement tracking
4. Use view functions to display auction state
5. Implement Clock-based UI countdown timers
6. Call finalize programmatically after expiry for UX

### For Marketplace Integrators
1. Set platform fee via `change_fee_percentage`
2. Monitor fee balance via Bag inspection
3. Withdraw fees periodically via `withdraw_fee`
4. Share the AuctionHouse and Kiosk as shared objects
5. Index events for auction history

## License

[Your License Here]

## Support

[Your Support Contact]
