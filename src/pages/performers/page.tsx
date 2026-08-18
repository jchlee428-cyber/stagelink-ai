import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { regions, genres } from '@/mocks/filters';
import { usePerformers } from '@/hooks/usePerformers';
import ArtistScoreBadge from '@/components/feature/ArtistScoreBadge';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

export default function PerformersPage() {
  const [searchParams] = useSearchParams();
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedGenre, setSelectedGenre] = useState('전체');
  const [search, setSearch] = useState('');
  const { performers, loading, error, retry } = usePerformers();

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, [searchParams]);

  const filtered = performers.filter((p) => {
    const matchRegion = selectedRegion === '전체' || p.regions.includes(selectedRegion);
    const matchGenre = selectedGenre === '전체' || p.genres.includes(selectedGenre);
    const matchSearch = search === '' || p.stageName.includes(search) || p.genres.some((g) => g.includes(search));
    return matchRegion && matchGenre && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />
      <main className="pt-20 md:pt-24">
        <div className="w-full px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950 mb-2">공연자 찾기</h1>
            <p className="text-sm md:text-base text-foreground-600 mb-8">장르, 지역, 예산으로 최적의 공연자를 검색하세요</p>

            {error && (
              <div className="mb-6 flex items-center justify-between gap-3 bg-secondary-100 border border-secondary-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <i className="ri-information-line text-secondary-700 text-xl" />
                  <p className="text-sm text-secondary-800">실시간 데이터 연결에 문제가 있어 데모 목록을 표시 중입니다.</p>
                </div>
                <button
                  onClick={retry}
                  className="px-3 py-1.5 rounded-md bg-secondary-500 text-background-50 text-xs font-medium hover:bg-secondary-600 transition-colors whitespace-nowrap"
                >
                  다시 시도
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400" />
                <input
                  type="text"
                  placeholder="공연자 이름 또는 장르 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <i className="ri-loader-4-line text-primary-500 text-2xl animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filtered.map((performer) => (
                  <Link
                    key={performer.id}
                    to={`/performers/${performer.id}`}
                    className="group block bg-background-50 rounded-xl border border-background-200 overflow-hidden hover:border-primary-300 hover:shadow-lg transition-all"
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
                      <p className="text-xs text-foreground-500 mb-2">{performer.regions.join(', ')}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary-600">{performer.fee}만원~</span>
                        <div className="flex items-center gap-2">
                          <ArtistScoreBadge
                            rating={performer.rating}
                            experienceCount={performer.experienceCount}
                            reviewCount={performer.reviewCount}
                            variant="compact"
                          />
                          <div className="flex items-center gap-1 text-xs text-foreground-500">
                            <i className="ri-star-fill text-accent-500" />
                            <span>{performer.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-foreground-500 text-sm">검색 결과가 없습니다. 다른 조건으로 검색해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}