import type { GenreItem } from '../types';

interface GenreDistributionProps {
  genres: GenreItem[];
}

export default function GenreDistribution({ genres }: GenreDistributionProps) {
  const total = genres.reduce((sum, g) => sum + g.count, 0);
  const max = genres.length > 0 ? genres[0].count : 0;

  return (
    <div className="bg-background-50 border border-background-200 rounded-lg p-6">
      <h3 className="font-heading font-semibold text-foreground-950 text-sm mb-5">장르별 공연자 분포</h3>
      {genres.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-foreground-500 text-sm">아직 등록된 장르 데이터가 없어요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {genres.map((genre) => {
            const pct = max > 0 ? Math.round((genre.count / max) * 100) : 0;
            const share = total > 0 ? Math.round((genre.count / total) * 100) : 0;
            return (
              <div key={genre.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-foreground-700 font-medium">{genre.name}</span>
                  <span className="text-xs text-foreground-500">
                    {genre.count}명 · {share}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-background-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}