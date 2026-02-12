"use client";

interface RecentUser {
  id: string;
  display_name: string;
  subscription_tier: string | null;
  created_at: string;
  vocab_cards: { count: number }[];
}

interface RecentError {
  id: string;
  created_at: string;
  user_id: string | null;
  payload: Record<string, unknown> | null;
  users: { display_name: string } | null;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const tierLabels: Record<string, string> = {
  free: "免費",
  sprout: "嫩芽",
  bloom: "綻放",
};

function UsersTable({ users }: { users: RecentUser[] }) {
  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
      <h3 className="font-heading font-bold text-sm text-earth mb-3">最近用戶</h3>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {users.map((u) => (
          <div key={u.id} className="p-3 rounded-xl bg-cloud/50">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-heading font-bold text-earth text-sm truncate">
                  {u.display_name || "—"}
                </div>
                <div className="text-earth-light text-xs mt-0.5">
                  {u.vocab_cards?.[0]?.count ?? 0} 張卡片
                </div>
              </div>
              <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cloud text-earth-light">
                {tierLabels[u.subscription_tier || "free"] || u.subscription_tier}
              </span>
            </div>
            <div className="text-[10px] text-earth-light/70 mt-1">
              {formatDateTime(u.created_at)}
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
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">卡片數</th>
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">方案</th>
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">加入日期</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-mist/30 hover:bg-cloud/50 transition-colors">
                <td className="py-2.5 px-2 font-medium text-earth">{u.display_name || "—"}</td>
                <td className="py-2.5 px-2 text-earth-light">{u.vocab_cards?.[0]?.count ?? 0}</td>
                <td className="py-2.5 px-2 text-earth-light">
                  {tierLabels[u.subscription_tier || "free"] || u.subscription_tier}
                </td>
                <td className="py-2.5 px-2 text-earth-light text-xs">{formatDateTime(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-6 text-earth-light text-sm">尚無資料</div>
      )}
    </div>
  );
}

function ErrorsTable({ errors }: { errors: RecentError[] }) {
  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
      <h3 className="font-heading font-bold text-sm text-earth mb-3">最近錯誤</h3>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {errors.map((e) => (
          <div key={e.id} className="p-3 rounded-xl bg-cloud/50">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-heading font-bold text-earth text-sm truncate">
                  {e.users?.display_name || e.user_id?.slice(0, 8) || "unknown"}
                </div>
                <div className="text-earth-light text-xs mt-0.5 line-clamp-2">
                  {(e.payload?.error as string) || "No details"}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-earth-light/70 mt-1">
              {formatDateTime(e.created_at)}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mist/50">
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">時間</th>
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">用戶</th>
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">錯誤訊息</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((e) => (
              <tr key={e.id} className="border-b border-mist/30 hover:bg-cloud/50 transition-colors">
                <td className="py-2.5 px-2 text-earth-light text-xs whitespace-nowrap">
                  {formatDateTime(e.created_at)}
                </td>
                <td className="py-2.5 px-2 text-earth-light">
                  {e.users?.display_name || e.user_id?.slice(0, 8) || "—"}
                </td>
                <td className="py-2.5 px-2 text-earth-light text-xs max-w-xs truncate">
                  {(e.payload?.error as string) || "No details"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {errors.length === 0 && (
        <div className="text-center py-6 text-earth-light text-sm">尚無錯誤</div>
      )}
    </div>
  );
}

export default function AdminTables({
  recentUsers,
  recentErrors,
}: {
  recentUsers: RecentUser[];
  recentErrors: RecentError[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <UsersTable users={recentUsers} />
      <ErrorsTable errors={recentErrors} />
    </div>
  );
}
