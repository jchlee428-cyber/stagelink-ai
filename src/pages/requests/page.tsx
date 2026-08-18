import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { performanceRequests, type PerformanceRequest } from '@/mocks/requests';
import { regions, eventTypes } from '@/mocks/filters';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

export default function RequestsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedType, setSelectedType] = useState('전체');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'matched'>('all');
  const [requests, setRequests] = useState<PerformanceRequest[]>(performanceRequests);
  const [realIds, setRealIds] = useState<Set<string>>(new Set());
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());

  const [applyTarget, setApplyTarget] = useState<PerformanceRequest | null>(null);
  const [message, setMessage] = useState('');
  const [proposedFee, setProposedFee] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  const loadRequests = useCallback(() => {
    supabase
      .from('performance_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const ids = new Set<string>();
          const real: PerformanceRequest[] = data.map((r: Record<string, unknown>) => {
            const id = String(r.id);
            ids.add(id);
            return {
              id,
              title: String(r.title ?? ''),
              eventType: String(r.event_type ?? ''),
              date: String(r.date ?? ''),
              region: String(r.region ?? ''),
              venue: String(r.venue ?? ''),
              budget: Number(r.budget ?? 0),
              duration: Number(r.duration ?? 0),
              genres: Array.isArray(r.genre) ? (r.genre as string[]) : [],
              audienceSize: Number(r.audience_size ?? 0),
              description: String(r.description ?? ''),
              status: (r.status as PerformanceRequest['status']) || 'open',
              clientName: String(r.client_name ?? ''),
            };
          });
          setRealIds(ids);
          setRequests([...real, ...performanceRequests]);
        }
      });
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const channel = supabase
      .channel('requests-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'performance_requests' },
        (payload) => {
          loadRequests();
          if (payload.eventType === 'INSERT') {
            const newId = String((payload.new as Record<string, unknown>).id);
            setHighlightIds((prev) => new Set(prev).add(newId));
            setTimeout(() => {
              setHighlightIds((prev) => {
                const next = new Set(prev);
                next.delete(newId);
                return next;
              });
            }, 2600);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRequests]);

  const filtered = requests.filter((r) => {
    const matchRegion = selectedRegion === '전체' || r.region.includes(selectedRegion);
    const matchType = selectedType === '전체' || r.eventType === selectedType;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchRegion && matchType && matchStatus;
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">모집중</span>;
      case 'matched':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">매칭완료</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-background-200 text-foreground-500">마감</span>;
    }
  };

  const openApply = (req: PerformanceRequest) => {
    if (!user || profile?.role !== 'performer') {
      alert('공연자 계정으로 로그인해야 지원할 수 있어요.');
      return;
    }
    setMessage('');
    setProposedFee('');
    setApplyError('');
    setApplyTarget(req);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || profile?.role !== 'performer') {
      alert('공연자 계정으로 로그인해야 지원할 수 있어요.');
      return;
    }
    if (!applyTarget) return;
    if (!realIds.has(applyTarget.id)) {
      setApplyError('데모 요청입니다. 실제 등록된 공연 요청에만 지원할 수 있어요.');
      return;
    }

    setApplying(true);
    setApplyError('');

    const { error } = await supabase.from('applications').insert({
      request_id: applyTarget.id,
      performer_id: user.id,
      message,
      proposed_fee: proposedFee ? Number(proposedFee) : null,
      status: 'pending',
    });

    setApplying(false);
    if (error) {
      setApplyError(error.message);
      return;
    }
    setApplyTarget(null);
    setApplySuccess(true);
  };

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />
      <main className="pt-20 md:pt-24">
        <div className="w-full px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950 mb-1">공연 요청</h1>
                <p className="text-sm text-foreground-600">현재 모집 중인 공연 요청을 확인하고 지원하세요</p>
              </div>
              <Link
                to="/requests/new"
                className="px-5 py-2.5 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap text-center"
              >
                <i className="ri-add-line mr-1" />
                공연 요청 등록
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="전체">모든 행사 종류</option>
                {eventTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="flex gap-1 p-1 bg-background-100 rounded-lg border border-background-200">
                {([['all', '전체'], ['open', '모집중'], ['matched', '매칭완료']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setStatusFilter(val)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === val
                        ? 'bg-background-50 text-foreground-950 shadow-sm'
                        : 'text-foreground-500 hover:text-foreground-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((req) => (
                <div
                  key={req.id}
                  className={`bg-background-50 rounded-xl border border-background-200 p-5 hover:border-primary-300 transition-colors ${highlightIds.has(req.id) ? 'realtime-highlight' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    {statusBadge(req.status)}
                    <span className="text-xs text-foreground-400">{req.date}</span>
                  </div>
                  <h3 className="font-heading font-semibold text-foreground-950 text-base mb-2">
                    <Link to={`/requests/${req.id}`} className="hover:text-primary-600 transition-colors">
                      {req.title}
                    </Link>
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-secondary-100 text-secondary-800">{req.eventType}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-secondary-100 text-secondary-800">{req.region}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-secondary-100 text-secondary-800">{req.duration}분</span>
                  </div>
                  <p className="text-sm text-foreground-600 mb-3 line-clamp-2">{req.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-background-200">
                    <div className="text-sm font-semibold text-primary-600">{req.budget}만원</div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-foreground-500">{req.clientName}</span>
                      <Link
                        to={`/requests/${req.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
                      >
                        상세보기 <i className="ri-arrow-right-line" />
                      </Link>
                      {req.status === 'open' && (
                        <button
                          onClick={() => openApply(req)}
                          className="px-3 py-1.5 rounded-lg bg-primary-500 text-background-50 text-xs font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
                        >
                          지원하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-foreground-500 text-sm">검색 결과가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {applyTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setApplyTarget(null)} />
          <div className="relative bg-background-50 rounded-2xl p-6 md:p-8 max-w-md w-full">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-heading font-bold text-foreground-950 text-lg">공연 지원</h3>
                <p className="text-sm text-foreground-500 mt-0.5 line-clamp-1">{applyTarget.title}</p>
              </div>
              <button
                onClick={() => setApplyTarget(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-foreground-400 hover:bg-background-100"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">제안 출연료 (만원)</label>
                <input
                  type="number"
                  value={proposedFee}
                  onChange={(e) => setProposedFee(e.target.value)}
                  placeholder={`예: ${applyTarget.budget}`}
                  className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">지원 메시지</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="경력, 대표 공연, 이 행사에 적합한 이유를 간단히 소개해주세요"
                  className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                />
                <p className="text-right text-xs text-foreground-400 mt-1">{message.length}/500</p>
              </div>

              {applyError && <p className="text-sm text-accent-600">{applyError}</p>}

              <button
                type="submit"
                disabled={applying}
                className="w-full py-3 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60"
              >
                {applying ? '지원 중...' : '지원하기'}
              </button>
            </form>
          </div>
        </div>
      )}

      {applySuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setApplySuccess(false)} />
          <div className="relative bg-background-50 rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-primary-600 text-2xl" />
            </div>
            <h3 className="font-heading font-bold text-foreground-950 text-lg mb-1">지원이 완료되었습니다</h3>
            <p className="text-sm text-foreground-600 mb-6">수요자의 검토 후 결과가 알려져요.</p>
            <button
              onClick={() => setApplySuccess(false)}
              className="w-full py-3 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}