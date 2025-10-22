import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Auction } from '../../types/auction';
import { Clock } from 'lucide-react';

interface ClosedAuctionCardProps {
  auction: Auction;
}

export default function ClosedAuctionCard({ auction }: ClosedAuctionCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/auction/${auction.id}`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      className="card overflow-hidden cursor-pointer"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
    >
      {/* Content */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold truncate">{auction.title}</h3>

        {/* Closed Date */}
        <div className="flex items-center gap-2 text-sm text-wb-ink/60">
          <Clock className="w-4 h-4" />
          <span>Closed: {formatDate(auction.endTime)}</span>
        </div>

        {/* View Details Button */}
        <button 
          onClick={handleCardClick}
          className="w-full btn-secondary text-sm"
        >
          View Details
        </button>
      </div>
    </motion.div>
  );
}
