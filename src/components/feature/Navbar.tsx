import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    let mounted = true;
    const loadUnread = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (!error && mounted) setUnreadCount((data ?? []).length);
    };
    loadUnread();

    const channel = supabase
      .channel('navbar-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => loadUnread(),
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isHome = location.pathname === '/';

  const navLinks = [
    { to: '/performers', label: '공연자 찾기' },
    { to: '/matching', label: 'AI 매칭' },
    { to: '/requests', label: '공연 요청' },
  ];

  const dashboardPath =
    profile?.role === 'performer' ? '/dashboard/performer' : '/dashboard/client';

  const handleLogout = async () => {
    setMenuOpen(false);
    setMobileOpen(false);
    await signOut();
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHome
          ? 'bg-background-50/95 backdrop-blur-md border-b border-background-200/70'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <i className="ri-music-2-line text-background-50 text-lg" />
            </div>
            <span className={`text-lg md:text-xl font-bold font-heading tracking-tight ${scrolled || !isHome ? 'text-foreground-950' : 'text-background-50'}`}>
              StageLink AI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  scrolled || !isHome
                    ? 'text-foreground-700 hover:text-foreground-950 hover:bg-background-100'
                    : 'text-background-50/80 hover:text-background-50 hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/notifications"
                  className="relative w-10 h-10 flex items-center justify-center rounded-full bg-background-100 hover:bg-background-200 text-foreground-700 transition-colors"
                  title="알림"
                >
                  <i className="ri-notification-3-line text-lg" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-background-50 text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium bg-background-100 hover:bg-background-200 text-foreground-800 transition-colors whitespace-nowrap"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-background-50 text-xs font-bold">
                        {(profile?.name || user.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="max-w-[120px] truncate">{profile?.name || '회원'}</span>
                    <i className="ri-arrow-down-s-line text-foreground-500" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-background-50 border border-background-200 rounded-lg py-1">
                      {profile?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-primary-700 font-semibold bg-primary-50/70 hover:bg-primary-100 whitespace-nowrap"
                        >
                          <i className="ri-shield-star-line mr-2 text-primary-600" />
                          관리자 대시보드
                        </Link>
                      )}
                      <Link
                        to={dashboardPath}
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 whitespace-nowrap"
                      >
                        <i className="ri-dashboard-line mr-2" />
                        마이페이지
                      </Link>
                      <Link
                        to="/quotes"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 whitespace-nowrap"
                      >
                        <i className="ri-file-list-3-line mr-2 text-primary-600" />
                        견적·계약 관리
                      </Link>
                      {(profile?.role === 'performer' || profile?.role === 'admin') && (
                        <Link
                          to="/schedule"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 whitespace-nowrap"
                        >
                          <i className="ri-calendar-line mr-2" />
                          일정 관리
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 whitespace-nowrap"
                      >
                        <i className="ri-logout-box-r-line mr-2" />
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    scrolled || !isHome
                      ? 'text-foreground-700 hover:text-foreground-950'
                      : 'text-background-50/80 hover:text-background-50'
                  }`}
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-full text-sm font-medium bg-primary-500 text-background-50 hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>

          <button
            className={`md:hidden w-10 h-10 flex items-center justify-center rounded-lg ${scrolled || !isHome ? 'text-foreground-950' : 'text-background-50'}`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <i className={`ri-${mobileOpen ? 'close' : 'menu'}-line text-xl`} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background-50 border-b border-background-200/70 px-4 py-4">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-3 rounded-lg text-foreground-700 hover:bg-background-100 text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-background-200/70 pt-3 mt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to="/notifications"
                    className="px-4 py-3 rounded-lg text-foreground-700 hover:bg-background-100 text-sm font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    <i className="ri-notification-3-line mr-2" />
                    알림
                    {unreadCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-accent-500 text-background-50 text-[10px] font-bold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-4 py-3 rounded-lg text-primary-700 font-semibold bg-primary-50 hover:bg-primary-100 text-sm"
                      onClick={() => setMobileOpen(false)}
                    >
                      <i className="ri-shield-star-line mr-2 text-primary-600" />
                      관리자 대시보드
                    </Link>
                  )}
                  <Link
                    to={dashboardPath}
                    className="px-4 py-3 rounded-lg text-foreground-700 hover:bg-background-100 text-sm font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    <i className="ri-dashboard-line mr-2" />
                    마이페이지
                  </Link>
                  <Link
                    to="/quotes"
                    className="px-4 py-3 rounded-lg text-foreground-700 hover:bg-background-100 text-sm font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    <i className="ri-file-list-3-line mr-2 text-primary-600" />
                    견적·계약 관리
                  </Link>
                  {(profile?.role === 'performer' || profile?.role === 'admin') && (
                    <Link
                      to="/schedule"
                      className="px-4 py-3 rounded-lg text-foreground-700 hover:bg-background-100 text-sm font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      <i className="ri-calendar-line mr-2" />
                      일정 관리
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-3 rounded-lg text-left text-foreground-700 hover:bg-background-100 text-sm font-medium"
                  >
                    <i className="ri-logout-box-r-line mr-2" />
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-3 rounded-lg text-foreground-700 hover:bg-background-100 text-sm font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    로그인
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-3 rounded-lg bg-primary-500 text-background-50 text-sm font-medium text-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}