import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Review {
  id: string;
  performerId: string;
  clientName: string | null;
  rating: number;
  comment: string | null;
  eventName: string | null;
  createdAt: string;
}

interface ReviewsSummaryProps {
  userId: string;
  role: 'performer' | 'client';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ReviewsSummary({ userId, role }: ReviewsSummaryProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState('0.0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReviews = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      if (role === 'performer') {
        const { data: profileData } = await supabase
          .from('performer_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        const profileId = profileData ? String((profileData as Record<string, unknown>).id) : null;
        if (!profileId) {
          setReviews([]);
          setAverage('0.0');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('reviews')
          .select('*')
          .eq('performer_id', profileId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          setError('후기를 불러오지 못했어요.');
        } else {
          const mapped = (data ?? []).map(mapReview);
          setReviews(mapped);
          setAverage(
            mapped.length > 0
              ? (mapped.reduce((sum, r) => sum + r.rating, 0) / mapped.length).toFixed(1)
              : '0.0',
          );
        }
      } else {
        const { data, error: fetchError } = await supabase
          .from('reviews')
          .select('*')
          .eq('client_id', userId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          setError('후기를 불러오지 못했어요.');
        } else {
          setReviews((data ?? []).map(mapReview));
        }
      }
    } catch {
      setError('후기를 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (!userId) return;
    const filter = role === 'performer' ? undefined : `client_id=eq.${userId}`;
    const channel = supabase
      .channel(`dashboard-reviews-${role}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews', filter },
        () => {
          loadReviews();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role, loadReviews]);

  const isPerformer = role === 'performer';

  return (
    <div className="bg-background-50 border border-background-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="font-heading font-semibold text-foreground-950 text-sm">
            {isPerformer ? '받은 후기' : '내가 쓴 후기'}
          </h2>
          {isPerformer && (
            <div className="flex items-center gap-1.5">
              <i className="ri-star-fill text-accent-500" />
              <span className="font-semibold text-foreground-950">{average}</span>
              <span className="text-xs text-foreground-500">({reviews.length})</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={loadReviews}
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
            onClick={loadReviews}
            className="px-4 py-2 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
          >
            다시 시도
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-11 h-11 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-3">
            <i className="ri-star-line text-secondary-700 text-lg" />
          </div>
          <p className="text-sm text-foreground-500">
            {isPerformer ? '아직 받은 후기가 없어요.' : '아직 작성한 후기가 없어요.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.slice(0, 5).map((r) => (
            <div key={r.id} className="border border-background-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center">
                    <i className="ri-user-line text-secondary-700 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-900">{r.clientName ?? '익명'}</p>
                    <p className="text-xs text-foreground-400">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <i
                      key={n}
                      className={`text-sm ${n <= r.rating ? 'ri-star-fill text-accent-500' : 'ri-star-line text-foreground-300'}`}
                    />
                  ))}
                </div>
              </div>
              {r.eventName && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-900 mb-2">
                  {r.eventName}
                </span>
              )}
              {r.comment && <p className="text-sm text-foreground-700 leading-relaxed">{r.comment}</p>}
            </div>
          ))}
          {reviews.length > 5 && (
            <p className="text-xs text-foreground-400 text-center pt-1">외 {reviews.length - 5}개 더</p>
          )}
        </div>
      )}
    </div>
  );
}

function mapReview(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    performerId: String(row.performer_id),
    clientName: row.client_name != null ? String(row.client_name) : null,
    rating: Number(row.rating),
    comment: row.comment != null ? String(row.comment) : null,
    eventName: row.event_name != null ? String(row.event_name) : null,
    createdAt: String(row.created_at),
  };
}