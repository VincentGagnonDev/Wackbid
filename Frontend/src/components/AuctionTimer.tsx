import { useEffect, useState } from 'react';
import { hasAuctionEnded, getTimeRemaining, formatTimeRemaining } from '../lib/sui-transactions';

interface AuctionTimerProps {
  endTime: number;
  className?: string;
  onExpire?: () => void;
}

/**
 * Component to display auction countdown timer
 */
export function AuctionTimer({ endTime, className = '', onExpire }: AuctionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(endTime));
  const [hasEnded, setHasEnded] = useState(hasAuctionEnded(endTime));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(endTime);
      const ended = hasAuctionEnded(endTime);
      
      setTimeRemaining(remaining);
      
      if (ended && !hasEnded) {
        setHasEnded(true);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, hasEnded, onExpire]);

  if (hasEnded) {
    return (
      <div className={`text-red-600 font-semibold ${className}`}>
        Ended
      </div>
    );
  }

  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2">
        <div className="font-mono font-semibold text-wb-accent">
          {days > 0 && <span>{days}d </span>}
          {(days > 0 || hours > 0) && <span>{hours}h </span>}
          <span>{minutes}m </span>
          <span>{seconds}s</span>
        </div>
      </div>
    </div>
  );
}

interface SimpleTimerProps {
  endTime: number;
}

/**
 * Simple compact timer display
 */
export function SimpleTimer({ endTime }: SimpleTimerProps) {
  const [formatted, setFormatted] = useState(formatTimeRemaining(endTime));
  const [ended, setEnded] = useState(hasAuctionEnded(endTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setFormatted(formatTimeRemaining(endTime));
      setEnded(hasAuctionEnded(endTime));
    }, 1000); // Update every second for real-time countdown

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <span className={ended ? 'text-red-500 font-semibold' : 'text-wb-ink/70 font-mono'}>
      {formatted}
    </span>
  );
}
