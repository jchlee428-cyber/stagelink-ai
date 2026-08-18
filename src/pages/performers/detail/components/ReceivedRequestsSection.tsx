import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface ReceivedRequest {
  id: string;
  title: string;
  eventType: string;
  date: string;
  region: string;
  venue: string;
  budget: number;
  duration: number;
  status: string;
  clientName: string;
}

interface ReceivedRequestsSectionProps {
  performerId: string;
  performerUserId: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function statusBadge(status: string) {
  switch (status) {
    case 'open':
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">모집중</span>;
    case 'matched':
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">매칭완료</span>;
    default:
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-background-200 text-foreground-500">마감</span>;
  }
}

export default function ReceivedRequestsSection({ performerId, performerUserId }: ReceivedRequestsSectionProps) {
  const [requests, setRequests] = useState<ReceivedRequest[]>([]);
  const [manualDates, setManualDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const isRealId = UUID_RE.test(performerId);

  const fetchRequests = useCallback(() => {
    if (!isRealId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('performance_requests')
      .select('id, title, event_type, date, region, venue, budget, duration, status, client_name')
      .eq('performer_id', performerId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setRequests(
            data.map((r: Record<string, unknown>) => ({
              id: String(r.id),
              title: String(r.title ?? ''),
              eventType: String(r.event_type ?? ''),
              date: String(r.date ?? ''),
              region: String(r.region ?? ''),
              venue: String(r.venue ?? ''),
              budget: Number(r.budget ?? 0),
              duration: Number(r.duration ?? 0),
              status: String(r.status ?? 'open'),
              clientName: String(r.client_name ?? ''),
            })),
          );
        }
        setLoading(false);
      });
  }, [isRealId, performerId]);

  const fetchSchedules = useCallback(() => {
    if (!isRealId || !performerUserId) {
      setManualDates(new Set());
      return;
    }
    supabase
      .from('schedules')
      .select('event_date, status')
      .eq('user_id', performerUserId)
      .then(({ data, error }) => {
        if (!error && data) {
          const dates = new Set<string>();
          data.forEach((s: Record<string, unknown>) => {
            if (String(s.status ?? '') === 'scheduled' && s.event_date) {
              dates.add(String(s.event_date));
            }
          });
          setManualDates(dates);
        } else {
          setManualDates(new Set());
        }
      });
  }, [isRealId, performerUserId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (!isRealId) return;
    const channel = supabase
      .channel(`received-requests-${performerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'performance_requests', filter: `performer_id=eq.${performerId}` },
        () => {
          fetchRequests();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isRealId, performerId, fetchRequests]);

  useEffect(() => {
    if (!isRealId || !performerUserId) return;
    const channel = supabase
      .channel(`received-schedules-${performerUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedules', filter: `user_id=eq.${performerUserId}` },
        () => {
          fetchSchedules();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isRealId, performerUserId, fetchSchedules]);

  const matchedDateCounts = useMemo(() => {
    const map = new Map<string, number>();
    requests.forEach((r) => {
      if (r.status === 'matched' && r.date) {
        map.set(r.date, (map.get(r.date) ?? 0) + 1);
      }
    });
    return map;
  }, [requests]);

  const hasConflict = useCallback(
    (req: ReceivedRequest): boolean => {
      if (req.status !== 'matched' || !req.date) return false;
      if (manualDates.has(req.date)) return true;
      return (matchedDateCounts.get(req.date) ?? 0) > 1;
    },
    [manualDates, matchedDateCounts],
  );

  if (loading) {
    return (
      <section className="mt-10">
        <h2 className="font-heading text-xl font-bold text-foreground-950 mb-5">받은 공연 요청</h2>
        <div className="flex items-center justify-center py-8">
          <i className="ri-loader-4-line text-primary-500 text-xl animate-spin" />
        </div>
      </section>
    );
  }

  if (requests.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-xl font-bold text-foreground-950">받은 공연 요청</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
            {requests.length}건
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className={`bg-background-50 border rounded-xl p-5 transition-colors ${
              hasConflict(req) ? 'border-red-200' : 'border-background-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {statusBadge(req.status)}
                {hasConflict(req) && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 inline-flex items-center gap-1">
                    <i className="ri-alert-line" />
                    일정 충돌
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-xs bg-secondary-100 text-secondary-800">{req.eventType}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-secondary-100 text-secondary-800">{req.region}</span>
              </div>
              <span className="text-xs text-foreground-400 whitespace-nowrap">{formatDate(req.date)}</span>
            </div>

            <h3 className="font-heading font-semibold text-foreground-950 text-base mb-1">{req.title}</h3>
            <p className="text-sm text-foreground-500 mb-3">
              {req.clientName}
              {req.venue ? ` · ${req.venue}` : ''}
              {req.duration ? ` · ${req.duration}분` : ''}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-background-200">
              <span className="text-sm font-semibold text-primary-600">{req.budget}만원</span>
              <Link
                to={`/requests/${req.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
              >
                상세보기 <i className="ri-arrow-right-line" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}