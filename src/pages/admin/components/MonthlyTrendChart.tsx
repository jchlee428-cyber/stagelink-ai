import type { MonthlyPoint } from '../types';

interface MonthlyTrendChartProps {
  title: string;
  points: MonthlyPoint[];
  unit: string;
  tone?: 'accent' | 'primary';
}

export default function MonthlyTrendChart({
  title,
  points,
  unit,
  tone = 'accent',
}: MonthlyTrendChartProps) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const barClass = tone === 'primary' ? 'bg-primary-500' : 'bg-accent-500';

  return (
    <div className="bg-background-50 border border-background-200 rounded-lg p-6">
      <h3 className="font-heading font-semibold text-foreground-950 text-sm mb-5">{title}</h3>
      <div className="flex items-end gap-2 h-36">
        {points.map((p) => {
          const barHeight = Math.max(Math.round((p.value / max) * 96), p.value > 0 ? 8 : 3);
          return (
            <div key={p.label} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full min-w-0">
              <span className="text-[10px] text-foreground-500 leading-none whitespace-nowrap">
                {p.value > 0 ? p.value.toLocaleString('ko-KR') : ''}
              </span>
              <div
                className={`w-full rounded-t-md ${barClass} transition-all duration-500`}
                style={{ height: `${barHeight}px` }}
              />
              <span className="text-[11px] text-foreground-500 leading-none whitespace-nowrap">
                {p.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-foreground-400 mt-3">단위: {unit}</p>
    </div>
  );
}