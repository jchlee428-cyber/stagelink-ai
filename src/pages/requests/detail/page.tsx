import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { performanceRequests, type PerformanceRequest } from '@/mocks/requests';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import RequestEditModal from './components/RequestEditModal';

interface Application {
  id: string;
  performerId: string;
  performerName: string;
  proposedFee: number | null;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface RequestDetail extends PerformanceRequest {
  clientId: string;
  performerId: string | null;
  performerName: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const statusMeta: Record<string, { label: string; className: string }> = {
  pending: { label: '검토중', className: 'bg-secondary-100 text-secondary-800' },
  accepted: { label: '수락됨', className: 'bg-primary-100 text-primary-700' },
  rejected: { label: '거절됨', className: 'bg-background-200 text-foreground-500' },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

function requestStatusBadge(status: string) {
  switch (status) {
    case 'open':
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">모집중</span>;
    case 'matched':
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent-100 text-accent-700">매칭완료</span>;
    default:
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-background-200 text-foreground-500">마감</span>;
  }
}

function mapRequestRow(r: Record<string, unknown>): RequestDetail {
  return {
    id: String(r.id),
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
    clientId: String(r.client_id ?? ''),
    performerId: r.performer_id ? String(r.performer_id) : null,
    performerName: null,
  };
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const mockReq = performanceRequests.find((r) => r.id === id);
  const isRealId = !!id && UUID_RE.test(id);

  const [request, setRequest] = useState<RequestDetail | null>(
    mockReq ? { ...mockReq, clientId: '', performerId: null, performerName: null } : null,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [highlightApplications, setHighlightApplications] = useState<Set<string>>(new Set());

  const [applyOpen, setApplyOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [proposedFee, setProposedFee] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);
  const [acceptedNotice, setAcceptedNotice] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = !!user && !!request && (profile?.role === 'admin' || request.clientId === user.id);
  const isPerformer = profile?.role === 'performer';

  const confirmDelete = async () => {
    if (!request) return;
    setDeleting(true);
    try {
      if (isRealId) {
        await supabase.from('applications').delete().eq('request_id', request.id);
        const { error } = await supabase
          .from('performance_requests')
          .delete()
          .eq('id', request.id);

        if (error) {
          alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
          setDeleting(false);
          setDeleteConfirmOpen(false);
          return;
        }
      }
      setDeleting(false);
      setDeleteConfirmOpen(false);
      alert('공연 요청이 성공적으로 삭제되었습니다.');
      navigate('/requests', { replace: true });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const loadRequest = useCallback((silent = false) => {
    if (!id) return;
    if (!isRealId) {
      setRequest(mockReq ? { ...mockReq, clientId: '', performerId: null, performerName: null } : null);
      if (!silent) setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
      setLoadError('');
    }
    supabase
      .from('performance_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setLoadError(error?.message ?? '요청을 찾을 수 없습니다.');
          if (!silent) setLoading(false);
          return;
        }
        const mapped = mapRequestRow(data as Record<string, unknown>);
        if (mapped.performerId) {
          const { data: p } = await supabase
            .from('performer_profiles')
            .select('stage_name')
            .eq('id', mapped.performerId)
            .maybeSingle();
          if (p) mapped.performerName = String((p as Record<string, unknown>).stage_name ?? '');
        }
        setRequest(mapped);
        if (!silent) setLoading(false);
      });
  }, [id, isRealId, mockReq]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const loadApplications = async () => {
    if (!isRealId || !user || !request) return;
    const owner = profile?.role === 'admin' || request.clientId === user.id;
    setAppsLoading(true);
    try {
      if (owner) {
        const { data, error } = await supabase
          .from('applications')
          .select('id, performer_id, proposed_fee, message, status, created_at')
          .eq('request_id', id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const performerIds = data.map((a: Record<string, unknown>) => String(a.performer_id));
          const { data: profilesData } = await supabase
            .from('performer_profiles')
            .select('user_id, stage_name')
            .in('user_id', performerIds);
          const nameMap = new Map<string, string>();
          (profilesData ?? []).forEach((p: Record<string, unknown>) => {
            nameMap.set(String(p.user_id), String(p.stage_name ?? ''));
          });

          setApplications(
            data.map((a: Record<string, unknown>) => {
              const pid = String(a.performer_id);
              return {
                id: String(a.id),
                performerId: pid,
                performerName: nameMap.get(pid) || '공연자',
                proposedFee: a.proposed_fee != null ? Number(a.proposed_fee) : null,
                message: String(a.message ?? ''),
                status: a.status as Application['status'],
                createdAt: String(a.created_at ?? ''),
              };
            }),
          );
        }
      } else if (isPerformer) {
        const { data, error } = await supabase
          .from('applications')
          .select('id, proposed_fee, message, status, created_at')
          .eq('request_id', id)
          .eq('performer_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setMyApplication({
            id: String((data as Record<string, unknown>).id),
            performerId: user.id,
            performerName: profile?.name || '공연자',
            proposedFee: (data as Record<string, unknown>).proposed_fee != null
              ? Number((data as Record<string, unknown>).proposed_fee)
              : null,
            message: String((data as Record<string, unknown>).message ?? ''),
            status: (data as Record<string, unknown>).status as Application['status'],
            createdAt: String((data as Record<string, unknown>).created_at ?? ''),
          });
        }
      }
    } catch {
      // 무시
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    if (user && request && isRealId) {
      loadApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, request, isRealId]);

  useEffect(() => {
    if (!isRealId || !id) return;
    const channel = supabase
      .channel(`request-detail-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'performance_requests', filter: `id=eq.${id}` },
        () => {
          loadRequest(true);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications', filter: `request_id=eq.${id}` },
        (payload) => {
          if (user && request) loadApplications();
          if (payload.eventType === 'INSERT') {
            const newId = String((payload.new as Record<string, unknown>).id);
            setHighlightApplications((prev) => new Set(prev).add(newId));
            setTimeout(() => {
              setHighlightApplications((prev) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRealId, id, user, request, loadRequest]);

  const openApply = () => {
    if (!user || !isPerformer) {
      alert('공연자 계정으로 로그인해야 지원할 수 있어요.');
      return;
    }
    setMessage('');
    setProposedFee('');
    setApplyError('');
    setApplyOpen(true);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !request) return;
    if (!isPerformer) {
      alert('공연자 계정으로 로그인해야 지원할 수 있어요.');
      return;
    }
    if (!isRealId) {
      setApplyError('데모 요청입니다. 실제 등록된 공연 요청에만 지원할 수 있어요.');
      return;
    }
    setApplying(true);
    setApplyError('');
    const { error } = await supabase.from('applications').insert({
      request_id: id,
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
    setApplyOpen(false);
    setApplySuccess(true);
    await loadApplications();
  };

  const handleDecision = async (app: Application, decision: 'accepted' | 'rejected') => {
    setActionId(app.id);
    const { error } = await supabase
      .from('applications')
      .update({ status: decision })
      .eq('id', app.id);

    if (!error && decision === 'accepted' && request) {
      // 수락한 공연자의 프로필 조회 (applications.performer_id = 로그인 계정 id)
      const { data: profileData } = await supabase
        .from('performer_profiles')
        .select('id, stage_name')
        .eq('user_id', app.performerId)
        .maybeSingle();

      const profileId = profileData ? String((profileData as Record<string, unknown>).id) : null;
      const stageName = profileData
        ? String((profileData as Record<string, unknown>).stage_name ?? '')
        : app.performerName;

      // 매칭 확정: status와 performer_id(프로필 id)를 함께 저장
      await supabase
        .from('performance_requests')
        .update({ status: 'matched', performer_id: profileId })
        .eq('id', request.id);
      setRequest((prev) =>
        prev ? { ...prev, status: 'matched', performerId: profileId, performerName: stageName } : prev,
      );

      // 견적·계약 연계: 수락한 공연자로 견적 요청 자동 생성
      if (profileData) {
        await supabase.from('quotes').insert({
          client_id: request.clientId || user?.id,
          performer_id: profileId,
          performer_user_id: app.performerId,
          title: request.title,
          event_date: request.date || null,
          region: request.region || null,
          venue: request.venue || null,
          duration: request.duration || null,
          budget: request.budget || null,
          genre: request.genres,
          description: request.description || null,
          client_name: request.clientName || profile?.name || '수요자',
          performer_name: stageName,
          status: 'requested',
        });
        setAcceptedNotice(true);
      }
    }
    setActionId(null);
    await loadApplications();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <i className="ri-loader-4-line text-primary-500 text-2xl animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <i className="ri-error-warning-line text-4xl text-foreground-300 mb-3 block" />
            <h2 className="text-xl font-bold text-foreground-950 mb-2">공연 요청을 찾을 수 없습니다</h2>
            {loadError && <p className="text-sm text-foreground-500 mb-4">{loadError}</p>}
            <Link to="/requests" className="text-primary-600 text-sm hover:underline">공연 요청 목록으로 돌아가기</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const detailItems = [
    { icon: 'ri-calendar-line', label: '공연 날짜', value: formatDate(request.date) || '미정' },
    { icon: 'ri-map-pin-line', label: '지역', value: request.region || '미정' },
    { icon: 'ri-building-line', label: '장소', value: request.venue || '미정' },
    { icon: 'ri-time-line', label: '공연 시간', value: request.duration ? `${request.duration}분` : '미정' },
    { icon: 'ri-group-line', label: '예상 관객', value: request.audienceSize ? `${request.audienceSize}명` : '미정' },
  ];

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24">
        <div className="w-full px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-5xl mx-auto">
            <Link to="/requests" className="inline-flex items-center gap-1 text-sm text-foreground-500 hover:text-foreground-700 mb-6">
              <i className="ri-arrow-left-line" />
              공연 요청 목록으로 돌아가기
            </Link>

            <div className="bg-background-50 rounded-2xl border border-background-200 overflow-hidden mb-6">
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {requestStatusBadge(request.status)}
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-900">
                      {request.eventType || '행사'}
                    </span>
                    {request.performerName && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary-500 text-background-50">
                        <i className="ri-user-star-line" />
                        {request.performerName} 공연 의뢰
                      </span>
                    )}
                  </div>

                  {/* 요청자(수요자) / 관리자 수정 및 삭제 기능 */}
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-background-300 bg-background-50 text-xs font-semibold text-foreground-700 hover:bg-background-100 hover:text-foreground-950 transition-colors cursor-pointer shadow-xs"
                      >
                        <i className="ri-edit-line text-sm text-primary-600" />
                        수정하기
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer shadow-xs"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                        삭제하기
                      </button>
                    </div>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950 mb-3">{request.title}</h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-500 mb-6">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="ri-user-line" />
                    {request.clientName}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <i className="ri-calendar-check-line" />
                    {formatDate(request.date)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {request.genres.map((g) => (
                    <span key={g} className="px-3 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-900">
                      {g}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {detailItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 bg-background-100 rounded-lg px-4 py-3">
                      <div className="w-9 h-9 rounded-lg bg-background-50 border border-background-200 flex items-center justify-center flex-shrink-0">
                        <i className={`${item.icon} text-foreground-600`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground-500">{item.label}</p>
                        <p className="text-sm font-medium text-foreground-900 truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-background-50 border border-primary-200 flex items-center justify-center flex-shrink-0">
                      <i className="ri-wallet-3-line text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-foreground-500">예산</p>
                      <p className="text-sm font-semibold text-primary-700">{request.budget}만원</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="font-heading font-semibold text-foreground-950 mb-2 text-sm">상세 설명</h2>
                  <p className="text-sm text-foreground-700 leading-relaxed whitespace-pre-line">
                    {request.description || '상세 설명이 없습니다.'}
                  </p>
                </div>
              </div>
            </div>

            {isPerformer && request.status === 'open' && (
              <div className="bg-background-50 rounded-2xl border border-background-200 p-6 md:p-8 mb-6">
                {myApplication ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <i className="ri-check-line text-primary-600 text-lg" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground-900">이미 지원한 요청입니다</p>
                        <p className="text-xs text-foreground-500 mt-0.5">
                          {myApplication.proposedFee != null ? `제안 출연료 ${myApplication.proposedFee}만원 · ` : ''}
                          {statusMeta[myApplication.status].label}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusMeta[myApplication.status].className}`}>
                      {statusMeta[myApplication.status].label}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="font-heading font-semibold text-foreground-950 text-base mb-1">이 공연에 지원하시겠어요?</h2>
                      <p className="text-sm text-foreground-600">제안 출연료와 지원 메시지를 작성해 수요자에게 어필하세요.</p>
                    </div>
                    <button
                      onClick={openApply}
                      className="px-6 py-3 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
                    >
                      <i className="ri-flashlight-line" />
                      지원하기
                    </button>
                  </div>
                )}
              </div>
            )}

            {isOwner && (
              <div className="bg-background-50 rounded-2xl border border-background-200 p-6 md:p-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading font-semibold text-foreground-950 text-base">받은 지원</h2>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                    {applications.length}건
                  </span>
                </div>

                {appsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line text-primary-500 text-xl animate-spin" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-10">
                    <i className="ri-inbox-line text-3xl text-foreground-300 mb-3 block" />
                    <p className="text-foreground-500 text-sm">아직 들어온 지원이 없어요.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => {
                      const meta = statusMeta[app.status] ?? statusMeta.pending;
                      return (
                        <div key={app.id} className={`border border-background-200 rounded-lg p-4 ${highlightApplications.has(app.id) ? 'realtime-highlight' : ''}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-foreground-900 text-sm">{app.performerName}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.className}`}>{meta.label}</span>
                              </div>
                              <p className="text-xs text-foreground-500">
                                {new Date(app.createdAt).toLocaleDateString('ko-KR')} 지원
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-primary-600">
                                {app.proposedFee != null ? `${app.proposedFee}만원` : '출연료 미기재'}
                              </p>
                            </div>
                          </div>
                          {app.message && <p className="text-sm text-foreground-600 mb-3">{app.message}</p>}
                          {app.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDecision(app, 'accepted')}
                                disabled={actionId === app.id}
                                className="flex-1 py-2 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60 whitespace-nowrap"
                              >
                                {actionId === app.id ? '처리 중...' : '수락하기'}
                              </button>
                              <button
                                onClick={() => handleDecision(app, 'rejected')}
                                disabled={actionId === app.id}
                                className="flex-1 py-2 rounded-lg border border-background-300 text-foreground-600 text-sm font-medium hover:bg-background-100 transition-colors disabled:opacity-60 whitespace-nowrap"
                              >
                                거절하기
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {applyOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setApplyOpen(false)} />
          <div className="relative bg-background-50 rounded-2xl p-6 md:p-8 max-w-md w-full">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-heading font-bold text-foreground-950 text-lg">공연 지원</h3>
                <p className="text-sm text-foreground-500 mt-0.5 line-clamp-1">{request.title}</p>
              </div>
              <button
                onClick={() => setApplyOpen(false)}
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
                  placeholder={`예: ${request.budget}`}
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

      {acceptedNotice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAcceptedNotice(false)} />
          <div className="relative bg-background-50 rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="w-14 h-14 rounded-full bg-accent-100 flex items-center justify-center mx-auto mb-4">
              <i className="ri-file-text-line text-accent-700 text-2xl" />
            </div>
            <h3 className="font-heading font-bold text-foreground-950 text-lg mb-1">공연자를 수락했습니다</h3>
            <p className="text-sm text-foreground-600 mb-6">
              견적·계약으로 자동 연결되었어요. 공연자가 견적서를 보내면 계약을 진행할 수 있습니다.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setAcceptedNotice(false);
                  navigate('/quotes');
                }}
                className="w-full py-3 rounded-lg bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer shadow-sm text-center block"
              >
                견적·계약 관리로 이동
              </button>
              <button
                type="button"
                onClick={() => setAcceptedNotice(false)}
                className="w-full py-3 rounded-lg border border-background-300 text-foreground-600 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && request && (
        <RequestEditModal
          open={editOpen}
          request={request}
          onClose={() => setEditOpen(false)}
          onSaved={() => loadRequest()}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background-50 rounded-2xl border border-background-200 p-6 max-w-sm w-full text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600 text-2xl">
              <i className="ri-delete-bin-line" />
            </div>
            <h3 className="font-heading font-bold text-foreground-950 text-lg mb-2">
              공연 요청을 삭제하시겠습니까?
            </h3>
            <p className="text-xs text-foreground-600 mb-6 leading-relaxed">
              삭제하시면 해당 요청과 관련된 지원 내역이 모두 함께 삭제되며 복구할 수 없습니다.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg border border-background-300 text-foreground-700 text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {deleting && <i className="ri-loader-4-line animate-spin" />}
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}