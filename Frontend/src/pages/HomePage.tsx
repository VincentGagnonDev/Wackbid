import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import Hero from '../components/Hero';
import AuctionCard from '../components/auctions/AuctionCard';
import CreateAuctionModal from '../components/auctions/CreateAuctionModal';
import { useAuctions } from '../hooks/useAuctions';
import { PACKAGE_ID } from '../config/constants';

export default function HomePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const currentAccount = useCurrentAccount();
  const { data: auctions, isLoading, error } = useAuctions();

  const isConfigured = PACKAGE_ID !== 'TO_BE_DEPLOYED';

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Hero />
        
        {/* Active Auctions Section */}
        <section className="flex-1 w-full bg-wb-bg/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-wb-ink font-display">Active Auctions</h2>
              {currentAccount && isConfigured && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-primary"
                >
                  Create Auction
                </button>
              )}
            </div>

            {!isConfigured && (
              <div className="bg-wb-card border border-wb-accent/20 rounded-lg p-8 text-center">
                <p className="text-xl mb-2">⚠️ Configuration Required</p>
                <p className="text-wb-ink/60 mb-4">
                  Please configure your package ID in the .env file
                </p>
                <div className="text-left max-w-lg mx-auto bg-wb-bg rounded p-4 text-sm font-mono">
                  <p className="text-wb-accent mb-1">VITE_PACKAGE_ID=your_package_id</p>
                  <p className="text-wb-accent">VITE_AUCTION_HOUSE_ID=your_auction_house_id</p>
                </div>
              </div>
            )}

            {isConfigured && isLoading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-wb-accent"></div>
                <p className="mt-4 text-wb-ink/60">Loading auctions...</p>
              </div>
            )}

            {isConfigured && error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
                <p className="text-red-500">Error loading auctions. Please try again.</p>
              </div>
            )}

            {isConfigured && !isLoading && !error && auctions && auctions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-wb-ink/60">No active auctions yet</p>
                {currentAccount && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary mt-4"
                  >
                    Create the First Auction
                  </button>
                )}
              </div>
            )}

            {isConfigured && !isLoading && !error && auctions && auctions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
                {auctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <CreateAuctionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}