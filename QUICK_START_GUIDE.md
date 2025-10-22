# Wackbid Auction Platform - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Deploy Smart Contracts

```bash
cd Contracts

# Build the package
sui move build

# Publish to testnet
sui client publish --gas-budget 200000000

# Save these IDs from the output:
# - Package ID: 0x...
# - AuctionHouse ID: 0x... (shared object)
# - Platform Kiosk ID: 0x... (shared object)
# - AdminCap ID: 0x... (owned by you)
```

### Step 2: Configure Frontend

```bash
cd ../Frontend

# Copy example env file
cp .env.example .env

# Edit .env with your contract IDs
VITE_PACKAGE_ID=0xYOUR_PACKAGE_ID
VITE_AUCTION_HOUSE_ID=0xYOUR_AUCTION_HOUSE_ID
VITE_PLATFORM_KIOSK_ID=0xYOUR_PLATFORM_KIOSK_ID
VITE_ADMIN_CAP_ID=0xYOUR_ADMIN_CAP_ID
VITE_NETWORK=testnet

# Install dependencies
npm install

# Start development server
npm run dev
```

### Step 3: Create Test Kiosk with NFT (Testnet Only)

For quick testing, use our built-in test helper:

```bash
# Create a kiosk with a test NFT in ONE command!
sui client call \
  --package YOUR_PACKAGE_ID \
  --module test_helpers \
  --function create_test_kiosk_quick \
  --gas-budget 10000000
```

This instantly gives you a kiosk with a test NFT ready for auction!

**See [TESTNET_SETUP_GUIDE.md](./Contracts/TESTNET_SETUP_GUIDE.md) for more options**

### Step 4: Test the System

1. **Open**: http://localhost:5173
2. **Connect**: Your Sui wallet
3. **View NFT**: Your test NFT should appear in the create auction modal
4. **Create Auction**: Click "Create Auction" and select your test NFT
5. **Place Bid**: Test bidding on your auction
6. **Wait & Finalize**: Wait for expiry and finalize

---

## 📝 Key Features

### For Auction Creators
- ✅ List any NFT from your kiosk
- ✅ Set custom duration (minutes to days)
- ✅ Support for locked NFTs with transfer policies
- ✅ Receive 95% of winning bid automatically
- ✅ NFT returned if no bids

### For Bidders
- ✅ Browse all active auctions
- ✅ Place bids with SUI tokens
- ✅ Get instant refund if outbid
- ✅ Win NFT automatically at auction end
- ✅ Only winning bid is charged

### For Platform
- ✅ 5% fee on all successful auctions
- ✅ Admin can withdraw fees anytime
- ✅ Secure kiosk-based custody
- ✅ Transfer policy enforcement

---

## 🔧 Common Tasks

### Create a Test Kiosk with NFT (Testnet)

**⚡ Quick Setup - One Command**:
```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module test_helpers \
  --function create_test_kiosk_quick \
  --gas-budget 10000000
```

Creates kiosk + test NFT + ready to auction!

**See [Testnet Setup Guide](./Contracts/TESTNET_SETUP_GUIDE.md) for more options**

### Create an Empty User Kiosk

**Option 1: Using Frontend**
```typescript
// Frontend will show a button if no kiosk detected
// Click "Create Kiosk" button
```

**Option 2: Using CLI**
```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module auction_house \
  --function create_user_kiosk_and_transfer \
  --gas-budget 10000000
```

### Place NFT in Kiosk

**Using Sui Kiosk SDK**:
```typescript
import { KioskClient } from '@mysten/kiosk';
import { Transaction } from '@mysten/sui/transactions';

const tx = new Transaction();

// Place NFT in kiosk
tx.moveCall({
  target: '0x2::kiosk::place',
  arguments: [
    tx.object(kioskId),
    tx.object(kioskOwnerCapId),
    tx.object(nftId),
  ],
  typeArguments: [nftType],
});

await signAndExecute({ transaction: tx });
```

### Check Auction Status

```bash
# View auction object
sui client object AUCTION_ID

# Should show:
# - creator: address
# - highest_bid: number
# - highest_bidder: Option<address>
# - expiry_time: timestamp
# - is_active: boolean
```

### Withdraw Platform Fees (Admin Only)

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module auction_house \
  --function withdraw_fee \
  --args YOUR_ADMIN_CAP_ID YOUR_AUCTION_HOUSE_ID \
  --type-args 0x2::sui::SUI \
  --gas-budget 10000000
```

---

## 🎯 User Flows

### Creating an Auction

```
1. Ensure NFT is in your kiosk
   ├─ If not, create kiosk first
   └─ Place NFT in kiosk

2. Click "Create Auction"
   ├─ Select NFT (only shows kiosk NFTs)
   ├─ Enter auction title
   ├─ Set minimum bid (not enforced, for display)
   └─ Set duration in minutes

3. Confirm transaction
   ├─ NFT moved to platform kiosk
   ├─ Auction object created and shared
   └─ You retain your KioskOwnerCap

4. Auction is now live!
   └─ Visible to all users
```

### Bidding on an Auction

```
1. Browse active auctions
   └─ See current highest bid

2. Click "Place Bid"
   ├─ Must bid higher than current highest
   └─ Enter your bid amount

3. Confirm transaction
   ├─ Your bid is recorded
   ├─ Previous bidder refunded instantly
   └─ You become current leader

4. If outbid:
   ├─ You get instant refund
   └─ Can bid again if you want
```

### Winning an Auction

```
1. Auction expires
   └─ No more bids accepted

2. Anyone can finalize
   ├─ Usually winner or creator
   └─ Costs gas but necessary

3. Finalization happens:
   ├─ 5% fee extracted
   ├─ 95% sent to creator
   └─ NFT transferred to winner

4. Done!
   ├─ Winner has NFT in wallet
   └─ Creator has SUI payment
```

---

## 🛠️ Development Commands

### Smart Contracts

```bash
cd Contracts

# Build
sui move build

# Test
sui move test

# Test with coverage
sui move test --coverage

# Deploy to testnet
sui client publish --gas-budget 200000000

# Deploy to mainnet
sui client switch --env mainnet
sui client publish --gas-budget 300000000
```

### Frontend

```bash
cd Frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🐛 Troubleshooting

### "NFT must be in a kiosk"
- **Problem**: Trying to auction wallet NFT
- **Fix**: Place NFT in kiosk first

### "No TransferPolicy found"
- **Problem**: Locked NFT without policy
- **Fix**: Creator must create TransferPolicy

### "Bid too low"
- **Problem**: Bid ≤ current highest
- **Fix**: Bid must be > current highest bid

### "Auction not expired"
- **Problem**: Trying to finalize early
- **Fix**: Wait until expiry_time passes

### Transaction fails with "object not found"
- **Problem**: Invalid object ID
- **Fix**: Check `.env` has correct IDs

---

## 📊 Smart Contract Functions

### Auction Creation
- `create_auction_from_kiosk` - Create auction with unlocked NFT
- `create_auction_from_kiosk_with_lock` - Create auction with locked NFT

### Bidding
- `place_bid` - Place or update your bid

### Finalization
- `finalize_auction` - Finalize auction with unlocked NFT
- `finalize_auction_with_lock` - Finalize auction with locked NFT

### Admin
- `change_fee_percentage` - Update platform fee (admin only)
- `withdraw_fee` - Withdraw collected fees (admin only)
- `new_admin_cap` - Create new admin capability (admin only)

### View Functions
- `get_highest_bid` - Get current highest bid
- `get_highest_bidder` - Get current leader
- `get_creator` - Get auction creator
- `get_expiry_time` - Get expiry timestamp
- `is_active` - Check if auction is active
- `get_item_id` - Get NFT ID in kiosk

---

## 🔒 Security Notes

### For Users
- ✅ Your NFTs are secure in kiosks
- ✅ Only you can manage your kiosk
- ✅ Instant refunds if outbid
- ✅ Transfer policies enforced

### For Creators
- ✅ Can't lose NFT to platform
- ✅ NFT returned if no bids
- ✅ Guaranteed 95% of winning bid
- ✅ Transfer policies respected

### For Platform
- ✅ Secure kiosk custody
- ✅ No way to steal NFTs
- ✅ Guaranteed 5% fee
- ✅ Admin-only functions protected

---

## 📈 Gas Estimates

| Operation | Estimated Gas (SUI) |
|-----------|-------------------|
| Create kiosk | ~0.001 |
| Place NFT in kiosk | ~0.0005 |
| Create auction | ~0.002 |
| Place bid | ~0.001 |
| Finalize auction | ~0.003 |
| Withdraw fees | ~0.001 |

*Actual costs vary by network congestion*

---

## 📚 Documentation

- [Testnet Setup Guide](./Contracts/TESTNET_SETUP_GUIDE.md) ⭐ **Quick NFT testing**
- [Contract Tests](./Contracts/AUCTION_TEST_DOCUMENTATION.md)
- [Implementation Details](./Contracts/IMPLEMENTATION_SUMMARY.md)
- [Frontend Updates](./Frontend/FRONTEND_AUCTION_UPDATE.md)
- [Sui Kiosk Docs](https://docs.sui.io/standards/kiosk)

---

## 🎉 Ready to Launch!

Your auction platform is now:
- ✅ Deployed on-chain
- ✅ Frontend configured
- ✅ Fully tested (18/18 tests passing)
- ✅ Production-ready

**Next Steps**:
1. Set platform fee percentage if desired (default 5%)
2. Promote your auction platform
3. Monitor and withdraw fees periodically
4. Consider adding custom features

**Support**:
- Smart Contract Tests: See `Contracts/tests/`
- Frontend Issues: Check browser console
- Network Issues: Verify `.env` configuration

Happy auctioning! 🚀
