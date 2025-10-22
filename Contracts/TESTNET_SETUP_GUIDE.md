# Testnet Setup Guide - Quick NFT Testing

## 🚀 Quick Start (1 Minute)

This guide shows you how to use the built-in test helper functions to quickly set up a kiosk with test NFTs for auction testing on testnet.

---

## ✨ Test Helper Functions

The `test_helpers` module provides easy functions to create test NFTs and kiosks for testing your auction platform.

### Available Functions

1. **`create_test_kiosk_quick()`** - One-click setup ⚡
2. **`create_kiosk_with_test_nft()`** - Custom NFT creation
3. **`create_kiosk_with_multiple_nfts()`** - Bulk NFT creation
4. **`mint_and_transfer()`** - Mint single NFT to wallet

---

## 🎯 Method 1: Quick Setup (Recommended)

**Use this for instant testing!**

### Using Sui CLI

```bash
# Deploy your package first
sui client publish --gas-budget 200000000

# Save your PACKAGE_ID from output
export PACKAGE_ID=0xYOUR_PACKAGE_ID

# Create a kiosk with a test NFT in ONE command!
sui client call \
  --package $PACKAGE_ID \
  --module test_helpers \
  --function create_test_kiosk_quick \
  --gas-budget 10000000
```

**What this does**:
- ✅ Creates a new shared Kiosk
- ✅ Mints a "Wackbid Test NFT" with default values
- ✅ Places NFT inside the kiosk
- ✅ Transfers KioskOwnerCap to you

**After this command, you're ready to create auctions immediately!** 🎉

---

## 🎨 Method 2: Custom NFT Creation

Create a kiosk with your own custom NFT properties.

### Using Sui CLI

```bash
sui client call \
  --package $PACKAGE_ID \
  --module test_helpers \
  --function create_kiosk_with_test_nft \
  --args \
    "My Cool NFT" \
    "Description of my awesome NFT" \
    "https://example.com/image.png" \
    1 \
  --gas-budget 10000000
```

**Parameters**:
- `name`: NFT name (string)
- `description`: NFT description (string)
- `image_url`: Image URL (string)
- `number`: NFT number (u64)

---

## 📦 Method 3: Multiple NFTs at Once

Create a kiosk with multiple test NFTs for bulk testing.

### Using Sui CLI

```bash
# Create kiosk with 5 test NFTs
sui client call \
  --package $PACKAGE_ID \
  --module test_helpers \
  --function create_kiosk_with_multiple_nfts \
  --args 5 \
  --gas-budget 20000000
```

**What this does**:
- Creates one kiosk
- Mints `count` NFTs (numbered 1, 2, 3, ...)
- Places all NFTs in the kiosk
- Perfect for testing multiple auctions

---

## 🎪 Method 4: Mint NFT to Wallet (No Kiosk)

Mint a test NFT directly to your wallet (not in kiosk).

### Using Sui CLI

```bash
sui client call \
  --package $PACKAGE_ID \
  --module test_helpers \
  --function mint_and_transfer \
  --args \
    "Test NFT" \
    "My test NFT" \
    "https://example.com/nft.png" \
    1 \
  --gas-budget 5000000
```

**Note**: You'll need to place this NFT in a kiosk before auctioning it.

---

## 🔄 Complete Testnet Workflow

### Step 1: Deploy Contracts

```bash
cd Contracts

# Build
sui move build

# Publish to testnet
sui client publish --gas-budget 200000000

# Copy output IDs:
# - Package ID
# - AuctionHouse ID
# - Platform Kiosk ID
# - AdminCap ID
```

### Step 2: Create Test Kiosk with NFT

```bash
# Save your package ID
export PACKAGE_ID=0xYOUR_PACKAGE_ID

# Quick setup - creates kiosk with test NFT
sui client call \
  --package $PACKAGE_ID \
  --module test_helpers \
  --function create_test_kiosk_quick \
  --gas-budget 10000000
```

**From the output, save**:
- Your Kiosk ID (shared object)
- Your KioskOwnerCap ID (owned by you)

### Step 3: Verify Your Kiosk

```bash
# Check your kiosk
sui client object YOUR_KIOSK_ID

# Check your kiosk cap
sui client object YOUR_KIOSK_CAP_ID
```

### Step 4: Configure Frontend

```bash
cd ../Frontend

# Update .env with your IDs
cat > .env << EOF
VITE_PACKAGE_ID=$PACKAGE_ID
VITE_AUCTION_HOUSE_ID=YOUR_AUCTION_HOUSE_ID
VITE_PLATFORM_KIOSK_ID=YOUR_PLATFORM_KIOSK_ID
VITE_ADMIN_CAP_ID=YOUR_ADMIN_CAP_ID
VITE_NETWORK=testnet
EOF
```

### Step 5: Test Auction Creation

```bash
# Start frontend
npm run dev

# Open http://localhost:5173
# Connect your wallet
# Click "Create Auction"
# Your test NFT should appear!
```

---

## 📋 Using TypeScript SDK

You can also call these functions from your frontend or scripts.

### Create Test Kiosk with NFT

```typescript
import { Transaction } from '@mysten/sui/transactions';

const tx = new Transaction();

tx.moveCall({
  target: `${PACKAGE_ID}::test_helpers::create_test_kiosk_quick`,
  arguments: [],
});

const result = await signAndExecuteTransaction({
  transaction: tx,
  options: {
    showEffects: true,
    showObjectChanges: true,
  },
});

// Extract kiosk and cap IDs from result
const kioskId = result.objectChanges?.find(
  obj => obj.objectType?.includes('::kiosk::Kiosk')
)?.objectId;

const kioskCapId = result.objectChanges?.find(
  obj => obj.objectType?.includes('::kiosk::KioskOwnerCap')
)?.objectId;

console.log('Kiosk ID:', kioskId);
console.log('Kiosk Cap ID:', kioskCapId);
```

### Create Custom Test NFT in Kiosk

```typescript
const tx = new Transaction();

tx.moveCall({
  target: `${PACKAGE_ID}::test_helpers::create_kiosk_with_test_nft`,
  arguments: [
    tx.pure.string('My Auction NFT'),
    tx.pure.string('Testing auction functionality'),
    tx.pure.string('https://example.com/nft.png'),
    tx.pure.u64(1),
  ],
});

await signAndExecuteTransaction({ transaction: tx });
```

### Create Multiple Test NFTs

```typescript
const tx = new Transaction();

tx.moveCall({
  target: `${PACKAGE_ID}::test_helpers::create_kiosk_with_multiple_nfts`,
  arguments: [
    tx.pure.u64(10), // Create 10 test NFTs
  ],
});

await signAndExecuteTransaction({ transaction: tx });
```

---

## 🧪 Testing Scenarios

### Scenario 1: Single Auction Test

```bash
# 1. Create kiosk with 1 NFT
sui client call \
  --package $PACKAGE_ID \
  --module test_helpers \
  --function create_test_kiosk_quick

# 2. Create auction via frontend
# 3. Place bids
# 4. Wait for expiry
# 5. Finalize
```

### Scenario 2: Multiple Auctions Test

```bash
# 1. Create kiosk with 5 NFTs
sui client call \
  --package $PACKAGE_ID \
  --module test_helpers \
  --function create_kiosk_with_multiple_nfts \
  --args 5

# 2. Create 5 different auctions
# 3. Test concurrent bidding
# 4. Test different expiry times
```

### Scenario 3: Different Users Testing

```bash
# User 1 (from first wallet)
sui client call \
  --package $PACKAGE_ID \
  --module test_helpers \
  --function create_test_kiosk_quick

# Switch wallet
sui client switch --address 0xUSER2

# User 2 (from second wallet)
sui client call \
  --package $PACKAGE_ID \
  --module test_helpers \
  --function create_test_kiosk_quick

# Now both users can create auctions and bid on each other's!
```

---

## 📊 Test NFT Properties

### Default NFT (create_test_kiosk_quick)

```
Name: "Wackbid Test NFT"
Description: "A test NFT for auction testing on Wackbid platform"
Image: Default placeholder image
Number: 1
Type: contracts::test_helpers::TestNFT
```

### Custom NFT Properties

All test NFTs have:
- `name`: String
- `description`: String  
- `image_url`: String
- `number`: u64

These are displayed via the Display standard, so they'll show up nicely in wallets and on your frontend.

---

## 🔍 Verifying Your Setup

### Check if NFT is in Kiosk

```bash
# Query your kiosk
sui client object YOUR_KIOSK_ID

# You should see item_ids in the output
```

### View Your NFT

```bash
# Get NFT ID from kiosk's item_ids
sui client object YOUR_NFT_ID

# Should show TestNFT with properties
```

### Check NFT Ownership

```bash
# List objects owned by you
sui client objects

# Should see:
# - KioskOwnerCap (owned by you)
# - Kiosk (shared, but you control via cap)
```

---

## ⚡ Quick Reference Commands

```bash
# Deploy
sui client publish --gas-budget 200000000

# Quick setup (1 NFT)
sui client call \
  --package $PKG \
  --module test_helpers \
  --function create_test_kiosk_quick \
  --gas-budget 10000000

# Multiple NFTs
sui client call \
  --package $PKG \
  --module test_helpers \
  --function create_kiosk_with_multiple_nfts \
  --args 5 \
  --gas-budget 20000000

# Custom NFT
sui client call \
  --package $PKG \
  --module test_helpers \
  --function create_kiosk_with_test_nft \
  --args "Name" "Desc" "URL" 1 \
  --gas-budget 10000000

# Mint to wallet (no kiosk)
sui client call \
  --package $PKG \
  --module test_helpers \
  --function mint_and_transfer \
  --args "Name" "Desc" "URL" 1 \
  --gas-budget 5000000
```

---

## 🎯 Best Practices

### For Development
1. Use `create_test_kiosk_quick()` for rapid iteration
2. Create multiple NFTs at once for batch testing
3. Use different wallet addresses to test multi-user scenarios

### For Testing
1. Test with both unlocked NFTs (default)
2. Create transfer policies to test locked NFT auctions
3. Test edge cases (no bids, multiple bids, expiry)

### For Demos
1. Pre-create multiple kiosks with attractive NFT metadata
2. Use proper image URLs for visual appeal
3. Test the full auction lifecycle before demonstrating

---

## 🚨 Troubleshooting

### "Function not found"
- **Cause**: Package not deployed or wrong package ID
- **Fix**: Verify `PACKAGE_ID` is correct

### "Insufficient gas"
- **Cause**: Not enough SUI for transaction
- **Fix**: Get testnet SUI from faucet: https://discord.gg/sui

### "NFT not showing in frontend"
- **Cause**: Frontend filtering wallet NFTs
- **Fix**: NFT must be in kiosk (use test helper functions)

### "Can't create auction"
- **Cause**: NFT not in kiosk
- **Fix**: Use `create_kiosk_with_test_nft` functions

---

## 📚 Additional Resources

- [Main Quick Start Guide](../QUICK_START_GUIDE.md)
- [Frontend Setup](../Frontend/FRONTEND_AUCTION_UPDATE.md)
- [Contract Tests](./AUCTION_TEST_DOCUMENTATION.md)
- [Sui Testnet Faucet](https://discord.gg/sui)

---

## ✅ Success Checklist

After following this guide, you should have:

- [ ] Contracts deployed to testnet
- [ ] Package ID saved
- [ ] Kiosk created with test NFT(s)
- [ ] KioskOwnerCap in your wallet
- [ ] Frontend configured with contract IDs
- [ ] Able to see test NFT in frontend
- [ ] Successfully created first test auction
- [ ] Tested bidding and finalization

**You're now ready to test your auction platform! 🎉**
