import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { formatSui } from '../lib/sui-transactions';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingDown, History, Gavel } from 'lucide-react';

interface BidHistoryEntry {
  bidder: string;
  amount: number;
  timestamp: number;
  isHighest: boolean;
  isOutbid: boolean;
}

interface ParticipantsListProps {
  auctionId: string;
  participants: string[];
  highestBidder: string;
  currentBid: number;
  packageId: string;
}

export default function ParticipantsList({ 
  auctionId, 
  participants, 
  highestBidder, 
  currentBid,
  packageId 
}: ParticipantsListProps) {
  const client = useSuiClient();
  const [bidHistory, setBidHistory] = useState<BidHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBidHistory();
  }, [auctionId, currentBid]); // Refresh when currentBid changes (new bid placed)

  const fetchBidHistory = async () => {
    try {
      setIsLoading(true);

      console.log('=== Participants List Debug ===');
      console.log('Auction ID:', auctionId);
      console.log('Participants:', participants);
      console.log('Highest Bidder:', highestBidder);
      console.log('Current Bid:', currentBid);

      // Query events for bid transactions on this auction
      const events = await client.queryEvents({
        query: {
          MoveEventType: `${packageId}::auctions::BidPlaced`
        },
      });

      // Filter events for this specific auction and parse them
      const auctionBids: BidHistoryEntry[] = [];
      
      // If we don't have events, create entries from participants array
      if (!events.data || events.data.length === 0) {
        // Fallback: Show participants without detailed bid info
        participants.forEach((participant, index) => {
          const isHighest = participant.toLowerCase() === highestBidder.toLowerCase();
          console.log(`Comparing: ${participant} === ${highestBidder} => ${isHighest}`);
          
          auctionBids.push({
            bidder: participant,
            amount: isHighest ? currentBid : 0,
            timestamp: Date.now() - (participants.length - index) * 60000, // Estimate
            isHighest: isHighest,
            isOutbid: !isHighest,
          });
        });
      } else {
        // Parse actual events
        events.data.forEach((event: any) => {
          const parsedJson = event.parsedJson;
          if (parsedJson && parsedJson.auction_id === auctionId) {
            const isHighest = parsedJson.bidder.toLowerCase() === highestBidder.toLowerCase();
            auctionBids.push({
              bidder: parsedJson.bidder,
              amount: Number(parsedJson.amount) || 0,
              timestamp: Number(event.timestampMs) || Date.now(),
              isHighest: isHighest,
              isOutbid: !isHighest,
            });
          }
        });
      }

      // Sort by amount (highest first), then by timestamp (most recent first)
      const sorted = auctionBids.sort((a, b) => {
        if (a.isHighest) return -1;
        if (b.isHighest) return 1;
        if (a.amount !== b.amount) return b.amount - a.amount;
        return b.timestamp - a.timestamp;
      });

      console.log('Final sorted bid history:', sorted);
      setBidHistory(sorted);
    } catch (error) {
      console.error('Error fetching bid history:', error);
      
      // Fallback to participants list
      const fallbackBids: BidHistoryEntry[] = participants.map((participant, index) => {
        const isHighest = participant.toLowerCase() === highestBidder.toLowerCase();
        return {
          bidder: participant,
          amount: isHighest ? currentBid : 0,
          timestamp: Date.now() - (participants.length - index) * 60000,
          isHighest: isHighest,
          isOutbid: !isHighest,
        };
      });
      
      setBidHistory(fallbackBids.sort((a, b) => a.isHighest ? -1 : 1));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (participants.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-wb-accent/20 rounded-2xl p-8"
        style={{ boxShadow: '0 0 30px rgba(0, 255, 136, 0.1)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <History className="text-wb-accent" size={24} />
          <h2 className="text-2xl font-black text-white font-display">Bid History</h2>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <Gavel className="text-gray-600" size={32} />
          </div>
          <p className="text-gray-400 font-body">No bids yet. Be the first to bid!</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-wb-accent/20 rounded-2xl p-6 md:p-8"
      style={{ boxShadow: '0 0 30px rgba(0, 255, 136, 0.1)' }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History className="text-wb-accent" size={24} />
          <h2 className="text-2xl font-black text-white font-display">
            Bid History <span className="text-gray-500">({participants.length})</span>
          </h2>
        </div>
        {isLoading && (
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-wb-accent border-t-transparent"></div>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {bidHistory.map((entry, index) => (
            <motion.div
              key={`${entry.bidder}-${entry.timestamp}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01, x: 4 }}
              className={`
                relative p-5 rounded-xl border transition-all overflow-hidden group
                ${entry.isHighest 
                  ? 'bg-gradient-to-r from-wb-accent/20 to-transparent border-wb-accent/50' 
                  : 'bg-gray-900/30 border-gray-700/50 hover:border-wb-accent/30'
                }
              `}
              style={{
                boxShadow: entry.isHighest 
                  ? '0 0 20px rgba(0, 255, 136, 0.2)' 
                  : '0 4px 10px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Glow effect for highest bidder */}
              {entry.isHighest && (
                <motion.div 
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-r from-wb-accent/10 to-transparent"
                ></motion.div>
              )}

              <div className="relative z-10 flex items-center justify-between gap-4">
                {/* Left: Bidder Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Identicon */}
                  <div 
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                      ${entry.isHighest 
                        ? 'bg-wb-accent text-black' 
                        : 'bg-gray-700 text-white'
                      }
                    `}
                    style={entry.isHighest ? { boxShadow: '0 0 15px rgba(0, 255, 136, 0.5)' } : {}}
                  >
                    {entry.bidder.slice(2, 4).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Address */}
                    <div 
                      className={`font-mono text-sm truncate font-body ${entry.isHighest ? 'text-wb-accent font-semibold' : 'text-gray-300'}`}
                      title={entry.bidder}
                    >
                      {entry.bidder.slice(0, 10)}...{entry.bidder.slice(-8)}
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-xs text-gray-500 mt-1 font-body">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>
                </div>

                {/* Right: Bid Amount & Status */}
                <div className="flex items-center gap-4">
                  {/* Bid Amount */}
                  {entry.amount > 0 && (
                    <div className="text-right">
                      <div className={`font-bold text-lg font-display ${entry.isHighest ? 'text-wb-accent' : 'text-gray-300'}`}>
                        {formatSui(entry.amount * 1_000_000_000)} SUI
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {entry.isHighest ? (
                      <div className="flex items-center gap-1 bg-wb-accent text-black text-xs font-bold px-3 py-2 rounded-full whitespace-nowrap font-body">
                        <Trophy size={14} />
                        Leading
                      </div>
                    ) : entry.isOutbid ? (
                      <div className="flex items-center gap-1 bg-gray-700/50 text-gray-400 text-xs font-semibold px-3 py-2 rounded-full whitespace-nowrap font-body">
                        <TrendingDown size={14} />
                        Outbid
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-6 text-xs text-gray-500 text-center flex items-center justify-center gap-2 font-body">
        <span className="w-1.5 h-1.5 bg-wb-accent rounded-full animate-pulse"></span>
        Updates in real-time
      </div>
    </motion.div>
  );
}
