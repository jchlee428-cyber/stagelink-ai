import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { performers } from '@/mocks/performers';
import { useInView } from '@/hooks/useInView';
import { rankPerformersByMatch, type MatchingCriteria } from '@/lib/matching';

const demoRequest: MatchingCriteria & { title: string; date: string; region: string; budgetText: string; genreText: string } = {
  title: '기업 송년회 공연',
  date: '2026년 12월 20일',
  region: '서울',
  budget: 100,
  genre: '재즈',
  eventType: '기업행사',
  audience: 80,
  budgetText: '100만원',
  genreText: '재즈 / 보컬',
};

export default function AiMatchingSection() {
  const { ref, inView } = useInView();
  const [activeTab, setActiveTab] = useState(0);

  // 실시간 AI 매칭 로직으로 투명하게 분석된 랭킹
  const recommendedResults = useMemo(() => {
    return rankPerformersByMatch(performers, demoRequest, 3);
  }, []);

  const currentMatch = recommendedResults[activeTab] || recommendedResults[0];

  return (
    <section ref={ref} className="py-16 md:py-24 bg-background-100">
      <div className="w-full px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}>
              <span className="text-xs font-semibold text-accent-600 tracking-wider uppercase mb-2 block">AI Matching</span>
              <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950 mb-4">
                AI가 행사에 딱 맞는<br />공연자를 추천합니다
              </h2>
              <p className="text-sm text-foreground-600 leading-relaxed mb-6">
                행사 목적, 희망 장르, 예산, 지역, 관객 규모를 다각도로 정밀 분석하여
                가장 성공적인 무대를 만들 최적의 아티스트를 투명하게 추천합니다.
              </p>
              
              <div className="bg-background-50 rounded-xl border border-background-200 p-5 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-foreground-700 uppercase tracking-wider">실시간 매칭 분석 예시</h4>
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    AI 매칭 가동 중
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-foreground-500">행사</span><span className="text-foreground-800 font-medium">{demoRequest.title}</span></div>
                  <div className="flex justify-between"><span className="text-foreground-500">날짜</span><span className="text-foreground-800 font-medium">{demoRequest.date}</span></div>
                  <div className="flex justify-between"><span className="text-foreground-500">지역</span><span className="text-foreground-800 font-medium">서울 강남</span></div>
                  <div className="flex justify-between"><span className="text-foreground-500">예산</span><span className="text-foreground-800 font-medium">{demoRequest.budgetText}</span></div>
                  <div className="flex justify-between"><span className="text-foreground-500">장르</span><span className="text-foreground-800 font-medium">{demoRequest.genreText}</span></div>
                </div>
              </div>
              
              <Link
                to="/matching"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent-500 text-background-50 font-medium text-sm hover:bg-accent-600 transition-colors shadow-sm"
              >
                <i className="ri-magic-line" />
                직접 조건 입력해 AI 매칭하기
              </Link>
            </div>
            
            <div className={`transition-all duration-700 delay-200 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}>
              <div className="bg-background-50 rounded-xl border border-background-200 overflow-hidden shadow-sm">
                <div className="bg-primary-500 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="ri-magic-line text-background-50" />
                    <span className="text-sm font-semibold text-background-50">AI 맞춤 추천 결과 ({recommendedResults.length}팀)</span>
                  </div>
                  <span className="text-[11px] text-primary-100 bg-primary-600 px-2 py-0.5 rounded">
                    적합도 높은 순
                  </span>
                </div>
                
                <div className="p-4 space-y-2.5">
                  {recommendedResults.map(({ performer, totalScore, matchReasons }, i) => (
                    <button
                      key={performer.id}
                      onClick={() => setActiveTab(i)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                        activeTab === i
                          ? 'bg-primary-50/80 border-2 border-primary-400 shadow-xs'
                          : 'bg-background-50 border border-background-200 hover:border-primary-200 hover:bg-background-100/60'
                      }`}
                    >
                      <img src={performer.image} alt={performer.stageName} className="w-12 h-12 rounded-lg object-cover border border-background-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground-950 text-sm">{performer.stageName}</span>
                            {i === 0 && (
                              <span className="text-[10px] bg-primary-100 text-primary-800 font-bold px-1.5 py-0.2 rounded">BEST</span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-primary-600">{totalScore}%</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-foreground-600 font-medium truncate">{performer.genres.join(', ')}</span>
                          <span className="text-xs text-foreground-400">·</span>
                          <span className="text-xs text-foreground-600">{performer.fee}만원</span>
                        </div>
                        {matchReasons[0] && (
                          <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                            <i className="ri-check-line text-emerald-500" />
                            {matchReasons[0]}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* 선택된 아티스트의 세부 매칭 분석 breakdown */}
                {currentMatch && (
                  <div className="mx-4 mb-4 p-3.5 bg-background-100/70 rounded-xl border border-background-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground-800">
                        {currentMatch.performer.stageName} 매칭 세부 분석
                      </span>
                      <span className="text-xs font-bold text-primary-600">
                        종합 {currentMatch.totalScore}점
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="bg-white p-2 rounded-lg border border-background-200">
                        <span className="text-foreground-500 text-[11px] block">장르 적합도</span>
                        <span className="font-bold text-foreground-900">{currentMatch.breakdown.genre}%</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-background-200">
                        <span className="text-foreground-500 text-[11px] block">예산 부합도</span>
                        <span className="font-bold text-foreground-900">{currentMatch.breakdown.budget}%</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-background-200">
                        <span className="text-foreground-500 text-[11px] block">지역 일치도</span>
                        <span className="font-bold text-foreground-900">{currentMatch.breakdown.region}%</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="px-4 pb-4">
                  <Link
                    to={`/performers/${currentMatch.performer.id}`}
                    className="block w-full text-center py-2.5 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer"
                  >
                    {currentMatch.performer.stageName} 프로필 & 견적 요청
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}