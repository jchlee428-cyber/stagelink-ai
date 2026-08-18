import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { sanitizeNext } from '@/hooks/useAuth';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const nextParam = searchParams.get('next');
    const isRecovery = (nextParam || '').includes('reset-password');
    const destination = isRecovery ? '/auth/reset-password' : sanitizeNext(nextParam);

    if (!code) {
      setStatus('error');
      setErrorMsg('인증 코드가 없습니다. 로그인을 다시 시도해주세요.');
      return;
    }

    let cancelled = false;

    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;
      if (error) {
        setStatus('error');
        setErrorMsg(error.message);
        return;
      }
      navigate(destination, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background-50 flex items-center justify-center px-4">
      <div className="text-center">
        {status === 'loading' ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center mx-auto mb-4">
              <i className="ri-loader-4-line text-background-50 text-xl animate-spin" />
            </div>
            <h1 className="text-xl font-bold font-heading text-foreground-950">인증 확인 중</h1>
            <p className="text-sm text-foreground-600 mt-2">잠시만 기다려주세요...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-accent-500 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-background-50 text-xl" />
            </div>
            <h1 className="text-xl font-bold font-heading text-foreground-950">인증 실패</h1>
            <p className="text-sm text-foreground-600 mt-2">{errorMsg}</p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="mt-6 px-6 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
            >
              로그인으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}