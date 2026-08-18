import type { RecentContract } from '../types';

interface RecentContractsProps {
  contracts: RecentContract[];
}

export default function RecentContracts({ contracts }: RecentContractsProps) {
  return (
    <div className="bg-background-50 border border-background-200 rounded-lg p-6">
      <h3 className="font-heading font-semibold text-foreground-950 text-sm mb-5">최근 계약 성사</h3>
      {contracts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-foreground-500 text-sm">아직 성사된 계약이 없어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 border border-background-200 rounded-lg p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                  <i className="ri-file-text-line text-accent-700 text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground-800 truncate">{c.title}</p>
                  <p className="text-xs text-foreground-500 truncate">
                    {c.clientName} · {c.performerName}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-primary-600 whitespace-nowrap">
                  {c.fee.toLocaleString('ko-KR')}만원
                </p>
                <p className="text-xs text-foreground-400 whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}