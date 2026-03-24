// components/admin/ReportsClient.tsx
"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, Trophy, Heart, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  stats: {
    totalUsers: number;
    activeSubscribers: number;
    totalPrizesPaid: number;
    totalPrizesPending: number;
    drawsCompleted: number;
  };
  drawStats: { label: string; jackpot: number; fourMatch: number; threeMatch: number }[];
  charityStats: { name: string; amount: number }[];
}

const CHART_COLORS = ["#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7"];
const GOLD_COLORS = ["#f59e0b", "#fbbf24", "#fcd34d"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 border border-white/10 text-sm">
      <p className="font-semibold mb-2 text-white">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-zinc-300">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          {p.name}: <span className="text-white font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function ReportsClient({ stats, drawStats, charityStats }: Props) {
  const pieData = charityStats.filter(c => c.amount > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1">Reports & Analytics</h1>
        <p className="text-zinc-500 text-sm">Platform-wide statistics and financial overview</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: <Users size={18} />, color: "brand" },
          { label: "Active Subscribers", value: stats.activeSubscribers.toLocaleString(), icon: <TrendingUp size={18} />, color: "brand" },
          { label: "Prizes Paid", value: formatCurrency(stats.totalPrizesPaid), icon: <Trophy size={18} />, color: "gold" },
          { label: "Pending Payouts", value: formatCurrency(stats.totalPrizesPending), icon: <Heart size={18} />, color: "gold" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color === "brand" ? "bg-brand-500/15 text-brand-400" : "bg-gold-500/15 text-gold-400"}`}>
              {s.icon}
            </div>
            <div>
              <div className="font-display text-2xl font-black">{s.value}</div>
              <div className="text-xs text-zinc-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Prize pool by draw */}
      {drawStats.length > 0 && (
        <div className="card">
          <h3 className="font-display text-lg font-semibold mb-6">Prize Pool by Draw</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={drawStats} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Legend formatter={(v) => <span className="text-zinc-400 text-xs capitalize">{v}</span>} />
              <Bar dataKey="jackpot" name="Jackpot" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="fourMatch" name="4-Match" stackId="a" fill="#22c55e" />
              <Bar dataKey="threeMatch" name="3-Match" stackId="a" fill="#4ade80" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Charity breakdown */}
      {pieData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-display text-lg font-semibold mb-6">Charity Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-display text-lg font-semibold mb-5">Charity Totals</h3>
            <div className="space-y-3">
              {charityStats.sort((a, b) => b.amount - a.amount).map((c, i) => {
                const max = Math.max(...charityStats.map(x => x.amount));
                const pct = max > 0 ? (c.amount / max) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-300 truncate max-w-[70%]">{c.name}</span>
                      <span className="text-brand-400 font-semibold">{formatCurrency(c.amount)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-dark-600 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Draw summary table */}
      {drawStats.length > 0 && (
        <div className="card overflow-x-auto">
          <h3 className="font-display text-lg font-semibold mb-5">Draw Summary</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="pb-3 pr-4 text-zinc-500 font-medium">Draw</th>
                <th className="pb-3 pr-4 text-zinc-500 font-medium">Jackpot</th>
                <th className="pb-3 pr-4 text-zinc-500 font-medium">4-Match Pool</th>
                <th className="pb-3 text-zinc-500 font-medium">3-Match Pool</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {drawStats.map((d, i) => (
                <tr key={i} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4 font-medium">{d.label}</td>
                  <td className="py-3 pr-4 text-gold-400">{formatCurrency(d.jackpot)}</td>
                  <td className="py-3 pr-4 text-brand-400">{formatCurrency(d.fourMatch)}</td>
                  <td className="py-3 text-brand-300">{formatCurrency(d.threeMatch)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {drawStats.length === 0 && charityStats.every(c => c.amount === 0) && (
        <div className="card text-center py-16 text-zinc-600">
          <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
          <p>No data yet — complete draws and subscriptions will appear here.</p>
        </div>
      )}
    </div>
  );
}
