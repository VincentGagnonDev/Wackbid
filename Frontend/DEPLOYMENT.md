# WackBid Deployment Guide

Complete step-by-step guide to deploy the WackBid auction system.

## Prerequisites

- Sui CLI installed (`sui --version`)
- Sui wallet with sufficient SUI for gas
- Node.js 18+ and npm
- Access to deployer wallet private key

## Part 1: Smart Contract Deployment

### Step 1: Configure Sui Client

```bash
# Check your active address
sui client active-address

# Check balance (need ~1 SUI for deployment)
sui client gas

# If needed, switch environment
sui client switch --env testnet  # or mainnet
```

### Step 2: Build and Test Contracts

```bash
cd Contracts

# Build the contracts
sui move build

# Run tests
sui move test

# Expected: All 12 tests pass
```

### Step 3: Publish Contracts

```bash
# Publish to testnet (or mainnet)
sui client publish --gas-budget 100000000
```

### Step 4: Extract Deployment Information

From the output, find and save these values:

```
----- Transaction Effects ----
Status : Success
Created Objects:
  ┌──
  │ ObjectID: 0xabc123...
  │ Sender: 0x...
  │ Owner: Shared
  │ ObjectType: 0xpackage::auction_house::AuctionHouse
  └──
  ┌──
  │ ObjectID: 0xdef456...
  │ Sender: 0x...
  │ Owner: Shared
  │ ObjectType: 0x2::kiosk::Kiosk
  └──

Mutated Objects:
  ┌──
  │ ObjectID: 0x789...
  │ Owner: Account Address ( 0xyour_address )
  │ ObjectType: 0xpackage::auction_house::AdminCap
  └──

Published Objects:
  ┌──
  │ PackageID: 0xPACKAGE_ID...
  │ Version: 1
  └──
```

**Save these values:**
- `PACKAGE_ID`: From Published Objects
- `AUCTION_HOUSE_ID`: AuctionHouse shared object
- `PLATFORM_KIOSK_ID`: Kiosk shared object
- `ADMIN_CAP_ID`: AdminCap transferred to your address

### Step 5: Verify Deployment

```bash
# Check AuctionHouse object
sui client object <AUCTION_HOUSE_ID>

# Check Platform Kiosk
sui client object <PLATFORM_KIOSK_ID>

# Check AdminCap (should be owned by your address)
sui client object <ADMIN_CAP_ID>
```

## Part 2: Frontend Configuration

### Step 1: Update Environment Variables

```bash
cd Frontend

# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env  # or use your favorite editor
```

Update `.env`:

```env
VITE_NETWORK=testnet  # or mainnet
VITE_PACKAGE_ID=0x...  # From deployment
VITE_AUCTION_HOUSE_ID=0x...  # AuctionHouse shared object
VITE_PLATFORM_KIOSK_ID=0x...  # Kiosk shared object
VITE_ADMIN_CAP_ID=0x...  # AdminCap object
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Test Locally

```bash
# Run development server
npm run dev

# Open browser to http://localhost:5173
```

### Step 4: Test Core Functionality

1. **Connect Wallet**
   - Click "Connect Wallet"
   - Select Sui Wallet
   - Approve connection

2. **Create Test Auction** (if you have NFTs)
   - Go to "Create Auction"
   - Select an NFT from your kiosk
   - Set expiry time
   - Create auction

3. **Place Test Bid**
   - Browse to auction
   - Place a bid
   - Verify transaction succeeds

4. **Test Finalization**
   - Wait for auction to expire (or create short auction)
   - Click "Finalize"
   - Verify NFT transfer and payment

### Step 5: Build for Production

```bash
# Build the app
npm run build

# Test production build locally
npm run preview
```

## Part 3: Production Deployment

### Option A: Vercel

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables:
     - Add all `VITE_*` variables from `.env`
   - Deploy

3. **Update on Vercel Dashboard**
   - Settings → Environment Variables
   - Add production values

### Option B: Netlify

1. **Build the app**
```bash
npm run build
```

2. **Deploy to Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

3. **Configure Environment**
   - Site settings → Environment variables
   - Add all `VITE_*` variables

### Option C: AWS S3 + CloudFront

1. **Build the app**
```bash
npm run build
```

2. **Create S3 Bucket**
```bash
aws s3 mb s3://wackbid-frontend
aws s3 website s3://wackbid-frontend --index-document index.html
```

3. **Upload Files**
```bash
aws s3 sync dist/ s3://wackbid-frontend --delete
```

4. **Setup CloudFront**
   - Create distribution pointing to S3 bucket
   - Configure custom domain
   - Enable HTTPS

## Part 4: Post-Deployment

### Verify Production

1. **Test on Production URL**
   - Connect wallet
   - Create auction
   - Place bid
   - Finalize expired auction

2. **Monitor Transactions**
   - Check Sui Explorer
   - Verify events are emitted
   - Confirm fees are collected

### Configure Platform Fee (Optional)

If you want to change the default 5% fee:

```bash
# Get your AdminCap ID
ADMIN_CAP=<your_admin_cap_id>

# Change fee to 2.5% (250 basis points)
sui client call \
  --package $PACKAGE_ID \
  --module auction_house \
  --function change_fee_percentage \
  --args $ADMIN_CAP $AUCTION_HOUSE_ID 250 \
  --gas-budget 10000000
```

### Withdraw Collected Fees

```bash
# Withdraw SUI fees
sui client call \
  --package $PACKAGE_ID \
  --module auction_house \
  --function withdraw_fee \
  --type-args "0x2::sui::SUI" \
  --args $ADMIN_CAP $AUCTION_HOUSE_ID \
  --gas-budget 10000000
```

## Part 5: Optional - Auction Closer Daemon

The daemon automatically finalizes expired auctions. It's optional since anyone can finalize, but provides better UX.

### Setup Daemon Server

1. **Create separate server** (e.g., DigitalOcean droplet)

2. **Install dependencies**
```bash
git clone <your-repo>
cd Frontend
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Add all configuration
```

4. **Run daemon**
```bash
# Using PM2 for process management
npm install -g pm2
pm2 start "npm run daemon" --name wackbid-daemon
pm2 save
pm2 startup  # Enable on system restart
```

5. **Monitor daemon**
```bash
pm2 logs wackbid-daemon
pm2 status
```

## Troubleshooting

### Deployment Fails

**Problem:** `sui client publish` fails

**Solutions:**
- Ensure sufficient gas (need ~0.5-1 SUI)
- Check you're on correct network
- Verify contracts compile: `sui move build`

### Frontend Can't Find Objects

**Problem:** "Object not found" errors

**Solutions:**
- Double-check object IDs in `.env`
- Verify objects are on correct network
- Use `sui client object <ID>` to verify

### Transactions Failing

**Problem:** Auction creation/bidding fails

**Solutions:**
- Ensure wallet has sufficient SUI
- Verify NFT is in a kiosk
- Check transfer policy exists
- Test on testnet first

### Admin Functions Not Working

**Problem:** Can't change fees or withdraw

**Solutions:**
- Verify you own the AdminCap
- Check AdminCap ID is correct
- Ensure using correct wallet address

## Security Checklist

- [ ] AdminCap secured (not exposed publicly)
- [ ] Environment variables not committed to Git
- [ ] Tested thoroughly on testnet
- [ ] Contract addresses verified
- [ ] Fee percentage set appropriately
- [ ] Monitoring set up for production
- [ ] Backup of deployment details saved securely

## Maintenance

### Updating Contracts

If you need to update contracts:

1. Publish new version
2. Update `PACKAGE_ID` in frontend `.env`
3. Redeploy frontend
4. Migrate data if needed (depends on changes)

### Monitoring

- **Sui Explorer:** Track transactions and events
- **Frontend Logs:** Check console for errors
- **Daemon Logs:** Monitor PM2 logs if using daemon

## Costs

### Initial Deployment
- **Contract Publishing:** ~0.5-1 SUI (one-time)
- **Gas for Operations:** Varies by network

### Ongoing Costs
- **Auction Creation:** ~0.01-0.05 SUI (paid by creator)
- **Bidding:** ~0.01 SUI (paid by bidder)
- **Finalization:** ~0.02-0.05 SUI (paid by finalizer)
- **Daemon Server:** $5-20/month if running (optional)

## Support

If you encounter issues:

1. Check logs: `pm2 logs` or browser console
2. Verify on Sui Explorer
3. Test on testnet first
4. Review contract tests: `sui move test`

## Next Steps

After successful deployment:

1. Announce on social media
2. Create documentation for users
3. Monitor first auctions closely
4. Gather feedback
5. Plan iterative improvements

---

**Congratulations! Your WackBid auction platform is now live! 🎉**
