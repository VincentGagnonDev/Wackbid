# WackBid Frontend - Cleaned & Simplified

A minimal, working NFT auction platform frontend for the new Wackbid smart contracts.

## ✅ What's Included

### Core Features
- ⚡ Browse active auctions
- 💰 Place bids with instant refund mechanism
- 🎯 View auction details
- 🔒 Wallet integration (Sui Wallet)
- ⏱️ Real-time countdown timers

### Pages
1. **Home** (`/`) - Welcome page with quick access
2. **Auctions** (`/auctions`) - Browse all active auctions  
3. **Auction Detail** (`/auction/:id`) - View and bid on specific auction

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Required
- Node.js 18+
- npm or yarn
- Sui Wallet browser extension

# Deployed Smart Contracts
- Package ID
- AuctionHouse ID
- Platform Kiosk ID
```

### 2. Installation
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 3. Configuration

Edit `.env` with your deployed contract addresses:

```env
VITE_NETWORK=testnet  # or mainnet

# Update these after deploying contracts
VITE_PACKAGE_ID=0x...
VITE_AUCTION_HOUSE_ID=0x...
VITE_PLATFORM_KIOSK_ID=0x...
VITE_ADMIN_CAP_ID=0x...  # Optional - for admin functions
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Build for Production
```bash
npm run build
npm run preview  # Test production build locally
```

## 📝 How to Deploy Contracts

Before running the frontend, you MUST deploy the smart contracts:

```bash
cd ../Contracts

# Build
sui move build

# Test (optional but recommended)
sui move test

# Deploy to testnet
sui client publish --gas-budget 100000000

# Save the output!
# You'll need:
# - Package ID
# - AuctionHouse shared object ID
# - Kiosk shared object ID  
# - AdminCap object ID
```

Then update your `.env` file with these IDs.

## 🏗️ Project Structure

```
src/
├── components/        # UI components
│   └── layout/       # Layout components (Navbar, etc.)
├── pages/            # Route pages
│   ├── HomePage.tsx
│   ├── AuctionsPage.tsx
│   └── AuctionDetailPage.tsx
├── hooks/            # React hooks
│   ├── useAuctions.ts     # Fetch auctions
│   └── useUserNFTs.ts     # Fetch user's NFTs
├── lib/              # Utilities
│   └── sui-transactions.ts  # Smart contract interactions
├── config/           # Configuration
│   ├── constants.ts  # Contract addresses
│   └── networks.ts   # Network configuration
├── types/            # TypeScript types
│   └── auction.ts
└── App.tsx           # Main app component
```

## 🔧 Key Files

### `src/config/constants.ts`
Contains all contract addresses and configuration. **Update this after deployment!**

### `src/lib/sui-transactions.ts`
Functions for interacting with smart contracts:
- `createAuctionTransaction()` - Create new auction
- `placeBidTransaction()` - Place a bid
- `finalizeAuctionTransaction()` - Finalize expired auction
- Helper functions for formatting and calculations

### `src/hooks/useAuctions.ts`  
React hooks for fetching auction data from the blockchain.

## 💡 Usage Examples

### Fetching Auctions
```typescript
import { useAuctions } from './hooks/useAuctions';

function MyComponent() {
  const { data: auctions, isLoading } = useAuctions();
  
  return (
    <div>
      {auctions?.map(auction => (
        <div key={auction.id}>{auction.title}</div>
      ))}
    </div>
  );
}
```

### Placing a Bid
```typescript
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { placeBidTransaction, suiToMist } from './lib/sui-transactions';

function BidButton({ auctionId, bidAmount }: Props) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const handleBid = () => {
    const tx = placeBidTransaction(
      auctionId,
      suiToMist(bidAmount)
    );
    
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => console.log('Bid placed!'),
        onError: (error) => console.error(error),
      }
    );
  };
  
  return <button onClick={handleBid}>Place Bid</button>;
}
```

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Testing Locally
1. Deploy contracts to testnet
2. Update `.env` with contract IDs
3. Run `npm run dev`
4. Connect Sui Wallet
5. Test auction creation and bidding

## 🔍 Troubleshooting

### "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Contract not deployed" errors
- Check `.env` file has correct contract addresses
- Verify contracts are deployed on the network you're using
- Ensure `VITE_NETWORK` matches your deployment

### Transactions failing
- Ensure sufficient SUI balance for gas
- Verify wallet is connected
- Check contract addresses are correct
- Test on testnet first

### No auctions showing
- Contracts must be deployed first
- Check browser console for errors
- Verify `PACKAGE_ID` is correct
- Auctions are fetched from events - there must be auctions created first

## 📚 Documentation

- **Smart Contracts**: See `../Contracts/README.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Test Documentation**: See `../Contracts/TEST_DOCUMENTATION.md`

## 🎨 Customization

### Modify Theme
Edit `src/App.tsx`:
```typescript
const wackbidTheme: ThemeVars = {
  ...lightTheme,
  backgroundColors: {
    ...lightTheme.backgroundColors,
    primaryButton: '#YOUR_COLOR',
  },
};
```

### Add New Pages
1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Update navigation in `src/components/layout/Navbar.tsx`

## ⚠️ Important Notes

### Before Running
- [ ] Smart contracts MUST be deployed
- [ ] `.env` MUST be configured with real contract IDs
- [ ] Sui Wallet extension MUST be installed
- [ ] Must have SUI for gas fees

### Security
- Never commit `.env` with real values
- AdminCap should be kept secure
- Test thoroughly on testnet first

### Features Removed
This version has been simplified and no longer includes:
- ❌ Dashboard statistics (no dashboard contract)
- ❌ User statistics (no user stats contract)
- ❌ Leaderboards (no leaderboard contract)
- ❌ Activity feeds

These were removed because they referenced contracts that don't exist in the new system. The core auction functionality remains intact.

## 🚦 Current Status

✅ **Working**:
- Auction browsing
- Placing bids
- Auction details
- Wallet connection
- Real-time updates

⚠️ **Requires Setup**:
- Contract deployment
- Environment configuration

❌ **Not Included**:
- NFT creation UI (use external tools)
- Admin dashboard (use CLI for admin functions)
- Advanced statistics

## 📦 Dependencies

Main dependencies:
- `react` & `react-dom` - UI framework
- `@mysten/dapp-kit` - Sui wallet integration
- `@mysten/sui` - Sui blockchain interactions
- `@tanstack/react-query` - Data fetching
- `react-router-dom` - Routing
- `tailwindcss` - Styling

## 🤝 Next Steps

After getting the frontend running:

1. **Test Core Flow**:
   - Create auction with NFT
   - Place bid
   - Get outbid (instant refund)
   - Finalize expired auction

2. **Customize UI**:
   - Update branding
   - Modify colors/theme
   - Add your own components

3. **Add Features**:
   - NFT metadata display
   - Auction creation UI
   - User profile pages

4. **Deploy to Production**:
   - Build: `npm run build`
   - Deploy `dist/` folder to hosting
   - Set environment variables on host

## 📞 Support

If you encounter issues:
1. Check this README
2. Verify contract deployment
3. Check browser console for errors
4. Review `DEPLOYMENT.md`

---

**Status**: ✅ Cleaned & Ready to Use  
**Version**: Simplified for new smart contracts  
**Last Updated**: 2025-10-20

Ready to start auctioning! 🎉
