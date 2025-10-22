import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransactionBlock, useSuiClient } from '@mysten/dapp-kit';
import { useAuction } from '../hooks/useAuctions';
import PlaceBidModal from '../components/auctions/PlaceBidModal';
import { finalizeAuctionTransaction, findTransferPolicy, findUserKiosk, mistToSui } from '../lib/sui-transactions';
import wackoLogoGif from '../assets/wacko_logo.gif';
import { motion } from 'framer-motion';
import { User, Clock, Trophy, Gavel } from 'lucide-react';

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { data: auction, isLoading, error, refetch } = useAuction(id || '');
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showFinalizeButton, setShowFinalizeButton] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();
  const client = useSuiClient();

  // Update current time every second for live timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Effect to handle finalize button visibility with 10-second delay after expiry
  useEffect(() => {
    if (!auction) {
      setShowFinalizeButton(false);
      return;
    }

    const checkExpiry = () => {
      const now = Date.now();
      const isExpired = auction.expiry_time <= now;
      
      if (isExpired && auction.is_active) {
        // Add a 10-second buffer after expiry before showing the button
        // This ensures blockchain state has time to sync and prevents race conditions
        const timeSinceExpiry = now - auction.expiry_time;
        const bufferPeriod = 60000; // 60 seconds
        
        if (timeSinceExpiry >= bufferPeriod) {
          setShowFinalizeButton(true);
        } else {
          setShowFinalizeButton(false);
          // Set a precise timeout to enable the button exactly when buffer period ends
          const delay = bufferPeriod - timeSinceExpiry;
          const timer = setTimeout(() => {
            setShowFinalizeButton(true);
            // Force immediate refetch when button becomes available
            refetch();
          }, delay);
          return () => clearTimeout(timer);
        }
      } else {
        setShowFinalizeButton(false);
      }
    };

    checkExpiry();
    // Check every second to update state precisely
    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, [auction, refetch]);

  const handleFinalizeAuction = async () => {
    if (!auction || !currentAccount || !id) return;

    setIsClosing(true);

    try {
      const nftType = auction.nft_type;
      
      if (!nftType) {
        alert('NFT type not found. Cannot finalize auction.');
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
        id, 
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
            const message = hasHighestBid 
              ? 'Auction finalized! Winner will receive a new kiosk with the NFT.'
              : 'Auction finalized! NFT returned to creator\'s wallet.';
            alert(message);
            // Redirect to auctions page instead of reloading
            setTimeout(() => navigate('/auctions'), 2000);
          },
          onError: (err) => {
            console.error('Failed to finalize auction:', err);
            
            // Check if error is about auction not expired yet
            if (err.message && err.message.includes('MoveAbort') && err.message.includes('1')) {
              alert('Auction not expired yet. Please wait a moment and try again.');
            } else {
              alert('Failed to finalize auction: ' + err.message);
            }
            setIsClosing(false);
          },
        }
      );
    } catch (err) {
      console.error('Error:', err);
      alert('Error: ' + (err as Error).message);
      setIsClosing(false);
    }
  };

  const isCreator = currentAccount?.address === auction?.creator;
  // Use currentTime state for real-time expiry check
  const isExpired = auction && auction.expiry_time <= currentTime;
  const hasHighestBid = auction && auction.highest_bid > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-wb-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-wb-accent/20 border-t-wb-accent"
               style={{ boxShadow: '0 0 40px rgba(107, 255, 59, 0.3)' }}></div>
          <p className="mt-6 text-wb-accent font-bold text-lg">Loading auction...</p>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-wb-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-8 text-center backdrop-blur-xl"
             style={{ boxShadow: '0 0 40px rgba(239, 68, 68, 0.2)' }}>
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-400 font-bold text-xl">Auction Not Found</p>
          <p className="text-gray-400 mt-2">This auction may have been removed or doesn't exist</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-6 bg-wb-accent text-black font-bold px-6 py-3 rounded-lg hover:bg-wb-accent/90 transition-all">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentBidSui = mistToSui(auction.highest_bid);
  // Calculate time remaining using currentTime state that updates every second
  const timeRemaining = Math.max(0, auction.expiry_time - currentTime);
  
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

  return (
    <>
      {/* Premium Dark Gradient Background with Particles */}
      <div className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-wb-accent/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-wb-accent/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Left Column - NFT Preview with Floating Effect */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="sticky top-24">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    boxShadow: auction.is_active 
                      ? '0 0 60px rgba(107, 255, 59, 0.3), 0 0 120px rgba(107, 255, 59, 0.1)' 
                      : '0 20px 60px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  {/* Glowing Border */}
                  <div className="absolute inset-0 bg-gradient-to-br from-wb-accent/20 via-transparent to-wb-accent/20 rounded-2xl"></div>
                  
                  <img
                    src={wackoLogoGif}
                    alt={auction.title}
                    className="w-full aspect-square object-cover relative z-10"
                  />

                  {/* Status Overlay */}
                  <div className="absolute top-6 right-6 z-20">
                    {auction.is_active ? (
                      <motion.div 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="bg-wb-accent text-black px-6 py-3 rounded-full font-bold text-sm shadow-lg flex items-center gap-2"
                        style={{ boxShadow: '0 0 30px rgba(107, 255, 59, 0.6)' }}
                      >
                        <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                        LIVE AUCTION
                      </motion.div>
                    ) : (
                      <div className="bg-gray-800/90 text-gray-400 px-6 py-3 rounded-full font-bold text-sm backdrop-blur-sm">
                        ENDED
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Column - Auction Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Title & Description */}
              <div>
                <h1 className="text-5xl font-black mb-4 text-wb-accent tracking-tight">
                  {auction.title}
                </h1>
                {auction.description && (
                  <p className="text-gray-400 text-lg leading-relaxed">{auction.description}</p>
                )}
              </div>

              {/* Auction Locked Message */}
              {isCreator && hasHighestBid && auction.is_active && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-r from-wb-accent/10 to-transparent border-l-4 border-wb-accent rounded-lg p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-wb-accent/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-wb-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-wb-accent font-bold text-lg mb-2">Auction Locked</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Active bids prevent cancellation. Auto-closes when timer expires.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Current Bid Card */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-wb-accent/20 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-wb-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <Gavel size={16} />
                      <span className="uppercase tracking-wider font-semibold">Current Bid</span>
                    </div>
                    <motion.div 
                      key={auction.highest_bid}
                      initial={{ scale: 1.1, color: '#6BFF3B' }}
                      animate={{ scale: 1, color: '#6BFF3B' }}
                      className="text-4xl font-black text-wb-accent"
                    >
                      {hasHighestBid ? `${currentBidSui} SUI` : 'No bids'}
                    </motion.div>
                    {!hasHighestBid && (
                      <p className="text-sm text-gray-500 mt-2">
                        Min: {mistToSui(auction.min_bid_increment)} SUI
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Time Remaining Card */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-wb-accent/20 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-wb-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <Clock size={16} />
                      <span className="uppercase tracking-wider font-semibold">Time Left</span>
                    </div>
                    <div className={`text-3xl font-black ${isExpired ? 'text-red-500' : 'text-white'}`}>
                      {formatTimeLeft(timeRemaining)}
                    </div>
                  </div>
                </motion.div>

                {/* Highest Bidder Card */}
                {hasHighestBid && auction.highest_bidder && (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-wb-accent/20 relative overflow-hidden group sm:col-span-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-wb-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Trophy size={16} />
                          <span className="uppercase tracking-wider font-semibold">Leading Bidder</span>
                        </div>
                        {currentAccount?.address === auction.highest_bidder && (
                          <span className="bg-wb-accent text-black px-3 py-1 rounded-full text-xs font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Identicon */}
                        <div className="w-10 h-10 rounded-full bg-wb-accent flex items-center justify-center text-black font-bold">
                          {auction.highest_bidder.slice(2, 4).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-wb-accent truncate" title={auction.highest_bidder}>
                            {auction.highest_bidder.slice(0, 12)}...{auction.highest_bidder.slice(-10)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Creator Card */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-wb-accent/20 relative overflow-hidden group sm:col-span-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-wb-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <User size={16} />
                      <span className="uppercase tracking-wider font-semibold">Creator</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold">
                        {auction.creator.slice(2, 4).toUpperCase()}
                      </div>
                      <div className="font-mono text-sm text-gray-300 truncate" title={auction.creator}>
                        {auction.creator.slice(0, 12)}...{auction.creator.slice(-10)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                {/* Show countdown message when expired but button not ready yet */}
                {auction.is_active && isExpired && !showFinalizeButton && currentAccount && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 text-yellow-300 font-bold text-center py-5 rounded-xl backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Clock size={20} className="animate-pulse" />
                      <span>Auction ended - syncing blockchain state...</span>
                    </div>
                    <p className="text-sm text-yellow-400/80 mt-2">
                      Finalize button available in {Math.ceil((60000 - (currentTime - auction.expiry_time)) / 1000)}s
                    </p>
                  </motion.div>
                )}

                {/* Anyone can close expired auctions! */}
                {auction.is_active && isExpired && showFinalizeButton && currentAccount && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFinalizeAuction}
                    disabled={isClosing}
                    className="w-full bg-wb-accent text-black font-black text-lg py-5 rounded-xl shadow-lg relative overflow-hidden group hover:bg-wb-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Trophy size={24} />
                      {isClosing ? 'FINALIZING...' : (auction.highest_bidder === currentAccount?.address ? 'CLAIM YOUR NFT' : 'FINALIZE AUCTION')}
                    </span>
                  </motion.button>
                )}

                {/* Place bid - only if auction not expired */}
                {auction.is_active && !isExpired && !isCreator && currentAccount && (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsBidModalOpen(true)}
                    className="w-full bg-wb-accent text-black font-black text-lg py-5 rounded-xl shadow-lg relative overflow-hidden group hover:bg-wb-accent/90 transition-all"
                    style={{ boxShadow: '0 0 40px rgba(107, 255, 59, 0.4)' }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Gavel size={24} />
                      PLACE BID
                    </span>
                  </motion.button>
                )}

                {auction.is_active && isCreator && !isExpired && (
                  <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6 text-center backdrop-blur-sm">
                    <p className="text-gray-400">Your auction • Anyone can finalize it when timer expires</p>
                  </div>
                )}

                {!auction.is_active && (
                  <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6 text-center backdrop-blur-sm">
                    <p className="text-gray-400 font-semibold">This auction has ended</p>
                  </div>
                )}

                {auction.is_active && !isExpired && !currentAccount && (
                  <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-wb-accent/30 rounded-xl p-6 text-center backdrop-blur-sm">
                    <p className="text-gray-300">Connect your wallet to place a bid</p>
                  </div>
                )}
                
                {auction.is_active && isExpired && !currentAccount && (
                  <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-wb-accent/30 rounded-xl p-6 text-center backdrop-blur-sm">
                    <p className="text-gray-300">
                      {showFinalizeButton 
                        ? 'Connect your wallet to finalize this auction' 
                        : 'Auction ended - syncing blockchain state...'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {auction && (
        <PlaceBidModal
          isOpen={isBidModalOpen}
          onClose={() => setIsBidModalOpen(false)}
          auction={auction}
        />
      )}
    </>
  );
}
