import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import ScheduleModal from './components/ScheduleModal';
import { statusMeta, type ScheduleItem } from './types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function SchedulePage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [highlightItems, setHighlightItems] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState(toDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  const loadSchedules = useCallback(async () => {
    if (!user) return;
    setLoadingItems(true);
    setLoadError('');
    try {
      const performerProfileRes = await supabase
        .from('performer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const performerProfileId = performerProfileRes.data?.id ?? null;

      const [schedulesRes, requestsRes] = await Promise.all([
        supabase
          .from('schedules')
          .select('*')
          .eq('user_id', user.id)
          .order('event_date', { ascending: true }),
        performerProfileId
          ? supabase
              .from('performance_requests')
              .select('*')
              .eq('performer_id', performerProfileId)
              .not('date', 'is', null)
              .order('date', { ascending: true })
          : Promise.resolve({ data: null, error: null }),
      ]);

      const manualItems: ScheduleItem[] = [];
      if (!schedulesRes.error && schedulesRes.data) {
        manualItems.push(
          ...schedulesRes.data.map((s) => ({
            id: String(s.id),
            title: String(s.title ?? ''),
            eventDate: String(s.event_date ?? ''),
            startTime: s.start_time != null ? String(s.start_time) : null,
            endTime: s.end_time != null ? String(s.end_time) : null,
            location: s.location != null ? String(s.location) : null,
            eventType: s.event_type != null ? String(s.event_type) : null,
            description: s.description != null ? String(s.description) : null,
            status: (s.status as ScheduleItem['status']) ?? 'scheduled',
            source: 'manual' as const,
          })),
        );
      }

      const requestItems: ScheduleItem[] = [];
      if (!requestsRes.error && requestsRes.data) {
        requestItems.push(
          ...requestsRes.data.map((r) => ({
            id: `req-${r.id}`,
            title: String(r.title ?? '공연 요청'),
            eventDate: String(r.date ?? ''),
            startTime: null,
            endTime: null,
            location: r.venue != null ? String(r.venue) : null,
            eventType: r.event_type != null ? String(r.event_type) : '공연',
            description: r.description != null ? String(r.description) : null,
            status: 'scheduled' as ScheduleItem['status'],
            source: 'request' as const,
            requestId: String(r.id),
          })),
        );
      }

      if (schedulesRes.error && requestsRes.error) {
        setLoadError('일정을 불러오지 못했어요. 다시 시도해주세요.');
      } else {
        setItems([...manualItems, ...requestItems]);
      }
    } catch {
      setLoadError('일정을 불러오지 못했어요. 다시 시도해주세요.');
    } finally {
      setLoadingItems(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSchedules();
    }
  }, [user, loadSchedules]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('schedule-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedules', filter: `user_id=eq.${user.id}` },
        (payload) => {
          loadSchedules();
          if (payload.eventType === 'INSERT') {
            const newId = String((payload.new as Record<string, unknown>).id);
            setHighlightItems((prev) => new Set(prev).add(newId));
            setTimeout(() => {
              setHighlightItems((prev) => {
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
  }, [user, loadSchedules]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    items.forEach((item) => {
      const list = map.get(item.eventDate) ?? [];
      list.push(item);
      map.set(item.eventDate, list);
    });
    return map;
  }, [items]);

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    const cells: { day: number; date: string; inMonth: boolean }[] = [];
    for (let i = 0; i < totalCells; i += 1) {
      const day = i - startOffset + 1;
      if (day < 1 || day > daysInMonth) {
        cells.push({ day: 0, date: '', inMonth: false });
      } else {
        cells.push({ day, date: toDateString(year, month, day), inMonth: true });
      }
    }
    return cells;
  }, [currentMonth]);

  const todayStr = toDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const upcomingItems = useMemo(() => {
    return items
      .filter((i) => i.eventDate >= todayStr && i.status !== 'cancelled')
      .sort((a, b) => {
        if (a.eventDate === b.eventDate) {
          return (a.startTime ?? '').localeCompare(b.startTime ?? '');
        }
        return a.eventDate.localeCompare(b.eventDate);
      });
  }, [items, todayStr]);

  if (!loading && user && profile && profile.role !== 'performer' && profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background-50 flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 md:pt-28 pb-16 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-4">
              <i className="ri-calendar-close-line text-secondary-700 text-2xl" />
            </div>
            <h2 className="text-xl font-bold font-heading text-foreground-950 mb-2">공연자 전용 기능</h2>
            <p className="text-sm text-foreground-600 mb-6 max-w-xs mx-auto">
              일정 관리는 공연자 회원만 사용할 수 있는 기능이에요.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                to="/performer/profile"
                className="px-5 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
              >
                공연자 프로필 등록
              </Link>
              <Link
                to="/"
                className="px-5 py-2.5 rounded-full border border-background-300 text-foreground-700 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap"
              >
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-50 flex items-center justify-center">
        <i className="ri-loader-4-line text-primary-500 text-2xl animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const changeMonth = (delta: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const goToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const openAdd = (date?: string) => {
    setEditingItem(null);
    setModalInitialDate(date ?? todayStr);
    setModalOpen(true);
  };

  const openEdit = (item: ScheduleItem) => {
    if (item.source === 'request' && item.requestId) {
      navigate(`/requests/${item.requestId}`);
      return;
    }
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (item: ScheduleItem) => {
    if (item.source === 'request') return;
    if (!window.confirm(`"${item.title}" 일정을 삭제할까요?`)) return;
    const { error } = await supabase.from('schedules').delete().eq('id', item.id);
    if (!error) {
      await loadSchedules();
    }
  };

  const monthLabel = `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`;

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-28 pb-16">
        <div className="w-full px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950">일정 관리</h1>
                <p className="text-sm text-foreground-600 mt-1">
                  {profile?.name || '회원'}님의 공연 일정을 한눈에 관리해보세요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAdd()}
                className="px-5 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
              >
                <i className="ri-add-line mr-1" />
                새 일정
              </button>
            </div>

            <div className="bg-background-50 border border-background-200 rounded-lg p-4 md:p-6 mb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading font-semibold text-foreground-950 text-base">{monthLabel}</h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    className="w-9 h-9 rounded-md border border-background-300 flex items-center justify-center text-foreground-600 hover:bg-background-100 transition-colors"
                    aria-label="이전 달"
                  >
                    <i className="ri-arrow-left-s-line text-lg" />
                  </button>
                  <button
                    type="button"
                    onClick={goToday}
                    className="px-3 h-9 rounded-md border border-background-300 text-sm text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap"
                  >
                    오늘
                  </button>
                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    className="w-9 h-9 rounded-md border border-background-300 flex items-center justify-center text-foreground-600 hover:bg-background-100 transition-colors"
                    aria-label="다음 달"
                  >
                    <i className="ri-arrow-right-s-line text-lg" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map((d, idx) => (
                  <div
                    key={d}
                    className={`text-center text-xs font-medium py-2 ${
                      idx === 0 ? 'text-red-500' : idx === 6 ? 'text-primary-600' : 'text-foreground-500'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, idx) => {
                  if (!cell.inMonth) {
                    return <div key={idx} className="min-h-[72px] md:min-h-[92px]" />;
                  }
                  const isToday = cell.date === todayStr;
                  const dayEvents = eventsByDate.get(cell.date) ?? [];
                  const weekday = idx % 7;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => openAdd(cell.date)}
                      className={`min-h-[72px] md:min-h-[92px] rounded-md border p-1.5 text-left transition-colors cursor-pointer ${
                        isToday
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-background-200 hover:bg-background-100'
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-1 ${
                          isToday
                            ? 'bg-primary-500 text-background-50'
                            : weekday === 0
                              ? 'text-red-500'
                              : weekday === 6
                                ? 'text-primary-600'
                                : 'text-foreground-700'
                        }`}
                      >
                        {cell.day}
                      </span>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (ev.source === 'request' && ev.requestId) {
                                navigate(`/requests/${ev.requestId}`);
                              } else {
                                openEdit(ev);
                              }
                            }}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] leading-tight truncate cursor-pointer ${
                              ev.source === 'request'
                                ? 'bg-accent-100 text-accent-800'
                                : 'bg-secondary-100 text-secondary-800'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              ev.source === 'request' ? 'bg-accent-500' : statusMeta[ev.status].dot
                            }`} />
                            <span className="truncate">{ev.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-foreground-400 px-1.5">+{dayEvents.length - 2}건</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-background-50 border border-background-200 rounded-lg p-4 md:p-6">
              <h2 className="font-heading font-semibold text-foreground-950 text-base mb-5">다가오는 일정</h2>
              {loadingItems ? (
                <div className="flex items-center justify-center py-10">
                  <i className="ri-loader-4-line text-primary-500 text-xl animate-spin" />
                </div>
              ) : loadError ? (
                <div className="text-center py-10">
                  <p className="text-foreground-500 text-sm mb-4">{loadError}</p>
                  <button
                    type="button"
                    onClick={loadSchedules}
                    className="px-4 py-2 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
                  >
                    다시 시도
                  </button>
                </div>
              ) : upcomingItems.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-3">
                    <i className="ri-calendar-line text-secondary-700 text-xl" />
                  </div>
                  <p className="text-foreground-500 text-sm mb-4">예정된 일정이 없어요. 새 일정을 추가해보세요.</p>
                  <button
                    type="button"
                    onClick={() => openAdd()}
                    className="px-4 py-2 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
                  >
                    새 일정 추가
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingItems.map((item) => {
                    const meta = statusMeta[item.status] ?? statusMeta.scheduled;
                    const dateObj = new Date(`${item.eventDate}T00:00:00`);
                    const isToday = item.eventDate === todayStr;
                    return (
                      <div
                        key={item.id}
                        className={`border border-background-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${highlightItems.has(item.id) ? 'realtime-highlight' : ''}`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-14 h-14 rounded-lg bg-background-100 flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-xs text-foreground-500">{dateObj.getMonth() + 1}월</span>
                            <span className="text-xl font-bold font-heading text-foreground-950 leading-none">
                              {dateObj.getDate()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-medium text-foreground-900 text-sm truncate">{item.title}</h3>
                              {item.source === 'request' ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-800">
                                  공연 요청
                                </span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.className}`}>
                                  {isToday ? '오늘' : meta.label}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-foreground-500 line-clamp-1">
                              {item.startTime ? `${item.startTime}${item.endTime ? ` ~ ${item.endTime}` : ''}` : '시간 미정'}
                              {item.location ? ` · ${item.location}` : ''}
                              {item.eventType ? ` · ${item.eventType}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {item.source === 'request' && item.requestId ? (
                            <Link
                              to={`/requests/${item.requestId}`}
                              className="px-4 py-2 rounded-md bg-accent-500 text-background-50 text-xs font-medium hover:bg-accent-600 transition-colors whitespace-nowrap"
                            >
                              상세 보기
                            </Link>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(item)}
                                className="w-9 h-9 rounded-md border border-background-300 flex items-center justify-center text-foreground-600 hover:bg-background-100 transition-colors"
                                aria-label="수정"
                              >
                                <i className="ri-edit-line" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="w-9 h-9 rounded-md border border-background-300 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                                aria-label="삭제"
                              >
                                <i className="ri-delete-bin-line" />
                              </button>
                            </>
                          )}
                        </div>
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

      <ScheduleModal
        open={modalOpen}
        editingItem={editingItem}
        initialDate={modalInitialDate}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          loadSchedules();
        }}
      />
    </div>
  );
}