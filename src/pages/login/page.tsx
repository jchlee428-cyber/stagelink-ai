import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { supabase } from '@/lib/supabase';
import { sanitizeNext } from '@/hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes('not confirmed')) {
        setErrorMsg('이메일 인증이 완료되지 않았습니다. 가입 시 받은 인증 코드를 확인해주세요.');
      } else {
        setErrorMsg(error.message);
      }
      return;
    }
    const destination = sanitizeNext(searchParams.get('next'));
    navigate(destination, { replace: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    setErrorMsg('');
    const redirectTo = nextParam
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`
      : `${window.location.origin}/auth/callback`;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) {
        if (
          error.message?.includes('provider is not enabled') ||
          error.message?.includes('Unsupported provider') ||
          error.message?.includes('validation_failed')
        ) {
          setErrorMsg(
            '현재 Supabase에 Google 로그인이 활성화되어 있지 않습니다. 이메일/비밀번호로 로그인하시거나 대시보드에서 Google Provider를 활성화해 주세요.'
          );
        } else {
          setErrorMsg(error.message);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google 로그인 중 오류가 발생했습니다.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'performer' | 'client' | 'admin') => {
    setLoading(true);
    setErrorMsg('');
    const demoEmail = `${role}@stagelink.ai`;
    const demoPassword = 'Password1234!';
    const demoNames: Record<string, string> = {
      performer: '김지현 (보컬리스트)',
      client: '카페 블루문 매니저',
      admin: '최고관리자',
    };

    try {
      // 1. Try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (!signInError) {
        const dest = sanitizeNext(searchParams.get('next')) !== '/'
          ? sanitizeNext(searchParams.get('next'))
          : (role === 'admin' ? '/admin' : `/dashboard/${role}`);
        navigate(dest, { replace: true });
        setLoading(false);
        return;
      }

      // 2. If not registered, auto signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            role,
            name: demoNames[role],
            phone: '010-1234-5678',
            region: '서울',
          },
        },
      });

      if (signUpError) {
        setErrorMsg(signUpError.message);
        setLoading(false);
        return;
      }

      if (signUpData.session) {
        const dest = sanitizeNext(searchParams.get('next')) !== '/'
          ? sanitizeNext(searchParams.get('next'))
          : (role === 'admin' ? '/admin' : `/dashboard/${role}`);
        navigate(dest, { replace: true });
      } else {
        // Try sign in once more
        await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });
        const dest = sanitizeNext(searchParams.get('next')) !== '/'
          ? sanitizeNext(searchParams.get('next'))
          : (role === 'admin' ? '/admin' : `/dashboard/${role}`);
        navigate(dest, { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '체험 계정 로그인 중 오류가 발생했습니다.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 flex items-center justify-center">
        <div className="w-full max-w-md px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center mx-auto mb-4">
              <i className="ri-music-2-line text-background-50 text-xl" />
            </div>
            <h1 className="text-2xl font-bold font-heading text-foreground-950">로그인</h1>
            <p className="text-sm text-foreground-600 mt-1">StageLink AI 계정으로 로그인하세요</p>
          </div>

          {/* ⚡ 원클릭 빠른 체험 계정 */}
          <div className="mb-6 bg-primary-50/60 border border-primary-200/80 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-900 mb-2">
              <i className="ri-flashlight-line text-primary-600 text-sm" />
              <span>원클릭 빠른 체험 (테스트 계정)</span>
            </div>
            <p className="text-[11px] text-foreground-600 mb-3">
              별도 가입/구글 인증 없이 원하는 역할로 바로 접속하여 모든 기능을 테스트할 수 있습니다.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('performer')}
                disabled={loading}
                className="px-2.5 py-2 text-xs font-medium bg-white text-primary-700 hover:bg-primary-100/50 border border-primary-200 rounded-lg transition-colors cursor-pointer text-center"
              >
                🎤 공연자
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('client')}
                disabled={loading}
                className="px-2.5 py-2 text-xs font-medium bg-white text-primary-700 hover:bg-primary-100/50 border border-primary-200 rounded-lg transition-colors cursor-pointer text-center"
              >
                🏢 수요자
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
                className="px-2.5 py-2 text-xs font-medium bg-white text-primary-700 hover:bg-primary-100/50 border border-primary-200 rounded-lg transition-colors cursor-pointer text-center"
              >
                👑 관리자
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">이메일</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-4 py-3 pr-11 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600"
                >
                  {showPw ? <i className="ri-eye-off-line" /> : <i className="ri-eye-line" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-foreground-600 cursor-pointer">
                <input type="checkbox" className="rounded border-background-300" />
                로그인 상태 유지
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                비밀번호 찾기
              </Link>
            </div>

            {errorMsg && <p className="text-sm text-accent-600">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-primary-500 text-background-50 font-medium text-sm hover:bg-primary-600 transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-foreground-500">
            계정이 없으신가요?{' '}
            <Link
              to={nextParam ? `/register?next=${encodeURIComponent(nextParam)}` : '/register'}
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              회원가입
            </Link>
          </div>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-background-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-background-50 text-foreground-400">또는</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="mt-4 w-full py-3 rounded-lg border border-background-200 bg-background-50 text-sm font-medium text-foreground-700 hover:bg-background-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              <i className="ri-google-fill text-lg" />
              Google로 로그인
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}