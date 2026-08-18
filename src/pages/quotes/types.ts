export type QuoteStatus = 'requested' | 'quoted' | 'accepted' | 'rejected';

export interface Quote {
  id: string;
  performerId: string;
  performerUserId: string | null;
  title: string;
  eventDate: string | null;
  region: string | null;
  venue: string | null;
  duration: number | null;
  budget: number | null;
  genre?: string[];
  description: string | null;
  clientName: string | null;
  performerName: string | null;
  status: QuoteStatus;
  proposedFee: number | null;
  quoteNote: string | null;
  createdAt: string;
  feeAmount?: number | null;
  paymentStatus?: string | null;
  tossOrderId?: string | null;
  tossPaymentKey?: string | null;
}

export const quoteStatusMeta: Record<QuoteStatus, { label: string; className: string }> = {
  requested: { label: '견적 요청됨', className: 'bg-secondary-100 text-secondary-800' },
  quoted: { label: '견적 도착', className: 'bg-primary-100 text-primary-700' },
  accepted: { label: '계약 성사', className: 'bg-accent-100 text-accent-900' },
  rejected: { label: '거절됨', className: 'bg-background-200 text-foreground-500' },
};

export function formatQuoteDate(iso: string | null): string {
  if (!iso) return '날짜 미정';
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}