import type { AdminStats, ComparisonStats } from '../types';

interface StatCardsProps {
  stats: AdminStats;
  comparison: ComparisonStats | null;
}

function formatWon(value: number): string {
  if (value >= 10000) {
    const eok = value / 10000;
    return `${eok.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억`;
  }
  return `${value.toLocaleString('ko-KR')}만`;
}

function ChangeBadge({
  prev,
  curr,
  isRate = false,
}: {
  prev: number;
  curr: number;
  isRate?: boolean;
}) {
  if (prev === 0) {
    if (curr === 0) {
      return <span className="text-[11px] text-foreground-400">이전 0</span>;
    }
    return <span className="text-[11px] font-semibold text-accent-700">신규</span>;
  }
  const diff = isRate ? curr - prev : ((curr - prev) / prev) * 100;
  const up = diff >= 0;
  const icon = up ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
  const color = up ? 'text-emerald-600' : 'text-rose-600';
  const label = isRate
    ? `${Math.abs(diff).toFixed(1)}%p`
    : `${Math.abs(diff).toFixed(1)}%`;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${color}`}>
      <i className={icon} />
      {label}
    </span>
  );
}

export default function StatCards({ stats, comparison }: StatCardsProps) {
  const matchRate =
    stats.totalApplications > 0
      ? Math.round((stats.acceptedApplications / stats.totalApplications) * 100)
      : 0;

  const cards = [
    {
      label: '총 가입자',
      value: stats.totalUsers.toLocaleString('ko-KR'),
      raw: stats.totalUsers,
      prev: comparison?.totalUsers ?? null,
      isRate: false,
      sub: `공연자 ${stats.performerCount} · 수요자 ${stats.clientCount}`,
      icon: 'ri-user-3-line',
      tone: 'bg-primary-100 text-primary-700',
    },
    {
      label: '총 거래액',
      value: formatWon(stats.totalRevenue),
      raw: stats.totalRevenue,
      prev: comparison?.totalRevenue ?? null,
      isRate: false,
      sub: `계약 성사 ${stats.acceptedQuotes}건`,
      icon: 'ri-money-dollar-circle-line',
      tone: 'bg-accent-100 text-accent-700',
    },
    {
      label: '공연 요청',
      value: stats.totalRequests.toLocaleString('ko-KR'),
      raw: stats.totalRequests,
      prev: comparison?.totalRequests ?? null,
      isRate: false,
      sub: `매칭 완료 ${stats.matchedRequests}건`,
      icon: 'ri-megaphone-line',
      tone: 'bg-secondary-100 text-secondary-700',
    },
    {
      label: '매칭률',
      value: `${matchRate}%`,
      raw: matchRate,
      prev:
        comparison && comparison.totalApplications > 0
          ? Math.round(
              (comparison.acceptedApplications / comparison.totalApplications) * 100,
            )
          : null,
      isRate: true,
      sub: `지원 ${stats.totalApplications} · 수락 ${stats.acceptedApplications}`,
      icon: 'ri-flashlight-line',
      tone: 'bg-background-200 text-foreground-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-background-50 border border-background-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-foreground-500">{card.label}</p>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.tone}`}>
              <i className={`${card.icon} text-lg`} />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground-950">{card.value}</p>
          <p className="text-xs text-foreground-500 mt-1.5">{card.sub}</p>
          {comparison && card.prev != null && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[10px] text-foreground-400">이전 기간 대비</span>
              <ChangeBadge prev={card.prev} curr={card.raw} isRate={card.isRate} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}