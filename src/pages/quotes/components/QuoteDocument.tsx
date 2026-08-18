import type { Quote } from '@/pages/quotes/types';
import { formatQuoteDate } from '@/pages/quotes/types';

interface QuoteDocumentProps {
  quote: Quote;
}

export default function QuoteDocument({ quote }: QuoteDocumentProps) {
  const isContract = quote.status === 'accepted';

  return (
    <div className="bg-background-50 border border-background-200 rounded-lg overflow-hidden">
      <div className="bg-background-100 border-b border-background-200 px-6 py-5 text-center">
        <p className="text-xs text-foreground-500 mb-1">StageLink AI</p>
        <h3 className="font-heading text-xl font-bold text-foreground-950">
          {isContract ? '공연 계약서' : '공연 견적서'}
        </h3>
        <p className="text-xs text-foreground-400 mt-2">문서번호 {quote.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
          <div>
            <p className="text-xs text-foreground-500 mb-1">공연 수요자</p>
            <p className="text-sm font-medium text-foreground-900">{quote.clientName || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-500 mb-1">공연자</p>
            <p className="text-sm font-medium text-foreground-900">{quote.performerName || '—'}</p>
          </div>
        </div>

        <div className="border-t border-background-200 pt-5 mb-6">
          <p className="text-xs text-foreground-500 mb-3 font-medium">공연 내역</p>
          <dl className="space-y-2.5">
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-foreground-500 flex-shrink-0">행사명</dt>
              <dd className="text-sm text-foreground-900 text-right">{quote.title}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-foreground-500 flex-shrink-0">공연 날짜</dt>
              <dd className="text-sm text-foreground-900 text-right">{formatQuoteDate(quote.eventDate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-foreground-500 flex-shrink-0">장소</dt>
              <dd className="text-sm text-foreground-900 text-right">
                {quote.venue ? `${quote.venue}${quote.region ? ` (${quote.region})` : ''}` : quote.region || '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-foreground-500 flex-shrink-0">공연 시간</dt>
              <dd className="text-sm text-foreground-900 text-right">{quote.duration ? `${quote.duration}분` : '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-accent-50 border border-accent-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-accent-800 font-medium">
              {quote.proposedFee != null ? '출연료' : '예상 예산'}
            </span>
            <span className="text-xl font-bold text-accent-700">
              {quote.proposedFee != null ? quote.proposedFee : quote.budget ?? '—'}만원
            </span>
          </div>
          {quote.proposedFee != null && quote.budget != null && (
            <p className="text-xs text-accent-700/80 mt-1">수요자 예산 {quote.budget}만원</p>
          )}
        </div>

        {quote.quoteNote && (
          <div className="mb-6">
            <p className="text-xs text-foreground-500 mb-1.5 font-medium">공연자 메모</p>
            <p className="text-sm text-foreground-700 leading-relaxed whitespace-pre-line">{quote.quoteNote}</p>
          </div>
        )}

        {quote.description && (
          <div className="mb-6">
            <p className="text-xs text-foreground-500 mb-1.5 font-medium">요청 내용</p>
            <p className="text-sm text-foreground-600 leading-relaxed">{quote.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-background-200">
          <div className="text-center">
            <p className="text-xs text-foreground-500 mb-8">공연 수요자</p>
            <p className="text-sm font-medium text-foreground-900">{quote.clientName || '—'}</p>
            {isContract && <p className="text-xs text-foreground-400 mt-1">(서명)</p>}
          </div>
          <div className="text-center">
            <p className="text-xs text-foreground-500 mb-8">공연자</p>
            <p className="text-sm font-medium text-foreground-900">{quote.performerName || '—'}</p>
            {isContract && <p className="text-xs text-foreground-400 mt-1">(서명)</p>}
          </div>
        </div>
      </div>
    </div>
  );
}