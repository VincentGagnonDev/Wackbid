import { useCurrentAccount } from '@mysten/dapp-kit';
import { useUserStats, useUserActivity } from '../hooks/useUserStats';
import { mistToSui } from '../lib/sui-transactions';

export default function UserStatsCard() {
  const account = useCurrentAccount();
  const { data: stats, isLoading: statsLoading } = useUserStats(account?.address);
  const { data: activity, isLoading: activityLoading } = useUserActivity(account?.address);

  if (!account) {
    return (
      <div className="card text-center text-wb-ink/60">
        <p className="font-body">Connect your wallet to view your stats</p>
      </div>
    );
  }

  if (statsLoading || activityLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-wb-bg rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-wb-bg rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const winRate =
    stats.totalBidsPlaced > 0
      ? ((stats.totalAuctionsWon / stats.totalBidsPlaced) * 100).toFixed(1)
      : '0';

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 font-display">Your Stats</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Bids Placed"
          value={stats.totalBidsPlaced}
        />
        <StatCard
          label="Auctions Won"
          value={stats.totalAuctionsWon}
          highlight
        />
        <StatCard
          label="Times Outbid"
          value={stats.totalOutbidCount}
        />
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
        />
        <StatCard
          label="Volume Bid"
          value={`${mistToSui(stats.totalVolumeBid).toFixed(2)} SUI`}
        />
        <StatCard
          label="Volume Won"
          value={`${mistToSui(stats.totalVolumeWon).toFixed(2)} SUI`}
          highlight
        />
        <StatCard
          label="Auctions Created"
          value={stats.totalAuctionsCreated}
        />
        {activity && (
          <StatCard
            label="Active Bids"
            value={activity.activeBids.length}
            highlight={activity.activeBids.length > 0}
          />
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

function StatCard({ label, value, highlight }: StatCardProps) {
  return (
    <div className="bg-wb-bg/50 rounded-lg p-4 border border-wb-accent/10 hover:border-wb-accent/30 transition-colors">
      <div className="text-xs text-wb-ink/60 mb-1 font-body">{label}</div>
      <div className={`text-2xl font-bold font-body ${highlight ? 'text-wb-accent' : ''}`}>
        {value}
      </div>
    </div>
  );
}
