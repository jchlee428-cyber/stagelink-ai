import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { eventTypes } from '@/mocks/filters';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function RequestNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const performerId = searchParams.get('performer');
  const performerName = searchParams.get('performerName');
  const performerUuid =
    performerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(performerId)
      ? performerId
      : null;
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    title: performerName ? `${performerName} 공연 의뢰` : '',
    eventType: '',
    region: '',
    venue: '',
    budget: '',
    date: '',
    duration: '',
    audience: '',
    genres: [] as string[],
    description: '',
  });

  const queryString = searchParams.toString();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        const next = queryString ? `/requests/new?${queryString}` : '/requests/new';
        navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
      } else if (profile?.role === 'performer') {
        alert('공연 요청 등록은 수요자(클라이언트) 전용 기능입니다.');
        navigate('/requests', { replace: true });
      }
    }
  }, [authLoading, user, profile, navigate, queryString]);

  const genreOptions = [
    '트로트', '7080', '어쿠스틱', '포크', '재즈', '클래식', '인디', 'K-Pop',
    '댄스', '국악', '찬양', '힙합', 'R&B', '록', '마술', '코미디',
  ];

  const toggleGenre = (g: string) => {
    setForm((prev) => ({
      ...prev,
      genres: prev.genres.includes(g)
        ? prev.genres.filter((x) => x !== g)
        : [...prev.genres, g],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setErrorMsg('');

    const { error } = await supabase.from('performance_requests').insert({
      client_id: user.id,
      client_name: profile?.name || user.email || '수요자',
      title: form.title,
      event_type: form.eventType,
      region: form.region,
      venue: form.venue,
      budget: Number(form.budget),
      date: form.date,
      duration: Number(form.duration),
      audience_size: Number(form.audience),
      genre: form.genres,
      description: form.description,
      status: 'open',
      performer_id: performerUuid,
    });

    setSubmitting(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24">
        <div className="w-full px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate('/requests')}
                className="text-sm text-foreground-500 hover:text-foreground-700 flex items-center gap-1"
              >
                <i className="ri-arrow-left-line" />
                목록으로
              </button>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950 mb-1">공연 요청 등록</h1>
            <p className="text-sm text-foreground-600 mb-8">공연 조건을 상세히 입력할수록 더 정확한 공연자를 추천받을 수 있어요</p>

            <form onSubmit={handleSubmit} className="bg-background-50 rounded-xl border border-background-200 p-6 md:p-8 space-y-5">
              {performerName && (
                <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-lg bg-primary-50 border border-primary-200">
                  <i className="ri-user-star-line text-primary-600" />
                  <span className="text-sm text-foreground-600">공연 의뢰 대상</span>
                  <span className="px-3 py-1 rounded-full bg-primary-500 text-background-50 text-xs font-semibold whitespace-nowrap">{performerName}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">요청 제목</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="예: 기업 송년회 공연 (80명 규모)"
                  className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">행사 종류</label>
                  <select
                    required
                    value={form.eventType}
                    onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    <option value="">선택하세요</option>
                    {eventTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">공연 지역</label>
                  <input
                    type="text"
                    required
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    placeholder="예: 서울 강남"
                    className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">공연 장소</label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  placeholder="예: 강남구 소재 연회장"
                  className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">예산 (만원)</label>
                  <input
                    type="number"
                    required
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="예: 100"
                    className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">공연 날짜</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">공연 시간 (분)</label>
                  <input
                    type="number"
                    required
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="예: 120"
                    className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">예상 관객 수</label>
                  <input
                    type="number"
                    required
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    placeholder="예: 80"
                    className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">희망 장르 (복수 선택 가능)</label>
                <div className="flex flex-wrap gap-2">
                  {genreOptions.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        form.genres.includes(g)
                          ? 'bg-primary-500 text-background-50 border-primary-500'
                          : 'bg-background-50 text-foreground-600 border-background-200 hover:border-primary-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">상세 설명</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={500}
                  rows={5}
                  placeholder="행사 분위기, 관객층, 특별 요청사항 등을 자세히 적어주세요"
                  className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                />
                <p className="text-right text-xs text-foreground-400 mt-1">{form.description.length}/500</p>
              </div>

              {errorMsg && <p className="text-sm text-accent-600">{errorMsg}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-lg bg-primary-500 text-background-50 font-medium text-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <i className="ri-send-plane-line" />
                {submitting ? '등록 중...' : '공연 요청 등록'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />

      {submitted && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSubmitted(false)} />
          <div className="relative bg-background-50 rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-primary-600 text-2xl" />
            </div>
            <h3 className="font-heading font-bold text-foreground-950 text-lg mb-1">요청이 등록되었습니다</h3>
            <p className="text-sm text-foreground-600 mb-6">공연자들의 지원이 오면 알려드릴게요.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/requests')}
                className="w-full py-3 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
              >
                요청 목록 보기
              </button>
              {performerId && (
                <button
                  onClick={() => navigate(`/performers/${performerId}`)}
                  className="w-full py-3 rounded-lg border border-primary-300 text-primary-600 text-sm font-medium hover:bg-primary-50 transition-colors whitespace-nowrap"
                >
                  {performerName ? `${performerName} 상세로 돌아가기` : '공연자 상세로 돌아가기'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}