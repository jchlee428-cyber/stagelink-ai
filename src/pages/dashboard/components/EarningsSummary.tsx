import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface EarningsSummaryProps {
  performerUserId: string;
}

interface ContractSummary {
  total: number;
  thisMonth: number;
  upcoming: number;
}

function formatFee(fee: number): string {
  return fee >= 10000
    ? `${(fee / 10000).toFixed(1)}억`
    : `${fee.toLocaleString('ko-KR')}만`;
}

export default function EarningsSummary({ performerUserId }: EarningsSummaryProps) {
  const [summary, setSummary] = useState<ContractSummary>({ total: 0, thisMonth: 0, upcoming: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadEarnings = useCallback(async () => {
    if (!performerUserId) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('quotes')
        .select('proposed_fee, event_date')
        .eq('performer_user_id', performerUserId)
        .eq('status', 'accepted');

      if (fetchError) {
        setError('수익 현황을 불러오지 못했어요.');
      } else if (data) {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        let total = 0;
        let thisMonth = 0;
        let upcoming = 0;

        (data as Record<string, unknown>[]).forEach((row) => {
          const fee = row.proposed_fee != null ? Number(row.proposed_fee) : 0;
          const date = row.event_date != null ? String(row.event_date) : '';
          total += fee;
          if (date.startsWith(monthPrefix)) thisMonth += fee;
          if (date > todayStr) upcoming += fee;
        });

        setSummary({ total, thisMonth, upcoming });
      }
    } catch {
      setError('수익 현황을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [performerUserId]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  useEffect(() => {
    if (!performerUserId) return;
    const channel = supabase
      .channel('dashboard-earnings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes', filter: `performer_user_id=eq.${performerUserId}` },
        () => {
          loadEarnings();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [performerUserId, loadEarnings]);

  const cards = [
    { label: '누적 수익', value: formatFee(summary.total), icon: 'ri-money-cny-circle-line', note: '성사된 계약 전체' },
    { label: '이번 달 수익', value: formatFee(summary.thisMonth), icon: 'ri-calendar-check-line', note: '이번 달 공연 기준' },
    { label: '예정 수익', value: formatFee(summary.upcoming), icon: 'ri-time-line', note: '남은 공연 출연료' },
  ];

  return (
    <div className="bg-background-50 border border-background-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="font-heading font-semibold text-foreground-950 text-sm">수익 현황</h2>
          <span className="text-xs text-foreground-400">계약 성사 기준</span>
        </div>
        <button
          type="button"
          onClick={loadEarnings}
          className="text-xs text-foreground-500 hover:text-foreground-700 whitespace-nowrap"
        >
          새로고침
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <i className="ri-loader-4-line text-primary-500 text-lg animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-sm text-foreground-500 mb-3">{error}</p>
          <button
            type="button"
            onClick={loadEarnings}
            className="px-4 py-2 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="border border-background-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-accent-100 flex items-center justify-center">
                  <i className={`${card.icon} text-accent-700 text-lg`} />
                </div>
                <span className="text-xs text-foreground-500">{card.label}</span>
              </div>
              <p className="text-2xl font-bold font-heading text-foreground-950">{card.value}</p>
              <p className="text-xs text-foreground-400 mt-1">{card.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}