import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { KioskClient } from '@mysten/kiosk';
import { 
  PACKAGE_ID, 
  AUCTION_HOUSE_ID, 
  PLATFORM_KIOSK_ID, 
  CLOCK_OBJECT_ID, 
  PLATFORM_FEE_BPS, 
  BPS_DIVISOR,
  NETWORK 
} from '../config/constants';
import type { BidBreakdown } from '../types/auction';

/**
 * Find TransferPolicy for a given NFT type
 */
export async function findTransferPolicy(
  nftType: string, 
  client: SuiClient
): Promise<string | null> {
  try {
    console.log(`🔍 Searching for TransferPolicy for type: ${nftType}`);
    
    const response = await client.queryEvents({
      query: {
        MoveEventType: `0x2::transfer_policy::TransferPolicyCreated<${nftType}>`
      },
      limit: 1,
      order: 'descending'
    });
    
    if (response.data && response.data.length > 0) {
      const policyId = (response.data[0].parsedJson as any)?.id;
      if (policyId) {
        console.log(`✅ Found TransferPolicy: ${policyId}`);
        return policyId;
      }
    }
    
    console.log('⚠️  No TransferPolicy found - NFT may not have transfer restrictions');
    return null;
  } catch (error) {
    console.error('Error finding TransferPolicy:', error);
    return null;
  }
}

/**
 * Create a new auction
 * @param nftObjectId - The ID of the NFT to auction
 * @param nftType - Full type of the NFT
 * @param minimumBid - Minimum bid in MIST (not used in contract but for UI)
 * @param expiryTime - Unix timestamp in milliseconds
 * @param title - Auction title (not used in contract but for UI)
 * @param kioskData - User's kiosk info {kioskId, kioskOwnerCapId}
 * @param transferPolicyId - Optional transfer policy ID for locked NFTs
 */
export function createAuctionTransaction(
  nftObjectId: string,
  nftType: string,
  minimumBid: number,
  expiryTime: number,
  title: string,
  kioskData: { kioskId: string; kioskOwnerCapId: string },
  transferPolicyId?: string
): Transaction {
  const tx = new Transaction();

  if (!AUCTION_HOUSE_ID || AUCTION_HOUSE_ID === 'TO_BE_DEPLOYED') {
    throw new Error('Auction House not deployed. Please deploy contracts first.');
  }

  if (!PLATFORM_KIOSK_ID || PLATFORM_KIOSK_ID === 'TO_BE_DEPLOYED') {
    throw new Error('Platform Kiosk not deployed. Please deploy contracts first.');
  }

  // Step 1: Create the auction using entry functions
  console.log('📦 Transaction arguments:', {
    auctionHouse: AUCTION_HOUSE_ID,
    userKiosk: kioskData.kioskId,
    userKioskCap: kioskData.kioskOwnerCapId,
    platformKiosk: PLATFORM_KIOSK_ID,
    nftObjectId,
    expiryTime,
  });

  if (transferPolicyId) {
    console.log('🔒 Creating auction with locked NFT (entry function)');
    tx.moveCall({
      target: `${PACKAGE_ID}::auction::create_auction_from_kiosk_with_lock`,
      typeArguments: [nftType, '0x2::sui::SUI'], // T, CoinType
      arguments: [
        tx.object(AUCTION_HOUSE_ID),              // &AuctionHouse (shared)
        tx.object(kioskData.kioskId),             // &mut Kiosk (shared)
        tx.object(kioskData.kioskOwnerCapId),     // KioskOwnerCap (taken by value, consumed)
        tx.object(PLATFORM_KIOSK_ID),             // &mut Kiosk (shared)
        tx.object(transferPolicyId),              // &TransferPolicy<T> (shared)
        tx.pure.id(nftObjectId),                  // ID (pure value)
        tx.pure.u64(expiryTime),                  // u64 (pure value)
        tx.pure.string(title),                    // vector<u8> title
        tx.object(CLOCK_OBJECT_ID),               // &Clock (shared)
      ],
    });
  } else {
    console.log('📦 Creating auction with unlocked NFT (entry function)');
    tx.moveCall({
      target: `${PACKAGE_ID}::auction::create_auction_from_kiosk`,
      typeArguments: [nftType, '0x2::sui::SUI'], // T, CoinType
      arguments: [
        tx.object(AUCTION_HOUSE_ID),              // &AuctionHouse (shared)
        tx.object(kioskData.kioskId),             // &mut Kiosk (shared)
        tx.object(kioskData.kioskOwnerCapId),     // KioskOwnerCap (taken by value, consumed)
        tx.object(PLATFORM_KIOSK_ID),             // &mut Kiosk (shared)
        tx.pure.id(nftObjectId),                  // ID (pure value)
        tx.pure.u64(expiryTime),                  // u64 (pure value)
        tx.pure.string(title),                    // vector<u8> title
        tx.object(CLOCK_OBJECT_ID),               // &Clock (shared)
      ],
    });
  }

  return tx;
}

/**
 * Place a bid on an auction
 * @param auctionId - The auction object ID
 * @param bidAmount - Bid amount in MIST
 * @param nftType - Full type of the NFT (required for type safety)
 */
export function placeBidTransaction(
  auctionId: string,
  bidAmount: string,
  nftType: string
): Transaction {
  const tx = new Transaction();

  // Split coins for the bid
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(bidAmount)]);

  // MUST provide type arguments for place_bid to work
  tx.moveCall({
    target: `${PACKAGE_ID}::auction::place_bid`,
    typeArguments: [nftType, '0x2::sui::SUI'], // T, CoinType
    arguments: [
      tx.object(auctionId),
      coin,
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

/**
 * Finalize an auction with automatic kiosk creation for winner (RECOMMENDED)
 * Creates a new kiosk for the winner if they won
 * For no-bid auctions, returns NFT to creator's wallet
 * Can be called by ANYONE after auction expires
 * @param auctionId - The auction object ID
 * @param nftType - Full type of the NFT
 * @param creatorKioskId - NOT USED (kept for compatibility)
 * @param creatorKioskCapId - NOT USED (kept for compatibility)
 * @param transferPolicyId - Optional transfer policy ID for locked NFTs
 * @param hasBids - NOT USED (kept for compatibility)
 */
export function finalizeAuctionTransaction(
  auctionId: string,
  nftType: string,
  creatorKioskId?: string,
  creatorKioskCapId?: string,
  transferPolicyId?: string,
  hasBids: boolean = true
): Transaction {
  const tx = new Transaction();

  if (!AUCTION_HOUSE_ID || AUCTION_HOUSE_ID === 'TO_BE_DEPLOYED') {
    throw new Error('Auction House not deployed. Please deploy contracts first.');
  }

  if (!PLATFORM_KIOSK_ID || PLATFORM_KIOSK_ID === 'TO_BE_DEPLOYED') {
    throw new Error('Platform Kiosk not deployed. Please deploy contracts first.');
  }

  console.log('🎯 Finalizing auction:', {
    auctionId,
    transferPolicyId: transferPolicyId || 'none',
  });

  // Use finalize_and_create_kiosk functions
  // Winner gets new kiosk, no-bid returns to creator's wallet
  if (transferPolicyId) {
    tx.moveCall({
      target: `${PACKAGE_ID}::auction::finalize_and_create_kiosk_with_lock`,
      typeArguments: [nftType, '0x2::sui::SUI'], // T, CoinType
      arguments: [
        tx.object(AUCTION_HOUSE_ID),
        tx.object(PLATFORM_KIOSK_ID),
        tx.object(auctionId),
        tx.object(transferPolicyId),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
  } else {
    tx.moveCall({
      target: `${PACKAGE_ID}::auction::finalize_and_create_kiosk`,
      typeArguments: [nftType, '0x2::sui::SUI'], // T, CoinType
      arguments: [
        tx.object(AUCTION_HOUSE_ID),
        tx.object(PLATFORM_KIOSK_ID),
        tx.object(auctionId),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
  }

  return tx;
}

/**
 * LEGACY: Finalize to wallet (not recommended - NFT goes to wallet instead of kiosk)
 * Use finalizeAuctionTransaction instead for proper kiosk handling
 */
export function finalizeAuctionToWalletTransaction(
  auctionId: string,
  nftType: string,
  transferPolicyId?: string
): Transaction {
  const tx = new Transaction();

  if (!AUCTION_HOUSE_ID || AUCTION_HOUSE_ID === 'TO_BE_DEPLOYED') {
    throw new Error('Auction House not deployed. Please deploy contracts first.');
  }

  if (!PLATFORM_KIOSK_ID || PLATFORM_KIOSK_ID === 'TO_BE_DEPLOYED') {
    throw new Error('Platform Kiosk not deployed. Please deploy contracts first.');
  }

  console.warn('⚠️  Using legacy wallet finalization - NFT will not be in a kiosk');

  if (transferPolicyId) {
    tx.moveCall({
      target: `${PACKAGE_ID}::auction::finalize_to_wallet_with_lock`,
      typeArguments: [nftType, '0x2::sui::SUI'],
      arguments: [
        tx.object(AUCTION_HOUSE_ID),
        tx.object(PLATFORM_KIOSK_ID),
        tx.object(auctionId),
        tx.object(transferPolicyId),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
  } else {
    tx.moveCall({
      target: `${PACKAGE_ID}::auction::finalize_to_wallet`,
      typeArguments: [nftType, '0x2::sui::SUI'],
      arguments: [
        tx.object(AUCTION_HOUSE_ID),
        tx.object(PLATFORM_KIOSK_ID),
        tx.object(auctionId),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
  }

  return tx;
}

/**
 * Calculate bid breakdown with platform fee (5%)
 */
export function calculateBidBreakdown(bidAmount: number): BidBreakdown {
  const totalMist = Math.floor(bidAmount * 1_000_000_000);
  const feeMist = Math.floor((totalMist * PLATFORM_FEE_BPS) / BPS_DIVISOR);
  const netMist = totalMist - feeMist;

  return {
    totalAmount: bidAmount,
    platformFee: feeMist / 1_000_000_000,
    netBid: netMist / 1_000_000_000,
  };
}

/**
 * Convert SUI to MIST (1 SUI = 1_000_000_000 MIST)
 */
export function suiToMist(sui: number): string {
  return Math.floor(sui * 1_000_000_000).toString();
}

/**
 * Convert MIST to SUI
 */
export function mistToSui(mist: string | number): number {
  return Number(mist) / 1_000_000_000;
}

/**
 * Format SUI amount with proper decimals
 */
export function formatSui(mist: string | number, decimals: number = 4): string {
  const sui = mistToSui(mist);
  return sui.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

/**
 * Check if auction has ended
 */
export function hasAuctionEnded(endTime: number): boolean {
  return Date.now() >= endTime;
}

/**
 * Find user's kiosk and kiosk cap
 * Returns the first kiosk found owned by the user
 */
export async function findUserKiosk(
  userAddress: string,
  client: SuiClient
): Promise<{ kioskId: string; kioskCapId: string } | null> {
  try {
    console.log('🔍 Finding kiosk for user:', userAddress);

    // Find KioskOwnerCap owned by user
    const ownedObjects = await client.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: '0x2::kiosk::KioskOwnerCap'
      },
      options: {
        showContent: true,
        showType: true,
      }
    });

    if (ownedObjects.data.length === 0) {
      console.log('⚠️  No kiosk found for user');
      return null;
    }

    // Get the first kiosk cap
    const kioskCapObj = ownedObjects.data[0];
    const kioskCapId = kioskCapObj.data?.objectId;

    if (!kioskCapId) {
      console.log('⚠️  Kiosk cap has no object ID');
      return null;
    }

    // Extract the kiosk ID from the kiosk cap content
    const content = kioskCapObj.data?.content;
    if (content && 'fields' in content) {
      const fields = content.fields as any;
      const kioskId = fields.for;

      if (kioskId) {
        console.log('✅ Found kiosk:', { kioskId, kioskCapId });
        return { kioskId, kioskCapId };
      }
    }

    console.log('⚠️  Could not extract kiosk ID from cap');
    return null;
  } catch (error) {
    console.error('Error finding user kiosk:', error);
    return null;
  }
}

/**
 * Get time remaining for auction
 */
export function getTimeRemaining(endTime: number): number {
  return Math.max(0, endTime - Date.now());
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(endTime: number): string {
  const remaining = getTimeRemaining(endTime);
  
  if (remaining === 0) return 'Ended';
  
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Create a user kiosk using the auction_house helper function
 * Returns a transaction that will create and share a new kiosk
 */
export function createUserKioskTransaction(): Transaction {
  const tx = new Transaction();

  if (!PACKAGE_ID || PACKAGE_ID === 'TO_BE_DEPLOYED') {
    throw new Error('Package not deployed. Please deploy contracts first.');
  }

  tx.moveCall({
    target: `${PACKAGE_ID}::auction_house::create_user_kiosk_and_transfer`,
    arguments: [],
  });

  return tx;
}

/**
 * Local storage functions for auction titles
 */
export function getAuctionTitle(auctionId: string): string | null {
  try {
    const titles = JSON.parse(localStorage.getItem('auctionTitles') || '{}');
    return titles[auctionId] || null;
  } catch {
    return null;
  }
}

export function setAuctionTitle(auctionId: string, title: string): void {
  try {
    const titles = JSON.parse(localStorage.getItem('auctionTitles') || '{}');
    titles[auctionId] = title;
    localStorage.setItem('auctionTitles', JSON.stringify(titles));
  } catch (error) {
    console.warn('Could not save auction title:', error);
  }
}

/**
 * Check if user has a kiosk
 */
export async function getUserKiosk(
  address: string,
  client: SuiClient
): Promise<{ kioskId: string; capId: string } | null> {
  try {
    const kioskClient = new KioskClient({
      client,
      network: NETWORK as 'mainnet' | 'testnet' | 'devnet',
    });
    
    const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({ address });
    
    if (kioskOwnerCaps.length > 0) {
      return {
        kioskId: kioskOwnerCaps[0].kioskId,
        capId: kioskOwnerCaps[0].objectId,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user kiosk:', error);
    return null;
  }
}

/**
 * Finalize auction - NFT goes to winner's wallet
 * Can be called by ANYONE after expiry
 */
export function finalizeToWalletTransaction(
  auctionId: string,
  nftType: string,
  transferPolicyId?: string
): Transaction {
  const tx = new Transaction();

  if (!AUCTION_HOUSE_ID || AUCTION_HOUSE_ID === 'TO_BE_DEPLOYED') {
    throw new Error('Auction House not deployed. Please deploy contracts first.');
  }

  if (!PLATFORM_KIOSK_ID || PLATFORM_KIOSK_ID === 'TO_BE_DEPLOYED') {
    throw new Error('Platform Kiosk not deployed. Please deploy contracts first.');
  }

  if (transferPolicyId) {
    tx.moveCall({
      target: `${PACKAGE_ID}::auction::finalize_auction_with_lock`,
      typeArguments: [nftType, '0x2::sui::SUI'],
      arguments: [
        tx.object(AUCTION_HOUSE_ID),
        tx.object(PLATFORM_KIOSK_ID),
        tx.object(auctionId),
        tx.object(transferPolicyId),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
  } else {
    tx.moveCall({
      target: `${PACKAGE_ID}::auction::finalize_to_wallet`,
      typeArguments: [nftType, '0x2::sui::SUI'],
      arguments: [
        tx.object(AUCTION_HOUSE_ID),
        tx.object(PLATFORM_KIOSK_ID),
        tx.object(auctionId),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
  }

  return tx;
}

/**
 * Finalize auction - NFT goes to winner's kiosk
 * Can only be called by winner (must provide kiosk)
 */
export function finalizeToKioskTransaction(
  auctionId: string,
  nftType: string,
  winnerKioskId: string,
  winnerKioskCapId: string,
  transferPolicyId?: string
): Transaction {
  const tx = new Transaction();

  if (!AUCTION_HOUSE_ID || AUCTION_HOUSE_ID === 'TO_BE_DEPLOYED') {
    throw new Error('Auction House not deployed. Please deploy contracts first.');
  }

  if (!PLATFORM_KIOSK_ID || PLATFORM_KIOSK_ID === 'TO_BE_DEPLOYED') {
    throw new Error('Platform Kiosk not deployed. Please deploy contracts first.');
  }

  if (transferPolicyId) {
    tx.moveCall({
      target: `${PACKAGE_ID}::auction::finalize_to_kiosk_with_lock`,
      typeArguments: [nftType, '0x2::sui::SUI'],
      arguments: [
        tx.object(AUCTION_HOUSE_ID),
        tx.object(PLATFORM_KIOSK_ID),
        tx.object(auctionId),
        tx.object(winnerKioskId),
        tx.object(winnerKioskCapId),
        tx.object(transferPolicyId),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
  } else {
    tx.moveCall({
      target: `${PACKAGE_ID}::auction::finalize_to_kiosk`,
      typeArguments: [nftType, '0x2::sui::SUI'],
      arguments: [
        tx.object(AUCTION_HOUSE_ID),
        tx.object(PLATFORM_KIOSK_ID),
        tx.object(auctionId),
        tx.object(winnerKioskId),
        tx.object(winnerKioskCapId),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
  }

  return tx;
}



