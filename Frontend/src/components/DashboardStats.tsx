import { useDashboardStats } from '../hooks/useDashboard';
import { formatSui } from '../lib/sui-transactions';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

/**
 * Dashboard statistics component
 */
export function DashboardStats() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load dashboard statistics</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Auctions"
        value={stats?.totalAuctionsCreated || 0}
        icon="📊"
        loading={isLoading}
      />
      <StatCard
        title="Active Auctions"
        value={stats?.activeAuctionsCount || 0}
        icon="🔥"
        loading={isLoading}
      />
      <StatCard
        title="Closed Auctions"
        value={stats?.closedAuctionsCount || 0}
        icon="✅"
        loading={isLoading}
      />
      <StatCard
        title="Total Volume"
        value={stats?.totalSuiProcessedFormatted || '0.00 SUI'}
        icon="💰"
        loading={isLoading}
      />
    </div>
  );
}

interface CompactDashboardStatsProps {
  className?: string;
}

/**
 * Compact version of dashboard statistics
 */
export function CompactDashboardStats({ className = '' }: CompactDashboardStatsProps) {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className={`flex gap-6 ${className}`}>
        <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className={`flex gap-6 text-sm ${className}`}>
      <div>
        <span className="text-gray-600">Active: </span>
        <span className="font-semibold">{stats?.activeAuctionsCount || 0}</span>
      </div>
      <div>
        <span className="text-gray-600">Closed: </span>
        <span className="font-semibold">{stats?.closedAuctionsCount || 0}</span>
      </div>
      <div>
        <span className="text-gray-600">Volume: </span>
        <span className="font-semibold">{stats?.totalSuiProcessedFormatted || '0.00'}</span>
      </div>
    </div>
  );
}
