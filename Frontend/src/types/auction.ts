export interface Auction {
  id: string;
  title: string;
  description: string;
  creator: string;
  item_id: string;              // NFT ID in platform kiosk
  nft_type: string;             // Full NFT type
  highest_bid: number;          // In MIST
  highest_bidder: string | null;
  expiry_time: number;          // Unix timestamp in milliseconds
  is_active: boolean;
  imageUrl?: string;
}

export interface Bid {
  auctionId: string;
  bidder: string;
  amount: number;               // Full bid amount in MIST
  timestamp: number;
}

export interface BidBreakdown {
  totalAmount: number;          // Full bid amount in SUI
  platformFee: number;          // 5% fee in SUI
  netBid: number;               // 95% actual bid in SUI
}

export interface DashboardStats {
  totalAuctionsCreated: number;
  activeAuctionsCount: number;
  closedAuctionsCount: number;
  totalSuiProcessed: number; // In MIST
  totalSuiProcessedFormatted: string; // In SUI
}

export interface User {
  address: string;
  bids: Bid[];
  auctions: string[];
}

// Event Types from our contracts
export interface AuctionCreatedEvent {
  auction_id: string;
  item_id: string;
  creator: string;
  expiry_time: number;
}

export interface BidPlacedEvent {
  auction_id: string;
  bidder: string;
  bid_amount: number;
  previous_bidder: string | null;
}

export interface AuctionFinalizedEvent {
  auction_id: string;
  winner: string | null;
  final_bid: number;
  creator_received: number;
  fee_collected: number;
}
