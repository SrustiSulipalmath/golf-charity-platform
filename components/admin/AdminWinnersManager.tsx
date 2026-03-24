// components/admin/AdminWinnersManager.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, DollarSign, ExternalLink, Loader2, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, getMonthName, PRIZE_TIER_LABELS } from "@/lib/utils";
import type { Winner, Profile } from "@/types";

type WinnerRow = Winner & {
  profiles?: Pick<Profile, "full_name" | "email"> | null;
  draws?: { month: number; year: number; winning_numbers: number[] } | null;
};

interface Props { winners: WinnerRow[]; }

type Filter = "all" | "pending" | "approved" | "rejected" | "paid";

export default function AdminWinnersManager({ winners: initial }: Props) {
  const supabase = createClient();
  const [winners, setWinners] = useState<WinnerRow[]>(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: string; action: "approved" | "rejected" } | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const filtered = filter === "all" ? winners
    : filter === "paid" ? winners.filter(w => w.payment_status === "paid")
    : winners.filter(w => w.verification_status === filter);

  async function verify(id: string, status: "approved" | "rejected", note?: string) {
    setProcessing(id);
    const { error } = await supabase.from("winners")
      .update({ verification_status: status, admin_notes: note ?? null })
      .eq("id", id);
    if (error) { toast.error(error.message); }
    else {
      setWinners(ws => ws.map(w => w.id === id ? { ...w, verification_status: status, admin_notes: note ?? null } : w));
      toast.success(status === "approved" ? "Winner approved!" : "Submission rejected");
    }
    setProcessing(null);
    setNoteModal(null);
    setAdminNote("");
  }

  async function markPaid(id: string) {
    if (!confirm("Mark this prize as paid? This cannot be undone.")) return;
    setProcessing(id + "-pay");
    const { error } = await supabase.from("winners")
      .update({ payment_status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); }
    else {
      setWinners(ws => ws.map(w => w.id === id ? { ...w, payment_status: "paid", paid_at: new Date().toISOString() } : w));
      toast.success("Marked as paid!");
    }
    setProcessing(null);
  }

  const counts = {
    all: winners.length,
    pending: winners.filter(w => w.verification_status === "pending").length,
    approved: winners.filter(w => w.verification_status === "approved").length,
    rejected: winners.filter(w => w.verification_status === "rejected").length,
    paid: winners.filter(w => w.payment_status === "paid").length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1">Winners</h1>
        <p className="text-zinc-500 text-sm">Review proof submissions, approve winners, and track payouts.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected", "paid"] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === f ? "bg-brand-500/15 text-brand-300 border border-brand-500/25" : "text-zinc-500 hover:text-white bg-white/3 border border-white/5"
            }`}>
            {f} <span className="ml-1 text-xs opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Winners table */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card text-center py-12 text-zinc-600">No winners in this category.</div>
        )}

        {filtered.map(winner => (
          <div key={winner.id} className={`card ${winner.prize_tier === "five_match" ? "border-gold-500/20" : ""}`}>
            <div className="flex flex-wrap items-start gap-4">
              {/* User & draw info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{winner.profiles?.full_name ?? "Unknown"}</span>
                  {winner.prize_tier === "five_match" && <span className="text-lg">🏆</span>}
                </div>
                <div className="text-xs text-zinc-500">{winner.profiles?.email}</div>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <span className="text-zinc-400">
                    {winner.draws ? `${getMonthName(winner.draws.month)} ${winner.draws.year}` : "—"}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400">{PRIZE_TIER_LABELS[winner.prize_tier]}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="font-semibold text-gold-400">{formatCurrency(winner.prize_amount)}</span>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-col gap-1.5 items-end">
                <span className={`badge border text-xs ${
                  winner.verification_status === "approved" ? "text-green-400 bg-green-400/10 border-green-400/20"
                  : winner.verification_status === "rejected" ? "text-red-400 bg-red-400/10 border-red-400/20"
                  : "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
                }`}>
                  {winner.verification_status}
                </span>
                <span className={`badge border text-xs ${
                  winner.payment_status === "paid" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                  : "text-zinc-400 bg-zinc-400/10 border-zinc-400/20"
                }`}>
                  {winner.payment_status}
                </span>
              </div>
            </div>

            {/* Proof */}
            {winner.proof_url && (
              <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 text-sm">
                <Check size={14} className="text-brand-400 shrink-0" />
                <span className="text-zinc-400">Proof uploaded {winner.proof_uploaded_at ? formatDate(winner.proof_uploaded_at) : ""}</span>
                <a href={winner.proof_url} target="_blank" rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors text-xs">
                  View proof <ExternalLink size={12} />
                </a>
              </div>
            )}

            {!winner.proof_url && winner.verification_status === "pending" && (
              <div className="mt-3 p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/15 text-sm text-yellow-400/80">
                Awaiting proof upload from winner
              </div>
            )}

            {winner.admin_notes && (
              <div className="mt-3 p-3 rounded-xl bg-white/3 border border-white/5 text-sm text-zinc-400">
                <span className="text-zinc-500">Admin note: </span>{winner.admin_notes}
              </div>
            )}

            {/* Action buttons */}
            {winner.verification_status === "pending" && winner.proof_url && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => verify(winner.id, "approved")}
                  disabled={processing === winner.id}
                  className="btn-primary text-sm py-2 px-4 flex-1">
                  {processing === winner.id ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Approve</>}
                </button>
                <button onClick={() => setNoteModal({ id: winner.id, action: "rejected" })}
                  className="btn-outline text-sm py-2 px-4 border-red-400/30 text-red-400 hover:bg-red-400/10 flex-1">
                  <X size={14} /> Reject
                </button>
              </div>
            )}

            {winner.verification_status === "approved" && winner.payment_status === "pending" && (
              <div className="mt-4">
                <button onClick={() => markPaid(winner.id)}
                  disabled={processing === winner.id + "-pay"}
                  className="btn-primary text-sm py-2 px-5">
                  {processing === winner.id + "-pay" ? <Loader2 size={14} className="animate-spin" /> : <><DollarSign size={14} /> Mark as Paid</>}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rejection note modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-md">
            <h3 className="font-semibold mb-4">Rejection Reason</h3>
            <p className="text-sm text-zinc-400 mb-4">Provide a reason for rejection — this will be shown to the winner.</p>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
              className="input-field min-h-[100px] mb-4" placeholder="e.g. Proof screenshot does not match claimed scores..." />
            <div className="flex gap-3">
              <button onClick={() => verify(noteModal.id, "rejected", adminNote)}
                disabled={!adminNote.trim()}
                className="btn-primary text-sm py-2.5 flex-1 border-red-400 bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-50">
                Confirm Rejection
              </button>
              <button onClick={() => { setNoteModal(null); setAdminNote(""); }}
                className="btn-outline text-sm py-2.5 px-4">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
