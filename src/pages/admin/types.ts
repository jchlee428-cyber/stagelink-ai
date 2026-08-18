export type PeriodFilter = '7d' | '30d' | 'all' | 'custom';

export interface GenreItem {
  name: string;
  count: number;
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: 'performer' | 'client' | 'admin';
  createdAt: string;
}

export interface RecentContract {
  id: string;
  title: string;
  clientName: string;
  performerName: string;
  fee: number;
  createdAt: string;
}

export interface MonthlyPoint {
  label: string;
  value: number;
}

export interface ComparisonStats {
  totalUsers: number;
  totalRevenue: number;
  totalRequests: number;
  totalApplications: number;
  acceptedApplications: number;
}

export interface AdminStats {
  totalUsers: number;
  performerCount: number;
  clientCount: number;
  performerProfileCount: number;
  totalRequests: number;
  matchedRequests: number;
  totalApplications: number;
  acceptedApplications: number;
  totalQuotes: number;
  acceptedQuotes: number;
  totalRevenue: number;
  totalReviews: number;
  totalSchedules: number;
  monthlyRevenue: MonthlyPoint[];
  monthlySignups: MonthlyPoint[];
  genreDistribution: GenreItem[];
  recentUsers: RecentUser[];
  recentContracts: RecentContract[];
  comparison: ComparisonStats | null;
}