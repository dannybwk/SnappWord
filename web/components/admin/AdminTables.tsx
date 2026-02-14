"use client";

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
  recentErrors,
}: {
  recentErrors: RecentError[];
}) {
  return <ErrorsTable errors={recentErrors} />;
}
