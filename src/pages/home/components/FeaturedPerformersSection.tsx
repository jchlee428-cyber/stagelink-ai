import { Link } from 'react-router-dom';
import { usePerformers } from '@/hooks/usePerformers';
import { useInView } from '@/hooks/useInView';

export default function FeaturedPerformersSection() {
  const { ref, inView } = useInView();
  const { performers } = usePerformers();
  const featured = performers.slice(0, 4);

  return (
    <section ref={ref} className="py-16 md:py-24 bg-background-50">
      <div className="w-full px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-semibold text-primary-600 tracking-wider uppercase mb-2 block">Featured</span>
              <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950">이번 주 인기 공연자</h2>
            </div>
            <Link to="/performers" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              전체 보기 <i className="ri-arrow-right-line" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featured.map((performer, index) => (
              <Link
                key={performer.id}
                to={`/performers/${performer.id}`}
                className={`group block rounded-xl border border-background-200 overflow-hidden bg-background-50 hover:border-primary-300 transition-all duration-500 ${
                  inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={performer.image}
                    alt={performer.stageName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {performer.genres.slice(0, 2).map((g) => (
                      <span key={g} className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-900">
                        {g}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-heading font-semibold text-foreground-950 text-base mb-1">{performer.stageName}</h3>
                  <p className="text-xs text-foreground-500 mb-2">{performer.regions.slice(0, 2).join(', ')}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary-600">{performer.fee}만원~</span>
                    <div className="flex items-center gap-1 text-xs text-foreground-500">
                      <i className="ri-star-fill text-accent-500" />
                      <span>{performer.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}