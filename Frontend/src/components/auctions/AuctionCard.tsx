import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransactionBlock, useSuiClient } from '@mysten/dapp-kit';
import type { Auction } from '../../types/auction';
import PlaceBidModal from './PlaceBidModal';
import wackoLogoGif from '../../assets/wacko_logo.gif';
import { finalizeAuctionTransaction, findTransferPolicy, mistToSui, findUserKiosk } from '../../lib/sui-transactions';
import { Trophy, AlertCircle } from 'lucide-react';

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Math.max(0, auction.expiry_time - Date.now()));
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  const isCreator = currentAccount?.address === auction.creator;
  const isWinner = currentAccount?.address === auction.highest_bidder && auction.highest_bid > 0;
  const isExpired = timeLeft === 0;
  
  // Add 60 second buffer before allowing finalization
  const FINALIZE_BUFFER = 60000; // 60 seconds in milliseconds
  const canFinalize = currentTime >= auction.expiry_time + FINALIZE_BUFFER;
  
  // Update timer and current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(Math.max(0, auction.expiry_time - Date.now()));
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [auction.expiry_time]);
  
  const formatTimeLeft = (ms: number) => {
    if (ms === 0) return 'Ended';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const handleCardClick = () => {
    navigate(`/auction/${auction.id}`);
  };

  const handleBidClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBidModalOpen(true);
  };

  const handleCloseAuction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentAccount) {
      setCloseError('Please connect your wallet');
      return;
    }

    setIsClosing(true);
    setCloseError('');

    try {
      const nftType = auction.nft_type;
      
      if (!nftType) {
        setCloseError('NFT type not found. Cannot finalize auction.');
        setIsClosing(false);
        return;
      }

      const hasBids = auction.highest_bid > 0;
      
      console.log('Finding TransferPolicy for NFT type:', nftType);
      const transferPolicyId = await findTransferPolicy(nftType, client);
      
      if (transferPolicyId) {
        console.log('Using TransferPolicy:', transferPolicyId);
      } else {
        console.log('No TransferPolicy found - will finalize without policy');
      }

      console.log('Creating finalize transaction with NFT type:', nftType);
      
      // Create finalize transaction - no need for creator kiosk anymore
      const tx = finalizeAuctionTransaction(
        auction.id, 
        nftType, 
        undefined,
        undefined,
        transferPolicyId || undefined,
        hasBids
      );

      signAndExecute(
        { transactionBlock: tx },
        {
          onSuccess: (result) => {
            console.log('Auction finalized successfully:', result);
            const message = auction.highest_bid > 0
              ? 'Auction finalized! Winner will receive a new kiosk with the NFT.'
              : 'Auction finalized! NFT returned to creator\'s wallet.';
            alert(message);
            setTimeout(() => window.location.reload(), 2000);
          },
          onError: (err) => {
            console.error('Failed to finalize auction:', err);
            
            // Check if error is about auction not expired yet
            if (err.message && err.message.includes('MoveAbort') && err.message.includes('1')) {
              setCloseError('Auction not expired yet. Please wait a moment and try again.');
            } else {
              setCloseError(err.message || 'Failed to finalize auction');
            }
            setIsClosing(false);
          },
        }
      );
    } catch (err: any) {
      console.error('Error finalizing auction:', err);
      setCloseError(err.message || 'Failed to finalize auction');
      setIsClosing(false);
    }
  };

  const currentBidSui = mistToSui(auction.highest_bid);

  return (
    <>
      <motion.div
        onClick={handleCardClick}
        className="bg-wb-card border border-wb-border rounded-lg overflow-hidden hover:border-wb-accent transition-all duration-200 cursor-pointer"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-wb-bg">
          <img
            src={wackoLogoGif}
            alt={auction.title}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'auto' }}
          />
          {auction.is_active && !isExpired && (
            <div className="absolute top-2 right-2 bg-wb-accent text-black px-3 py-1 rounded-full text-xs font-bold">
              LIVE
            </div>
          )}
          {isExpired && auction.is_active && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
              ENDED
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-wb-text mb-2 truncate">{auction.title}</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-wb-text/60">Current Bid</span>
              <span className="text-wb-accent font-bold">
                {auction.highest_bid > 0 ? `${currentBidSui} SUI` : 'No bids'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-wb-text/60">Time Left</span>
              <span className="text-wb-text font-medium">{formatTimeLeft(timeLeft)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 space-y-2">
            {auction.is_active && !isExpired && !isCreator && (
              <button
                onClick={handleBidClick}
                className="w-full bg-wb-accent text-black font-bold py-2 rounded hover:bg-wb-accent/90 transition-colors"
              >
                Place Bid
              </button>
            )}
            
            {auction.is_active && isExpired && currentAccount && (
              <button
                onClick={handleCloseAuction}
                disabled={isClosing || !canFinalize}
                className="w-full bg-wb-accent text-black font-bold py-2 rounded hover:bg-wb-accent/90 transition-colors disabled:opacity-50"
              >
                {isClosing ? 'Finalizing...' : !canFinalize ? 'Processing...' : isWinner ? 'Claim NFT' : 'Finalize'}
              </button>
            )}
            
            {closeError && (
              <div className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle size={12} />
                {closeError}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <PlaceBidModal
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
        auction={auction}
      />
    </>
  );
}
