import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { sanitizeNext } from '@/hooks/useAuth';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const handledRef = useRef(false);

  useEffect(() => {
    const nextParam = searchParams.get('next');
    const isRecovery = (nextParam || '').includes('reset-password');
    const destination = isRecovery ? '/auth/reset-password' : sanitizeNext(nextParam);

    let cancelled = false;

    const handleSuccess = () => {
      if (handledRef.current || cancelled) return;
      handledRef.current = true;
      navigate(destination, { replace: true });
    };

    // 1. Listen for automatic auth state changes (SIGNED_IN)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        handleSuccess();
      }
    });

    // 2. Perform manual exchange & verify session
    (async () => {
      // Check existing session first
      const { data: initialSession } = await supabase.auth.getSession();
      if (initialSession.session?.user) {
        handleSuccess();
        return;
      }

      const code = searchParams.get('code');
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled || handledRef.current) return;

          if (!error && data.session?.user) {
            handleSuccess();
            return;
          }

          // In case exchangeCodeForSession returned an error due to concurrent auto-exchange, check getSession again
          await new Promise((r) => setTimeout(r, 600));
          const { data: retrySession } = await supabase.auth.getSession();
          if (retrySession.session?.user) {
            handleSuccess();
            return;
          }

          if (error) {
            setStatus('error');
            setErrorMsg(error.message || '인증 처리 중 오류가 발생했습니다.');
            return;
          }
        } catch (err: unknown) {
          if (cancelled || handledRef.current) return;
          const { data: retrySession } = await supabase.auth.getSession();
          if (retrySession.session?.user) {
            handleSuccess();
            return;
          }
          setStatus('error');
          setErrorMsg(err instanceof Error ? err.message : '인증 처리 중 문제가 발생했습니다.');
          return;
        }
      } else {
        // No code in query parameters, check if session exists via hash or cookies
        await new Promise((r) => setTimeout(r, 800));
        const { data: fallbackSession } = await supabase.auth.getSession();
        if (fallbackSession.session?.user) {
          handleSuccess();
          return;
        }
        setStatus('error');
        setErrorMsg('인증 코드가 만료되었거나 올바르지 않습니다. 로그인을 다시 시도해주세요.');
      }
    })();

    return () => {
      cancelled = true;
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {status === 'loading' ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center mx-auto mb-4">
              <i className="ri-loader-4-line text-background-50 text-xl animate-spin" />
            </div>
            <h1 className="text-xl font-bold font-heading text-foreground-950">인증 확인 중</h1>
            <p className="text-sm text-foreground-600 mt-2">안전하게 로그인 중입니다. 잠시만 기다려주세요...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-accent-500 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-background-50 text-xl" />
            </div>
            <h1 className="text-xl font-bold font-heading text-foreground-950">인증 실패</h1>
            <p className="text-sm text-foreground-600 mt-2">{errorMsg}</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="px-6 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                로그인으로 돌아가기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}