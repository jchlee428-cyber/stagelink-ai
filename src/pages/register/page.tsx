import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { supabase } from '@/lib/supabase';
import { sanitizeNext } from '@/hooks/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const destination = sanitizeNext(searchParams.get('next'));
  const [role, setRole] = useState<'performer' | 'client'>('performer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { role, name, phone, region },
      },
    });
    console.log('[Register] signUp response:', { data, error });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    // data.user가 있고 identities가 비어있으면 이미 가입된 계정일 수 있음
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      setErrorMsg('이미 가입된 이메일입니다. 로그인을 시도해 보세요.');
      return;
    }
    if (data.session) {
      navigate(destination, { replace: true });
    } else {
      setStep('verify');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    });
    console.log('[Register] verifyOtp response:', { data, error });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    navigate(destination, { replace: true });
  };

  const handleResend = async () => {
    setLoading(true);
    setErrorMsg('');
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo },
    });
    console.log('[Register] resend response:', { data, error });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg('');
      alert('인증 코드가 다시 전송되었습니다. 이메일함과 스팸함을 모두 확인해 주세요.');
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-background-50 flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 md:pt-24 flex items-center justify-center">
          <div className="w-full max-w-md px-4 py-12">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center mx-auto mb-4">
                <i className="ri-mail-check-line text-background-50 text-xl" />
              </div>
              <h1 className="text-2xl font-bold font-heading text-foreground-950">이메일 인증</h1>
              <p className="text-sm text-foreground-600 mt-1">
                {email}로 전송된 6자리 코드를 입력하세요
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
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
                {loading ? '확인 중...' : '인증 완료'}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="w-full text-sm text-foreground-500 hover:text-foreground-700 whitespace-nowrap disabled:opacity-60"
              >
                코드 다시 보내기
              </button>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24">
        <div className="w-full max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center mx-auto mb-4">
              <i className="ri-music-2-line text-background-50 text-xl" />
            </div>
            <h1 className="text-2xl font-bold font-heading text-foreground-950">회원가입</h1>
            <p className="text-sm text-foreground-600 mt-1">StageLink AI에 오신 것을 환영합니다</p>
          </div>

          <div className="flex gap-2 mb-6 p-1 bg-background-100 rounded-full border border-background-200">
            <button
              type="button"
              onClick={() => setRole('performer')}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                role === 'performer'
                  ? 'bg-primary-500 text-background-50'
                  : 'text-foreground-600 hover:text-foreground-800'
              }`}
            >
              <i className="ri-mic-line mr-1" />
              공연자
            </button>
            <button
              type="button"
              onClick={() => setRole('client')}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                role === 'client'
                  ? 'bg-primary-500 text-background-50'
                  : 'text-foreground-600 hover:text-foreground-800'
              }`}
            >
              <i className="ri-building-line mr-1" />
              공연 수요자
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                {role === 'performer' ? '활동명' : '상호명 / 담당자 이름'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'performer' ? '무대에서 사용하는 이름' : '회사명 또는 담당자 이름'}
                className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
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
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상 입력하세요"
                className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">연락처</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                {role === 'performer' ? '주요 활동 지역' : '행사 주요 지역'}
              </label>
              <input
                type="text"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="예: 서울, 경기"
                className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            {errorMsg && <p className="text-sm text-accent-600">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-primary-500 text-background-50 font-medium text-sm hover:bg-primary-600 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {loading ? '가입 중...' : '회원가입 완료'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-foreground-500">
            가입 시{' '}
            <span className="text-primary-600 hover:text-primary-700 cursor-pointer">이용약관</span>
            {' '}및{' '}
            <span className="text-primary-600 hover:text-primary-700 cursor-pointer">개인정보처리방침</span>
            에 동의하는 것으로 간주됩니다.
          </p>

          <div className="mt-6 text-center text-sm text-foreground-500">
            이미 계정이 있으신가요?{' '}
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