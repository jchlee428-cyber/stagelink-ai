import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePerformers } from '@/hooks/usePerformers';
import { eventTypes, regions } from '@/mocks/filters';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { rankPerformersByMatch, type MatchingResult } from '@/lib/matching';

const presetQueries = [
  {
    label: '🏢 기업 송년회',
    data: {
      title: '2026 기업 연말 송년의 밤',
      eventType: '기업행사',
      region: '서울',
      budget: '120',
      date: '2026-12-20',
      genre: '재즈',
      duration: '90',
      audience: '80',
    },
  },
  {
    label: '☕ 카페 오프닝',
    data: {
      title: '감성 카페 오프닝 라이브',
      eventType: '카페/레스토랑',
      region: '경기',
      budget: '80',
      date: '2026-09-15',
      genre: '어쿠스틱',
      duration: '60',
      audience: '40',
    },
  },
  {
    label: '🎪 지역 문화 축제',
    data: {
      title: '가을 힐링 시민 축제',
      eventType: '축제/페스티벌',
      region: '서울',
      budget: '200',
      date: '2026-10-10',
      genre: '인디',
      duration: '120',
      audience: '300',
    },
  },
];

export default function MatchingPage() {
  const [step, setStep] = useState<'input' | 'result'>('input');
  const { performers } = usePerformers();
  const [form, setForm] = useState({
    title: '',
    eventType: '',
    region: '',
    budget: '',
    date: '',
    genre: '',
    duration: '',
    audience: '',
  });

  const [recommendations, setRecommendations] = useState<MatchingResult[]>([]);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const ranked = rankPerformersByMatch(performers, form, 4);
    setRecommendations(ranked);
    setStep('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyPreset = (preset: typeof presetQueries[0]['data']) => {
    setForm(preset);
  };

  const scoreLabels = [
    { label: '장르 적합성', key: 'genre' as const },
    { label: '지역 적합성', key: 'region' as const },
    { label: '예산 적합성', key: 'budget' as const },
    { label: '행사 경험', key: 'experience' as const },
    { label: '관객 적합성', key: 'audience' as const },
  ];

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />
      <main className="pt-20 md:pt-24 pb-16">
        {step === 'input' && (
          <div className="w-full px-4 md:px-8 py-8 md:py-12">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-xl bg-accent-500 flex items-center justify-center mx-auto mb-4">
                  <i className="ri-magic-line text-background-50 text-xl" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950">AI 공연 매칭</h1>
                <p className="text-sm text-foreground-600 mt-1">행사 정보를 입력하면 AI가 최적의 아티스트를 투명하게 분석하여 추천합니다</p>
              </div>

              {/* 빠른 프리셋 선택 */}
              <div className="mb-6 bg-primary-50/70 border border-primary-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-primary-900 mb-2">⚡ 빠른 예시 조건 채우기:</p>
                <div className="flex flex-wrap gap-2">
                  {presetQueries.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p.data)}
                      className="px-3 py-1.5 text-xs font-medium bg-white text-primary-700 hover:bg-primary-100/60 border border-primary-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAnalyze} className="bg-background-50 rounded-xl border border-background-200 p-6 md:p-8 space-y-5 shadow-sm">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">행사명</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="예: 기업 송년회, 카페 오프닝 콘서트"
                    className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">행사 종류</label>
                    <select
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
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">지역</label>
                    <select
                      value={form.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="">선택하세요</option>
                      {regions.filter((r) => r !== '전체').map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">예산 (만원)</label>
                    <input
                      type="number"
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
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">희망 장르</label>
                    <select
                      value={form.genre}
                      onChange={(e) => setForm({ ...form, genre: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="">선택하세요</option>
                      {[
                        '재즈', '보컬', '어쿠스틱', '인디', '포크', '트로트', '7080', '클래식', 'K-Pop', '댄스', '국악', '찬양', '힙합', 'R&B', '록', '마술', '코미디',
                      ].map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">공연 시간 (분)</label>
                    <input
                      type="number"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      placeholder="예: 90"
                      className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">예상 관객 수</label>
                  <input
                    type="number"
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    placeholder="예: 80"
                    className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-lg bg-accent-500 text-background-50 font-medium text-sm hover:bg-accent-600 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <i className="ri-magic-line" />
                  AI 정밀 매칭 분석 시작
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="w-full px-4 md:px-8 py-8 md:py-12">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setStep('input')}
                  className="text-sm text-foreground-500 hover:text-foreground-700 flex items-center gap-1 cursor-pointer"
                >
                  <i className="ri-arrow-left-line" />
                  조건 다시 입력
                </button>
                <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-full font-medium">
                  {form.genre || '전체 장르'} · {form.region || '전국'} · {form.budget ? `${form.budget}만원` : '예산 미지정'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950 mb-1">
                AI 맞춤 추천 결과
              </h1>
              <p className="text-sm text-foreground-600 mb-8">
                입력하신 조건과 아티스트의 장르·지역·출연료·경력을 투명하게 비교 분석한 최적의 아티스트 순위입니다
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.map(({ performer: p, totalScore, breakdown, matchReasons }, index) => (
                  <div
                    key={p.id}
                    className="bg-background-50 rounded-xl border border-background-200 overflow-hidden hover:border-primary-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex gap-4 p-5">
                      <div className="shrink-0">
                        <img
                          src={p.image}
                          alt={p.stageName}
                          className="w-24 h-28 rounded-lg object-cover border border-background-200"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                            추천 #{index + 1}
                          </span>
                          <span className="text-base font-bold text-primary-600">{totalScore}% 매칭</span>
                        </div>
                        <h3 className="font-heading font-bold text-foreground-950 text-base mb-1">{p.stageName}</h3>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {p.genres.slice(0, 3).map((g) => (
                            <span key={g} className="px-2 py-0.5 rounded-full text-xs bg-secondary-100 text-secondary-800 font-medium">{g}</span>
                          ))}
                        </div>
                        <p className="text-xs text-foreground-500 mb-1.5">{p.regions.join(', ')}</p>
                        <div className="flex items-center gap-3 text-xs text-foreground-600">
                          <span className="flex items-center gap-1 font-medium"><i className="ri-star-fill text-accent-500" /> {p.rating}</span>
                          <span>공연 {p.experienceCount}회</span>
                          <span className="font-bold text-primary-600">{p.fee}만원~</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      {/* 추천 핵심 사유 */}
                      {matchReasons.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {matchReasons.map((r, ri) => (
                            <p key={ri} className="text-xs text-emerald-700 bg-emerald-50/70 border border-emerald-100 px-2.5 py-1 rounded flex items-center gap-1.5">
                              <i className="ri-checkbox-circle-fill text-emerald-500 text-xs" />
                              {r}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* 5대 항목 투명 분석 지표 */}
                      <div className="bg-background-100 rounded-lg p-3 mb-4">
                        <h4 className="text-xs font-semibold text-foreground-700 mb-2">AI 정밀 매칭 분석 지표</h4>
                        <div className="space-y-1.5">
                          {scoreLabels.map((s) => {
                            const pct = breakdown[s.key];
                            return (
                              <div key={s.key} className="flex items-center gap-2">
                                <span className="text-xs text-foreground-500 w-20 shrink-0">{s.label}</span>
                                <div className="flex-1 h-1.5 bg-background-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary-500 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-foreground-700 w-8 text-right">{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          to={`/performers/${p.id}`}
                          className="flex-1 text-center py-2.5 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer"
                        >
                          프로필 & 견적 요청
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}