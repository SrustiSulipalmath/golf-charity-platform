// app/admin/reports/page.tsx
import { createClient } from "@/lib/supabase/server";
import ReportsClient from "@/components/admin/ReportsClient";

export default async function AdminReportsPage() {
  const supabase = createClient();

  const [
    { count: totalUsers },
    { count: activeSubscribers },
    { data: draws },
    { data: charities },
    { data: winners },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("draws").select("*").eq("status", "published").order("year").order("month"),
    supabase.from("charities").select("name, total_raised").eq("is_active", true),
    supabase.from("winners").select("prize_tier, prize_amount, payment_status"),
    supabase.from("profiles").select("created_at").order("created_at", { ascending: false }).limit(100),
  ]);

  const drawStats = draws?.map(d => ({
    label: `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.month - 1]} ${String(d.year).slice(2)}`,
    jackpot: d.jackpot_pool,
    fourMatch: d.four_match_pool,
    threeMatch: d.three_match_pool,
  })) ?? [];

  const charityStats = charities?.map(c => ({ name: c.name, amount: c.total_raised })) ?? [];

  const totalPrizesPaid = winners?.filter(w => w.payment_status === "paid").reduce((s, w) => s + w.prize_amount, 0) ?? 0;
  const totalPrizesPending = winners?.filter(w => w.payment_status === "pending").reduce((s, w) => s + w.prize_amount, 0) ?? 0;

  return (
    <ReportsClient
      stats={{ totalUsers: totalUsers ?? 0, activeSubscribers: activeSubscribers ?? 0, totalPrizesPaid, totalPrizesPending, drawsCompleted: draws?.length ?? 0 }}
      drawStats={drawStats}
      charityStats={charityStats}
    />
  );
}
