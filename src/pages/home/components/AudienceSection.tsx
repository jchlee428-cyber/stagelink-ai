import { useInView } from '@/hooks/useInView';
import { Link } from 'react-router-dom';

export default function AudienceSection() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-16 md:py-24 bg-background-50">
      <div className="w-full px-4 md:px-8">
        <div className="max-w-5xl mx-auto space-y-16 md:space-y-24">
          {/* For Clients */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="order-2 lg:order-1">
              <span className="text-xs font-semibold text-primary-600 tracking-wider uppercase mb-2 block">For Clients</span>
              <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950 mb-4">
                기업, 지자체, 카페, 교회<br />어떤 행사든 완벽한 공연자를
              </h2>
              <ul className="space-y-3 mb-6">
                {[
                  '행사 성격과 예산에 맞는 공연자 AI 추천',
                  '견적, 계약, 일정 관리를 한 곳에서',
                  '후기와 평점으로 검증된 공연자만',
                  '지역 기반 빠른 매칭',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground-700">
                    <i className="ri-check-line text-accent-500 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/requests"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-background-50 font-medium text-sm hover:bg-primary-600 transition-colors"
              >
                공연 의뢰하기
                <i className="ri-arrow-right-line" />
              </Link>
            </div>
            <div className="order-1 lg:order-2">
              <div className="rounded-xl overflow-hidden border border-background-200">
                <img
                  src="https://readdy.ai/api/search-image?query=Elegant%20corporate%20event%20venue%20with%20warm%20ambient%20lighting%2C%20round%20tables%2C%20stage%20setup%2C%20soft%20bokeh%2C%20professional%20business%20atmosphere%2C%20warm%20golden%20tones%2C%20editorial%20photography&width=800&height=500&seq=section-client&orientation=landscape"
                  alt="Corporate event"
                  className="w-full aspect-[16/10] object-cover"
                />
              </div>
            </div>
          </div>

          {/* For Performers */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center transition-all duration-700 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div>
              <div className="rounded-xl overflow-hidden border border-background-200">
                <img
                  src="https://readdy.ai/api/search-image?query=Intimate%20live%20music%20cafe%20stage%20with%20warm%20string%20lights%2C%20wooden%20floor%2C%20microphone%20stand%2C%20cozy%20atmosphere%2C%20soft%20warm%20lighting%2C%20editorial%20interior%20photography&width=800&height=500&seq=section-performer&orientation=landscape"
                  alt="Live music cafe"
                  className="w-full aspect-[16/10] object-cover"
                />
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-accent-600 tracking-wider uppercase mb-2 block">For Performers</span>
              <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950 mb-4">
                실력 있는 아티스트에게<br />더 많은 무대를
              </h2>
              <ul className="space-y-3 mb-6">
                {[
                  '전국 공연 요청을 한눈에 확인',
                  'AI가 나에게 딱 맞는 공연을 추천',
                  '출연료, 일정, 장소를 투명하게',
                  '공연 이력과 평점으로 신뢰도 상승',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground-700">
                    <i className="ri-check-line text-accent-500 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent-500 text-background-50 font-medium text-sm hover:bg-accent-600 transition-colors"
              >
                공연자 등록하기
                <i className="ri-arrow-right-line" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}