// app/admin/users/page.tsx
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Search } from "lucide-react";

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("*, subscriptions(status, plan, amount_pence, charity_percentage, charities(name))")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Users</h1>
          <p className="text-zinc-500 text-sm">{users?.length ?? 0} registered users</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left">
              <th className="pb-3 pr-4 text-zinc-500 font-medium">User</th>
              <th className="pb-3 pr-4 text-zinc-500 font-medium">Role</th>
              <th className="pb-3 pr-4 text-zinc-500 font-medium">Subscription</th>
              <th className="pb-3 pr-4 text-zinc-500 font-medium">Charity</th>
              <th className="pb-3 text-zinc-500 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users?.map(user => {
              const sub = Array.isArray(user.subscriptions) ? user.subscriptions[0] : user.subscriptions;
              return (
                <tr key={user.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{user.full_name ?? "—"}</div>
                    <div className="text-xs text-zinc-500">{user.email}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`badge ${user.role === "admin" ? "bg-red-400/10 text-red-300" : "bg-zinc-800 text-zinc-400"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {sub ? (
                      <div>
                        <span className={`badge ${sub.status === "active" ? "bg-green-400/10 text-green-400" : "bg-zinc-800 text-zinc-500"}`}>
                          {sub.status}
                        </span>
                        <div className="text-xs text-zinc-600 mt-0.5">{sub.plan} · {formatCurrency((sub.amount_pence ?? 0) / 100)}</div>
                      </div>
                    ) : (
                      <span className="text-zinc-700 text-xs">No subscription</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {sub?.charities ? (
                      <div>
                        <div className="text-xs">{(sub.charities as { name: string }).name}</div>
                        <div className="text-xs text-zinc-600">{sub.charity_percentage}%</div>
                      </div>
                    ) : <span className="text-zinc-700 text-xs">—</span>}
                  </td>
                  <td className="py-3 text-xs text-zinc-500 font-mono">{formatDate(user.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
