export type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled';
export type ScheduleSource = 'manual' | 'request';

export interface ScheduleItem {
  id: string;
  title: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  eventType: string | null;
  description: string | null;
  status: ScheduleStatus;
  source: ScheduleSource;
  requestId?: string;
}

export const EVENT_TYPES = ['공연', '리허설', '미팅', '기타'];

export const statusMeta: Record<ScheduleStatus, { label: string; className: string; dot: string }> = {
  scheduled: { label: '예정', className: 'bg-secondary-100 text-secondary-800', dot: 'bg-secondary-500' },
  completed: { label: '완료', className: 'bg-primary-100 text-primary-700', dot: 'bg-primary-500' },
  cancelled: { label: '취소', className: 'bg-background-200 text-foreground-500', dot: 'bg-foreground-300' },
};

export const sourceMeta: Record<ScheduleSource, { label: string; className: string; dot: string }> = {
  manual: { label: '직접 등록', className: 'bg-secondary-100 text-secondary-800', dot: 'bg-secondary-500' },
  request: { label: '공연 요청', className: 'bg-accent-100 text-accent-800', dot: 'bg-accent-500' },
};