import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative min-h-[70vh] flex items-center">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-wb-accent/5 to-transparent opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 font-display">
              Bid <span className="text-wb-accent animate-glow">Wack</span>,<br />
              Win <span className="text-wb-accent animate-glow">Big</span>
            </h1>
            <p className="text-xl mb-8 text-wb-ink/80 font-body">
              The most entertaining auction platform on Sui Network.
              Join the fun and start bidding today!
            </p>
            <Link to="/auctions">
              <motion.button
                className="btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Auctions
              </motion.button>
            </Link>
          </motion.div>

          {/* Right Column - Featured Auction */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-wb-accent/5 rounded-2xl blur-3xl" />
            <div className="relative card">
              <div className="aspect-square rounded-xl bg-wb-accent/10 mb-4">
                {/* Placeholder for featured auction image */}
              </div>
              <h3 className="text-2xl font-bold mb-2">Featured Auction</h3>
              <p className="text-wb-ink/60">Coming soon...</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}