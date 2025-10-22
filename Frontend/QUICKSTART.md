# 🚀 Quick Start Guide

Get the WackBid frontend running in 5 minutes!

## Prerequisites Check

Before starting, make sure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Sui CLI installed (`sui --version`)
- [ ] Sui Wallet browser extension installed
- [ ] ~1 SUI for deployment (testnet faucet: https://faucet.testnet.sui.io/)

## Step 1: Deploy Smart Contracts (5 min)

```bash
# Navigate to contracts
cd Contracts

# Build contracts
sui move build

# Run tests (should see 12/12 passing)
sui move test

# Deploy to testnet
sui client publish --gas-budget 100000000
```

**Important**: Save these IDs from the output:
```
Published Objects:
  PackageID: 0xABC123...  ← Save this

Created Objects:
  AuctionHouse: 0xDEF456...  ← Save this (type: auction_house::AuctionHouse)
  Kiosk: 0x789ABC...  ← Save this (type: kiosk::Kiosk)

Transferred Objects:
  AdminCap: 0x012DEF...  ← Save this
```

## Step 2: Configure Frontend (1 min)

```bash
# Navigate to frontend
cd ../Frontend

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your favorite editor
```

Update `.env` with your saved IDs:
```env
VITE_NETWORK=testnet
VITE_PACKAGE_ID=0xABC123...      # From Step 1
VITE_AUCTION_HOUSE_ID=0xDEF456... # From Step 1
VITE_PLATFORM_KIOSK_ID=0x789ABC... # From Step 1
VITE_ADMIN_CAP_ID=0x012DEF...     # From Step 1
```

## Step 3: Install & Run (2 min)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser!

## Step 4: Connect Wallet

1. Click "Connect Wallet" button
2. Select Sui Wallet
3. Approve connection
4. You're ready!

## Step 5: Test It Out

### View Auctions
- Go to "Auctions" page
- Should be empty initially (no auctions created yet)

### Create Test Auction (if you have NFTs)
If you have NFTs in your wallet:
1. They will appear in the create auction interface
2. Select an NFT
3. Set expiry time (e.g., 1 hour from now)
4. Click "Create Auction"
5. Sign transaction

### Place a Bid
1. Go to an auction
2. Enter bid amount (must be higher than current)
3. Click "Place Bid"
4. Sign transaction
5. Watch for instant refund if someone outbids you!

## Troubleshooting

### "Cannot find package" error
```bash
# Make sure you're in Frontend directory
cd Frontend
npm install
```

### "Contract not deployed" error
- Check `.env` has correct IDs
- Verify `PACKAGE_ID` is not "TO_BE_DEPLOYED"
- Make sure you deployed to the same network (testnet/mainnet)

### No auctions showing
- Auctions are fetched from events
- If no auctions created yet, page will be empty
- Try creating one!

### Transaction fails
- Check SUI balance (need SUI for gas)
- Verify wallet is connected
- Make sure auction hasn't expired (for bids)

## Quick Commands

```bash
# Development
npm run dev          # Start dev server

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Maintenance
npm run lint         # Check code quality
```

## What's Next?

### Customize
- Edit theme colors in `src/App.tsx`
- Modify components in `src/components/`
- Add your branding

### Deploy
1. Build: `npm run build`
2. Upload `dist/` folder to:
   - Vercel (recommended)
   - Netlify
   - AWS S3
   - Any static hosting

### Extend
- Add user profiles
- Create admin dashboard
- Build mobile app
- Add analytics

## File Structure

```
Frontend/
├── src/
│   ├── pages/          # 3 pages
│   │   ├── HomePage.tsx
│   │   ├── AuctionsPage.tsx
│   │   └── AuctionDetailPage.tsx
│   ├── hooks/          # 2 hooks
│   │   ├── useAuctions.ts
│   │   └── useUserNFTs.ts
│   └── lib/            # 1 core library
│       └── sui-transactions.ts
├── .env               # Your config (create from .env.example)
└── package.json       # Dependencies
```

## Need Help?

Check these docs:
- `README.md` - Full documentation
- `CLEANUP_SUMMARY.md` - What was changed
- `DEPLOYMENT.md` - Detailed deployment guide
- `../Contracts/README.md` - Smart contract docs

## Success Checklist

- [x] Contracts deployed
- [x] `.env` configured  
- [x] `npm install` completed
- [x] `npm run dev` running
- [x] Browser open at localhost:5173
- [x] Wallet connected
- [x] Ready to auction!

---

**Total Time**: ~10 minutes  
**Complexity**: Beginner-friendly  
**Support**: Check documentation files

🎉 **You're all set! Start auctioning NFTs!**
