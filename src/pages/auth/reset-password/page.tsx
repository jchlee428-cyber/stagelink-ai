import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/forgot-password', { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    navigate('/login', { replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background-50 flex items-center justify-center">
        <i className="ri-loader-4-line text-primary-500 text-2xl animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 flex items-center justify-center">
        <div className="w-full max-w-md px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center mx-auto mb-4">
              <i className="ri-lock-password-line text-background-50 text-xl" />
            </div>
            <h1 className="text-2xl font-bold font-heading text-foreground-950">새 비밀번호 설정</h1>
            <p className="text-sm text-foreground-600 mt-1">새로운 비밀번호를 입력해주세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">새 비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8자 이상 입력하세요"
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
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">비밀번호 확인</label>
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            {errorMsg && <p className="text-sm text-accent-600">{errorMsg}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-primary-500 text-background-50 font-medium text-sm hover:bg-primary-600 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}