import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AdminStats, ComparisonStats, GenreItem, MonthlyPoint, PeriodFilter, RecentContract, RecentUser } from './types';

const EMPTY_STATS: AdminStats = {
  totalUsers: 0,
  performerCount: 0,
  clientCount: 0,
  performerProfileCount: 0,
  totalRequests: 0,
  matchedRequests: 0,
  totalApplications: 0,
  acceptedApplications: 0,
  totalQuotes: 0,
  acceptedQuotes: 0,
  totalRevenue: 0,
  totalReviews: 0,
  totalSchedules: 0,
  monthlyRevenue: [],
  monthlySignups: [],
  genreDistribution: [],
  recentUsers: [],
  recentContracts: [],
  comparison: null,
};

interface CountOpts {
  eq?: { column: string; value: string };
  gte?: { column: string; value: string };
  lte?: { column: string; value: string };
}

async function countOf(table: string, opts?: CountOpts) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (opts?.eq) query = query.eq(opts.eq.column, opts.eq.value);
  if (opts?.gte) query = query.gte(opts.gte.column, opts.gte.value);
  if (opts?.lte) query = query.lte(opts.lte.column, opts.lte.value);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function startOfDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function lastSixMonths(): { key: string; label: string }[] {
  const now = new Date();
  const arr: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push({
      key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
      label: `${d.getMonth() + 1}월`,
    });
  }
  return arr;
}

function lastDays(days: number): { key: string; label: string }[] {
  const now = new Date();
  const arr: { key: string; label: string }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    arr.push({
      key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
    });
  }
  return arr;
}

function dailyBuckets(start: Date, end: Date): { key: string; label: string }[] {
  const arr: { key: string; label: string }[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    arr.push({
      key: `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`,
      label: `${cur.getMonth() + 1}/${cur.getDate()}`,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return arr;
}

function monthlyBuckets(start: Date, end: Date): { key: string; label: string }[] {
  const arr: { key: string; label: string }[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    arr.push({
      key: `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}`,
      label: `${cur.getMonth() + 1}월`,
    });
    cur.setMonth(cur.getMonth() + 1);
  }
  return arr;
}

function monthKeyOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function dayKeyOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function computeRange(
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string,
): { start: string | null; end: string | null } {
  if (period === 'custom') {
    return {
      start: customStart ? startOfDay(customStart) : null,
      end: customEnd ? endOfDay(customEnd) : null,
    };
  }
  if (period === 'all') return { start: null, end: null };
  const days = period === '7d' ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return { start: d.toISOString(), end: null };
}

function computePreviousRange(
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string,
): { start: string | null; end: string | null } {
  if (period === 'all') return { start: null, end: null };
  if (period === 'custom') {
    if (!customStart || !customEnd) return { start: null, end: null };
    const curStart = new Date(startOfDay(customStart));
    const curEnd = new Date(endOfDay(customEnd));
    const duration = curEnd.getTime() - curStart.getTime();
    const prevEnd = new Date(curStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { start: prevStart.toISOString(), end: prevEnd.toISOString() };
  }
  const days = period === '7d' ? 7 : 30;
  const now = new Date();
  const prevEnd = new Date(now.getTime() - days * 86400000);
  const prevStart = new Date(prevEnd.getTime() - days * 86400000);
  return { start: prevStart.toISOString(), end: prevEnd.toISOString() };
}

export function useAdminStats(period: PeriodFilter, customStart?: string, customEnd?: string) {
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [granularity, setGranularity] = useState<'day' | 'month'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = computeRange(period, customStart, customEnd);
      const gte = start ? { column: 'created_at', value: start } : undefined;
      const lte = end ? { column: 'created_at', value: end } : undefined;

      const totalUsers = await countOf('users', { gte, lte });
      const performerCount = await countOf('users', { eq: { column: 'role', value: 'performer' }, gte, lte });
      const clientCount = await countOf('users', { eq: { column: 'role', value: 'client' }, gte, lte });
      const totalRequests = await countOf('performance_requests', { gte, lte });
      const matchedRequests = await countOf('performance_requests', {
        eq: { column: 'status', value: 'matched' },
        gte,
        lte,
      });
      const totalApplications = await countOf('applications', { gte, lte });
      const acceptedApplications = await countOf('applications', {
        eq: { column: 'status', value: 'accepted' },
        gte,
        lte,
      });
      const totalQuotes = await countOf('quotes', { gte, lte });
      const acceptedQuotes = await countOf('quotes', {
        eq: { column: 'status', value: 'accepted' },
        gte,
        lte,
      });
      const totalReviews = await countOf('reviews', { gte, lte });
      const totalSchedules = await countOf('schedules', { gte, lte });

      let profileQuery = supabase.from('performer_profiles').select('genre');
      if (start) profileQuery = profileQuery.gte('created_at', start);
      if (end) profileQuery = profileQuery.lte('created_at', end);
      const { data: profiles } = await profileQuery;

      const genreMap = new Map<string, number>();
      (profiles ?? []).forEach((p: Record<string, unknown>) => {
        const genres = p.genre as string[] | null;
        (genres ?? []).forEach((g) => {
          if (g) genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
        });
      });
      const genreDistribution: GenreItem[] = Array.from(genreMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      let totalRevenue = 0;
      let acceptedQuoteQuery = supabase
        .from('quotes')
        .select('proposed_fee, created_at')
        .eq('status', 'accepted');
      if (start) acceptedQuoteQuery = acceptedQuoteQuery.gte('created_at', start);
      if (end) acceptedQuoteQuery = acceptedQuoteQuery.lte('created_at', end);
      const { data: acceptedQuoteRows } = await acceptedQuoteQuery;
      (acceptedQuoteRows ?? []).forEach((q: Record<string, unknown>) => {
        const fee = q.proposed_fee != null ? Number(q.proposed_fee) : 0;
        if (!Number.isNaN(fee)) totalRevenue += fee;
      });

      let recentUsersQuery = supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(6);
      if (start) recentUsersQuery = recentUsersQuery.gte('created_at', start);
      if (end) recentUsersQuery = recentUsersQuery.lte('created_at', end);
      const { data: recentUsersRows } = await recentUsersQuery;
      const recentUsers: RecentUser[] = (recentUsersRows ?? []).map(
        (u: Record<string, unknown>) => ({
          id: String(u.id),
          name: String(u.name ?? '—'),
          email: String(u.email ?? ''),
          role: (u.role as RecentUser['role']) || 'client',
          createdAt: String(u.created_at ?? ''),
        }),
      );

      let recentContractQuery = supabase
        .from('quotes')
        .select('id, title, client_name, performer_name, proposed_fee, created_at')
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(6);
      if (start) recentContractQuery = recentContractQuery.gte('created_at', start);
      if (end) recentContractQuery = recentContractQuery.lte('created_at', end);
      const { data: recentContractRows } = await recentContractQuery;
      const recentContracts: RecentContract[] = (recentContractRows ?? []).map(
        (q: Record<string, unknown>) => ({
          id: String(q.id),
          title: String(q.title ?? '공연 계약'),
          clientName: String(q.client_name ?? '—'),
          performerName: String(q.performer_name ?? '—'),
          fee: q.proposed_fee != null ? Number(q.proposed_fee) : 0,
          createdAt: String(q.created_at ?? ''),
        }),
      );

      let buckets: { key: string; label: string }[];
      let bucketKeyOf: (iso: string) => string;
      let gran: 'day' | 'month' = 'month';

      if (period === 'all') {
        buckets = lastSixMonths();
        bucketKeyOf = monthKeyOf;
      } else if (period === 'custom') {
        const s = start ? new Date(start) : null;
        const e = end ? new Date(end) : null;
        if (s && e) {
          const days = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
          if (days <= 45) {
            buckets = dailyBuckets(s, e);
            bucketKeyOf = dayKeyOf;
            gran = 'day';
          } else {
            buckets = monthlyBuckets(s, e);
            bucketKeyOf = monthKeyOf;
            gran = 'month';
          }
        } else {
          buckets = lastDays(30);
          bucketKeyOf = dayKeyOf;
          gran = 'day';
        }
      } else {
        buckets = lastDays(period === '7d' ? 7 : 30);
        bucketKeyOf = dayKeyOf;
        gran = 'day';
      }

      let signupQuery = supabase.from('users').select('created_at');
      if (start) signupQuery = signupQuery.gte('created_at', start);
      if (end) signupQuery = signupQuery.lte('created_at', end);
      const { data: signupRows } = await signupQuery;

      const monthlyRevenue: MonthlyPoint[] = buckets.map((b) => ({ label: b.label, value: 0 }));
      const monthlySignups: MonthlyPoint[] = buckets.map((b) => ({ label: b.label, value: 0 }));
      const revIndex = new Map(buckets.map((b, i) => [b.key, i]));
      const signIndex = new Map(buckets.map((b, i) => [b.key, i]));

      (acceptedQuoteRows ?? []).forEach((q: Record<string, unknown>) => {
        const fee = q.proposed_fee != null ? Number(q.proposed_fee) : 0;
        const idx = revIndex.get(bucketKeyOf(String(q.created_at ?? '')));
        if (idx != null && !Number.isNaN(fee)) monthlyRevenue[idx].value += fee;
      });

      (signupRows ?? []).forEach((u: Record<string, unknown>) => {
        const idx = signIndex.get(bucketKeyOf(String(u.created_at ?? '')));
        if (idx != null) monthlySignups[idx].value += 1;
      });

      const prevRange = computePreviousRange(period, customStart, customEnd);
      let comparison: ComparisonStats | null = null;
      if (prevRange.start) {
        const pgte = { column: 'created_at', value: prevRange.start };
        const plte = prevRange.end ? { column: 'created_at', value: prevRange.end } : undefined;
        const [pUsers, pRequests, pApplications, pAcceptedApplications] = await Promise.all([
          countOf('users', { gte: pgte, lte: plte }),
          countOf('performance_requests', { gte: pgte, lte: plte }),
          countOf('applications', { gte: pgte, lte: plte }),
          countOf('applications', {
            eq: { column: 'status', value: 'accepted' },
            gte: pgte,
            lte: plte,
          }),
        ]);
        let prevQuoteQuery = supabase
          .from('quotes')
          .select('proposed_fee')
          .eq('status', 'accepted')
          .gte('created_at', prevRange.start);
        if (prevRange.end) prevQuoteQuery = prevQuoteQuery.lte('created_at', prevRange.end);
        const { data: prevQuoteRows } = await prevQuoteQuery;
        let prevRevenue = 0;
        (prevQuoteRows ?? []).forEach((q: Record<string, unknown>) => {
          const fee = q.proposed_fee != null ? Number(q.proposed_fee) : 0;
          if (!Number.isNaN(fee)) prevRevenue += fee;
        });
        comparison = {
          totalUsers: pUsers,
          totalRevenue: prevRevenue,
          totalRequests: pRequests,
          totalApplications: pApplications,
          acceptedApplications: pAcceptedApplications,
        };
      }

      setGranularity(gran);
      setStats({
        totalUsers,
        performerCount,
        clientCount,
        performerProfileCount: profiles?.length ?? 0,
        totalRequests,
        matchedRequests,
        totalApplications,
        acceptedApplications,
        totalQuotes,
        acceptedQuotes,
        totalRevenue,
        totalReviews,
        totalSchedules,
        monthlyRevenue,
        monthlySignups,
        genreDistribution,
        recentUsers,
        recentContracts,
        comparison,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '통계를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, reload: load, granularity };
}