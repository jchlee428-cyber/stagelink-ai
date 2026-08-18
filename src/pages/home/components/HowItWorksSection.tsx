import { useInView } from '@/hooks/useInView';

const steps = [
  {
    icon: 'ri-user-add-line',
    title: '등록',
    desc: '공연자는 프로필과 영상을, 수요자는 행사 정보를 등록합니다',
  },
  {
    icon: 'ri-magic-line',
    title: 'AI 매칭',
    desc: 'AI가 장르, 지역, 예산, 행사 성격을 분석해 최적의 공연자를 추천합니다',
  },
  {
    icon: 'ri-calendar-check-line',
    title: '공연',
    desc: '견적, 계약, 일정까지 플랫폼에서 관리하고 성공적인 공연을 만듭니다',
  },
];

export default function HowItWorksSection() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-16 md:py-24 bg-background-50">
      <div className="w-full px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-primary-600 tracking-wider uppercase mb-2 block">How it works</span>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950 mb-2">3단계로 끝나는 스마트 공연 매칭</h2>
            <p className="text-sm text-foreground-600">복잡한 섭외 과정은 이제 그만. AI가 최적의 매칭을 찾아드립니다.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`relative bg-background-50 rounded-xl border border-background-200 p-6 md:p-8 text-center transition-all duration-700 ${
                  inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-100 flex items-center justify-center">
                  <i className={`${step.icon} text-2xl text-primary-600`} />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary-500 text-background-50 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                <h3 className="font-heading font-semibold text-foreground-950 text-base mb-2">{step.title}</h3>
                <p className="text-sm text-foreground-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}