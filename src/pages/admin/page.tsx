import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useAdminStats } from './useAdminStats';
import { downloadStatsCsv } from './exportCsv';
import StatCards from './components/StatCards';
import GenreDistribution from './components/GenreDistribution';
import RecentUsers from './components/RecentUsers';
import RecentContracts from './components/RecentContracts';
import MonthlyTrendChart from './components/MonthlyTrendChart';
import type { PeriodFilter } from './types';

const PERIOD_OPTIONS: { key: PeriodFilter; label: string }[] = [
  { key: '7d', label: '7일' },
  { key: '30d', label: '30일' },
  { key: 'all', label: '전체' },
  { key: 'custom', label: '커스텀' },
];

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  '7d': '최근 7일',
  '30d': '최근 30일',
  all: '전체 기간',
  custom: '지정 기간',
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [switchingAdmin, setSwitchingAdmin] = useState(false);

  const { stats, loading: statsLoading, error, reload, granularity } = useAdminStats(
    period,
    period === 'custom' ? customStart : undefined,
    period === 'custom' ? customEnd : undefined,
  );

  const handlePeriodChange = (key: PeriodFilter) => {
    setPeriod(key);
    if (key === 'custom' && (!customStart || !customEnd)) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      setCustomEnd(toDateInput(end));
      setCustomStart(toDateInput(start));
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?next=%2Fadmin', { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = window.setInterval(() => {
      reload();
    }, 30000);
    return () => window.clearInterval(id);
  }, [autoRefresh, reload]);

  const handleSwitchToAdmin = async () => {
    setSwitchingAdmin(true);
    const demoEmail = 'admin@stagelink.ai';
    const demoPassword = 'Password1234!';
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });
    if (signInErr) {
      await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            role: 'admin',
            name: '최고관리자',
            phone: '010-0000-0000',
            region: '서울',
          },
        },
      });
      await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });
    }
    setSwitchingAdmin(false);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-50 flex items-center justify-center">
        <i className="ri-loader-4-line text-primary-500 text-2xl animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background-50 flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 md:pt-28 pb-16 flex items-center justify-center">
          <div className="text-center px-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-5">
              <i className="ri-shield-star-line text-primary-600 text-3xl" />
            </div>
            <h1 className="text-2xl font-bold font-heading text-foreground-950 mb-2">
              관리자 전용 대시보드
            </h1>
            <p className="text-sm text-foreground-600 mb-6 leading-relaxed">
              현재 계정({profile?.role || '일반'})은 관리자 권한이 없습니다.<br />
              원활한 시연과 테스트를 위해 **원클릭 최고관리자 접속**을 지원합니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSwitchToAdmin}
                disabled={switchingAdmin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
              >
                <i className={switchingAdmin ? "ri-loader-4-line animate-spin" : "ri-key-2-line"} />
                {switchingAdmin ? '관리자 로그인 중...' : '👑 최고관리자 계정으로 바로 접속'}
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-full border border-background-300 text-foreground-700 text-sm font-medium hover:bg-background-100 transition-colors"
              >
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const trendPrefix = granularity === 'month' ? '월별' : '일별';

  const subStats = [
    { label: '공연자 프로필', value: stats.performerProfileCount.toLocaleString('ko-KR'), icon: 'ri-mic-line' },
    { label: '누적 후기', value: stats.totalReviews.toLocaleString('ko-KR'), icon: 'ri-star-line' },
    { label: '등록 일정', value: stats.totalSchedules.toLocaleString('ko-KR'), icon: 'ri-calendar-line' },
    { label: '견적 요청', value: stats.totalQuotes.toLocaleString('ko-KR'), icon: 'ri-file-list-3-line' },
  ];

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />
      <main className="pt-20 md:pt-24 pb-16">
        <div className="w-full px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-100 text-accent-800">
                    Admin
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950">
                    관리자 대시보드
                  </h1>
                </div>
                <p className="text-sm text-foreground-600">
                  플랫폼 핵심 지표, 거래 현황, 사용자 추이를 실시간으로 모니터링합니다
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                    autoRefresh
                      ? 'border-accent-500 bg-accent-50 text-accent-800'
                      : 'border-background-200 bg-background-50 text-foreground-600 hover:bg-background-100'
                  }`}
                  title="30초마다 지표를 자동 갱신합니다"
                >
                  <i className={`ri-refresh-line ${autoRefresh ? 'animate-spin' : ''}`} />
                  자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => reload()}
                  disabled={statsLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-background-200 bg-background-50 text-xs font-medium text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  <i className={`ri-loop-right-line ${statsLoading ? 'animate-spin' : ''}`} />
                  새로고침
                </button>
                <button
                  type="button"
                  onClick={() => downloadStatsCsv(stats)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 text-background-50 text-xs font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  <i className="ri-download-2-line" />
                  CSV 내보내기
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-accent-50 border border-accent-200 text-accent-900 text-sm flex items-center gap-2">
                <i className="ri-error-warning-line text-lg flex-shrink-0" />
                <span>{error}</span>
                <button
                  type="button"
                  onClick={reload}
                  className="ml-auto text-sm font-medium text-accent-700 hover:text-accent-800 whitespace-nowrap"
                >
                  다시 시도
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="inline-flex items-center gap-0.5 bg-background-200 rounded-full px-1 py-1">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handlePeriodChange(opt.key)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        period === opt.key
                          ? 'bg-background-50 text-foreground-950 font-bold shadow-xs'
                          : 'text-foreground-600 hover:text-foreground-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {period === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="px-3 py-1.5 rounded-md border border-background-200 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <span className="text-xs text-foreground-500">~</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="px-3 py-1.5 rounded-md border border-background-200 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-foreground-500">{PERIOD_LABELS[period]} 기준 통계</p>
            </div>

            <StatCards stats={stats} comparison={stats.comparison} />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 mb-8">
              {subStats.map((s) => (
                <div key={s.label} className="bg-background-50 border border-background-200 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-background-200 flex items-center justify-center flex-shrink-0">
                    <i className={`${s.icon} text-foreground-600 text-lg`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold font-heading text-foreground-950 leading-tight">{s.value}</p>
                    <p className="text-xs text-foreground-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <MonthlyTrendChart
                title={`${trendPrefix} 거래액 추이`}
                points={stats.monthlyRevenue}
                unit="만원"
                tone="accent"
              />
              <MonthlyTrendChart
                title={`${trendPrefix} 신규 가입자`}
                points={stats.monthlySignups}
                unit="명"
                tone="primary"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-1">
                <GenreDistribution genres={stats.genreDistribution} />
              </div>
              <div className="lg:col-span-2">
                <RecentUsers users={stats.recentUsers} />
              </div>
            </div>

            <RecentContracts contracts={stats.recentContracts} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}