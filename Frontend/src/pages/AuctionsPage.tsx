import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import AuctionCard from '../components/auctions/AuctionCard';
import CreateAuctionModal from '../components/auctions/CreateAuctionModal';
import { useAuctions } from '../hooks/useAuctions';
import { PACKAGE_ID } from '../config/constants';

export default function AuctionsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const currentAccount = useCurrentAccount();
  const { data: auctions, isLoading, error } = useAuctions();

  const isConfigured = PACKAGE_ID !== 'TO_BE_DEPLOYED';

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">All Auctions</h1>
          {currentAccount && isConfigured && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
            >
              Create Auction
            </button>
          )}
        </div>
        
        {/* Filters - TODO: Implement filtering */}
        <div className="mb-8">
          {/* Add filter components here */}
        </div>

        {!isConfigured && (
          <div className="bg-wb-card border border-wb-accent/20 rounded-lg p-8 text-center">
            <p className="text-xl mb-2">⚠️ Configuration Required</p>
            <p className="text-wb-ink/60">
              Please configure your package and dashboard IDs to view auctions
            </p>
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
            <p className="text-xl text-wb-ink/60">No auctions found</p>
          </div>
        )}
        
        {/* Auctions Grid */}
        {isConfigured && !isLoading && !error && auctions && auctions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </div>

      <CreateAuctionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}