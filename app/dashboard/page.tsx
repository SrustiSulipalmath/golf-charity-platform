// app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Target, Heart, Trophy, Medal, ArrowRight, AlertCircle, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate, getMonthName, PRIZE_TIER_LABELS } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [
    { data: subscription },
    { data: scores },
    { data: draws },
    { data: winnings },
  ] = await Promise.all([
    supabase.from("subscriptions").select("*, charities(name,image_url)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("golf_scores").select("*").eq("user_id", user.id).order("played_on", { ascending: false }).limit(5),
    supabase.from("draws").select("*").eq("status", "published").order("year", { ascending: false }).order("month", { ascending: false }).limit(3),
    supabase.from("winners").select("*, draws(month,year)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const isActive = subscription?.status === "active";
  const totalWon = winnings?.filter(w => w.payment_status === "paid").reduce((s, w) => s + w.prize_amount, 0) ?? 0;
  const pendingPayout = winnings?.filter(w => w.payment_status === "pending" && w.verification_status === "approved").reduce((s, w) => s + w.prize_amount, 0) ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Subscription alert */}
      {!isActive && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-400/10 border border-orange-400/20 text-orange-300">
          <AlertCircle size={18} className="shrink-0" />
          <span className="text-sm">Your subscription is inactive. <Link href="/subscribe" className="underline font-medium">Subscribe now</Link> to enter monthly draws.</span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Scores Entered",
            value: scores?.length ?? 0,
            sub: "of 5 slots used",
            icon: <Target size={18} />,
            color: "brand",
            href: "/dashboard/scores",
          },
          {
            label: "Draws Entered",
            value: draws?.length ?? 0,
            sub: "recent draws",
            icon: <Trophy size={18} />,
            color: "gold",
            href: "/dashboard/draws",
          },
          {
            label: "Total Won",
            value: formatCurrency(totalWon),
            sub: pendingPayout > 0 ? `+${formatCurrency(pendingPayout)} pending` : "lifetime winnings",
            icon: <Medal size={18} />,
            color: "brand",
            href: "/dashboard/winnings",
          },
          {
            label: "Charity",
            value: (subscription as { charities?: { name: string } | null } | null)?.charities?.name ?? "Not set",
            sub: subscription?.charity_percentage ? `${subscription.charity_percentage}% contribution` : "Select one",
            icon: <Heart size={18} />,
            color: "gold",
            href: "/dashboard/charity",
          },
        ].map((s, i) => (
          <Link key={i} href={s.href} className="stat-card hover:border-brand-500/25 transition-all group">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${
              s.color === "brand" ? "bg-brand-500/15 text-brand-400" : "bg-gold-500/15 text-gold-400"
            }`}>
              {s.icon}
            </div>
            <div>
              <div className="font-display text-xl font-bold text-white leading-tight">{s.value}</div>
              <div className="text-xs text-zinc-500">{s.label}</div>
              <div className="text-xs text-zinc-600 mt-0.5">{s.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Latest scores */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg font-semibold">Latest Scores</h3>
            <Link href="/dashboard/scores" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          {scores && scores.length > 0 ? (
            <div className="space-y-3">
              {scores.map((score, i) => (
                <div key={score.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600 font-mono w-4">{i + 1}</span>
                    <div>
                      <span className="text-sm font-medium">{score.score} pts</span>
                      {score.notes && <span className="text-xs text-zinc-500 ml-2">— {score.notes}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">{formatDate(score.played_on)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-600">
              <Target size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No scores yet</p>
              <Link href="/dashboard/scores" className="btn-primary text-sm mt-4 inline-flex">Add your first score</Link>
            </div>
          )}
        </div>

        {/* Recent draws */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg font-semibold">Recent Draws</h3>
            <Link href="/dashboard/draws" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              All draws <ArrowRight size={14} />
            </Link>
          </div>
          {draws && draws.length > 0 ? (
            <div className="space-y-3">
              {draws.map(draw => (
                <div key={draw.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                  <div>
                    <div className="text-sm font-medium">{getMonthName(draw.month)} {draw.year}</div>
                    <div className="flex gap-1 mt-1">
                      {draw.winning_numbers.map((n: number, idx: number) => (
                        <span key={idx} className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-300 text-xs flex items-center justify-center font-mono">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">Jackpot</div>
                    <div className="text-sm font-semibold text-gold-400">{formatCurrency(draw.jackpot_pool)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-600">
              <Trophy size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No draws published yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Winnings */}
      {winnings && winnings.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <TrendingUp size={18} className="text-gold-400" /> Recent Winnings
            </h3>
            <Link href="/dashboard/winnings" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {winnings.slice(0, 3).map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-gold-500/5 border border-gold-500/15">
                <div>
                  <div className="text-sm font-medium text-gold-300">{PRIZE_TIER_LABELS[w.prize_tier]}</div>
                  <div className="text-xs text-zinc-500">
                    {getMonthName((w as { draws?: { month: number; year: number } }).draws?.month ?? 1)} {(w as { draws?: { month: number; year: number } }).draws?.year}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gold-400">{formatCurrency(w.prize_amount)}</div>
                  <div className={`text-xs mt-0.5 ${w.payment_status === "paid" ? "text-green-400" : "text-yellow-400"}`}>
                    {w.payment_status === "paid" ? "Paid" : "Pending"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
