import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

interface PendingReview {
  scheduleId: string;
  performerProfileId: string;
  performerName: string;
  title: string;
  eventDate: string;
}

interface PendingReviewsProps {
  userId: string;
  clientName: string | null;
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function PendingReviews({ userId, clientName }: PendingReviewsProps) {
  const [pending, setPending] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [active, setActive] = useState<PendingReview | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const loadPending = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const { data: schedData, error: schedError } = await supabase
        .from('schedules')
        .select('id, performer_profile_id, title, event_date')
        .eq('client_id', userId)
        .eq('status', 'completed')
        .order('event_date', { ascending: false });

      if (schedError) {
        setError('후기 작성 목록을 불러오지 못했어요.');
        return;
      }
      if (!schedData || schedData.length === 0) {
        setPending([]);
        return;
      }

      const profileIds = Array.from(
        new Set(
          schedData
            .map((s: Record<string, unknown>) => (s.performer_profile_id != null ? String(s.performer_profile_id) : ''))
            .filter(Boolean),
        ),
      );

      const { data: profData } = await supabase
        .from('performer_profiles')
        .select('id, stage_name')
        .in('id', profileIds);
      const nameMap = new Map<string, string>();
      (profData ?? []).forEach((p: Record<string, unknown>) => {
        nameMap.set(String(p.id), String(p.stage_name ?? ''));
      });

      const { data: revData } = await supabase
        .from('reviews')
        .select('performer_id')
        .eq('client_id', userId);
      const reviewedIds = new Set<string>(
        (revData ?? []).map((r: Record<string, unknown>) => String(r.performer_id)),
      );

      const seen = new Set<string>();
      const list: PendingReview[] = [];
      (schedData as Record<string, unknown>[]).forEach((s) => {
        const pid = s.performer_profile_id != null ? String(s.performer_profile_id) : '';
        if (!pid || reviewedIds.has(pid) || seen.has(pid)) return;
        seen.add(pid);
        list.push({
          scheduleId: String(s.id),
          performerProfileId: pid,
          performerName: nameMap.get(pid) || '공연자',
          title: String(s.title ?? ''),
          eventDate: String(s.event_date ?? ''),
        });
      });

      setPending(list);
    } catch {
      setError('후기 작성 목록을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    if (!userId) return;
    const schedChannel = supabase
      .channel('pending-reviews-schedules')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedules', filter: `client_id=eq.${userId}` },
        () => {
          loadPending();
        },
      )
      .subscribe();
    const reviewChannel = supabase
      .channel('pending-reviews-reviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews', filter: `client_id=eq.${userId}` },
        () => {
          loadPending();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(schedChannel);
      supabase.removeChannel(reviewChannel);
    };
  }, [userId, loadPending]);

  const openModal = (item: PendingReview) => {
    setActive(item);
    setRating(0);
    setHoverRating(0);
    setComment('');
    setSubmitError('');
  };

  const closeModal = () => {
    setActive(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!active || rating < 1 || rating > 5) return;
    setSubmitting(true);
    setSubmitError('');

    const { error: insertError } = await supabase.from('reviews').insert({
      performer_id: active.performerProfileId,
      client_id: userId,
      client_name: clientName || null,
      rating,
      comment: comment.trim() || null,
      event_name: active.title || null,
    });

    setSubmitting(false);
    if (insertError) {
      setSubmitError('후기 등록에 실패했어요. 잠시 후 다시 시도해주세요.');
      return;
    }
    closeModal();
    loadPending();
  };

  return (
    <div id="pending-reviews" className="bg-background-50 border border-background-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="font-heading font-semibold text-foreground-950 text-sm">후기 작성하기</h2>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-500 text-background-50">
              {pending.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={loadPending}
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
            onClick={loadPending}
            className="px-4 py-2 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
          >
            다시 시도
          </button>
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-11 h-11 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-3">
            <i className="ri-pencil-line text-secondary-700 text-lg" />
          </div>
          <p className="text-sm text-foreground-500">
            완료된 공연 중 후기를 남길 공연이 없어요. 공연이 완료되면 여기에 후기 작성 버튼이 나타나요.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((item) => (
            <div
              key={item.scheduleId}
              className="border border-background-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                    완료
                  </span>
                  <h3 className="font-medium text-foreground-900 text-sm truncate">{item.title}</h3>
                </div>
                <p className="text-xs text-foreground-500">
                  {item.performerName} · {formatDate(item.eventDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openModal(item)}
                className="px-4 py-2 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap flex-shrink-0"
              >
                <i className="ri-star-line mr-1" />
                후기 작성
              </button>
            </div>
          ))}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground-950/40" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-background-50 rounded-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-semibold text-foreground-950 text-base">후기 작성</h3>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-md hover:bg-background-100 flex items-center justify-center text-foreground-500"
                aria-label="닫기"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-foreground-900 font-medium">{active.performerName}</p>
              <p className="text-xs text-foreground-500 mt-0.5">
                {active.title} · {formatDate(active.eventDate)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground-700 mb-2">평점</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="w-9 h-9 flex items-center justify-center cursor-pointer"
                      aria-label={`${n}점`}
                    >
                      <i
                        className={`text-2xl ${
                          (hoverRating || rating) >= n ? 'ri-star-fill text-accent-500' : 'ri-star-line text-foreground-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-foreground-600">{rating > 0 ? `${rating}점` : '별점을 선택하세요'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground-700 mb-1.5">후기 내용</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder={`${active.performerName}님의 공연은 어떠셨나요?`}
                  className="w-full px-3 py-2.5 rounded-md border border-background-300 text-sm text-foreground-900 bg-background-50 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 resize-none"
                />
                <p className="text-right text-xs text-foreground-400 mt-1">{comment.length}/500</p>
              </div>

              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{submitError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-md border border-background-300 text-foreground-600 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting || rating < 1}
                  className="flex-1 py-2.5 rounded-md bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {submitting ? '등록 중...' : '후기 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}