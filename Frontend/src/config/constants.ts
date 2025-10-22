// Sui Move Package Configuration
// Updated for new Wackbid Auction System

export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0xc22a0a2591d0128ae3a218d9c5eb9b45880f53b83adc62cfee4ddeb9a256f058';

// New Auction System - Auction House & Kiosk IDs
// These are shared objects created during contract initialization
export const AUCTION_HOUSE_ID = import.meta.env.VITE_AUCTION_HOUSE_ID || '0x12e3a4d30d6e3e50f39ba2f9dc2d9d6154ad01e29e8ead70b1e5e1a5da3e8c39';
export const PLATFORM_KIOSK_ID = import.meta.env.VITE_PLATFORM_KIOSK_ID || '0x3ae7d4d3ed47f05bb9c22cf25bd5c45bb16a41eda50d9a3f939ee5c9b7a93c51';

// Admin capability (transferred to deployer on init)
export const ADMIN_CAP_ID = import.meta.env.VITE_ADMIN_CAP_ID || '0x8a422da7d416075d026b0a357a8430ae245a6da55a23bbd0b6ed03fa6ebd80e5';

// Network configuration
export const NETWORK = import.meta.env.VITE_NETWORK || 'mainnet';

// Sui Clock Object ID (shared object on all networks)
export const CLOCK_OBJECT_ID = '0x6';

// Fee constants - 5% platform fee (500 basis points)
export const PLATFORM_FEE_BPS = 500; // 5% = 500 basis points
export const BPS_DIVISOR = 10000;

// Module names
export const MODULES = {
  AUCTION_HOUSE: `${PACKAGE_ID}::auction_house`,
  AUCTION: `${PACKAGE_ID}::auction`,
} as const;

// Function names for Auction House
export const FUNCTIONS = {
  // Auction House Admin functions
  CHANGE_FEE_PERCENTAGE: 'change_fee_percentage',
  NEW_ADMIN_CAP: 'new_admin_cap',
  WITHDRAW_FEE: 'withdraw_fee',
  
  // Auction functions
  CREATE_AUCTION: 'create_auction',
  CREATE_AUCTION_WITH_LOCK: 'create_auction_with_lock',
  PLACE_BID: 'place_bid',
  FINALIZE_AUCTION: 'finalize_auction',
  FINALIZE_AUCTION_WITH_LOCK: 'finalize_auction_with_lock',
  
  // View functions
  GET_HIGHEST_BID: 'get_highest_bid',
  GET_HIGHEST_BIDDER: 'get_highest_bidder',
  GET_CREATOR: 'get_creator',
  GET_EXPIRY_TIME: 'get_expiry_time',
  IS_ACTIVE: 'is_active',
  GET_ITEM_ID: 'get_item_id',
} as const;
