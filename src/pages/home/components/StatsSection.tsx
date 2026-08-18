import { useInView } from '@/hooks/useInView';

const stats = [
  { value: '1,200+', label: '등록 공연자' },
  { value: '340+', label: '매칭 성공' },
  { value: '52', label: '활동 지역' },
  { value: '98%', label: '만족도' },
];

export default function StatsSection() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-10 md:py-14 bg-background-100 border-y border-background-200">
      <div className="w-full px-4 md:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`text-center transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-2xl md:text-3xl font-bold font-heading text-primary-600 mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-foreground-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}