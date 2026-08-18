import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const [query, setQuery] = useState('');

  return (
    <section className="relative min-h-[600px] md:min-h-[720px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://readdy.ai/api/search-image?query=Abstract%20flowing%20stage%20curtains%20with%20warm%20spotlight%20rays%20and%20floating%20musical%20notes%2C%20coral%20amber%20and%20soft%20teal%20gradient%20atmosphere%2C%20artistic%20digital%20illustration%2C%20dreamy%20performance%20venue%20mood%2C%20no%20text%2C%20editorial%20background&width=1600&height=900&seq=hero-main&orientation=landscape"
          alt="Stage background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      </div>
      
      <div className="relative z-10 w-full px-4 md:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent-500/20 text-accent-100 text-xs font-medium mb-6 backdrop-blur-sm border border-accent-400/30">
            <i className="ri-magic-line mr-1" />
            AI 공연 매칭 플랫폼
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-heading text-background-50 mb-4 leading-tight">
            어떤 공연을<br className="md:hidden" /> 찾고 계신가요?
          </h1>
          <p className="text-base md:text-lg text-background-50/80 mb-8 max-w-xl mx-auto leading-relaxed">
            실력 있는 공연자에게 무대를,<br className="hidden md:block" /> 공연이 필요한 곳에 최고의 아티스트를.<br />
            AI가 사람과 무대를 연결합니다.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground-400" />
              <input
                type="text"
                placeholder="장르나 지역으로 검색해보세요 (예: 재즈, 서울)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-full bg-background-50 text-foreground-950 text-sm placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <Link
              to={query ? `/performers?search=${encodeURIComponent(query)}` : '/performers'}
              className="px-8 py-3.5 rounded-full bg-primary-500 text-background-50 font-medium text-sm hover:bg-primary-600 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
            >
              <i className="ri-search-line" />
              검색하기
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <span className="text-xs text-background-50/60">인기 검색:</span>
            {['트로트', '재즈', '기업행사', '웨딩', '버스커'].map((tag) => (
              <Link
                key={tag}
                to={`/performers?search=${encodeURIComponent(tag)}`}
                className="px-3 py-1 rounded-full bg-white/10 text-background-50/80 text-xs hover:bg-white/20 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <i key={n} className="ri-star-fill text-accent-400 text-sm" />
              ))}
            </div>
            <span className="text-xs text-background-50/70">1,200+ 공연자 · 340+ 매칭 성공 · 만족도 98%</span>
          </div>
        </div>
      </div>
    </section>
  );
}