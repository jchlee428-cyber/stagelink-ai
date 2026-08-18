import { useInView } from '@/hooks/useInView';

const testimonials = [
  {
    name: '김서연',
    role: '카페 대표 · 서울',
    event: '토요 라이브 공연',
    quote: '매주 토요일 공연자를 구하기가 정말 번거로웠는데, 이제는 원하는 장르와 예산만 입력하면 딱 맞는 공연자를 바로 추천받아요. 이번 달에 벌써 세 번째 공연을 진행했어요.',
    rating: 5,
    icon: 'ri-store-2-line',
  },
  {
    name: '박지훈',
    role: '기업 행사 담당 · 경기',
    event: '연말 사내 행사',
    quote: '연말 행사 준비가 막막했는데, 견적부터 계약, 일정까지 한 곳에서 다 해결됐어요. 공연자가 너무 프로페셔널해서 직원들 반응이 폭발적이었습니다.',
    rating: 5,
    icon: 'ri-building-2-line',
  },
  {
    name: '이하늘',
    role: '공연자 · 인디 싱어송라이터',
    event: '월 3회 정기 공연',
    quote: '무명이었던 제게 정기적으로 무대에 설 기회를 만들어줬어요. 수익도 안정적으로 잡히고, 후기가 쌓이면서 더 좋은 공연 제안이 들어오고 있어요.',
    rating: 5,
    icon: 'ri-mic-line',
  },
];

export default function TestimonialsSection() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-16 md:py-24 bg-background-50">
      <div className="w-full px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium mb-4">
              <i className="ri-heart-3-line mr-1" />
              실제 사용자 후기
            </span>
            <h2 className="text-2xl md:text-4xl font-bold font-heading text-foreground-950 mb-3">
              무대와 공연이 만난 곳에서<br className="hidden md:block" /> 이런 이야기가 만들어집니다
            </h2>
            <p className="text-sm md:text-base text-foreground-600 max-w-xl mx-auto">
              수요자와 공연자 모두 StageLink AI로 더 나은 공연 경험을 만들고 있어요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {testimonials.map((t, index) => (
              <div
                key={t.name}
                className={`bg-background-50 border border-background-200 rounded-lg p-6 flex flex-col transition-all duration-700 ${
                  inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <i
                      key={n}
                      className={`text-sm ${n <= t.rating ? 'ri-star-fill text-accent-500' : 'ri-star-line text-foreground-300'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-foreground-700 leading-relaxed flex-1 mb-6">“{t.quote}”</p>
                <div className="flex items-center gap-3 pt-4 border-t border-background-200">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <i className={`${t.icon} text-primary-600`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground-900">{t.name}</p>
                    <p className="text-xs text-foreground-500 truncate">
                      {t.role} · {t.event}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}