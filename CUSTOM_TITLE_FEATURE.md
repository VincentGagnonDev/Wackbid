# Custom Auction Title Feature

## Overview
Users now have the option to provide a custom title when creating auctions. If no title is provided, the auction will automatically use the NFT's name as the title.

## Changes Made

### Smart Contract (Contracts/sources/auction.move)

1. **Added Title Field to Auction Struct**
   - Added `title: std::string::String` field to store custom titles
   - Imported `std::string::{Self, String}` module

2. **Updated AuctionCreated Event**
   - Added `title: std::string::String` field to the event for indexing

3. **Updated All Auction Creation Functions**
   - `create_auction()` - Now accepts `title: String` parameter
   - `create_auction_from_kiosk()` - Accepts `title: vector<u8>` and converts to String
   - `create_auction_with_lock()` - Now accepts `title: String` parameter
   - `create_auction_from_kiosk_with_lock()` - Accepts `title: vector<u8>` and converts to String

4. **Updated All Finalize Functions**
   - Added `title: _,` to auction destructuring in all 6 finalize functions to match the updated struct

### Frontend (Frontend/src)

1. **Transaction Builder (lib/sui-transactions.ts)**
   - Updated `createAuctionTransaction()` to pass title using `tx.pure.string(title)`
   - Added title parameter to both locked and unlocked auction creation flows

2. **Create Auction Form (components/CreateAuctionForm.tsx)**
   - Updated fallback logic: `title || nftType.split('::').pop() || 'NFT Auction'`
   - Changed helper text to: "Leave empty to use NFT name as title"
   - Title field was already marked as optional

3. **Auction Hooks (hooks/useAuctions.ts)**
   - `useAuctions()`: Now reads title from blockchain with fallback to NFT name
   - `useAuction()`: Now reads title from blockchain with fallback to NFT name
   - Fallback chain: `fields.title || parsedJson.title || nftType.split('::').pop() || 'NFT Auction'`

## User Experience

### Creating an Auction

Users have two options:

1. **Custom Title**: Enter a custom name in the "Auction Title (Optional)" field
   - Example: "My Cool NFT Auction"
   - The custom title will be stored on-chain and displayed everywhere

2. **Default Title**: Leave the field empty
   - The system will automatically use the NFT's type name
   - Example: If NFT type is `0x123::collection::CoolNFT`, title becomes "CoolNFT"

### Display

- Custom or default title is shown on:
  - Auction cards in the listings page
  - Auction detail page
  - All auction-related UI components

## Technical Details

### Title Storage
- Stored as `std::string::String` in the blockchain
- Passed as `vector<u8>` in entry functions and converted internally
- Maximum length: 100 characters (enforced in UI)

### Backward Compatibility
- New field is required in the struct
- **IMPORTANT**: Contract must be redeployed
- Old auctions will not exist after redeployment
- Frontend gracefully handles missing titles with fallback logic

## Deployment Notes

1. Build the updated contract:
   ```bash
   cd Contracts
   sui move build
   ```

2. Deploy to network:
   ```bash
   sui client publish --gas-budget 100000000
   ```

3. Update `Frontend/src/config/constants.ts` with new:
   - `PACKAGE_ID`
   - `AUCTION_HOUSE_ID`
   - `PLATFORM_KIOSK_ID`

4. Frontend will automatically use the new title functionality

## Benefits

- **User Control**: Users can brand their auctions with memorable names
- **Simplicity**: No action required if users prefer auto-naming
- **Discoverability**: Better titles make auctions easier to find and remember
- **On-Chain Storage**: Titles are permanently stored and verifiable
