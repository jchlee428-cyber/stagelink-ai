import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Review {
  id: string;
  performer_id: string;
  client_id: string | null;
  client_name: string | null;
  rating: number;
  comment: string | null;
  event_name: string | null;
  created_at: string;
}

interface ReviewsSectionProps {
  performerId: string;
  performerName: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ReviewsSection({ performerId, performerName }: ReviewsSectionProps) {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [eventName, setEventName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = useCallback(() => {
    setLoading(true);
    setError(null);
    supabase
      .from('reviews')
      .select('*')
      .eq('performer_id', performerId)
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message);
        } else {
          setReviews((data ?? []) as Review[]);
        }
        setLoading(false);
      });
  }, [performerId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    const channel = supabase
      .channel(`reviews-${performerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews', filter: `performer_id=eq.${performerId}` },
        () => {
          fetchReviews();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [performerId, fetchReviews]);

  const average = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating < 1 || rating > 5) return;
    setSubmitting(true);
    setSubmitError('');

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(performerId)) {
      setSubmitError('데모 공연자는 후기를 등록할 수 없어요. 실제 등록된 공연자 페이지에서 후기를 남겨주세요.');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from('reviews').insert({
      performer_id: performerId,
      client_id: user.id,
      client_name: profile?.name ?? '익명',
      rating,
      comment: comment.trim() || null,
      event_name: eventName.trim() || null,
    });

    setSubmitting(false);
    if (insertError) {
      setSubmitError(insertError.message);
      return;
    }
    setRating(0);
    setComment('');
    setEventName('');
    setShowForm(false);
    fetchReviews();
  };

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-xl font-bold text-foreground-950">후기</h2>
          <div className="flex items-center gap-1.5">
            <i className="ri-star-fill text-accent-500" />
            <span className="font-semibold text-foreground-950">{average}</span>
            <span className="text-sm text-foreground-500">({reviews.length})</span>
          </div>
        </div>
        {user && profile?.role === 'client' && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
          >
            후기 작성
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-background-100 border border-background-200 rounded-xl p-5 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground-700 mb-2">평점</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="w-8 h-8 flex items-center justify-center cursor-pointer"
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground-700 mb-1.5">행사명 (선택)</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="예: 기업 송년회"
              className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground-700 mb-1.5">후기 내용</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder={`${performerName}님의 공연은 어떠셨나요?`}
              className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
            <p className="text-right text-xs text-foreground-400 mt-1">{comment.length}/500</p>
          </div>

          {submitError && <p className="text-sm text-accent-600 mb-3">{submitError}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || rating < 1}
              className="flex-1 py-3 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <i className="ri-send-plane-line" />
              {submitting ? '등록 중...' : '후기 등록'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-3 rounded-lg border border-background-300 text-foreground-600 text-sm font-medium hover:bg-background-200 transition-colors whitespace-nowrap"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {!user && (
        <p className="text-sm text-foreground-500 bg-background-100 rounded-lg p-4 mb-6">
          후기를 작성하려면 수요자로 로그인해주세요.
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <i className="ri-loader-4-line text-primary-500 text-xl animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-between gap-3 bg-secondary-100 border border-secondary-200 rounded-lg p-4">
          <p className="text-sm text-secondary-800">후기를 불러오지 못했습니다.</p>
          <button
            onClick={fetchReviews}
            className="px-3 py-1.5 rounded-md bg-secondary-500 text-background-50 text-xs font-medium hover:bg-secondary-600 transition-colors whitespace-nowrap"
          >
            다시 시도
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-foreground-500 text-center py-12">아직 등록된 후기가 없습니다. 첫 후기를 남겨보세요.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-background-50 border border-background-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-secondary-100 flex items-center justify-center">
                    <i className="ri-user-line text-secondary-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-900">{r.client_name ?? '익명'}</p>
                    <p className="text-xs text-foreground-400">{formatDate(r.created_at)}</p>
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
              {r.event_name && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-900 mb-2">
                  {r.event_name}
                </span>
              )}
              {r.comment && <p className="text-sm text-foreground-700 leading-relaxed">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}