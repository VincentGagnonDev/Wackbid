import { useCurrentAccount } from '@mysten/dapp-kit';
import { useUserRanking } from '../hooks/useLeaderboard';
import { getRankDisplay, getRankMedal } from '../lib/leaderboard';

export default function UserRankingBadge() {
  const account = useCurrentAccount();
  const { data: ranking, isLoading } = useUserRanking(account?.address);

  if (!account || isLoading || !ranking) return null;

  if (!ranking.isRanked) {
    return (
      <div className="card text-center h-full flex flex-col justify-center">
        <p className="text-wb-ink/60 font-body">Not in top 100</p>
        <p className="text-sm text-wb-ink/40 mt-1 font-body">Win an auction to get ranked!</p>
      </div>
    );
  }

  const bestRank = Math.min(
    ranking.rankByAuctions > 0 ? ranking.rankByAuctions : 999,
    ranking.rankByVolume > 0 ? ranking.rankByVolume : 999
  );

  const medal = getRankMedal(bestRank);
  const isTop10 = bestRank <= 10;

  return (
    <div className={`card h-full ${isTop10 ? 'border-wb-accent' : ''}`}>
      <div className="text-center h-full flex flex-col justify-center">
        <div className="text-4xl mb-2">{medal || '🏆'}</div>
        <div className="text-sm text-wb-ink/60 font-body">Your Best Rank</div>
        <div className="text-3xl font-bold mb-4 font-display">{getRankDisplay(bestRank)}</div>
        
        <div className="space-y-2 text-sm">
          {ranking.rankByAuctions > 0 && (
            <div className="flex justify-between">
              <span className="text-wb-ink/60 font-body">By Wins:</span>
              <span className="font-medium font-body">#{ranking.rankByAuctions}</span>
            </div>
          )}
          {ranking.rankByVolume > 0 && (
            <div className="flex justify-between">
              <span className="text-wb-ink/60 font-body">By Volume:</span>
              <span className="font-medium font-body">#{ranking.rankByVolume}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
