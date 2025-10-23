import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { createAuctionTransaction, suiToMist, findTransferPolicy } from '../lib/sui-transactions';

interface CreateAuctionFormProps {
  nftObjectId: string;
  nftType: string;
  kioskId: string;
  kioskOwnerCapId: string;
  isLocked?: boolean;
  onSuccess?: () => void;
}

/**
 * Form component for creating auctions with time selection
 * Updated for new auction system with kiosk support
 */
export function CreateAuctionForm({ 
  nftObjectId, 
  nftType, 
  kioskId, 
  kioskOwnerCapId, 
  isLocked = false,
  onSuccess 
}: CreateAuctionFormProps) {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  
  const [title, setTitle] = useState('');
  const [minimumBid, setMinimumBid] = useState('');
  const [duration, setDuration] = useState('7'); // days
  const [customDuration, setCustomDuration] = useState('');
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!account) {
      setError('Please connect your wallet');
      return;
    }

    const minBid = parseFloat(minimumBid);
    const durationDays = useCustomDuration ? parseFloat(customDuration) : parseInt(duration);

    if (isNaN(minBid) || minBid <= 0) {
      setError('Please enter a valid minimum bid');
      return;
    }

    if (isNaN(durationDays) || durationDays <= 0) {
      setError('Please enter a valid duration');
      return;
    }

    if (durationDays > 365) {
      setError('Duration cannot exceed 365 days');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate end time (duration in days -> milliseconds)
      const endTime = Date.now() + (durationDays * 24 * 60 * 60 * 1000);

      // Find TransferPolicy for this NFT type
      console.log('🔍 Finding TransferPolicy for NFT type:', nftType);
      const transferPolicyId = await findTransferPolicy(nftType, client);
      
      if (transferPolicyId) {
        console.log('✅ Using TransferPolicy:', transferPolicyId);
      } else {
        console.log('⚠️  No TransferPolicy found - will use unlocked auction flow');
      }
      
      // Only require TransferPolicy if NFT is locked
      if (isLocked && !transferPolicyId) {
        throw new Error(
          'This NFT is locked in the kiosk but no TransferPolicy was found. ' +
          'Locked NFTs require a TransferPolicy to be transferred.'
        );
      }

      const tx = createAuctionTransaction(
        nftObjectId,
        nftType,
        suiToMist(minBid),
        endTime,
        title || nftType.split('::').pop() || 'NFT Auction',
        { kioskId, kioskOwnerCapId },
        isLocked ? transferPolicyId : undefined  // Only pass policy if locked
      );

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            onSuccess?.();
            // Reset form
            setTitle('');
            setMinimumBid('');
            setDuration('7');
            setCustomDuration('');
            setUseCustomDuration(false);
          },
          onError: (err) => {
            console.error('Create auction failed:', err);
            setError(err.message || 'Failed to create auction');
            setIsSubmitting(false);
          },
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
      setIsSubmitting(false);
    }
  };

  const durationValue = useCustomDuration ? parseFloat(customDuration) : parseInt(duration);
  const endDate = new Date(Date.now() + (durationValue || 0) * 24 * 60 * 60 * 1000);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Auction Title (Optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wb-accent focus:border-transparent"
          placeholder="My Cool NFT Auction"
          disabled={isSubmitting}
          maxLength={100}
        />
        <p className="mt-1 text-xs text-gray-500">Leave empty to use NFT name as title</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Bid (SUI)
        </label>
        <input
          type="number"
          step="0.0001"
          value={minimumBid}
          onChange={(e) => setMinimumBid(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wb-accent focus:border-transparent"
          placeholder="100"
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration
        </label>
        
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id="customDuration"
            checked={useCustomDuration}
            onChange={(e) => setUseCustomDuration(e.target.checked)}
            className="rounded border-gray-300 text-wb-accent focus:ring-wb-accent"
            disabled={isSubmitting}
          />
          <label htmlFor="customDuration" className="text-sm text-gray-700">
            Use custom duration
          </label>
        </div>

        {useCustomDuration ? (
          <div className="space-y-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="365"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wb-accent focus:border-transparent"
              placeholder="Enter days (e.g., 0.5 for 12 hours)"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-gray-500">
              💡 Examples: 0.5 = 12 hours, 1 = 24 hours, 1.5 = 36 hours
            </p>
          </div>
        ) : (
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wb-accent focus:border-transparent"
            disabled={isSubmitting}
            required
          >
            <option value="0.25">6 Hours</option>
            <option value="0.5">12 Hours</option>
            <option value="1">1 Day</option>
            <option value="3">3 Days</option>
            <option value="7">7 Days</option>
            <option value="14">14 Days</option>
            <option value="30">30 Days</option>
          </select>
        )}
        
        <p className="mt-2 text-sm text-gray-500">
          🕒 Auction will end on: <span className="font-medium">{endDate.toLocaleString()}</span>
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-wb-accent/10 border border-wb-accent/30 rounded-lg p-3">
        <p className="text-sm text-wb-accent">
          ℹ️ Note: A 5% platform fee will be deducted from the winning bid at auction finalization.
        </p>
        {isLocked && (
          <p className="text-sm text-wb-accent mt-1">
            🔒 This is a locked NFT - transfer policy will be enforced during transfer.
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-wb-accent text-black font-bold rounded-lg hover:bg-wb-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isSubmitting || !account}
      >
        {isSubmitting ? 'Creating Auction...' : 'Create Auction'}
      </button>
    </form>
  );
}
