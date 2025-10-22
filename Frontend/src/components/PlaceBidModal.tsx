import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { placeBidTransaction, calculateBidBreakdown, suiToMist } from '../lib/sui-transactions';
import { BidBreakdown } from './BidBreakdown';
import type { Auction } from '../types/auction';

interface PlaceBidModalProps {
  auction: Auction;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal component for placing bids with fee breakdown
 */
export function PlaceBidModal({ auction, isOpen, onClose, onSuccess }: PlaceBidModalProps) {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!account) {
      setError('Please connect your wallet');
      return;
    }

    // Check if user is the auction creator
    if (account.address === auction.creator) {
      setError('You cannot bid on your own auction');
      return;
    }

    const amount = parseFloat(bidAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount <= auction.currentBid) {
      setError(`Bid must be higher than current bid (${auction.currentBid} SUI)`);
      return;
    }

    if (amount < auction.minimumBid) {
      setError(`Bid must be at least ${auction.minimumBid} SUI`);
      return;
    }

    setIsSubmitting(true);

    try {
      const tx = placeBidTransaction(
        auction.id,
        suiToMist(amount)
      );

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            onSuccess?.();
            onClose();
          },
          onError: (err) => {
            console.error('Bid failed:', err);
            setError(err.message || 'Failed to place bid');
            setIsSubmitting(false);
          },
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
      setIsSubmitting(false);
    }
  };

  const amount = parseFloat(bidAmount) || 0;
  const showBreakdown = amount > 0;
  const isCreator = account?.address === auction.creator;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Place Bid</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {isCreator && (
          <div className="mb-4 p-3 bg-wb-accent/10 border border-wb-accent/30 rounded-lg">
            <p className="text-sm text-wb-accent">
              ⚠️ You cannot bid on your own auction
            </p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-gray-600">Auction: {auction.title}</p>
          <p className="text-sm text-gray-600">
            Current Bid: <span className="font-semibold">{auction.currentBid} SUI</span>
          </p>
          <p className="text-sm text-gray-600">
            Minimum Bid: <span className="font-semibold">{auction.minimumBid} SUI</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Bid (SUI)
            </label>
            <input
              type="number"
              step="0.0001"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wb-accent focus:border-transparent"
              placeholder="Enter bid amount"
              disabled={isSubmitting}
              required
            />
          </div>

          {showBreakdown && (
            <BidBreakdown bidAmount={amount} className="mb-4" />
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-wb-accent text-black rounded-lg hover:bg-wb-accent/90 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              disabled={isSubmitting || !account || isCreator}
            >
              {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
