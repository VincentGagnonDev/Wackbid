import { useQuery } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';
import { KioskClient, Network } from '@mysten/kiosk';
import { NETWORK } from '../config/constants';

export interface UserNFT {
  objectId: string;
  type: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  isInKiosk?: boolean;
  kioskId?: string;
  kioskOwnerCapId?: string;
  isLocked?: boolean; // NEW: indicates if item is locked in kiosk
  isListed?: boolean; // NEW: indicates if item is listed for sale
}

/**
 * List of type patterns to exclude from NFT selection
 * These are system objects, capabilities, and other non-NFT assets
 */
const EXCLUDED_TYPE_PATTERNS = [
  // Coins and tokens
  '0x2::coin::Coin',
  '::token::Token',
  '::balance::Balance',
  '::supply::Supply',
  
  // System packages and capabilities
  '0x2::package::',
  'UpgradeCap',
  'Publisher',
  'TreasuryCap',
  'Treasury',
  
  // Capability objects (AdminCap, WhitelistCap, MintCap, etc.)
  'Cap>', // Matches any type ending with Cap>
  'Cap<', // Matches any type with Cap<
  
  // Table and dynamic field objects
  '0x2::table::',
  '0x2::dynamic_field::',
  '0x2::dynamic_object_field::',
  
  // Auction system objects (don't auction auction objects!)
  '::auctions::Auction',
  '::auctions::AdminCap',
  '::dashboard::Dashboard',
];

/**
 * Check if a type should be excluded from NFT selection
 */
function isExcludedType(type: string): boolean {
  return EXCLUDED_TYPE_PATTERNS.some(pattern => type.includes(pattern)) ||
         type.endsWith('Cap'); // Also exclude types ending with 'Cap'
}

/**
 * Check if an object is likely an NFT based on its properties
 */
function isLikelyNFT(obj: any): boolean {
  // Has display metadata - strong indicator of NFT
  if (obj.data?.display?.data) return true;
  
  // Type name includes NFT
  const type = obj.data?.type || '';
  if (type.includes('NFT') || type.includes('nft')) return true;
  
  // Known NFT collection patterns
  if (type.includes('::collection::')) return true;
  if (type.includes('::collectible::')) return true;
  
  // Check content fields for NFT-like properties
  const content = obj.data?.content;
  if (content && typeof content === 'object') {
    const fields = (content as any).fields;
    // NFTs typically have these fields
    if (fields?.name || fields?.description || fields?.image_url || fields?.url) {
      return true;
    }
  }
  
  return false;
}

/**
 * Fetch all NFTs owned by a user
 * Filters out system objects, capabilities, coins, and other non-NFT assets
 * Also fetches NFTs from user's kiosks
 */
export function useUserNFTs(address: string) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ['userNFTs', address],
    queryFn: async (): Promise<UserNFT[]> => {
      try {
        if (!address) return [];

        const allNFTs: UserNFT[] = [];

        // 1. Get NFTs directly owned by the user (in wallet)
        const ownedObjects = await client.getOwnedObjects({
          owner: address,
          options: {
            showType: true,
            showDisplay: true,
            showContent: true,
          },
        });

        // Filter and map wallet NFTs
        const walletNFTs: UserNFT[] = ownedObjects.data
          .filter((obj) => {
            const type = obj.data?.type;
            if (!type) return false;
            
            // Exclude known non-NFT types
            if (isExcludedType(type)) return false;
            
            // Only include objects that are likely NFTs
            return isLikelyNFT(obj);
          })
          .map((obj) => {
            const display = obj.data?.display?.data;
            const type = obj.data?.type || '';

            return {
              objectId: obj.data?.objectId || '',
              type: type,
              name: display?.name || extractTypeName(type),
              description: display?.description || '',
              imageUrl: display?.image_url || display?.icon_url,
              isInKiosk: false,
            };
          })
          .filter((nft) => nft.objectId);

        allNFTs.push(...walletNFTs);

        // 2. Get NFTs from user's kiosks
        try {
          const kioskClient = new KioskClient({
            client,
            network: NETWORK === 'mainnet' ? Network.MAINNET : Network.TESTNET,
          });

          // Get all kiosks owned by the user
          const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({ address });

          // Fetch items from each kiosk
          for (const cap of kioskOwnerCaps) {
            try {
              const kioskData = await kioskClient.getKiosk({
                id: cap.kioskId,
                options: {
                  withKioskFields: true,
                  withListingPrices: true,
                },
              });

              // Process each item in the kiosk
              for (const itemId of kioskData.itemIds) {
                // Check if item is locked or listed
                const isLocked = kioskData.items.some((item: any) => 
                  item.objectId === itemId && item.isLocked === true
                );
                const isListed = kioskData.listingIds?.includes(itemId) || false;

                // Fetch full object details
                try {
                  const objectData = await client.getObject({
                    id: itemId,
                    options: {
                      showType: true,
                      showDisplay: true,
                      showContent: true,
                    },
                  });

                  if (objectData.data) {
                    const type = objectData.data.type;
                    if (!type || isExcludedType(type)) continue;

                    const display = objectData.data.display?.data;

                    allNFTs.push({
                      objectId: itemId,
                      type: type,
                      name: display?.name || extractTypeName(type),
                      description: display?.description || '',
                      imageUrl: display?.image_url || display?.icon_url,
                      isInKiosk: true,
                      kioskId: cap.kioskId,
                      kioskOwnerCapId: cap.objectId,
                      isLocked: isLocked,
                      isListed: isListed,
                    });
                  }
                } catch (err) {
                  console.warn(`Failed to fetch kiosk item ${itemId}:`, err);
                }
              }
            } catch (err) {
              console.warn(`Failed to fetch kiosk ${cap.kioskId}:`, err);
            }
          }
        } catch (err) {
          console.warn('Failed to fetch kiosk NFTs:', err);
          // Continue without kiosk NFTs - not all networks support kiosks
        }

        return allNFTs;
      } catch (error) {
        console.error('Error fetching user NFTs:', error);
        return [];
      }
    },
    enabled: !!address,
    staleTime: 30000, // Cache for 30 seconds
  });
}

/**
 * Extract a readable name from the type string
 */
function extractTypeName(type: string): string {
  try {
    // Extract the last part after ::
    const parts = type.split('::');
    if (parts.length >= 2) {
      const typeName = parts[parts.length - 1];
      // Remove generic parameters
      const cleanName = typeName.split('<')[0];
      return cleanName || 'NFT';
    }
    return 'NFT';
  } catch {
    return 'NFT';
  }
}
