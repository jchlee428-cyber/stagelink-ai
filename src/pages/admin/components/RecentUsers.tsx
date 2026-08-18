import type { RecentUser } from '../types';

interface RecentUsersProps {
  users: RecentUser[];
}

const roleMeta: Record<RecentUser['role'], { label: string; className: string; icon: string }> = {
  performer: { label: '공연자', className: 'bg-primary-100 text-primary-700', icon: 'ri-mic-line' },
  client: { label: '수요자', className: 'bg-secondary-100 text-secondary-700', icon: 'ri-building-line' },
  admin: { label: '관리자', className: 'bg-accent-100 text-accent-700', icon: 'ri-shield-star-line' },
};

export default function RecentUsers({ users }: RecentUsersProps) {
  return (
    <div className="bg-background-50 border border-background-200 rounded-lg p-6">
      <h3 className="font-heading font-semibold text-foreground-950 text-sm mb-5">최근 가입자</h3>
      {users.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-foreground-500 text-sm">아직 가입한 회원이 없어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const meta = roleMeta[u.role] ?? roleMeta.client;
            return (
              <div key={u.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-background-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-foreground-600">
                      {(u.name || u.email || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground-800 truncate">{u.name}</p>
                    <p className="text-xs text-foreground-500 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.className}`}>
                    <i className={meta.icon} />
                    {meta.label}
                  </span>
                  <span className="text-xs text-foreground-400 whitespace-nowrap hidden sm:block">
                    {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}