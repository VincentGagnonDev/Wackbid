import { useState } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { formatAddress, getRankMedal } from '../lib/leaderboard';
import { mistToSui } from '../lib/sui-transactions';
import { Trophy, TrendingUp } from 'lucide-react';
import type { LeaderboardEntry } from '../types/auction';

type LeaderboardTab = 'auctions' | 'volume';

export default function LeaderboardCard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('auctions');
  const { data, isLoading } = useLeaderboard(10);

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-wb-bg rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const entries = activeTab === 'auctions' ? data.byAuctionsWon : data.byVolumeWon;
  const displayEntries = entries.slice(0, 10);

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-display">Leaderboard</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('auctions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors font-body ${
              activeTab === 'auctions'
                ? 'bg-wb-accent text-wb-bg'
                : 'bg-wb-bg text-wb-ink hover:bg-wb-bg/50'
            }`}
          >
            <Trophy className="w-4 h-4 inline-block mr-1" />
            By Wins
          </button>
          <button
            onClick={() => setActiveTab('volume')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors font-body ${
              activeTab === 'volume'
                ? 'bg-wb-accent text-wb-bg'
                : 'bg-wb-bg text-wb-ink hover:bg-wb-bg/50'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline-block mr-1" />
            By Volume
          </button>
        </div>
      </div>

      {displayEntries.length === 0 ? (
        <div className="text-center py-12 text-wb-ink/60">
          <p className="font-body">No users ranked yet</p>
          <p className="text-sm mt-2 font-body">Win an auction to appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayEntries.map((entry, index) => (
            <LeaderboardRow
              key={entry.user}
              entry={entry}
              rank={index + 1}
              activeTab={activeTab}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  activeTab: LeaderboardTab;
}

function LeaderboardRow({ entry, rank, activeTab }: LeaderboardRowProps) {
  const medal = getRankMedal(rank);
  const isTop3 = rank <= 3;

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg ${
        isTop3
          ? 'bg-gradient-to-r from-wb-accent/10 to-transparent'
          : 'bg-wb-bg/50 hover:bg-wb-bg'
      } transition-colors`}
    >
      <div className={`w-12 text-center font-bold font-body ${isTop3 ? 'text-xl' : 'text-wb-ink/60'}`}>
        {medal || `#${rank}`}
      </div>

      <div className="flex-1 font-mono text-sm font-body">
        {formatAddress(entry.user)}
      </div>

      <div className="text-right">
        <div className="font-bold font-body">
          {activeTab === 'auctions'
            ? `${entry.auctions_won} ${entry.auctions_won === 1 ? 'win' : 'wins'}`
            : `${mistToSui(entry.volume_won).toFixed(2)} SUI`}
        </div>
      </div>
    </div>
  );
}
