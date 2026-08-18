import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { eventTypes, regions, genres as allGenres } from '@/mocks/filters';

interface RequestEditModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  request: {
    id: string;
    title: string;
    eventType: string;
    date: string;
    region: string;
    venue: string;
    budget: number;
    duration: number;
    genres: string[];
    audienceSize: number;
    description: string;
    status: 'open' | 'matched' | 'closed';
  };
}

const selectableRegions = regions.filter((r) => r !== '전체');
const selectableGenres = allGenres.filter((g) => g !== '전체');

export default function RequestEditModal({
  open,
  onClose,
  onSaved,
  request,
}: RequestEditModalProps) {
  const [title, setTitle] = useState(request.title);
  const [eventType, setEventType] = useState(request.eventType);
  const [date, setDate] = useState(request.date ? request.date.split('T')[0] : '');
  const [region, setRegion] = useState(request.region);
  const [venue, setVenue] = useState(request.venue);
  const [budget, setBudget] = useState(request.budget ? String(request.budget) : '');
  const [duration, setDuration] = useState(request.duration ? String(request.duration) : '');
  const [audienceSize, setAudienceSize] = useState(
    request.audienceSize ? String(request.audienceSize) : '',
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>(request.genres || []);
  const [description, setDescription] = useState(request.description || '');
  const [status, setStatus] = useState<'open' | 'matched' | 'closed'>(request.status || 'open');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!open) return null;

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g],
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('행사명을 입력해주세요.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('performance_requests')
        .update({
          title: title.trim(),
          event_type: eventType,
          date: date || null,
          region,
          venue: venue.trim(),
          budget: budget ? Number(budget) : null,
          duration: duration ? Number(duration) : null,
          audience_size: audienceSize ? Number(audienceSize) : null,
          genre: selectedGenres,
          description: description.trim(),
          status,
        })
        .eq('id', request.id);

      if (error) {
        setErrorMsg(error.message || '수정 중 오류가 발생했습니다.');
        setSaving(false);
        return;
      }

      setSaving(false);
      onSaved();
      onClose();
    } catch (err: unknown) {
      setSaving(false);
      setErrorMsg(err instanceof Error ? err.message : '수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-background-50 rounded-2xl border border-background-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-background-50/95 backdrop-blur-sm px-6 py-4 border-b border-background-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
              <i className="ri-edit-2-line" />
            </div>
            <h3 className="font-heading font-bold text-foreground-950 text-lg">
              공연 요청 수정
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-background-200 text-foreground-400 hover:text-foreground-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-accent-50 border border-accent-200 text-accent-900 text-xs flex items-center gap-2">
              <i className="ri-error-warning-line text-base shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 행사명 */}
          <div>
            <label className="block text-xs font-semibold text-foreground-700 mb-1.5">
              행사명 <span className="text-accent-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 서울 중랑천 이음한마당 공연 요청"
              className="w-full px-3.5 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 행사 종류 */}
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1.5">
                행사 종류
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="">선택하세요</option>
                {eventTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* 모집 상태 */}
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1.5">
                모집 상태
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'open' | 'matched' | 'closed')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="open">🟢 모집중</option>
                <option value="matched">🔵 매칭완료</option>
                <option value="closed">⚪ 마감</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 지역 */}
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1.5">
                지역
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="">선택하세요</option>
                {selectableRegions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* 상세 장소 */}
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1.5">
                상세 장소 / 무대
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="예: 중랑공연장, 강남 야외무대"
                className="w-full px-3.5 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 공연 날짜 */}
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1.5">
                공연 날짜
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            {/* 예산 */}
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1.5">
                예산 (만원)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="예: 300"
                className="w-full px-3.5 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            {/* 공연 시간 */}
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1.5">
                공연 시간 (분)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="예: 60"
                className="w-full px-3.5 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          {/* 예상 관객 수 */}
          <div>
            <label className="block text-xs font-semibold text-foreground-700 mb-1.5">
              예상 관객 수 (명)
            </label>
            <input
              type="number"
              value={audienceSize}
              onChange={(e) => setAudienceSize(e.target.value)}
              placeholder="예: 500"
              className="w-full px-3.5 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* 장르 선택 */}
          <div>
            <label className="block text-xs font-semibold text-foreground-700 mb-2">
              희망 장르 (다중 선택)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {selectableGenres.map((g) => {
                const selected = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      selected
                        ? 'bg-primary-500 text-background-50 border border-primary-500 shadow-xs'
                        : 'bg-background-100 text-foreground-700 hover:bg-background-200 border border-background-200'
                    }`}
                  >
                    {selected && <i className="ri-check-line mr-1" />}
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 상세 설명 */}
          <div>
            <label className="block text-xs font-semibold text-foreground-700 mb-1.5">
              상세 설명 및 요청사항
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="행사 취지, 관객 연령대, 필요 장비 등 공연자에게 전달할 내용을 작성해주세요."
              className="w-full px-3.5 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-background-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-background-300 text-foreground-700 text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {saving && <i className="ri-loader-4-line animate-spin" />}
              {saving ? '저장 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
