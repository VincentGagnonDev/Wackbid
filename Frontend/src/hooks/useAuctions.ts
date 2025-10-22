import { useQuery } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';
import type { Auction } from '../types/auction';
import { PACKAGE_ID } from '../config/constants';
import { mistToSui } from '../lib/sui-transactions';

/**
 * Simplified hook to fetch auctions from events
 */
export function useAuctions() {
  const client = useSuiClient();

  return useQuery({
    queryKey: ['auctions', PACKAGE_ID],
    queryFn: async (): Promise<Auction[]> => {
      if (!PACKAGE_ID || PACKAGE_ID === 'TO_BE_DEPLOYED') {
        return [];
      }

      try {
        // Query AuctionCreated events to find auctions
        const events = await client.queryEvents({
          query: {
            MoveEventModule: {
              package: PACKAGE_ID,
              module: 'auction',
            },
          },
          limit: 50,
          order: 'descending',
        });

        const auctions: Auction[] = [];

        for (const event of events.data) {
          try {
            if (event.type.includes('::auction::AuctionCreated')) {
              const parsedJson = event.parsedJson as any;
              
              // Try to get the auction object
              const auctionObj = await client.getObject({
                id: parsedJson.auction_id,
                options: {
                  showContent: true,
                  showType: true,
                },
              });

              if (auctionObj.data?.content?.dataType === 'moveObject') {
                const fields = (auctionObj.data.content as any).fields;
                
                // Extract NFT type from auction object type
                const fullType = auctionObj.data.type || '';
                const typeMatch = fullType.match(/<(.+?),/);
                const nftType = typeMatch ? typeMatch[1] : '';

                auctions.push({
                  id: parsedJson.auction_id,
                  title: `Auction #${parsedJson.auction_id.substring(0, 8)}`,
                  description: 'NFT Auction',
                  creator: fields.creator || parsedJson.creator,
                  item_id: fields.item_id || parsedJson.item_id,
                  nft_type: nftType,
                  highest_bid: Number(fields.highest_bid || 0),
                  highest_bidder: fields.highest_bidder || null,
                  expiry_time: Number(fields.expiry_time || parsedJson.expiry_time),
                  is_active: fields.is_active ?? true,
                });
              }
            }
          } catch (err) {
            console.warn('Failed to fetch auction:', err);
          }
        }

        // Filter only by is_active status - don't hide expired auctions
        // They still need to be finalized and should remain visible
        return auctions.filter(a => a.is_active);
      } catch (error) {
        console.error('Error fetching auctions:', error);
        return [];
      }
    },
    enabled: PACKAGE_ID !== 'TO_BE_DEPLOYED',
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

/**
 * Hook to fetch a single auction by ID
 */
export function useAuction(auctionId: string | undefined) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ['auction', auctionId],
    queryFn: async (): Promise<Auction | null> => {
      if (!auctionId || !PACKAGE_ID || PACKAGE_ID === 'TO_BE_DEPLOYED') {
        return null;
      }

      try {
        const auctionObj = await client.getObject({
          id: auctionId,
          options: {
            showContent: true,
            showType: true,
          },
        });

        if (auctionObj.data?.content?.dataType === 'moveObject') {
          const fields = (auctionObj.data.content as any).fields;
          
          // Extract NFT type from auction object type
          const fullType = auctionObj.data.type || '';
          const typeMatch = fullType.match(/<(.+?),/);
          const nftType = typeMatch ? typeMatch[1] : '';

          return {
            id: auctionId,
            title: `Auction #${auctionId.substring(0, 8)}`,
            description: 'NFT Auction',
            creator: fields.creator,
            item_id: fields.item_id,
            nft_type: nftType,
            highest_bid: Number(fields.highest_bid || 0),
            highest_bidder: fields.highest_bidder || null,
            expiry_time: Number(fields.expiry_time),
            is_active: fields.is_active ?? true,
          };
        }

        return null;
      } catch (error) {
        console.error('Error fetching auction:', error);
        return null;
      }
    },
    enabled: !!auctionId && PACKAGE_ID !== 'TO_BE_DEPLOYED',
    refetchInterval: 5000,
  });
}
