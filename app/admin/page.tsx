// app/admin/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Users, Trophy, Heart, Medal, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function AdminOverview() {
  const supabase = createClient();

  const [
    { count: totalUsers },
    { count: activeSubscribers },
    { data: draws },
    { data: pendingWinners },
    { data: charities },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("draws").select("jackpot_pool, four_match_pool, three_match_pool").eq("status", "published"),
    supabase.from("winners").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
    supabase.from("charities").select("total_raised").eq("is_active", true),
  ]);

  const totalPrizes = draws?.reduce((s, d) => s + d.jackpot_pool + d.four_match_pool + d.three_match_pool, 0) ?? 0;
  const totalCharity = charities?.reduce((s, c) => s + c.total_raised, 0) ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1">Admin Overview</h1>
        <p className="text-zinc-500 text-sm">Platform stats and quick actions</p>
      </div>

      {pendingWinners && pendingWinners > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 text-sm">
          <AlertCircle size={16} />
          <span><strong>{pendingWinners}</strong> winner{pendingWinners !== 1 ? "s" : ""} pending verification. <a href="/admin/winners" className="underline">Review now →</a></span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers?.toLocaleString() ?? "0", icon: <Users size={18} />, color: "brand" },
          { label: "Active Subscribers", value: activeSubscribers?.toLocaleString() ?? "0", icon: <TrendingUp size={18} />, color: "brand" },
          { label: "Total Prizes Paid", value: formatCurrency(totalPrizes), icon: <Trophy size={18} />, color: "gold" },
          { label: "Charity Raised", value: formatCurrency(totalCharity), icon: <Heart size={18} />, color: "gold" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color === "brand" ? "bg-brand-500/15 text-brand-400" : "bg-gold-500/15 text-gold-400"}`}>
              {s.icon}
            </div>
            <div>
              <div className="font-display text-xl font-bold">{s.value}</div>
              <div className="text-xs text-zinc-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { href: "/admin/draws", label: "Manage Draws", desc: "Create, simulate and publish monthly draws", icon: "🎰" },
          { href: "/admin/winners", label: "Verify Winners", desc: "Review proof submissions and approve payouts", icon: "🏆" },
          { href: "/admin/charities", label: "Manage Charities", desc: "Add, edit and feature charity partners", icon: "❤️" },
        ].map(link => (
          <a key={link.href} href={link.href} className="card hover:border-white/20 transition-all group">
            <div className="text-2xl mb-3">{link.icon}</div>
            <h3 className="font-semibold mb-1 group-hover:text-brand-300 transition-colors">{link.label}</h3>
            <p className="text-sm text-zinc-500">{link.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
