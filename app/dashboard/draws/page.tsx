// app/dashboard/draws/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Trophy, Calendar } from "lucide-react";
import { formatCurrency, getMonthName, PRIZE_TIER_LABELS } from "@/lib/utils";

export default async function DrawsPage() {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: draws }, { data: myEntries }] = await Promise.all([
    (await supabase).from("draws").select("*").eq("status", "published").order("year", { ascending: false }).order("month", { ascending: false }),
    (await supabase).from("draw_entries").select("*, draws(month,year)").eq("user_id", user.id),
  ]);

  const entryMap = new Map(myEntries?.map(e => [e.draw_id, e]) ?? []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1">Draw Results</h1>
        <p className="text-zinc-500 text-sm">Monthly draws — 5 numbers from 1–45. Match your scores to win.</p>
      </div>

      {(!draws || draws.length === 0) && (
        <div className="card text-center py-16">
          <Trophy size={40} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-400 font-medium">No draws published yet</p>
          <p className="text-zinc-600 text-sm mt-1">Check back after the end of the month</p>
        </div>
      )}

      <div className="space-y-4">
        {draws?.map(draw => {
          const myEntry = entryMap.get(draw.id);
          const won = myEntry?.prize_tier;

          return (
            <div key={draw.id} className={`card transition-all ${won ? "border-gold-500/30 glow-gold" : ""}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-xl font-bold">{getMonthName(draw.month)} {draw.year}</h3>
                    {won && (
                      <span className="badge bg-gold-400/15 text-gold-300 border border-gold-400/20">
                        🏆 You won!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                    <Calendar size={11} />
                    {draw.total_subscribers} participants · {draw.draw_type} draw
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500">Jackpot</div>
                  <div className="font-display text-xl font-bold text-gold-400">{formatCurrency(draw.jackpot_pool)}</div>
                  {draw.jackpot_rolled_over && (
                    <div className="text-xs text-orange-400">Rolled over ↗</div>
                  )}
                </div>
              </div>

              {/* Winning numbers */}
              <div className="mb-4">
                <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wide font-medium">Winning Numbers</p>
                <div className="flex gap-2 flex-wrap">
                  {draw.winning_numbers.map((n: number, i: number) => {
                    const isMyScore = myEntry?.scores_used?.includes(n);
                    return (
                      <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm transition-all ${
                        isMyScore
                          ? "bg-brand-500 text-dark-900 scale-110 shadow-lg shadow-brand-500/30"
                          : "bg-dark-600 border border-white/10 text-zinc-300"
                      }`}>
                        {n}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* My entry */}
              {myEntry ? (
                <div className={`p-3 rounded-xl text-sm ${
                  won ? "bg-gold-500/10 border border-gold-500/20" : "bg-white/3 border border-white/5"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-zinc-400">Your entry: </span>
                      <span className="font-mono font-medium">[{myEntry.scores_used.join(", ")}]</span>
                      <span className="ml-2 text-zinc-500">— {myEntry.match_count} match{myEntry.match_count !== 1 ? "es" : ""}</span>
                    </div>
                    {won && (
                      <span className="text-gold-300 font-semibold">{PRIZE_TIER_LABELS[won]}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-sm text-zinc-600 italic">
                  You were not entered in this draw
                </div>
              )}

              {/* Prize pools */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "3 Match", amount: draw.three_match_pool, pct: "25%" },
                  { label: "4 Match", amount: draw.four_match_pool, pct: "35%" },
                  { label: "Jackpot", amount: draw.jackpot_pool, pct: "40%" },
                ].map((pool, i) => (
                  <div key={i} className="text-center p-2 rounded-lg bg-white/3">
                    <div className="text-xs text-zinc-500">{pool.label}</div>
                    <div className="font-semibold text-sm">{formatCurrency(pool.amount)}</div>
                    <div className="text-xs text-zinc-600">{pool.pct}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
