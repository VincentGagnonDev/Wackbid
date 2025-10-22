import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuctions } from '../hooks/useAuctions';
import { AuctionTimer } from './AuctionTimer';
import wackoLogo from '../assets/wacko_logo.gif';

function Hero() {
  const { data: auctions, isLoading } = useAuctions();
  
  // Get the latest auction (most recently created)
  const latestAuction = auctions && auctions.length > 0 ? auctions[auctions.length - 1] : null;

  return (
    <div className="relative min-h-[90vh] w-full flex items-center bg-wb-bg overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-radial from-wb-accent/5 to-transparent opacity-30" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-wb-accent/20 rounded-full filter blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-wb-accent/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-20">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
              Wack <span className="glow-text">Bid</span>,<br />
              Win <span className="glow-text">Big</span>
            </h1>
            <p className="text-xl mb-10 text-wb-ink/80">
              The most entertaining auction platform on the Sui Network.
              Join the fun and start bidding & winning today!
            </p>
            <Link to="/auctions">
              <motion.button
                className="btn-primary text-lg px-8 py-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Auctions
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="card bg-wb-bg/40 backdrop-blur-lg"
          >
            {isLoading ? (
              <>
                <div className="aspect-square rounded-xl bg-wb-accent/10 mb-6 overflow-hidden animate-pulse">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-wb-accent/30 text-lg">Loading...</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">Featured Auction</h3>
                <p className="text-wb-ink/60">Loading latest auction...</p>
              </>
            ) : latestAuction ? (
              <Link to={`/auction/${latestAuction.id}`} className="block group">
                <div className="aspect-square rounded-xl bg-wb-card mb-6 overflow-hidden">
                  {latestAuction.imageUrl ? (
                    <img
                      src={latestAuction.imageUrl}
                      alt={latestAuction.title || 'NFT'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = wackoLogo;
                      }}
                    />
                  ) : (
                    <img
                      src={wackoLogo}
                      alt="Wacko Logo"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-wb-accent font-semibold uppercase tracking-wider">
                      Latest Auction
                    </span>
                    <AuctionTimer endTime={latestAuction.expiry_time} className="text-sm" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-wb-accent transition-colors">
                    {latestAuction.title || `Auction #${latestAuction.id.slice(0, 8)}...`}
                  </h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-wb-ink/60 mb-1">Highest Bid</p>
                    <p className="text-2xl font-bold text-wb-accent">
                      {latestAuction.highest_bid > 0
                        ? `${(latestAuction.highest_bid / 1_000_000_000).toFixed(4)} SUI`
                        : 'No bids yet'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-wb-ink/60 mb-1">Status</p>
                    <p className="text-xl font-bold">{latestAuction.is_active ? '🟢 Live' : '⚫ Ended'}</p>
                  </div>
                </div>
                <motion.div
                  className="mt-6 text-center text-sm text-wb-accent group-hover:underline"
                  whileHover={{ x: 5 }}
                >
                  View Auction →
                </motion.div>
              </Link>
            ) : (
              <>
                <div className="aspect-square rounded-xl bg-wb-accent/10 mb-6 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-wb-accent/30 text-lg">No Auctions Yet</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">Featured Auction</h3>
                <p className="text-wb-ink/60">Create the first auction to get started!</p>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Hero;