import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import QuoteRespondModal from './components/QuoteRespondModal';
import QuoteDocument from './components/QuoteDocument';
import { quoteStatusMeta, formatQuoteDate, type Quote, type QuoteStatus } from './types';

function mapQuote(row: Record<string, unknown>): Quote {
  return {
    id: String(row.id),
    performerId: String(row.performer_id),
    performerUserId: row.performer_user_id != null ? String(row.performer_user_id) : null,
    title: String(row.title ?? ''),
    eventDate: row.event_date != null ? String(row.event_date) : null,
    region: row.region != null ? String(row.region) : null,
    venue: row.venue != null ? String(row.venue) : null,
    duration: row.duration != null ? Number(row.duration) : null,
    budget: row.budget != null ? Number(row.budget) : null,
    genre: Array.isArray(row.genre) ? row.genre.map((g) => String(g)) : [],
    description: row.description != null ? String(row.description) : null,
    clientName: row.client_name != null ? String(row.client_name) : null,
    performerName: row.performer_name != null ? String(row.performer_name) : null,
    status: (row.status as QuoteStatus) ?? 'requested',
    proposedFee: row.proposed_fee != null ? Number(row.proposed_fee) : null,
    quoteNote: row.quote_note != null ? String(row.quote_note) : null,
    createdAt: String(row.created_at ?? ''),
  };
}

export default function QuotesPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [respondQuote, setRespondQuote] = useState<Quote | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [highlightQuotes, setHighlightQuotes] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  const isPerformer = profile?.role === 'performer';

  const loadQuotes = useCallback(async () => {
    if (!user || !profile) return;
    setLoadingItems(true);
    setLoadError('');
    try {
      const query = supabase.from('quotes').select('*').order('created_at', { ascending: false });
      const { data, error } = profile.role === 'performer'
        ? await query.eq('performer_user_id', user.id)
        : await query.eq('client_id', user.id);

      if (error) {
        setLoadError('견적 내역을 불러오지 못했어요. 다시 시도해주세요.');
      } else if (data) {
        setQuotes((data as Record<string, unknown>[]).map(mapQuote));
      }
    } catch {
      setLoadError('견적 내역을 불러오지 못했어요. 다시 시도해주세요.');
    } finally {
      setLoadingItems(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && profile) {
      loadQuotes();
    }
  }, [user, profile, loadQuotes]);

  useEffect(() => {
    if (!user || !profile) return;
    const filter = profile.role === 'performer'
      ? `performer_user_id=eq.${user.id}`
      : `client_id=eq.${user.id}`;
    const channel = supabase
      .channel('quotes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes', filter },
        (payload) => {
          loadQuotes();
          if (payload.eventType === 'INSERT') {
            const newId = String((payload.new as Record<string, unknown>).id);
            setHighlightQuotes((prev) => new Set(prev).add(newId));
            setTimeout(() => {
              setHighlightQuotes((prev) => {
                const next = new Set(prev);
                next.delete(newId);
                return next;
              });
            }, 2600);
          }
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Record<string, unknown>;
            const newStatus = String(updated.status);
            if (profile.role === 'performer' && (newStatus === 'accepted' || newStatus === 'rejected')) {
              setToast({
                message: newStatus === 'accepted' ? '계약이 성사되었어요!' : '견적이 거절되었어요',
              });
              setTimeout(() => setToast(null), 4000);
            }
            if (profile.role === 'client' && newStatus === 'quoted') {
              setToast({ message: '새로운 견적서가 도착했어요' });
              setTimeout(() => setToast(null), 4000);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, loadQuotes]);

  const stats = useMemo(() => {
    const total = quotes.length;
    const contracted = quotes.filter((q) => q.status === 'accepted').length;
    const pending = quotes.filter((q) => q.status === 'requested' || q.status === 'quoted').length;
    return { total, contracted, pending };
  }, [quotes]);

  const handleDecision = async (quoteId: string, decision: 'accepted' | 'rejected') => {
    setActionId(quoteId);
    const { error } = await supabase
      .from('quotes')
      .update({ status: decision, updated_at: new Date().toISOString() })
      .eq('id', quoteId);
    setActionId(null);
    if (!error) {
      await loadQuotes();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-50 flex items-center justify-center">
        <i className="ri-loader-4-line text-primary-500 text-2xl animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const statCards = [
    { label: '전체 견적', value: String(stats.total), icon: 'ri-file-list-3-line' },
    { label: '진행 중', value: String(stats.pending), icon: 'ri-time-line' },
    { label: '계약 성사', value: String(stats.contracted), icon: 'ri-award-line' },
  ];

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-28 pb-16">
        <div className="w-full px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950">견적·계약 관리</h1>
                <p className="text-sm text-foreground-600 mt-1">
                  {isPerformer ? '받은 견적 요청을 확인하고 견적서를 보내보세요.' : '보낸 견적 요청과 도착한 견적서를 관리하세요.'}
                </p>
              </div>
              {isPerformer ? (
                <Link
                  to="/requests"
                  className="px-5 py-2.5 rounded-full border border-background-200 text-sm font-medium text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap"
                >
                  <i className="ri-search-line mr-1" />
                  공연 요청 찾기
                </Link>
              ) : (
                <Link
                  to="/performers"
                  className="px-5 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  <i className="ri-add-line mr-1" />
                  공연자 찾기
                </Link>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {statCards.map((card) => (
                <div key={card.label} className="bg-background-50 border border-background-200 rounded-lg p-4 md:p-5">
                  <div className="w-9 h-9 rounded-lg bg-secondary-100 flex items-center justify-center mb-3">
                    <i className={`${card.icon} text-secondary-700 text-lg`} />
                  </div>
                  <p className="text-2xl font-bold font-heading text-foreground-950">{card.value}</p>
                  <p className="text-xs text-foreground-500 mt-1">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-background-50 border border-background-200 rounded-lg p-4 md:p-6">
              <h2 className="font-heading font-semibold text-foreground-950 text-base mb-5">
                {isPerformer ? '받은 견적 요청' : '견적 내역'}
              </h2>

              {loadingItems ? (
                <div className="flex items-center justify-center py-10">
                  <i className="ri-loader-4-line text-primary-500 text-xl animate-spin" />
                </div>
              ) : loadError ? (
                <div className="text-center py-10">
                  <p className="text-foreground-500 text-sm mb-4">{loadError}</p>
                  <button
                    type="button"
                    onClick={loadQuotes}
                    className="px-4 py-2 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
                  >
                    다시 시도
                  </button>
                </div>
              ) : quotes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-3">
                    <i className="ri-file-text-line text-secondary-700 text-xl" />
                  </div>
                  <p className="text-foreground-500 text-sm mb-4">
                    {isPerformer ? '아직 받은 견적 요청이 없어요.' : '아직 보낸 견적 요청이 없어요.'}
                  </p>
                  <Link
                    to={isPerformer ? '/requests' : '/performers'}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {isPerformer ? '공연 요청 둘러보기' : '공연자에게 견적 요청하기'} <i className="ri-arrow-right-line" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote) => {
                    const meta = quoteStatusMeta[quote.status] ?? quoteStatusMeta.requested;
                    const isExpanded = expandedId === quote.id;
                    const showDoc = quote.status === 'quoted' || quote.status === 'accepted';
                    return (
                      <div key={quote.id} className={`border border-background-200 rounded-lg overflow-hidden ${highlightQuotes.has(quote.id) ? 'realtime-highlight' : ''}`}>
                        <div className="p-4 md:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-medium text-foreground-900 text-sm">{quote.title}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.className}`}>{meta.label}</span>
                              </div>
                              <p className="text-xs text-foreground-500">
                                {isPerformer
                                  ? `${quote.clientName || '수요자'} · ${formatQuoteDate(quote.eventDate)}`
                                  : `${quote.performerName || '공연자'} · ${formatQuoteDate(quote.eventDate)}`}
                                {quote.venue ? ` · ${quote.venue}` : quote.region ? ` · ${quote.region}` : ''}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {quote.proposedFee != null ? (
                                <p className="text-base font-bold text-primary-600">{quote.proposedFee}만원</p>
                              ) : quote.budget != null ? (
                                <p className="text-sm text-foreground-500">예산 {quote.budget}만원</p>
                              ) : null}
                            </div>
                          </div>

                          {quote.description && (
                            <p className="text-sm text-foreground-600 line-clamp-2 mb-3">{quote.description}</p>
                          )}

                          <div className="flex items-center gap-2 flex-wrap">
                            {showDoc && (
                              <button
                                type="button"
                                onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-background-200 text-xs font-medium text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap"
                              >
                                <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-file-text-line'} />
                                {quote.status === 'accepted' ? '계약서 보기' : '견적서 보기'}
                              </button>
                            )}

                            {isPerformer && quote.status === 'requested' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setRespondQuote(quote)}
                                  className="px-4 py-1.5 rounded-full bg-primary-500 text-background-50 text-xs font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
                                >
                                  <i className="ri-send-plane-line mr-1" />
                                  견적서 작성
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDecision(quote.id, 'rejected')}
                                  disabled={actionId === quote.id}
                                  className="px-4 py-1.5 rounded-full border border-background-300 text-foreground-600 text-xs font-medium hover:bg-background-100 transition-colors disabled:opacity-60 whitespace-nowrap"
                                >
                                  거절
                                </button>
                              </>
                            )}

                            {!isPerformer && quote.status === 'quoted' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/payment/checkout/${quote.id}`)}
                                  className="px-4 py-1.5 rounded-full bg-primary-500 text-background-50 text-xs font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
                                >
                                  <i className="ri-secure-payment-line mr-1" />
                                  결제하고 계약하기
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDecision(quote.id, 'rejected')}
                                  disabled={actionId === quote.id}
                                  className="px-4 py-1.5 rounded-full border border-background-300 text-foreground-600 text-xs font-medium hover:bg-background-100 transition-colors disabled:opacity-60 whitespace-nowrap"
                                >
                                  거절
                                </button>
                              </>
                            )}

                            {quote.status === 'accepted' && (
                              <span className="inline-flex items-center gap-1 text-xs text-accent-700">
                                <i className="ri-checkbox-circle-line" />
                                계약이 성사되었습니다
                              </span>
                            )}
                          </div>
                        </div>

                        {isExpanded && showDoc && (
                          <div className="px-4 md:px-5 pb-5">
                            <QuoteDocument quote={quote} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {toast && (
        <div className="fixed top-24 right-4 z-[70] toast-in flex items-center gap-2.5 bg-foreground-950 text-background-50 pl-4 pr-5 py-3 rounded-lg">
          <i className="ri-notification-3-line text-primary-400 text-lg" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <QuoteRespondModal
        open={respondQuote !== null}
        quote={respondQuote}
        onClose={() => setRespondQuote(null)}
        onSaved={() => {
          setRespondQuote(null);
          loadQuotes();
        }}
      />
    </div>
  );
}