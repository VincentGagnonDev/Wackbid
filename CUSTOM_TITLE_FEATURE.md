# Custom Auction Title Feature - UPDATED

## Overview
Users now have the option to provide a custom title when creating auctions. If no title is provided, the auction will automatically use the NFT's name (from metadata) or NFT type name as the title.

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
   - Added `title: _,` to auction destructuring in all 7 finalize functions to match the updated struct

### Frontend (Frontend/src)

1. **Transaction Builder (lib/sui-transactions.ts)**
   - Updated `createAuctionTransaction()` to pass title using `tx.pure.string(title)`
   - Added title parameter to both locked and unlocked auction creation flows

2. **Create Auction Form (components/CreateAuctionForm.tsx)**
   - Updated fallback logic: `title || nftType.split('::').pop() || 'NFT Auction'`
   - Changed helper text to: "Leave empty to use NFT name as title"
   - Title field is marked as optional

3. **Create Auction Modal (components/auctions/CreateAuctionModal.tsx)** ⭐ KEY FIX
   - **Removed validation** that required title to be non-empty
   - Added automatic title generation with fallback chain:
     - User's custom title (if provided)
     - NFT's name from metadata (if available)
     - NFT type name (extracted from type string)
     - Default: "NFT Auction"
   - Updated label to "Auction Title (Optional)"
   - Updated placeholder to show what name will be used if left empty
   - Updated help text to clarify the auto-naming behavior

4. **Auction Hooks (hooks/useAuctions.ts)**
   - `useAuctions()`: Now reads title from blockchain with fallback to NFT name
   - `useAuction()`: Now reads title from blockchain with fallback to NFT name
   - Fallback chain: `fields.title || parsedJson.title || nftType.split('::').pop() || 'NFT Auction'`

## User Experience

### Creating an Auction

Users have two options:

1. **Custom Title**: Enter a custom name in the "Auction Title (Optional)" field
   - Example: "My Cool NFT Auction"
   - The custom title will be stored on-chain and displayed everywhere

2. **Default Title**: Leave the field empty ⭐ NOW WORKS!
   - The system will automatically use:
     1. NFT's name from metadata (if available)
     2. NFT's type name (e.g., "CoolNFT" from `0x123::collection::CoolNFT`)
     3. Fallback: "NFT Auction"
   - The placeholder shows what name will be used

### Display

- Custom or auto-generated title is shown on:
  - Auction cards in the listings page
  - Auction detail page
  - All auction-related UI components

## Technical Details

### Title Generation Priority
1. **User Input**: Custom title entered in the form
2. **NFT Metadata**: `nft.name` field from on-chain object
3. **Type Name**: Last segment of NFT type (e.g., `CoolNFT` from `0x123::collection::CoolNFT`)
4. **Fallback**: "NFT Auction"

### Title Storage
- Stored as `std::string::String` in the blockchain
- Passed as `vector<u8>` in entry functions and converted internally
- Maximum length: 100 characters (enforced in UI)

### Backward Compatibility
- New field is required in the struct
- **IMPORTANT**: Contract must be redeployed
- Old auctions will not exist after redeployment
- Frontend gracefully handles missing titles with fallback logic

## Bug Fix

**Issue**: The form validation required the title field to be non-empty, preventing users from leaving it blank.

**Fix**: 
- Removed `!auctionTitle.trim()` from validation check
- Added `finalTitle` variable that generates the title with proper fallback logic
- Updated UI to clearly indicate the field is optional and show what name will be used

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

4. Frontend changes are complete - no additional configuration needed

## Benefits

- **User Control**: Users can brand their auctions with memorable names
- **Simplicity**: No action required - the field is truly optional now ✅
- **Smart Defaults**: Automatically uses NFT name or type for better UX
- **Discoverability**: Better titles make auctions easier to find and remember
- **On-Chain Storage**: Titles are permanently stored and verifiable
- **Clear UI**: Placeholder and help text show exactly what will happen
