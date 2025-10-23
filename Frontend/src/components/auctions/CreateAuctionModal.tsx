import { useState } from 'react';
import { useSignAndExecuteTransactionBlock, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { createAuctionTransaction, suiToMist, findTransferPolicy } from '../../lib/sui-transactions';
import { useUserNFTs } from '../../hooks/useUserNFTs';

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateAuctionModal({ isOpen, onClose }: CreateAuctionModalProps) {
  const currentAccount = useCurrentAccount();
  const { data: userNFTs, isLoading: loadingNFTs } = useUserNFTs(currentAccount?.address || '');
  
  const [selectedNFT, setSelectedNFT] = useState<string>('');
  const [auctionTitle, setAuctionTitle] = useState('');
  const [minimumBid, setMinimumBid] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60'); // Default 60 minutes (1 hour)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();
  const client = useSuiClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate inputs (title is now optional)
      if (!selectedNFT || !minimumBid || !durationMinutes) {
        throw new Error('Please fill in all required fields');
      }

      const minutes = parseFloat(durationMinutes);
      if (minutes < 2) {
        throw new Error('Duration must be at least 2 minutes');
      }
      if (minutes > 10080) { // 7 days in minutes
        throw new Error('Duration cannot exceed 7 days (10,080 minutes)');
      }

      const nft = userNFTs?.find(n => n.objectId === selectedNFT);
      if (!nft) {
        throw new Error('Selected NFT not found');
      }
      
      // Generate title from NFT name or type if not provided
      const finalTitle = auctionTitle.trim() || 
                        nft.name || 
                        nft.type.split('::').pop() || 
                        'NFT Auction';

      // NEW: Kiosk is now required for all auctions
      if (!nft.isInKiosk || !nft.kioskId || !nft.kioskOwnerCapId) {
        throw new Error('NFT must be in a kiosk to create an auction. Please place your NFT in a kiosk first.');
      }

      // Check if NFT is listed (cannot auction listed items)
      if (nft.isListed) {
        throw new Error('This NFT is listed for sale in the kiosk. Please delist it before creating an auction.');
      }

      console.log('🎯 Validating NFT and kiosk objects:', {
        nftId: nft.objectId,
        kioskId: nft.kioskId,
        kioskOwnerCapId: nft.kioskOwnerCapId,
        isLocked: nft.isLocked,
      });

      // Verify objects exist on-chain before proceeding
      try {
        const [kioskObj, capObj] = await Promise.all([
          client.getObject({ id: nft.kioskId }),
          client.getObject({ id: nft.kioskOwnerCapId }),
        ]);

        if (!kioskObj.data) {
          throw new Error(`Kiosk ${nft.kioskId} not found. Please refresh and try again.`);
        }
        if (!capObj.data) {
          throw new Error(`KioskOwnerCap ${nft.kioskOwnerCapId} not found. You may not own this kiosk.`);
        }

        console.log('✅ Kiosk and KioskOwnerCap validated successfully');
      } catch (err) {
        console.error('❌ Validation error:', err);
        throw err;
      }

      // Locked NFTs are now SUPPORTED!
      // The contract uses kiosk::list + kiosk::purchase to handle locked items
      // No need to block locked NFTs

      // Calculate end time in Unix milliseconds
      const durationMs = minutes * 60 * 1000; // Convert minutes to milliseconds
      const endTime = Date.now() + durationMs;

      const bidInMist = suiToMist(parseFloat(minimumBid));
      
      // Kiosk data is required
      const kioskData = { 
        kioskId: nft.kioskId, 
        kioskOwnerCapId: nft.kioskOwnerCapId 
      };
      
      // Find TransferPolicy for this NFT type
      console.log('🔍 Finding TransferPolicy for NFT type:', nft.type);
      const transferPolicyId = await findTransferPolicy(nft.type, client);
      
      if (transferPolicyId) {
        console.log('✅ Using TransferPolicy:', transferPolicyId);
      } else {
        console.log('⚠️  No TransferPolicy found - will use unlocked auction flow');
      }
      
      // Only require TransferPolicy if NFT is locked
      if (nft.isLocked && !transferPolicyId) {
        throw new Error(
          'This NFT is locked in the kiosk but no TransferPolicy was found. ' +
          'Locked NFTs require a TransferPolicy to be transferred.'
        );
      }
      
      const tx = createAuctionTransaction(
        nft.objectId, 
        nft.type, 
        bidInMist, 
        endTime, 
        finalTitle,
        kioskData,
        nft.isLocked ? transferPolicyId : undefined  // Only pass policy if locked
      );

      signAndExecute(
        {
          transactionBlock: tx,
        },
        {
          onSuccess: async (result) => {
            console.log('Auction created successfully:', result);
            // Wait for transaction to be confirmed
            await client.waitForTransactionBlock({
              digest: result.digest,
            });
            
            // Reset form and close modal
            setSelectedNFT('');
            setAuctionTitle('');
            setMinimumBid('');
            setDurationMinutes('60');
            onClose();
          },
          onError: (err) => {
            console.error('Transaction failed:', err);
            setError(err.message || 'Failed to create auction');
          },
        }
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedNFTData = userNFTs?.find(n => n.objectId === selectedNFT);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-wb-card pb-4 z-10">
                <h2 className="text-2xl font-bold">Create Auction</h2>
                <button
                  onClick={onClose}
                  className="text-wb-ink/60 hover:text-wb-ink transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* NFT Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Select NFT to Auction
                  </label>
                  
                  {loadingNFTs && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-wb-accent"></div>
                      <p className="mt-2 text-wb-ink/60 text-sm">Loading your NFTs...</p>
                    </div>
                  )}

                  {!loadingNFTs && userNFTs && userNFTs.length === 0 && (
                    <div className="bg-wb-bg rounded-lg p-8 text-center">
                      <p className="text-wb-ink/60">No NFTs found in your wallet or kiosks</p>
                      <p className="text-sm text-wb-ink/40 mt-2">Make sure you have NFTs in a kiosk to create auctions</p>
                    </div>
                  )}

                  {!loadingNFTs && userNFTs && userNFTs.length > 0 && (
                    <>
                      {/* Info banner about kiosk requirement */}
                      <div className="bg-wb-accent/10 border border-wb-accent/30 rounded-lg p-3 mb-4">
                        <p className="text-sm text-wb-ink/80 mb-2">
                          <span className="font-semibold text-wb-accent">ℹ️ Requirements:</span> NFTs must be in kiosks and have a TransferPolicy.
                          {(userNFTs.filter(nft => !nft.isInKiosk || nft.isListed).length > 0) && (
                            <span className="text-wb-ink/60"> Listed or wallet NFTs cannot be auctioned.</span>
                          )}
                        </p>
                        <p className="text-xs text-wb-ink/70 mt-1">
                          <span className="font-semibold">✅ Locked NFTs:</span> Both locked and unlocked NFTs in kiosks are supported!
                        </p>
                        <p className="text-xs text-wb-ink/70 mt-1">
                          <span className="font-semibold">🔐 TransferPolicy:</span> All NFTs require a TransferPolicy for royalties and transfer rules. 
                          If your NFT doesn't have one, the creator must create it first.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
                        {userNFTs.map((nft) => {
                          // Only disable if: NOT in kiosk OR is listed
                          // Locked NFTs are OK!
                          const isDisabled = !nft.isInKiosk || nft.isListed;
                          const disabledReason = !nft.isInKiosk 
                            ? 'Not in Kiosk' 
                            : nft.isListed 
                            ? 'Listed for Sale'
                            : '';
                          
                          return (
                            <motion.div
                              key={nft.objectId}
                              whileHover={isDisabled ? {} : { scale: 1.02 }}
                              whileTap={isDisabled ? {} : { scale: 0.98 }}
                              onClick={() => !isDisabled && setSelectedNFT(nft.objectId)}
                              className={`relative rounded-lg border-2 transition-all ${
                                isDisabled
                                  ? 'opacity-50 cursor-not-allowed border-wb-ink/20'
                                  : selectedNFT === nft.objectId
                                  ? 'border-wb-accent bg-wb-accent/10 cursor-pointer'
                                  : 'border-wb-accent/20 hover:border-wb-accent/50 cursor-pointer'
                              }`}
                            >
                              {/* Disabled overlay */}
                              {isDisabled && (
                                <div className="absolute inset-0 bg-wb-bg/80 rounded-lg flex items-center justify-center z-20">
                                  <p className="text-xs text-wb-ink/60 text-center px-2">
                                    {disabledReason}
                                  </p>
                                </div>
                              )}

                              {/* Selected Indicator */}
                              {selectedNFT === nft.objectId && !isDisabled && (
                                <div className="absolute top-2 right-2 bg-wb-accent rounded-full p-1 z-10">
                                  <Check size={16} className="text-wb-bg" />
                                </div>
                              )}

                              {/* NFT Image */}
                              <div className="aspect-square rounded-t-lg bg-wb-bg overflow-hidden">
                                {nft.imageUrl ? (
                                  <img
                                    src={nft.imageUrl}
                                    alt={nft.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzBCMEIwRiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2QkZGM0IiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ORlQ8L3RleHQ+PC9zdmc+';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-wb-accent/30 text-sm">
                                    No Image
                                  </div>
                                )}
                              </div>

                              {/* NFT Info */}
                              <div className="p-2">
                                <p className="font-semibold text-sm truncate">{nft.name}</p>
                                <p className="text-xs text-wb-ink/60 truncate">{nft.objectId.slice(0, 8)}...</p>
                                {nft.isInKiosk && (
                                  <p className="text-xs text-wb-accent mt-1 flex items-center gap-1">
                                    <span>📦</span> In Kiosk {nft.isLocked ? '🔒' : ''}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Auction Title */}
                {selectedNFTData && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Auction Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={auctionTitle}
                      onChange={(e) => setAuctionTitle(e.target.value)}
                      placeholder={selectedNFTData.name || selectedNFTData.type.split('::').pop() || 'Leave empty to use NFT name'}
                      className="w-full bg-wb-bg border border-wb-accent/20 rounded-lg px-4 py-2 focus:outline-none focus:border-wb-accent transition-colors"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-wb-ink/60 mt-1">
                      Leave empty to use "{selectedNFTData.name || selectedNFTData.type.split('::').pop() || 'NFT name'}" as the title
                    </p>
                  </div>
                )}

                {/* Minimum Bid */}
                {selectedNFTData && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Minimum Bid (SUI)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={minimumBid}
                      onChange={(e) => setMinimumBid(e.target.value)}
                      placeholder="1.0"
                      className="w-full bg-wb-bg border border-wb-accent/20 rounded-lg px-4 py-2 focus:outline-none focus:border-wb-accent transition-colors"
                      disabled={isLoading}
                    />
                  </div>
                )}

                {/* Duration */}
                {selectedNFTData && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="2"
                      max="10080"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      placeholder="60"
                      className="w-full bg-wb-bg border border-wb-accent/20 rounded-lg px-4 py-2 focus:outline-none focus:border-wb-accent transition-colors"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-wb-ink/60 mt-1">
                      Minimum 2 minutes, Maximum 7 days (10,080 minutes)
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2 sticky bottom-0 bg-wb-card pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 btn-secondary"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                    disabled={isLoading || !selectedNFT || !minimumBid || !durationMinutes}
                  >
                    {isLoading ? 'Creating...' : 'Create Auction'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
