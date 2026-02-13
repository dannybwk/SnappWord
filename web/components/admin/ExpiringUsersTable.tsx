"use client";

interface ExpiringUser {
  id: string;
  displayName: string;
  tier: string;
  expiresAt: string;
  daysLeft: number;
}

const tierLabels: Record<string, string> = {
  free: "免費",
  sprout: "嫩芽",
  bloom: "綻放",
};

function daysLeftColor(days: number): string {
  if (days <= 1) return "text-red-500";
  if (days <= 3) return "text-yellow-600";
  return "text-earth-light";
}

function daysLeftBg(days: number): string {
  if (days <= 1) return "bg-red-50 text-red-500";
  if (days <= 3) return "bg-yellow-50 text-yellow-600";
  return "bg-cloud text-earth-light";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ExpiringUsersTable({ users }: { users: ExpiringUser[] }) {
  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {users.map((u) => (
          <div key={u.id} className="p-3 rounded-xl bg-cloud/50">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-heading font-bold text-earth text-sm truncate">
                  {u.displayName}
                </div>
                <div className="text-earth-light text-xs mt-0.5">
                  {tierLabels[u.tier] || u.tier} · 到期 {formatDate(u.expiresAt)}
                </div>
              </div>
              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${daysLeftBg(u.daysLeft)}`}>
                {u.daysLeft} 天
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mist/50">
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">名稱</th>
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">方案</th>
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">到期日</th>
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">剩餘天數</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-mist/30 hover:bg-cloud/50 transition-colors">
                <td className="py-2.5 px-2 font-medium text-earth">{u.displayName}</td>
                <td className="py-2.5 px-2 text-earth-light">
                  {tierLabels[u.tier] || u.tier}
                </td>
                <td className="py-2.5 px-2 text-earth-light text-xs">{formatDate(u.expiresAt)}</td>
                <td className={`py-2.5 px-2 font-bold text-xs ${daysLeftColor(u.daysLeft)}`}>
                  {u.daysLeft} 天
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-6 text-earth-light text-sm">
          目前沒有即將到期的用戶
        </div>
      )}
    </div>
  );
}
