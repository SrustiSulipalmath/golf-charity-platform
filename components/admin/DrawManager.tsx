// components/admin/DrawManager.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Trophy, Play, Send, RefreshCw, Plus, Loader2, ChevronDown, ChevronUp,
  Zap, Shuffle, CheckCircle, Clock, AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import type { Draw } from "@/types";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { calculatePrizePools } from "@/lib/stripe";
import { generateWinningNumbers, simulateDraw, type DrawMode } from "@/lib/draw-engine";

interface Props { draws: Draw[]; activeSubscribers: number; }

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:   <Clock size={14} />,
  simulated: <Play size={14} />,
  published: <CheckCircle size={14} />,
};
const STATUS_STYLE: Record<string, string> = {
  pending:   "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  simulated: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  published: "text-green-400 bg-green-400/10 border-green-400/20",
};

export default function DrawManager({ draws: initial, activeSubscribers }: Props) {
  const supabase = createClient();
  const [draws, setDraws] = useState<Draw[]>(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // New draw form
  const now = new Date();
  const [newDraw, setNewDraw] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    draw_type: "random" as DrawMode,
  });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const pools = calculatePrizePools(activeSubscribers);

  async function createDraw() {
    setCreating(true);
    const { data, error } = await supabase
      .from("draws")
      .insert({
        month: newDraw.month,
        year: newDraw.year,
        draw_type: newDraw.draw_type,
        status: "pending",
        winning_numbers: [],
        jackpot_pool: pools.jackpot,
        four_match_pool: pools.fourMatch,
        three_match_pool: pools.threeMatch,
        total_subscribers: activeSubscribers,
      })
      .select()
      .single();
    if (error) { toast.error(error.message); }
    else {
      setDraws(d => [data, ...d]);
      setShowForm(false);
      toast.success("Draw created!");
    }
    setCreating(false);
  }

  async function simulateDrawAction(draw: Draw) {
    setLoading(draw.id);
    try {
      // Fetch all active subscriber scores
      const { data: entries } = await supabase
        .from("golf_scores")
        .select("user_id, score")
        .in("user_id", (await supabase.from("subscriptions").select("user_id").eq("status", "active")).data?.map(s => s.user_id) ?? []);

      // Group scores by user
      const userScores: Record<string, number[]> = {};
      for (const e of entries ?? []) {
        if (!userScores[e.user_id]) userScores[e.user_id] = [];
        userScores[e.user_id].push(e.score);
      }
      const entryList = Object.entries(userScores).map(([userId, scores]) => ({ userId, scores }));
      const allScores = (entries ?? []).map(e => e.score);

      const result = simulateDraw(entryList, draw.draw_type as DrawMode, {
        jackpot: draw.jackpot_pool,
        fourMatch: draw.four_match_pool,
        threeMatch: draw.three_match_pool,
      }, allScores);

      const { data: updated, error } = await supabase
        .from("draws")
        .update({
          winning_numbers: result.winningNumbers,
          simulation_result: {
            five_match_winners: result.fiveMatchWinners.length,
            four_match_winners: result.fourMatchWinners.length,
            three_match_winners: result.threeMatchWinners.length,
            total_prize_distributed: result.totalDistributed,
            jackpot_rolls_over: result.jackpotRollsOver,
          },
          status: "simulated",
        })
        .eq("id", draw.id)
        .select()
        .single();

      if (error) throw error;
      setDraws(d => d.map(dr => dr.id === draw.id ? updated : dr));
      toast.success(`Simulation complete! ${result.fiveMatchWinners.length} jackpot, ${result.fourMatchWinners.length} four-match, ${result.threeMatchWinners.length} three-match winners.`);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Simulation failed");
    }
    setLoading(null);
  }

  async function publishDraw(draw: Draw) {
    if (!draw.winning_numbers?.length) return toast.error("Run simulation first");
    if (!confirm(`Publish draw for ${getMonthName(draw.month)} ${draw.year}? This will create winner records and cannot be undone.`)) return;

    setLoading(draw.id + "-publish");
    try {
      // Fetch all active subscriber entries
      const { data: activeSubs } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("status", "active");
      const subUserIds = activeSubs?.map(s => s.user_id) ?? [];

      const { data: allScores } = await supabase
        .from("golf_scores")
        .select("user_id, score")
        .in("user_id", subUserIds);

      // Group scores per user
      const userScoresMap: Record<string, number[]> = {};
      for (const s of allScores ?? []) {
        if (!userScoresMap[s.user_id]) userScoresMap[s.user_id] = [];
        userScoresMap[s.user_id].push(s.score);
      }

      const winSet = new Set(draw.winning_numbers);

      // Create draw entries
      const entries = Object.entries(userScoresMap).map(([userId, scores]) => {
        const matches = scores.filter(s => winSet.has(s)).length;
        const tier = matches >= 5 ? "five_match" : matches === 4 ? "four_match" : matches === 3 ? "three_match" : null;
        return { draw_id: draw.id, user_id: userId, scores_used: scores, match_count: matches, prize_tier: tier };
      });

      if (entries.length > 0) {
        await supabase.from("draw_entries").upsert(entries, { onConflict: "draw_id,user_id" });
      }

      // Create winner records
      const winners5 = entries.filter(e => e.prize_tier === "five_match");
      const winners4 = entries.filter(e => e.prize_tier === "four_match");
      const winners3 = entries.filter(e => e.prize_tier === "three_match");
      const jackpotRolls = winners5.length === 0;

      const winnerInserts = [
        ...winners5.map(w => ({ draw_id: draw.id, user_id: w.user_id, prize_tier: "five_match", prize_amount: jackpotRolls ? 0 : draw.jackpot_pool / winners5.length, match_count: w.match_count })),
        ...winners4.map(w => ({ draw_id: draw.id, user_id: w.user_id, prize_tier: "four_match", prize_amount: winners4.length > 0 ? draw.four_match_pool / winners4.length : 0, match_count: w.match_count })),
        ...winners3.map(w => ({ draw_id: draw.id, user_id: w.user_id, prize_tier: "three_match", prize_amount: winners3.length > 0 ? draw.three_match_pool / winners3.length : 0, match_count: w.match_count })),
      ];

      if (winnerInserts.length > 0) {
        // Get draw_entry IDs
        const { data: entryRecords } = await supabase
          .from("draw_entries")
          .select("id, user_id")
          .eq("draw_id", draw.id);
        const entryIdMap = new Map(entryRecords?.map(e => [e.user_id, e.id]) ?? []);

        await supabase.from("winners").insert(
          winnerInserts.map(w => ({ ...w, draw_entry_id: entryIdMap.get(w.user_id) ?? null }))
        );
      }

      // Update draw status
      const { data: updated } = await supabase
        .from("draws")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          jackpot_rolled_over: jackpotRolls,
        })
        .eq("id", draw.id)
        .select()
        .single();

      setDraws(d => d.map(dr => dr.id === draw.id ? (updated ?? dr) : dr));
      toast.success(`Draw published! ${winnerInserts.length} winner records created.`);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Publish failed");
    }
    setLoading(null);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Draw Management</h1>
          <p className="text-zinc-500 text-sm">{activeSubscribers} active subscribers · estimated prize pool: {formatCurrency(pools.jackpot + pools.fourMatch + pools.threeMatch)}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus size={16} /> New Draw
        </button>
      </div>

      {/* Pool breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Jackpot (5-match)", amount: pools.jackpot, pct: "40%" },
          { label: "4-Number Match", amount: pools.fourMatch, pct: "35%" },
          { label: "3-Number Match", amount: pools.threeMatch, pct: "25%" },
        ].map((p, i) => (
          <div key={i} className="stat-card">
            <div className="text-xs text-zinc-500">{p.label}</div>
            <div className="font-display text-xl font-bold text-gold-400">{formatCurrency(p.amount)}</div>
            <div className="text-xs text-zinc-600">{p.pct} of pool</div>
          </div>
        ))}
      </div>

      {/* New draw form */}
      {showForm && (
        <div className="card border-brand-500/30">
          <h3 className="font-semibold mb-4">Create New Draw</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Month</label>
              <select value={newDraw.month} onChange={e => setNewDraw(f => ({ ...f, month: Number(e.target.value) }))}
                className="input-field">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Year</label>
              <input type="number" value={newDraw.year} onChange={e => setNewDraw(f => ({ ...f, year: Number(e.target.value) }))}
                className="input-field" min={2024} max={2030} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Draw Type</label>
              <select value={newDraw.draw_type} onChange={e => setNewDraw(f => ({ ...f, draw_type: e.target.value as DrawMode }))}
                className="input-field">
                <option value="random">Random</option>
                <option value="algorithmic">Algorithmic</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createDraw} disabled={creating} className="btn-primary text-sm">
              {creating ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Create Draw</>}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-outline text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Draws list */}
      <div className="space-y-4">
        {draws.map(draw => (
          <div key={draw.id} className="card">
            {/* Draw header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold">{getMonthName(draw.month)} {draw.year}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge border ${STATUS_STYLE[draw.status]}`}>
                      {STATUS_ICON[draw.status]} {draw.status}
                    </span>
                    <span className="text-xs text-zinc-600 capitalize">{draw.draw_type} draw</span>
                    <span className="text-xs text-zinc-600">{draw.total_subscribers} subscribers</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {draw.status === "pending" && (
                  <button onClick={() => simulateDrawAction(draw)}
                    disabled={loading === draw.id}
                    className="btn-outline text-sm py-2 px-3 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10">
                    {loading === draw.id ? <Loader2 size={14} className="animate-spin" /> : <><Play size={14} /> Simulate</>}
                  </button>
                )}
                {draw.status === "simulated" && (
                  <>
                    <button onClick={() => simulateDrawAction(draw)}
                      disabled={loading === draw.id}
                      className="btn-ghost text-sm py-2 px-3">
                      <RefreshCw size={14} /> Re-run
                    </button>
                    <button onClick={() => publishDraw(draw)}
                      disabled={loading === draw.id + "-publish"}
                      className="btn-primary text-sm py-2 px-3">
                      {loading === draw.id + "-publish" ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> Publish</>}
                    </button>
                  </>
                )}
                <button onClick={() => setExpanded(expanded === draw.id ? null : draw.id)}
                  className="btn-ghost p-2">
                  {expanded === draw.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {/* Expanded details */}
            {expanded === draw.id && (
              <div className="mt-5 pt-5 border-t border-white/5 space-y-4">
                {/* Winning numbers */}
                {draw.winning_numbers?.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Winning Numbers</p>
                    <div className="flex gap-2">
                      {draw.winning_numbers.map((n, i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center font-display font-bold text-brand-300">
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Simulation result */}
                {draw.simulation_result && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Simulation Results</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "5-Match Winners", value: draw.simulation_result.five_match_winners },
                        { label: "4-Match Winners", value: draw.simulation_result.four_match_winners },
                        { label: "3-Match Winners", value: draw.simulation_result.three_match_winners },
                        { label: "Jackpot Rolls Over", value: draw.simulation_result.jackpot_rolls_over ? "Yes" : "No" },
                      ].map((s, i) => (
                        <div key={i} className="bg-white/3 rounded-xl p-3 text-center">
                          <div className="font-display text-lg font-bold">{s.value}</div>
                          <div className="text-xs text-zinc-500">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-zinc-400">
                      Total distributed: <span className="text-white font-semibold">{formatCurrency(draw.simulation_result.total_prize_distributed)}</span>
                    </div>
                  </div>
                )}

                {/* Pool breakdown */}
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Prize Pools</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Jackpot", amount: draw.jackpot_pool },
                      { label: "4-Match", amount: draw.four_match_pool },
                      { label: "3-Match", amount: draw.three_match_pool },
                    ].map((p, i) => (
                      <div key={i} className="bg-white/3 rounded-xl p-3 text-center">
                        <div className="font-display text-lg font-bold text-gold-400">{formatCurrency(p.amount)}</div>
                        <div className="text-xs text-zinc-500">{p.label}</div>
                      </div>
                    ))}
                  </div>
                  {draw.rollover_amount > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-orange-400">
                      <AlertTriangle size={14} /> Rollover from previous month: +{formatCurrency(draw.rollover_amount)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {draws.length === 0 && (
          <div className="card text-center py-16 text-zinc-600">
            <Trophy size={40} className="mx-auto mb-3 opacity-40" />
            <p>No draws created yet. Create your first draw above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
