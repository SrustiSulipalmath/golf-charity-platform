// components/dashboard/ScoreManager.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Edit3, Save, X, Target, Calendar, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import type { GolfScore } from "@/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface Props {
  initialScores: GolfScore[];
  isSubscribed: boolean;
  userId: string;
}

export default function ScoreManager({ initialScores, isSubscribed, userId }: Props) {
  const supabase = createClient();
  const [scores, setScores] = useState<GolfScore[]>(initialScores);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newScore, setNewScore] = useState({ score: "", played_on: new Date().toISOString().split("T")[0], notes: "" });
  const [editForm, setEditForm] = useState({ score: "", played_on: "", notes: "" });

  async function addScore() {
    if (!newScore.score || isNaN(Number(newScore.score))) return toast.error("Enter a valid score");
    const num = Number(newScore.score);
    if (num < 1 || num > 45) return toast.error("Score must be between 1 and 45");
    setSaving(true);
    const { data, error } = await supabase
      .from("golf_scores")
      .insert({ user_id: userId, score: num, played_on: newScore.played_on, notes: newScore.notes || null })
      .select()
      .single();
    if (error) { toast.error(error.message); }
    else {
      // Refetch to reflect rolling-5 enforcement
      const { data: fresh } = await supabase.from("golf_scores").select("*").eq("user_id", userId).order("played_on", { ascending: false });
      setScores(fresh ?? []);
      setNewScore({ score: "", played_on: new Date().toISOString().split("T")[0], notes: "" });
      setAdding(false);
      toast.success("Score added!");
    }
    setSaving(false);
  }

  async function updateScore(id: string) {
    const num = Number(editForm.score);
    if (num < 1 || num > 45) return toast.error("Score must be 1–45");
    setSaving(true);
    const { error } = await supabase
      .from("golf_scores")
      .update({ score: num, played_on: editForm.played_on, notes: editForm.notes || null })
      .eq("id", id);
    if (error) { toast.error(error.message); }
    else {
      setScores(s => s.map(sc => sc.id === id ? { ...sc, score: num, played_on: editForm.played_on, notes: editForm.notes } : sc));
      setEditingId(null);
      toast.success("Score updated!");
    }
    setSaving(false);
  }

  async function deleteScore(id: string) {
    if (!confirm("Delete this score?")) return;
    const { error } = await supabase.from("golf_scores").delete().eq("id", id);
    if (error) { toast.error(error.message); }
    else {
      setScores(s => s.filter(sc => sc.id !== id));
      toast.success("Score removed");
    }
  }

  function startEdit(score: GolfScore) {
    setEditingId(score.id);
    setEditForm({ score: String(score.score), played_on: score.played_on, notes: score.notes ?? "" });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">My Scores</h1>
          <p className="text-zinc-500 text-sm">Enter your last 5 Stableford scores (1–45). Oldest auto-removed when you add a 6th.</p>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl font-black text-brand-400">{scores.length}<span className="text-zinc-600 text-lg">/5</span></div>
          <div className="text-xs text-zinc-500">slots used</div>
        </div>
      </div>

      {!isSubscribed && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-400/10 border border-orange-400/20 text-orange-300 text-sm">
          <AlertCircle size={16} />
          Scores only count for draws while your subscription is active.{" "}
          <Link href="/subscribe" className="underline font-medium">Subscribe now</Link>
        </div>
      )}

      {/* Progress bar */}
      <div className="card">
        <div className="flex justify-between text-xs text-zinc-500 mb-2">
          <span>Score slots</span><span>{scores.length} / 5</span>
        </div>
        <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-500"
            style={{ width: `${(scores.length / 5) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-3">
          {Array.from({ length: 5 }, (_, i) => {
            const s = scores[i];
            return (
              <div key={i} className={`flex-1 mx-0.5 h-16 rounded-xl flex flex-col items-center justify-center border transition-all ${
                s ? "bg-brand-500/15 border-brand-500/30" : "bg-white/3 border-white/5"
              }`}>
                {s ? (
                  <>
                    <span className="font-display text-xl font-bold text-brand-300">{s.score}</span>
                    <span className="text-xs text-zinc-500 font-mono">{new Date(s.played_on).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                  </>
                ) : (
                  <span className="text-zinc-700 text-lg">—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Score list */}
      <div className="space-y-3">
        {scores.map((score, idx) => (
          <div key={score.id} className="card py-4">
            {editingId === score.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Score (1–45)</label>
                    <input type="number" min={1} max={45} value={editForm.score}
                      onChange={e => setEditForm(f => ({ ...f, score: e.target.value }))}
                      className="input-field text-center text-xl font-bold" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Date Played</label>
                    <input type="date" value={editForm.played_on}
                      onChange={e => setEditForm(f => ({ ...f, played_on: e.target.value }))}
                      className="input-field" />
                  </div>
                </div>
                <input type="text" placeholder="Notes (optional)" value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="input-field text-sm" />
                <div className="flex gap-2">
                  <button onClick={() => updateScore(score.id)} disabled={saving}
                    className="btn-primary text-sm py-2 flex-1">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Save</>}
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn-outline text-sm py-2 px-4">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
                    <span className="font-display text-xl font-black text-brand-300">{score.score}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Stableford: <span className="text-brand-300">{score.score} pts</span></div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Calendar size={11} /> {formatDate(score.played_on)}
                      {score.notes && <span className="ml-2 text-zinc-600">· {score.notes}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-700 font-mono">#{idx + 1}</span>
                  <button onClick={() => startEdit(score)} className="btn-ghost p-2 text-zinc-500 hover:text-brand-400">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => deleteScore(score.id)} className="btn-ghost p-2 text-zinc-500 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add score */}
      {adding ? (
        <div className="card border-brand-500/30 space-y-4">
          <h4 className="font-semibold text-sm text-brand-300">New Score</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Score (1–45)</label>
              <input type="number" min={1} max={45} placeholder="e.g. 32"
                value={newScore.score} onChange={e => setNewScore(f => ({ ...f, score: e.target.value }))}
                className="input-field text-center text-xl font-bold" autoFocus />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Date Played</label>
              <input type="date" value={newScore.played_on}
                onChange={e => setNewScore(f => ({ ...f, played_on: e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <input type="text" placeholder="Notes (optional — e.g. course name)"
            value={newScore.notes} onChange={e => setNewScore(f => ({ ...f, notes: e.target.value }))}
            className="input-field text-sm" />
          <div className="flex gap-2">
            <button onClick={addScore} disabled={saving} className="btn-primary text-sm py-2.5 flex-1">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Add Score</>}
            </button>
            <button onClick={() => { setAdding(false); setNewScore({ score: "", played_on: new Date().toISOString().split("T")[0], notes: "" }); }}
              className="btn-outline text-sm py-2.5 px-4">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-white/10 text-zinc-500 hover:border-brand-500/40 hover:text-brand-400 transition-all flex items-center justify-center gap-2 text-sm">
          <Plus size={18} /> Add a Score
        </button>
      )}
    </div>
  );
}
