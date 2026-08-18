import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Quote } from '@/pages/quotes/types';

interface QuoteRespondModalProps {
  open: boolean;
  quote: Quote | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function QuoteRespondModal({ open, quote, onClose, onSaved }: QuoteRespondModalProps) {
  const [proposedFee, setProposedFee] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setProposedFee('');
      setQuoteNote('');
      setError('');
    }
  }, [open]);

  if (!open || !quote) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedFee || Number(proposedFee) <= 0) {
      setError('제안 출연료를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        proposed_fee: Number(proposedFee),
        quote_note: quoteNote.trim() || null,
        status: 'quoted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', quote.id);

    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground-950/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background-50 rounded-xl border border-background-200">
        <div className="border-b border-background-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-semibold text-foreground-950">견적서 작성</h2>
            <p className="text-xs text-foreground-500 mt-0.5">{quote.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-md flex items-center justify-center text-foreground-500 hover:bg-background-100 transition-colors"
            aria-label="닫기"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-700 mb-1.5">제안 출연료 (만원) *</label>
            <input
              type="number"
              min={0}
              value={proposedFee}
              onChange={(e) => setProposedFee(e.target.value)}
              placeholder="예: 60"
              className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-700 mb-1.5">견적 메모</label>
            <textarea
              value={quoteNote}
              onChange={(e) => setQuoteNote(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="세트리스트, 장비, 준비사항 등 견적 내용을 적어주세요."
              className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
            <p className="text-right text-xs text-foreground-400 mt-1">{quoteNote.length}/500</p>
          </div>

          {error && <p className="text-sm text-accent-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <i className="ri-file-text-line" />
              {submitting ? '전송 중...' : '견적서 보내기'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-lg border border-background-300 text-foreground-600 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}