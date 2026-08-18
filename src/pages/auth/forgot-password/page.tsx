import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setStep('code');
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery',
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    navigate('/auth/reset-password', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 flex items-center justify-center">
        <div className="w-full max-w-md px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center mx-auto mb-4">
              <i className="ri-key-2-line text-background-50 text-xl" />
            </div>
            <h1 className="text-2xl font-bold font-heading text-foreground-950">비밀번호 찾기</h1>
            <p className="text-sm text-foreground-600 mt-1">
              {step === 'email'
                ? '가입한 이메일을 입력하면 인증 코드를 보내드려요'
                : '이메일로 전송된 6자리 코드를 입력하세요'}
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
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
              {errorMsg && <p className="text-sm text-accent-600">{errorMsg}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg bg-primary-500 text-background-50 font-medium text-sm hover:bg-primary-600 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {loading ? '전송 중...' : '인증 코드 보내기'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">인증 코드</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6자리 코드"
                  className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              {errorMsg && <p className="text-sm text-accent-600">{errorMsg}</p>}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3.5 rounded-lg bg-primary-500 text-background-50 font-medium text-sm hover:bg-primary-600 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {loading ? '확인 중...' : '코드 확인'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setErrorMsg('');
                }}
                className="w-full text-sm text-foreground-500 hover:text-foreground-700 whitespace-nowrap"
              >
                이메일 다시 입력하기
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-foreground-500">
            기억나셨나요?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
              로그인
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}