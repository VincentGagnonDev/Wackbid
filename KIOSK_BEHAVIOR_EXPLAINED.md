# Kiosk Behavior in WackBid Auctions

## Understanding Sui Kiosks

According to the official Sui Kiosk documentation:

> "When someone purchases an asset from a kiosk, **the asset leaves the kiosk** and ownership transfers to the buyer's address."

This means **kiosks do NOT follow NFTs**. Each user manages their own kiosk(s).

## How WackBid Handles Kiosks

### Auction Lifecycle

1. **Creator has NFT in their kiosk**
   - User owns a kiosk with their NFT inside
   - NFT can be PLACED (unlocked) or LOCKED (with transfer policy)

2. **Creating an Auction**
   - Creator's kiosk ID is recorded in the auction
   - NFT is extracted from creator's kiosk
   - NFT is placed in WackBid's platform kiosk during auction
   - Creator receives their kiosk cap back

3. **During Auction**
   - NFT remains in platform kiosk
   - Bids are placed against the auction
   - Platform holds the NFT securely

4. **Auction Finalization**

   **With Bids (Winner exists):**
   - Winner must provide their own kiosk and kiosk cap
   - Payment processed (fees extracted, creator paid)
   - NFT moves from platform kiosk → winner's kiosk
   - Winner can now list, sell, or auction the NFT again

   **Without Bids (No winner):**
   - Creator must provide their original kiosk and kiosk cap
   - NFT returns from platform kiosk → creator's original kiosk
   - No payments processed
   - Creator can try auctioning again

## Finalization Functions

### For Unlocked NFTs

- **`finalize_to_kiosk`**: Places NFT in recipient's kiosk (winner or creator)
- **`finalize_to_wallet`**: Transfers NFT to wallet (legacy, not recommended)

### For Locked NFTs (with Transfer Policy)

- **`finalize_to_kiosk_with_lock`**: Locks NFT in recipient's kiosk (winner or creator)
- **`finalize_to_wallet_with_lock`**: Transfers NFT to wallet (legacy, not recommended)

## Important Notes

1. **Kiosks are user-specific**: Each user manages their own kiosk(s)
2. **NFTs move between kiosks**: They don't stay in a single "traveling" kiosk
3. **Creator kiosk ID is stored**: Enables returning NFTs to the correct kiosk
4. **Kiosk cap required**: Both winner and creator need their kiosk cap to finalize

## Frontend Integration

The frontend must:
1. Track which kiosk each user created their auctions from
2. Request the correct kiosk when finalizing auctions
3. Use `finalize_to_kiosk` or `finalize_to_kiosk_with_lock` for proper kiosk handling
4. Handle kiosk caps securely during transactions

## Why This Design?

This follows Sui's kiosk best practices:
- ✅ True ownership: Users control their kiosks
- ✅ Royalty enforcement: Transfer policies apply during finalization
- ✅ Trading flexibility: NFTs can be re-auctioned from winner's kiosk
- ✅ Security: Platform can't access user kiosks without caps
