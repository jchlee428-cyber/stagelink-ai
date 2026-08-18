import { computeArtistScore, artistScoreTier } from '@/lib/artistScore';

interface ArtistScoreBadgeProps {
  rating: number;
  experienceCount: number;
  reviewCount: number;
  variant?: 'full' | 'compact';
}

function Donut({ total }: { total: number }) {
  return (
    <div
      className="relative w-24 h-24 rounded-full flex-shrink-0"
      style={{
        background: `conic-gradient(oklch(var(--accent-500)) ${total}%, oklch(var(--background-200)) ${total}%)`,
      }}
    >
      <div className="absolute inset-2 rounded-full bg-background-50 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-heading text-foreground-950 leading-none">{total}</span>
        <span className="text-[10px] text-foreground-400 mt-0.5">/100</span>
      </div>
    </div>
  );
}

function BreakdownBar({
  label,
  value,
  max,
  displayValue,
}: {
  label: string;
  value: number;
  max: number;
  displayValue: string;
}) {
  const percent = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-foreground-600">{label}</span>
        <span className="text-xs font-medium text-foreground-800">{displayValue}</span>
      </div>
      <div className="h-1.5 rounded-full bg-background-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function ArtistScoreBadge({
  rating,
  experienceCount,
  reviewCount,
  variant = 'full',
}: ArtistScoreBadgeProps) {
  const breakdown = computeArtistScore(rating, experienceCount, reviewCount);
  const tier = artistScoreTier(breakdown.total);

  if (variant === 'compact') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-100 text-accent-900"
        title="StageLink Artist Score"
      >
        <i className="ri-award-line" />
        {breakdown.total}
      </span>
    );
  }

  return (
    <div className="bg-background-50 border border-background-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
            <i className="ri-award-line text-accent-600 text-lg" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground-950 text-sm">StageLink Artist Score</h3>
            <p className="text-[11px] text-foreground-500">공연자 성장 점수</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tier.badgeClass}`}>{tier.label}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex items-center justify-center">
          <Donut total={breakdown.total} />
        </div>
        <div className="flex-1 space-y-3">
          <BreakdownBar
            label="평점"
            value={breakdown.ratingScore}
            max={60}
            displayValue={`${breakdown.rating.toFixed(1)} / 5`}
          />
          <BreakdownBar
            label="공연 경력"
            value={breakdown.experienceScore}
            max={20}
            displayValue={`${breakdown.experienceCount}회`}
          />
          <BreakdownBar
            label="후기"
            value={breakdown.reviewScore}
            max={20}
            displayValue={`${breakdown.reviewCount}건`}
          />
        </div>
      </div>

      <p className="text-[11px] text-foreground-400 mt-4 leading-relaxed">
        평점(60) · 공연 경력(20) · 후기(20)를 합산한 점수로, 활동이 쌓일수록 올라갑니다.
      </p>
    </div>
  );
}