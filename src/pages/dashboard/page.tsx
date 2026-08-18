import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import EarningsSummary from './components/EarningsSummary';
import ReviewsSummary from './components/ReviewsSummary';
import PendingReviews from './components/PendingReviews';

interface MyApplication {
  id: string;
  requestTitle: string;
  proposedFee: number | null;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface ReceivedApplication {
  id: string;
  requestId: string;
  requestTitle: string;
  performerId: string;
  performerName: string;
  proposedFee: number | null;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

const statusMeta: Record<string, { label: string; className: string }> = {
  pending: { label: '검토중', className: 'bg-secondary-100 text-secondary-800' },
  accepted: { label: '수락됨', className: 'bg-primary-100 text-primary-700' },
  rejected: { label: '거절됨', className: 'bg-background-200 text-foreground-500' },
};

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  relatedId: string | null;
  isRead: boolean;
  emailSent: boolean;
  createdAt: string;
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return d.toLocaleDateString('ko-KR');
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();

  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<ReceivedApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [highlightNotifications, setHighlightNotifications] = useState<Set<string>>(new Set());
  const [highlightApplications, setHighlightApplications] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; requestId: string } | null>(null);
  const myRequestIdsRef = useRef<Set<string>>(new Set());

  const [completedCount, setCompletedCount] = useState(0);
  const [myRating, setMyRating] = useState('—');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  const isPerformer = profile?.role === 'performer';

  const loadApplications = useCallback(async () => {
    if (!user || !profile) return;
    setAppsLoading(true);
    try {
      if (profile.role === 'performer') {
        const { data, error } = await supabase
          .from('applications')
          .select('id, proposed_fee, message, status, created_at, performance_requests(title)')
          .eq('performer_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setMyApplications(
            data.map((a: Record<string, unknown>) => {
              const req = a.performance_requests as Record<string, unknown> | null;
              return {
                id: String(a.id),
                requestTitle: String(req?.title ?? '공연 요청'),
                proposedFee: a.proposed_fee != null ? Number(a.proposed_fee) : null,
                message: String(a.message ?? ''),
                status: a.status as MyApplication['status'],
                createdAt: String(a.created_at ?? ''),
              };
            }),
          );
        }
      } else {
        const { data: myReqs } = await supabase
          .from('performance_requests')
          .select('id')
          .eq('client_id', user.id);
        const reqIds = (myReqs ?? []).map((r: Record<string, unknown>) => String(r.id));
        myRequestIdsRef.current = new Set(reqIds);

        if (reqIds.length === 0) {
          setReceivedApplications([]);
          return;
        }

        const { data: apps, error } = await supabase
          .from('applications')
          .select('id, request_id, performer_id, proposed_fee, message, status, created_at, performance_requests(title)')
          .in('request_id', reqIds)
          .order('created_at', { ascending: false });

        if (error || !apps) return;

        const performerIds = apps.map((a: Record<string, unknown>) => String(a.performer_id));
        const { data: profilesData } = await supabase
          .from('performer_profiles')
          .select('user_id, stage_name')
          .in('user_id', performerIds);
        const nameMap = new Map<string, string>();
        (profilesData ?? []).forEach((p: Record<string, unknown>) => {
          nameMap.set(String(p.user_id), String(p.stage_name ?? ''));
        });

        setReceivedApplications(
          apps.map((a: Record<string, unknown>) => {
            const req = a.performance_requests as Record<string, unknown> | null;
            const pid = String(a.performer_id);
            return {
              id: String(a.id),
              requestId: String(a.request_id),
              requestTitle: String(req?.title ?? '공연 요청'),
              performerId: pid,
              performerName: nameMap.get(pid) || '공연자',
              proposedFee: a.proposed_fee != null ? Number(a.proposed_fee) : null,
              message: String(a.message ?? ''),
              status: a.status as ReceivedApplication['status'],
              createdAt: String(a.created_at ?? ''),
            };
          }),
        );
      }
    } catch {
      // 무시
    } finally {
      setAppsLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && profile) {
      loadApplications();
    }
  }, [user, profile, loadApplications]);

  const handleDecision = async (
    appId: string,
    requestId: string,
    performerUserId: string,
    decision: 'accepted' | 'rejected',
  ) => {
    setActionId(appId);
    const { error } = await supabase
      .from('applications')
      .update({ status: decision })
      .eq('id', appId);

    if (!error && decision === 'accepted') {
      // 수락한 공연자의 프로필 id 조회 (applications.performer_id = 로그인 계정 id)
      const { data: profileData } = await supabase
        .from('performer_profiles')
        .select('id')
        .eq('user_id', performerUserId)
        .maybeSingle();

      const profileId = profileData ? String((profileData as Record<string, unknown>).id) : null;

      // 매칭 확정: status와 performer_id(프로필 id)를 함께 저장
      await supabase
        .from('performance_requests')
        .update({ status: 'matched', performer_id: profileId })
        .eq('id', requestId);
    }

    setActionId(null);
    await loadApplications();
  };

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) {
        setNotifications(
          (data as Record<string, unknown>[]).map((n) => ({
            id: String(n.id),
            type: String(n.type),
            title: String(n.title),
            message: n.message != null ? String(n.message) : null,
            relatedId: n.related_id != null ? String(n.related_id) : null,
            isRead: Boolean(n.is_read),
            emailSent: Boolean(n.email_sent),
            createdAt: String(n.created_at),
          })),
        );
      }
    } catch {
      // 무시
    } finally {
      setNotifLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  const loadStats = useCallback(async () => {
    if (!user || !profile) return;
    try {
      const { data: schedData } = await supabase
        .from('schedules')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'completed');
      setCompletedCount((schedData ?? []).length);

      if (profile.role === 'performer') {
        const { data: profData } = await supabase
          .from('performer_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        const pid = profData ? String((profData as Record<string, unknown>).id) : null;
        if (!pid) {
          setMyRating('0.0');
          return;
        }
        const { data: revData } = await supabase
          .from('reviews')
          .select('rating')
          .eq('performer_id', pid);
        if (revData && revData.length > 0) {
          const avg = (revData as Record<string, unknown>[]).reduce(
            (sum, r) => sum + Number(r.rating),
            0,
          ) / revData.length;
          setMyRating(avg.toFixed(1));
        } else {
          setMyRating('0.0');
        }
      } else {
        const { data: myRev } = await supabase
          .from('reviews')
          .select('id')
          .eq('client_id', user.id);
        setMyRating(String((myRev ?? []).length));
      }
    } catch {
      // 무시
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && profile) {
      loadStats();
    }
  }, [user, profile, loadStats]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('dashboard-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          loadNotifications();
          if (payload.eventType === 'INSERT') {
            const newId = String((payload.new as Record<string, unknown>).id);
            setHighlightNotifications((prev) => new Set(prev).add(newId));
            setTimeout(() => {
              setHighlightNotifications((prev) => {
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
  }, [user, loadNotifications]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('dashboard-applications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        (payload) => {
          loadApplications();
          if (payload.eventType === 'INSERT') {
            const newId = String((payload.new as Record<string, unknown>).id);
            const newReqId = String((payload.new as Record<string, unknown>).request_id);
            setHighlightApplications((prev) => new Set(prev).add(newId));
            setTimeout(() => {
              setHighlightApplications((prev) => {
                const next = new Set(prev);
                next.delete(newId);
                return next;
              });
            }, 2600);
            if (!isPerformer && myRequestIdsRef.current.has(newReqId)) {
              setToast({ message: '새로운 공연자 지원이 도착했어요', requestId: newReqId });
              setTimeout(() => setToast(null), 4000);
            }
          }
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Record<string, unknown>;
            const newStatus = String(updated.status);
            const performerId = String(updated.performer_id);
            if (
              isPerformer &&
              user &&
              performerId === user.id &&
              (newStatus === 'accepted' || newStatus === 'rejected')
            ) {
              setToast({
                message: newStatus === 'accepted' ? '지원이 수락되었어요!' : '지원이 거절되었어요',
                requestId: String(updated.request_id),
              });
              setTimeout(() => setToast(null), 4000);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadApplications, isPerformer]);

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user!.id)
      .eq('is_read', false);
    await loadNotifications();
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-50 flex items-center justify-center">
        <i className="ri-loader-4-line text-primary-500 text-2xl animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const statCards = [
    { label: '프로필 상태', value: '활성', icon: 'ri-checkbox-circle-line' },
    {
      label: isPerformer ? '지원한 요청' : '받은 지원',
      value: String(isPerformer ? myApplications.length : receivedApplications.length),
      icon: 'ri-flashlight-line',
    },
    {
      label: isPerformer ? '평점' : '작성한 후기',
      value: myRating,
      icon: 'ri-star-line',
    },
    { label: '완료 공연', value: String(completedCount), icon: 'ri-music-2-line' },
  ];

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-28 pb-16">
        <div className="w-full px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950">
                  {isPerformer ? '공연자 마이페이지' : '수요자 마이페이지'}
                </h1>
                <p className="text-sm text-foreground-600 mt-1">
                  {profile?.name || '회원'}님, 환영합니다!
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={isPerformer ? '/performer/profile' : '/requests/new'}
                  className="px-5 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  <i className={isPerformer ? 'ri-user-settings-line mr-1' : 'ri-add-line mr-1'} />
                  {isPerformer ? '프로필 관리' : '요청 등록'}
                </Link>
                <Link
                  to="/schedule"
                  className="px-5 py-2.5 rounded-full border border-background-200 text-sm font-medium text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap"
                >
                  <i className="ri-calendar-line mr-1" />
                  일정 관리
                </Link>
                <Link
                  to="/quotes"
                  className="px-5 py-2.5 rounded-full border border-background-200 text-sm font-medium text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap"
                >
                  <i className="ri-file-text-line mr-1" />
                  견적·계약
                </Link>
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="px-5 py-2.5 rounded-full bg-accent-500 text-background-50 text-sm font-medium hover:bg-accent-600 transition-colors whitespace-nowrap"
                  >
                    <i className="ri-dashboard-line mr-1" />
                    관리자 대시보드
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="px-5 py-2.5 rounded-full border border-background-200 text-sm font-medium text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap"
                >
                  <i className="ri-logout-box-r-line mr-1" />
                  로그아웃
                </button>
              </div>
            </div>

            <div className="bg-background-50 border border-background-200 rounded-lg p-6 mb-6">
              <h2 className="font-heading font-semibold text-foreground-950 mb-4 text-sm">기본 정보</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-foreground-500 mb-1">이름 / 활동명</p>
                  <p className="text-sm text-foreground-800 font-medium">{profile?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-500 mb-1">이메일</p>
                  <p className="text-sm text-foreground-800 font-medium">{user.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground-500 mb-1">역할</p>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                    <i className={isPerformer ? 'ri-mic-line' : 'ri-building-line'} />
                    {isPerformer ? '공연자' : '공연 수요자'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-foreground-500 mb-1">주요 지역</p>
                  <p className="text-sm text-foreground-800 font-medium">{profile?.region || '—'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statCards.map((card) => (
                <div key={card.label} className="bg-background-50 border border-background-200 rounded-lg p-5">
                  <div className="w-9 h-9 rounded-lg bg-secondary-100 flex items-center justify-center mb-3">
                    <i className={`${card.icon} text-secondary-700 text-lg`} />
                  </div>
                  <p className="text-2xl font-bold font-heading text-foreground-950">{card.value}</p>
                  <p className="text-xs text-foreground-500 mt-1">{card.label}</p>
                </div>
              ))}
            </div>

            {isPerformer && <EarningsSummary performerUserId={user.id} />}

            {!isPerformer && <PendingReviews userId={user.id} clientName={profile?.name ?? null} />}

            <ReviewsSummary userId={user.id} role={isPerformer ? 'performer' : 'client'} />

            <div className="bg-background-50 border border-background-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-semibold text-foreground-950 text-sm">알림</h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-500 text-background-50">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs text-foreground-500 hover:text-foreground-700 whitespace-nowrap"
                  >
                    모두 읽음
                  </button>
                )}
              </div>

              {notifLoading ? (
                <div className="flex items-center justify-center py-6">
                  <i className="ri-loader-4-line text-primary-500 text-lg animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-6">
                  <i className="ri-notification-3-line text-2xl text-foreground-300 mb-2 block" />
                  <p className="text-sm text-foreground-500">아직 알림이 없어요.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        markRead(n.id);
                        if (n.type === 'quote') {
                          navigate('/quotes');
                        } else if (n.type === 'review') {
                          document.getElementById('pending-reviews')?.scrollIntoView({ behavior: 'smooth' });
                        } else if (n.relatedId) {
                          navigate(`/requests/${n.relatedId}`);
                        }
                      }}
                      className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        n.isRead ? 'hover:bg-background-100' : 'bg-accent-50 hover:bg-accent-100/70'
                      } ${highlightNotifications.has(n.id) ? 'realtime-highlight' : ''}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
                        <i className="ri-notification-3-line text-secondary-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground-900">{n.title}</p>
                          {n.emailSent && <i className="ri-mail-send-line text-foreground-400" title="이메일로도 발송됨" />}
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-accent-500 flex-shrink-0" />}
                        </div>
                        {n.message && <p className="text-xs text-foreground-500 mt-0.5 line-clamp-2">{n.message}</p>}
                        <p className="text-xs text-foreground-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isPerformer ? (
              <div className="bg-background-50 border border-background-200 rounded-lg p-6">
                <h2 className="font-heading font-semibold text-foreground-950 mb-5 text-sm">지원 현황</h2>
                {appsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line text-primary-500 text-xl animate-spin" />
                  </div>
                ) : myApplications.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-foreground-500 text-sm mb-4">아직 지원한 공연 요청이 없어요.</p>
                    <Link
                      to="/requests"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      공연 요청 둘러보기 <i className="ri-arrow-right-line" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myApplications.map((app) => {
                      const meta = statusMeta[app.status] ?? statusMeta.pending;
                      return (
                        <div key={app.id} className={`border border-background-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${highlightApplications.has(app.id) ? 'realtime-highlight' : ''}`}>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-foreground-900 text-sm truncate">{app.requestTitle}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.className}`}>{meta.label}</span>
                            </div>
                            <p className="text-xs text-foreground-500 line-clamp-1">
                              {app.proposedFee != null ? `제안 출연료 ${app.proposedFee}만원` : '출연료 미기재'}
                              {app.message ? ` · ${app.message}` : ''}
                            </p>
                          </div>
                          <span className="text-xs text-foreground-400 whitespace-nowrap">
                            {new Date(app.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-background-50 border border-background-200 rounded-lg p-6">
                <h2 className="font-heading font-semibold text-foreground-950 mb-5 text-sm">받은 지원</h2>
                {appsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line text-primary-500 text-xl animate-spin" />
                  </div>
                ) : receivedApplications.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-foreground-500 text-sm mb-4">아직 들어온 지원이 없어요.</p>
                    <Link
                      to="/requests/new"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      공연 요청 등록하기 <i className="ri-arrow-right-line" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receivedApplications.map((app) => {
                      const meta = statusMeta[app.status] ?? statusMeta.pending;
                      return (
                        <div key={app.id} className={`border border-background-200 rounded-lg p-4 ${highlightApplications.has(app.id) ? 'realtime-highlight' : ''}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-foreground-900 text-sm truncate">{app.performerName}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.className}`}>{meta.label}</span>
                              </div>
                              <p className="text-xs text-foreground-500">{app.requestTitle}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-primary-600">
                                {app.proposedFee != null ? `${app.proposedFee}만원` : '출연료 미기재'}
                              </p>
                            </div>
                          </div>
                          {app.message && <p className="text-sm text-foreground-600 mb-3 line-clamp-2">{app.message}</p>}
                          {app.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDecision(app.id, app.requestId, app.performerId, 'accepted')}
                                disabled={actionId === app.id}
                                className="flex-1 py-2 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60 whitespace-nowrap"
                              >
                                {actionId === app.id ? '처리 중...' : '수락하기'}
                              </button>
                              <button
                                onClick={() => handleDecision(app.id, app.requestId, app.performerId, 'rejected')}
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

      {toast && (
        <button
          type="button"
          onClick={() => navigate(`/requests/${toast.requestId}`)}
          className="fixed top-24 right-4 z-[70] toast-in flex items-center gap-2.5 bg-foreground-950 text-background-50 pl-4 pr-5 py-3 rounded-lg hover:bg-foreground-900 transition-colors cursor-pointer"
        >
          <i className="ri-notification-3-line text-primary-400 text-lg" />
          <span className="text-sm font-medium">{toast.message}</span>
          <i className="ri-arrow-right-line text-background-50/60 text-sm" />
        </button>
      )}
    </div>
  );
}