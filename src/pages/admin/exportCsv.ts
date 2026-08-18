import type { AdminStats } from './types';

function csvCell(value: string | number): string {
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildStatsCsv(stats: AdminStats): string {
  const rows: (string | number)[][] = [];

  rows.push(['구분', '값']);
  rows.push(['총 가입자', stats.totalUsers]);
  rows.push(['공연자', stats.performerCount]);
  rows.push(['수요자', stats.clientCount]);
  rows.push(['공연자 프로필', stats.performerProfileCount]);
  rows.push(['공연 요청', stats.totalRequests]);
  rows.push(['매칭 완료', stats.matchedRequests]);
  rows.push(['지원', stats.totalApplications]);
  rows.push(['수락', stats.acceptedApplications]);
  rows.push(['견적 요청', stats.totalQuotes]);
  rows.push(['계약 성사', stats.acceptedQuotes]);
  rows.push(['총 거래액(만원)', stats.totalRevenue]);
  rows.push(['누적 후기', stats.totalReviews]);
  rows.push(['등록 일정', stats.totalSchedules]);

  rows.push([]);
  rows.push(['거래액 추이']);
  rows.push(['기간', '거래액(만원)']);
  stats.monthlyRevenue.forEach((p) => rows.push([p.label, p.value]));

  rows.push([]);
  rows.push(['신규 가입자 추이']);
  rows.push(['기간', '가입자 수']);
  stats.monthlySignups.forEach((p) => rows.push([p.label, p.value]));

  rows.push([]);
  rows.push(['장르 분포']);
  rows.push(['장르', '공연자 수']);
  stats.genreDistribution.forEach((g) => rows.push([g.name, g.count]));

  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  return `\uFEFF${csv}`;
}

export function downloadStatsCsv(stats: AdminStats): void {
  const csv = buildStatsCsv(stats);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `admin-stats-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}