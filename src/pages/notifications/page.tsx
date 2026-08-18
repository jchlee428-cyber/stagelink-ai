import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

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

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
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
    if (user) loadNotifications();
  }, [user, loadNotifications]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          loadNotifications();
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
  }, [user, loadNotifications]);

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

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-28 pb-16">
        <div className="w-full px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950">알림</h1>
                <p className="text-sm text-foreground-600 mt-1">새로운 소식을 확인하세요</p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="px-4 py-2 rounded-full text-sm font-medium text-foreground-700 border border-background-200 hover:bg-background-100 transition-colors whitespace-nowrap"
                >
                  모두 읽음
                </button>
              )}
            </div>

            <div className="bg-background-50 border border-background-200 rounded-xl p-2">
              {notifLoading ? (
                <div className="flex items-center justify-center py-12">
                  <i className="ri-loader-4-line text-primary-500 text-xl animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-full bg-background-100 flex items-center justify-center mx-auto mb-4">
                    <i className="ri-notification-3-line text-2xl text-foreground-300" />
                  </div>
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
                        if (n.relatedId) {
                          navigate(n.type === 'quote' ? '/quotes' : `/requests/${n.relatedId}`);
                        }
                      }}
                      className={`w-full text-left flex items-start gap-3 p-4 rounded-lg transition-colors ${
                        n.isRead ? 'hover:bg-background-100' : 'bg-accent-50 hover:bg-accent-100/70'
                      } ${highlightIds.has(n.id) ? 'realtime-highlight' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
                        <i className="ri-notification-3-line text-secondary-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground-900">{n.title}</p>
                          {n.emailSent && (
                            <i className="ri-mail-send-line text-foreground-400" title="이메일로도 발송됨" />
                          )}
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-accent-500 flex-shrink-0" />}
                        </div>
                        {n.message && (
                          <p className="text-xs text-foreground-500 mt-0.5 line-clamp-2">{n.message}</p>
                        )}
                        <p className="text-xs text-foreground-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      <i className="ri-arrow-right-s-line text-foreground-300 mt-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}