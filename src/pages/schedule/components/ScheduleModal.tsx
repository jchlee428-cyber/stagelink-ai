import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { EVENT_TYPES, type ScheduleItem, type ScheduleStatus } from '../types';

interface ScheduleModalProps {
  open: boolean;
  editingItem: ScheduleItem | null;
  initialDate: string;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  title: '',
  eventDate: '',
  startTime: '',
  endTime: '',
  location: '',
  eventType: '',
  description: '',
  status: 'scheduled' as ScheduleStatus,
};

export default function ScheduleModal({
  open,
  editingItem,
  initialDate,
  onClose,
  onSaved,
}: ScheduleModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingItem) {
      setForm({
        title: editingItem.title,
        eventDate: editingItem.eventDate,
        startTime: editingItem.startTime ?? '',
        endTime: editingItem.endTime ?? '',
        location: editingItem.location ?? '',
        eventType: editingItem.eventType ?? '',
        description: editingItem.description ?? '',
        status: editingItem.status,
      });
    } else {
      setForm({ ...emptyForm, eventDate: initialDate });
    }
  }, [open, editingItem, initialDate]);

  if (!open) return null;

  const update = (key: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // 공연자 전용 기능 제한
    const role = (user.user_metadata?.role as string | undefined) ?? '';
    if (role !== 'performer' && role !== 'admin') {
      setError('일정 관리는 공연자 회원만 사용할 수 있는 기능이에요.');
      return;
    }

    if (!form.title.trim()) {
      setError('일정 제목을 입력해주세요.');
      return;
    }
    if (!form.eventDate) {
      setError('날짜를 선택해주세요.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      event_date: form.eventDate,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      location: form.location.trim() || null,
      event_type: form.eventType || null,
      description: form.description.trim() || null,
      status: form.status,
    };

    const { error: saveError } = editingItem
      ? await supabase.from('schedules').update(payload).eq('id', editingItem.id)
      : await supabase.from('schedules').insert(payload);

    setSaving(false);

    if (saveError) {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
      return;
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground-950/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background-50 rounded-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-semibold text-foreground-950 text-base">
            {editingItem ? '일정 수정' : '새 일정 추가'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-background-100 flex items-center justify-center text-foreground-500"
            aria-label="닫기"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground-700 mb-1.5">일정 제목</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="예: 홍대 카페 버스킹"
              className="w-full px-3 py-2.5 rounded-md border border-background-300 text-sm text-foreground-900 bg-background-50 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground-700 mb-1.5">날짜</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => update('eventDate', e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-background-300 text-sm text-foreground-900 bg-background-50 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground-700 mb-1.5">행사 종류</label>
              <select
                value={form.eventType}
                onChange={(e) => update('eventType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-background-300 text-sm text-foreground-900 bg-background-50 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              >
                <option value="">선택</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground-700 mb-1.5">시작 시간</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => update('startTime', e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-background-300 text-sm text-foreground-900 bg-background-50 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground-700 mb-1.5">종료 시간</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => update('endTime', e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-background-300 text-sm text-foreground-900 bg-background-50 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-700 mb-1.5">장소</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="예: 서울 마포구 홍대입구"
              className="w-full px-3 py-2.5 rounded-md border border-background-300 text-sm text-foreground-900 bg-background-50 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
            />
          </div>

          {editingItem && (
            <div>
              <label className="block text-xs font-medium text-foreground-700 mb-1.5">상태</label>
              <div className="flex gap-2">
                {(['scheduled', 'completed', 'cancelled'] as ScheduleStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update('status', s)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                      form.status === s
                        ? 'bg-primary-500 text-background-50 border-primary-500'
                        : 'border-background-300 text-foreground-600 hover:bg-background-100'
                    }`}
                  >
                    {s === 'scheduled' ? '예정' : s === 'completed' ? '완료' : '취소'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground-700 mb-1.5">메모</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="준비사항, 요청사항 등을 기록해보세요."
              className="w-full px-3 py-2.5 rounded-md border border-background-300 text-sm text-foreground-900 bg-background-50 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-md border border-background-300 text-foreground-600 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-md bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}