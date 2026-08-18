import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { regions } from '@/mocks/filters';

interface QuoteRequestModalProps {
  open: boolean;
  performerId: string;
  performerUserId: string;
  performerName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const selectableRegions = regions.filter((r) => r !== '전체');

export default function QuoteRequestModal({
  open,
  performerId,
  performerUserId,
  performerName,
  onClose,
  onSubmitted,
}: QuoteRequestModalProps) {
  const { user, profile } = useAuth();

  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [region, setRegion] = useState('');
  const [venue, setVenue] = useState('');
  const [duration, setDuration] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setTitle('');
    setEventDate('');
    setRegion('');
    setVenue('');
    setDuration('');
    setBudget('');
    setDescription('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || profile?.role !== 'client') {
      setError('견적 요청은 공연 수요자만 가능합니다.');
      return;
    }
    if (!title.trim() || !eventDate) {
      setError('행사명과 공연 날짜는 필수 입력 항목입니다.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase.from('quotes').insert({
      client_id: user.id,
      performer_id: performerId,
      performer_user_id: performerUserId || null,
      title: title.trim(),
      event_date: eventDate,
      region: region || null,
      venue: venue.trim() || null,
      duration: duration ? Number(duration) : null,
      budget: budget ? Number(budget) : null,
      description: description.trim() || null,
      client_name: profile?.name ?? '',
      performer_name: performerName,
      status: 'requested',
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    reset();
    onSubmitted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground-950/40" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-background-50 rounded-xl border border-background-200 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background-50 border-b border-background-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-semibold text-foreground-950">견적 요청하기</h2>
            <p className="text-xs text-foreground-500 mt-0.5">{performerName}님에게 견적을 요청합니다</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-md flex items-center justify-center text-foreground-500 hover:bg-background-100 transition-colors"
            aria-label="닫기"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-700 mb-1.5">행사명 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 카페 창업 기념 오픈 공연"
              className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">공연 날짜 *</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">지역</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="">지역 선택</option>
                {selectableRegions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-700 mb-1.5">장소</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="예: 서울 성수동 OO카페"
              className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">공연 시간 (분)</label>
              <input
                type="number"
                min={0}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="예: 60"
                className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">예산 (만원)</label>
              <input
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="예: 50"
                className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-700 mb-1.5">상세 요청</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="원하는 공연 분위기, 특별 요청사항 등을 적어주세요."
              className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
            <p className="text-right text-xs text-foreground-400 mt-1">{description.length}/500</p>
          </div>

          {error && <p className="text-sm text-accent-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <i className="ri-send-plane-line" />
              {submitting ? '요청 중...' : '견적 요청 보내기'}
            </button>
            <button
              type="button"
              onClick={handleClose}
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