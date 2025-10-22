# Deployment Checklist - Kiosk Update

## Pre-Deployment

- [x] Smart contract changes implemented
- [x] Contract builds successfully
- [x] Frontend transaction helpers updated
- [x] Documentation created

## Smart Contract Deployment

### 1. Build Contracts
```bash
cd Contracts
sui move build
```

### 2. Deploy to Testnet
```bash
sui client publish --gas-budget 100000000
```

### 3. Save Important IDs

After deployment, save these IDs to `Frontend/src/config/constants.ts`:

```typescript
// Update these values
export const PACKAGE_ID = 'YOUR_NEW_PACKAGE_ID';
export const AUCTION_HOUSE_ID = 'YOUR_AUCTION_HOUSE_ID';
export const PLATFORM_KIOSK_ID = 'YOUR_PLATFORM_KIOSK_ID';
```

## Testing Checklist

### Test Scenario 1: Auction with Bids (Winner Gets New Kiosk)

1. **Create test auction**
   - Use `test_helpers::create_kiosk_with_test_nft` if needed
   - Or create auction from existing kiosk
   - Set short expiry time (e.g., 5 minutes)

2. **Place bids**
   - From different wallet than creator
   - Place at least one bid
   - Verify bid is recorded

3. **Wait for expiry**
   - Wait for auction to expire
   - Wait additional 60 seconds for buffer

4. **Finalize auction**
   - Click "Finalize Auction" button
   - Transaction should succeed
   - Check console logs for kiosk creation

5. **Verify winner received**
   - Winner should have new `KioskOwnerCap`
   - NFT should be in winner's kiosk
   - Creator should receive payment (minus fee)

### Test Scenario 2: No-Bid Auction (Returns to Creator)

1. **Create test auction**
   - Create auction from your kiosk
   - Set short expiry time

2. **Don't place bids**
   - Let auction expire without bids

3. **Finalize auction**
   - Anyone can finalize
   - Should require creator's kiosk info
   - Transaction should succeed

4. **Verify NFT returned**
   - NFT should be back in creator's original kiosk
   - No payment processed
   - Creator still has their kiosk cap

### Test Scenario 3: Locked NFT with Transfer Policy

1. **Create auction with locked NFT**
   - Use NFT that has transfer policy
   - Transaction should use `create_auction_from_kiosk_with_lock`

2. **Place bids and finalize**
   - Same as Scenario 1
   - Should use `finalize_and_create_kiosk_with_lock`

3. **Verify locked NFT in kiosk**
   - NFT should be locked in winner's kiosk
   - Transfer policy enforced

## Frontend Verification

### Check Console Logs
When finalizing, you should see:
```
🔍 Finding kiosk for user: <creator_address>
✅ Found kiosk: { kioskId: ..., kioskCapId: ... }
🔍 Searching for TransferPolicy for type: ...
🎯 Finalizing auction with kiosk creation: { auctionId: ..., creatorKioskId: ..., transferPolicyId: ... }
```

### Verify Transaction Structure
Transaction should call:
- `finalize_and_create_kiosk` for unlocked NFTs
- `finalize_and_create_kiosk_with_lock` for locked NFTs

Arguments should include:
1. Auction House ID
2. Platform Kiosk ID
3. Auction ID
4. Creator Kiosk ID (for no-bid returns)
5. Creator Kiosk Cap ID (for no-bid returns)
6. Transfer Policy ID (if applicable)
7. Clock object

## Common Issues & Solutions

### Issue: "Creator kiosk not found"
**Solution:** Creator must have created a kiosk before creating auction. Use `test_helpers::create_kiosk_with_test_nft` or create kiosk manually.

### Issue: "Wrong kiosk owner"
**Solution:** Verify creator kiosk ID matches the one stored in auction struct.

### Issue: "Auction not expired" (EAuctionNotExpired)
**Solution:** Wait for expiry time + 60 second buffer before finalizing.

### Issue: Transaction fails with "Invalid argument"
**Solution:** Check that all object IDs are correct and objects exist on chain.

## Rollback Plan

If issues occur:
1. Revert to previous package version
2. Update `PACKAGE_ID` in constants
3. Frontend will use old finalization methods
4. Existing auctions continue to work

## Success Criteria

- ✅ Auctions can be created from kiosks
- ✅ Bids can be placed successfully  
- ✅ Auctions with bids finalize correctly
- ✅ Winner receives new kiosk + NFT
- ✅ Creator receives payment (minus fee)
- ✅ No-bid auctions return NFT to creator's kiosk
- ✅ Locked NFTs work with transfer policies
- ✅ Anyone can finalize expired auctions

## Post-Deployment

1. **Monitor transactions** for first few finalizations
2. **Check event logs** for proper kiosk creation
3. **Verify gas costs** are reasonable
4. **Update documentation** with real contract addresses
5. **Announce update** to users

## Notes

- The new functions create kiosks automatically for winners
- No-bid auctions require creator's kiosk info (fetched automatically)
- Legacy finalization methods still available for compatibility
- Kiosk creation adds small gas overhead but improves UX significantly

## Contact

For issues or questions:
- Check logs in browser console
- Review `KIOSK_HANDLING_GUIDE.md`
- Review `KIOSK_IMPLEMENTATION_SUMMARY.md`
