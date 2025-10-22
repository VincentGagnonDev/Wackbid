import { useState } from 'react';
import { useSignAndExecuteTransactionBlock, useSuiClient } from '@mysten/dapp-kit';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { placeBidTransaction, suiToMist } from '../../lib/sui-transactions';
import type { Auction } from '../../types/auction';

interface PlaceBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: Auction;
}

export default function PlaceBidModal({ isOpen, onClose, auction }: PlaceBidModalProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();
  const client = useSuiClient();

  // Convert highest_bid from MIST to SUI
  const currentBidSUI = auction.highest_bid / 1_000_000_000;
  
  // Next bid must be higher than current highest bid
  // If no bids yet, minimum is 0.001 SUI
  const minimumNextBid = currentBidSUI > 0 ? currentBidSUI + 0.001 : 0.001;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const bid = parseFloat(bidAmount);

      // Validate bid amount
      if (!bidAmount || isNaN(bid)) {
        throw new Error('Please enter a valid bid amount');
      }

      if (bid < minimumNextBid) {
        throw new Error(`Bid must be at least ${minimumNextBid.toFixed(3)} SUI`);
      }

      const bidInMist = suiToMist(bid);
      const tx = placeBidTransaction(auction.id, bidInMist, auction.nft_type);

      signAndExecute(
        {
          transactionBlock: tx,
        },
        {
          onSuccess: async (result) => {
            console.log('Bid placed successfully:', result);
            await client.waitForTransactionBlock({
              digest: result.digest,
            });
            
            setBidAmount('');
            onClose();
          },
          onError: (err) => {
            console.error('Transaction failed:', err);
            setError(err.message || 'Failed to place bid');
          },
        }
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="card max-w-md w-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Place Bid</h2>
                <button
                  onClick={onClose}
                  className="text-wb-ink/60 hover:text-wb-ink transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Auction Info */}
              <div className="bg-wb-bg rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">{auction.title}</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-wb-ink/60">Current Highest Bid:</span>
                  <span className="font-bold text-wb-accent">
                    {currentBidSUI > 0 ? `${currentBidSUI.toFixed(4)} SUI` : 'No bids yet'}
                  </span>
                </div>
                {auction.highest_bidder && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-wb-ink/60">Current Leader:</span>
                    <span className="font-mono text-xs">{auction.highest_bidder.slice(0, 8)}...{auction.highest_bidder.slice(-6)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-wb-ink/60">Minimum Next Bid:</span>
                  <span className="font-semibold">{minimumNextBid.toFixed(4)} SUI</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Bid Amount (SUI)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min={minimumNextBid}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={minimumNextBid.toFixed(4)}
                    className="w-full bg-wb-bg border border-wb-accent/20 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-wb-accent transition-colors"
                    disabled={isLoading}
                    autoFocus
                  />
                  <p className="text-xs text-wb-ink/60 mt-1">
                    Bid must be higher than {minimumNextBid.toFixed(4)} SUI
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
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
                    disabled={isLoading}
                  >
                    {isLoading ? 'Placing Bid...' : 'Place Bid'}
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
