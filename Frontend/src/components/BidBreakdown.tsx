import { calculateBidBreakdown } from '../lib/sui-transactions';
import { PLATFORM_FEE_BPS, BPS_DIVISOR } from '../config/constants';

interface BidBreakdownProps {
  bidAmount: number;
  className?: string;
}

/**
 * Component to display bid breakdown with platform fee
 */
export function BidBreakdown({ bidAmount, className = '' }: BidBreakdownProps) {
  const breakdown = calculateBidBreakdown(bidAmount);
  const feePercentage = ((PLATFORM_FEE_BPS / BPS_DIVISOR) * 100).toFixed(1);

  return (
    <div className={`bg-gray-50 rounded-lg p-4 space-y-2 ${className}`}>
      <h4 className="font-semibold text-sm text-gray-700">Bid Breakdown</h4>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Bid Amount:</span>
          <span className="font-medium">{breakdown.totalAmount.toFixed(4)} SUI</span>
        </div>
        
        <div className="flex justify-between text-red-600">
          <span>Platform Fee ({feePercentage}%):</span>
          <span className="font-medium">-{breakdown.platformFee.toFixed(4)} SUI</span>
        </div>
        
        <div className="border-t border-gray-300 pt-1 mt-1"></div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Your Deposit:</span>
          <span className="font-semibold">{breakdown.depositAmount.toFixed(4)} SUI</span>
        </div>
        
        <div className="mt-2 p-2 bg-wb-accent/10 border border-wb-accent/30 rounded">
          <p className="text-xs text-wb-accent">
            ✨ If outbid, you'll receive back: <strong>{breakdown.refundIfOutbid.toFixed(4)} SUI</strong>
          </p>
          <p className="text-xs text-gray-300 mt-1">
            The {feePercentage}% platform fee is non-refundable.
          </p>
        </div>
      </div>
    </div>
  );
}

interface SimpleBidBreakdownProps {
  bidAmount: number;
}

/**
 * Simple inline bid breakdown display
 */
export function SimpleBidBreakdown({ bidAmount }: SimpleBidBreakdownProps) {
  const breakdown = calculateBidBreakdown(bidAmount);
  
  return (
    <div className="text-sm text-gray-600">
      <span>Fee: {breakdown.platformFee.toFixed(4)} SUI</span>
      {' • '}
      <span>Deposit: {breakdown.depositAmount.toFixed(4)} SUI</span>
    </div>
  );
}
