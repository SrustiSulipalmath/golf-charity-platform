// components/dashboard/WinningsManager.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Medal, Upload, Check, Clock, X, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, getMonthName, PRIZE_TIER_LABELS } from "@/lib/utils";
import type { Winner } from "@/types";

interface Props {
  winners: (Winner & { draws?: { month: number; year: number; winning_numbers: number[] } | null })[];
  userId: string;
}

const VERIFICATION_STYLES: Record<string, string> = {
  pending:  "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  approved: "text-green-400 bg-green-400/10 border-green-400/20",
  rejected: "text-red-400 bg-red-400/10 border-red-400/20",
};

export default function WinningsManager({ winners, userId }: Props) {
  const supabase = createClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const [localWinners, setLocalWinners] = useState(winners);

  async function uploadProof(winnerId: string, file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("File must be under 5MB");

    setUploading(winnerId);
    const ext = file.name.split(".").pop();
    const path = `proofs/${userId}/${winnerId}.${ext}`;

    const { error: upErr } = await supabase.storage.from("winner-proofs").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Upload failed: " + upErr.message); setUploading(null); return; }

    const { data: { publicUrl } } = supabase.storage.from("winner-proofs").getPublicUrl(path);

    const { error: dbErr } = await supabase
      .from("winners")
      .update({ proof_url: publicUrl, proof_uploaded_at: new Date().toISOString() })
      .eq("id", winnerId);

    if (dbErr) { toast.error(dbErr.message); }
    else {
      setLocalWinners(ws => ws.map(w => w.id === winnerId ? { ...w, proof_url: publicUrl } : w));
      toast.success("Proof uploaded! Awaiting admin review.");
    }
    setUploading(null);
  }

  const totalWon = localWinners.filter(w => w.payment_status === "paid").reduce((s, w) => s + w.prize_amount, 0);
  const pendingAmount = localWinners.filter(w => w.payment_status === "pending").reduce((s, w) => s + w.prize_amount, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1">My Winnings</h1>
        <p className="text-zinc-500 text-sm">Track your prizes and upload proof of your scores to claim.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="w-9 h-9 rounded-lg bg-gold-500/15 flex items-center justify-center text-gold-400">
            <Medal size={18} />
          </div>
          <div>
            <div className="font-display text-2xl font-black text-gold-400">{formatCurrency(totalWon)}</div>
            <div className="text-xs text-zinc-500">Total Won & Paid</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
            <Clock size={18} />
          </div>
          <div>
            <div className="font-display text-2xl font-black text-yellow-400">{formatCurrency(pendingAmount)}</div>
            <div className="text-xs text-zinc-500">Pending Payment</div>
          </div>
        </div>
      </div>

      {localWinners.length === 0 && (
        <div className="card text-center py-16">
          <Medal size={40} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-400 font-medium">No winnings yet</p>
          <p className="text-zinc-600 text-sm mt-1">Keep entering draws — your time will come!</p>
        </div>
      )}

      <div className="space-y-4">
        {localWinners.map(winner => (
          <div key={winner.id} className={`card ${winner.prize_tier === "five_match" ? "border-gold-500/30 glow-gold" : ""}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display text-lg font-bold">
                    {winner.draws ? `${getMonthName(winner.draws.month)} ${winner.draws.year}` : "Draw"}
                  </span>
                  {winner.prize_tier === "five_match" && <span className="text-lg">🏆</span>}
                </div>
                <div className="text-sm text-zinc-400">{PRIZE_TIER_LABELS[winner.prize_tier]}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-black text-gold-400">{formatCurrency(winner.prize_amount)}</div>
                <div className={`badge border mt-1 ${VERIFICATION_STYLES[winner.verification_status]}`}>
                  {winner.verification_status === "approved" && <Check size={11} />}
                  {winner.verification_status === "pending" && <Clock size={11} />}
                  {winner.verification_status === "rejected" && <X size={11} />}
                  {winner.verification_status.charAt(0).toUpperCase() + winner.verification_status.slice(1)}
                </div>
              </div>
            </div>

            {/* Winning numbers */}
            {winner.draws?.winning_numbers && (
              <div className="flex gap-2 flex-wrap mb-4">
                {winner.draws.winning_numbers.map((n: number, i: number) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-dark-600 border border-white/10 flex items-center justify-center text-xs font-mono font-semibold text-zinc-300">
                    {n}
                  </div>
                ))}
              </div>
            )}

            {/* Payment status */}
            <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm ${
              winner.payment_status === "paid"
                ? "bg-green-400/10 border border-green-400/20 text-green-300"
                : "bg-yellow-400/10 border border-yellow-400/20 text-yellow-300"
            }`}>
              {winner.payment_status === "paid" ? <Check size={14} /> : <Clock size={14} />}
              Payment: {winner.payment_status === "paid"
                ? `Paid on ${winner.paid_at ? formatDate(winner.paid_at) : "—"}`
                : "Awaiting verification & approval"}
            </div>

            {/* Proof upload */}
            {winner.verification_status === "pending" && (
              <div>
                {winner.proof_url ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 text-sm">
                    <Check size={14} className="text-brand-400" />
                    <span className="text-zinc-300">Proof uploaded — awaiting review</span>
                    <a href={winner.proof_url} target="_blank" rel="noopener noreferrer"
                      className="text-brand-400 text-xs hover:underline ml-auto">View</a>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-5 text-center hover:border-brand-500/30 transition-colors">
                    <AlertCircle size={20} className="mx-auto text-yellow-400 mb-2" />
                    <p className="text-sm text-zinc-400 mb-1">Upload proof of your scores to claim your prize</p>
                    <p className="text-xs text-zinc-600 mb-4">Screenshot from your golf club's scoring system</p>
                    <label className="btn-primary text-sm py-2 px-5 cursor-pointer inline-flex">
                      {uploading === winner.id ? <Loader2 size={14} className="animate-spin" /> : <><Upload size={14} /> Upload Screenshot</>}
                      <input type="file" accept="image/*" className="hidden"
                        disabled={uploading === winner.id}
                        onChange={e => e.target.files?.[0] && uploadProof(winner.id, e.target.files[0])} />
                    </label>
                  </div>
                )}
              </div>
            )}

            {winner.verification_status === "rejected" && winner.admin_notes && (
              <div className="p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-sm text-red-300">
                <strong>Rejected:</strong> {winner.admin_notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
