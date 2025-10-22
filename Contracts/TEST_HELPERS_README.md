# Test Helpers Module

## Overview

The `test_helpers` module provides convenient functions for creating test NFTs and kiosks on testnet. This makes it easy to test your auction platform without needing real NFTs.

## Quick Start

**One command to create a kiosk with a test NFT:**

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module test_helpers \
  --function create_test_kiosk_quick \
  --gas-budget 10000000
```

After this, you're ready to create auctions immediately! ✨

## Test NFT Type

```move
public struct TestNFT has key, store {
    id: UID,
    name: String,
    description: String,
    image_url: String,
    number: u64,
}
```

**Features**:
- ✅ Has `store` ability - can be placed in kiosks
- ✅ Has `key` ability - can be owned and transferred
- ✅ Includes Display standard metadata
- ✅ Perfect for testing auctions

## Available Functions

### 1. `create_test_kiosk_quick()` ⚡

**Most popular - one-click setup!**

```move
public entry fun create_test_kiosk_quick(ctx: &mut TxContext)
```

Creates:
- A shared Kiosk
- A test NFT with default values
- NFT placed inside kiosk
- KioskOwnerCap transferred to you

**CLI Usage**:
```bash
sui client call \
  --package $PACKAGE_ID \
  --module test_helpers \
  --function create_test_kiosk_quick \
  --gas-budget 10000000
```

**Result**: You can immediately create an auction with this NFT!

---

### 2. `create_kiosk_with_test_nft()` 🎨

**Custom NFT properties**

```move
public entry fun create_kiosk_with_test_nft(
    name: vector<u8>,
    description: vector<u8>,
    image_url: vector<u8>,
    number: u64,
    ctx: &mut TxContext
)
```

Creates a kiosk with your custom NFT.

**CLI Usage**:
```bash
sui client call \
  --package $PACKAGE_ID \
  --module test_helpers \
  --function create_kiosk_with_test_nft \
  --args \
    "My Rare NFT" \
    "A unique test NFT" \
    "https://example.com/rare.png" \
    42 \
  --gas-budget 10000000
```

**Parameters**:
- `name`: Your NFT name
- `description`: NFT description
- `image_url`: Image URL (any valid URL)
- `number`: NFT number/edition

---

### 3. `create_kiosk_with_multiple_nfts()` 📦

**Bulk NFT creation**

```move
public entry fun create_kiosk_with_multiple_nfts(
    count: u64,
    ctx: &mut TxContext
)
```

Creates one kiosk with multiple test NFTs (numbered 1, 2, 3...).

**CLI Usage**:
```bash
# Create kiosk with 10 NFTs
sui client call \
  --package $PACKAGE_ID \
  --module test_helpers \
  --function create_kiosk_with_multiple_nfts \
  --args 10 \
  --gas-budget 20000000
```

**Perfect for**:
- Testing multiple auctions
- Batch operations
- Performance testing

---

### 4. `mint_and_transfer()` 🎪

**Mint single NFT to wallet (not in kiosk)**

```move
public entry fun mint_and_transfer(
    name: vector<u8>,
    description: vector<u8>,
    image_url: vector<u8>,
    number: u64,
    ctx: &mut TxContext
)
```

Mints NFT and transfers directly to your wallet.

**CLI Usage**:
```bash
sui client call \
  --package $PACKAGE_ID \
  --module test_helpers \
  --function mint_and_transfer \
  --args \
    "Wallet NFT" \
    "Test NFT in wallet" \
    "https://example.com/nft.png" \
    1 \
  --gas-budget 5000000
```

**Note**: You'll need to place this in a kiosk before auctioning.

---

## View Functions

```move
// Get NFT properties
public fun get_name(nft: &TestNFT): String
public fun get_description(nft: &TestNFT): String
public fun get_image_url(nft: &TestNFT): String
public fun get_number(nft: &TestNFT): u64
```

---

## Usage Examples

### Example 1: Quick Testing

```bash
# Deploy
sui client publish --gas-budget 200000000
export PKG=0xYOUR_PACKAGE_ID

# Create test setup
sui client call \
  --package $PKG \
  --module test_helpers \
  --function create_test_kiosk_quick \
  --gas-budget 10000000

# Done! Ready to create auctions
```

### Example 2: Custom NFT for Demo

```bash
# Create custom NFT for presentation
sui client call \
  --package $PKG \
  --module test_helpers \
  --function create_kiosk_with_test_nft \
  --args \
    "Rare Dragon #1" \
    "A legendary dragon NFT for auction" \
    "https://example.com/dragon.png" \
    1 \
  --gas-budget 10000000
```

### Example 3: Batch Testing

```bash
# Create 20 NFTs for load testing
sui client call \
  --package $PKG \
  --module test_helpers \
  --function create_kiosk_with_multiple_nfts \
  --args 20 \
  --gas-budget 30000000

# Now create 20 different auctions!
```

### Example 4: Multi-User Testing

```bash
# User 1
sui client call --package $PKG --module test_helpers --function create_test_kiosk_quick

# Switch to User 2
sui client switch --address 0xUSER2_ADDRESS

# User 2
sui client call --package $PKG --module test_helpers --function create_test_kiosk_quick

# Now both can create auctions and bid on each other's!
```

---

## TypeScript/JavaScript Usage

```typescript
import { Transaction } from '@mysten/sui/transactions';

// Quick setup
const tx = new Transaction();
tx.moveCall({
  target: `${packageId}::test_helpers::create_test_kiosk_quick`,
  arguments: [],
});

const result = await signAndExecute({ 
  transaction: tx,
  options: {
    showObjectChanges: true,
  },
});

// Extract IDs from result
const kioskId = result.objectChanges?.find(
  obj => obj.objectType?.includes('kiosk::Kiosk')
)?.objectId;

const kioskCapId = result.objectChanges?.find(
  obj => obj.objectType?.includes('kiosk::KioskOwnerCap')
)?.objectId;

console.log('Ready to auction!');
console.log('Kiosk:', kioskId);
console.log('Cap:', kioskCapId);
```

---

## Gas Costs

| Function | Estimated Gas (SUI) |
|----------|-------------------|
| `create_test_kiosk_quick` | ~0.001 |
| `create_kiosk_with_test_nft` | ~0.001 |
| `create_kiosk_with_multiple_nfts` (10 NFTs) | ~0.002 |
| `mint_and_transfer` | ~0.0005 |

*Estimates for testnet, actual costs may vary*

---

## Display Metadata

All TestNFTs have Display metadata configured:

```
name: {name}
description: {description}
image_url: {image_url}
number: #{number}
```

This means they'll display nicely in:
- Sui wallets
- NFT marketplaces
- Your auction frontend

---

## Best Practices

### For Development
1. ✅ Use `create_test_kiosk_quick()` for rapid testing
2. ✅ Create multiple NFTs at once for batch testing
3. ✅ Use descriptive names for custom NFTs

### For Testing
1. ✅ Test with different NFT numbers/names
2. ✅ Create multiple kiosks for multi-user scenarios
3. ✅ Verify NFTs appear in frontend before auctioning

### For Demos
1. ✅ Use custom images and descriptions
2. ✅ Create themed NFT collections
3. ✅ Pre-create kiosks before presenting

---

## Troubleshooting

### NFT not showing in frontend
- **Cause**: Frontend filters wallet NFTs
- **Solution**: Use test helper functions that create kiosk + NFT

### Can't create auction
- **Cause**: NFT not in kiosk
- **Solution**: Use `create_kiosk_with_test_nft` functions

### "Insufficient gas"
- **Cause**: Low SUI balance
- **Solution**: Get testnet SUI from faucet

### "Module not found"
- **Cause**: Wrong package ID
- **Solution**: Verify package ID from publish output

---

## Integration with Auction System

After creating test NFT in kiosk:

1. **Frontend automatically detects it** ✅
2. **Shows in "Create Auction" modal** ✅
3. **Can immediately create auction** ✅
4. **NFT moved to platform kiosk** ✅
5. **Auction goes live** ✅

**No manual steps needed!**

---

## Complete Example Workflow

```bash
# 1. Deploy package
sui client publish --gas-budget 200000000
export PKG=0xYOUR_PACKAGE_ID

# 2. Create test kiosk with NFT
sui client call \
  --package $PKG \
  --module test_helpers \
  --function create_test_kiosk_quick \
  --gas-budget 10000000

# 3. Save IDs from output
export KIOSK_ID=0xYOUR_KIOSK_ID
export CAP_ID=0xYOUR_CAP_ID

# 4. Verify NFT in kiosk
sui client object $KIOSK_ID

# 5. Open frontend and create auction!
# Your test NFT should appear in the modal
```

---

## Production vs Testnet

### Testnet (with test_helpers) ✅
- Quick setup with test NFTs
- Perfect for development
- Easy to test all features
- No need for real NFTs

### Mainnet (real NFTs) 🚀
- Users bring their own NFTs
- Real kiosks with real assets
- Transfer policies enforced
- Real SUI transactions

**test_helpers is ONLY for testnet testing!**

---

## Summary

The `test_helpers` module makes testnet testing incredibly easy:

- ⚡ **One command** creates everything you need
- 🎨 **Custom NFTs** for realistic testing
- 📦 **Bulk creation** for load testing
- 🔧 **TypeScript support** for automation
- ✅ **Production-like** behavior

**Start testing in under 1 minute!** 🚀

See [TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md) for complete setup instructions.
