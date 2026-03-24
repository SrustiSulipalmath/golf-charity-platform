// components/dashboard/CharitySelector.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart, Check, ExternalLink, Loader2, Star, Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { Charity, Subscription } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface Props {
  charities: Charity[];
  subscription: Subscription | null;
  userId: string;
}

export default function CharitySelector({ charities, subscription, userId }: Props) {
  const supabase = createClient();
  const [selectedId, setSelectedId] = useState(subscription?.selected_charity_id ?? "");
  const [pct, setPct] = useState(subscription?.charity_percentage ?? 10);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!selectedId) return toast.error("Please select a charity");
    setSaving(true);
    const { error } = await supabase
      .from("subscriptions")
      .update({ selected_charity_id: selectedId, charity_percentage: pct })
      .eq("user_id", userId);
    if (error) toast.error(error.message);
    else toast.success("Charity preferences saved!");
    setSaving(false);
  }

  const monthlyAmount = subscription?.amount_pence
    ? ((subscription.amount_pence * pct) / 100 / 100).toFixed(2)
    : ((999 * pct) / 100 / 100).toFixed(2);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1">My Charity</h1>
        <p className="text-zinc-500 text-sm">Choose who your subscription supports. Minimum 10% goes to charity every cycle.</p>
      </div>

      {/* Contribution slider */}
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Heart size={16} className="text-brand-400" /> Contribution Amount
        </h3>
        <div className="text-center mb-6">
          <div className="font-display text-5xl font-black text-gradient-green mb-1">{pct}%</div>
          <div className="text-zinc-400 text-sm">of your subscription = <span className="text-brand-300 font-semibold">£{monthlyAmount}/mo</span> to charity</div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setPct(p => Math.max(10, p - 5))}
            disabled={pct <= 10}
            className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all">
            <Minus size={16} />
          </button>
          <div className="flex-1">
            <input type="range" min={10} max={90} step={5} value={pct}
              onChange={e => setPct(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer" />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>10% (min)</span><span>90% (max)</span>
            </div>
          </div>
          <button onClick={() => setPct(p => Math.min(90, p + 5))}
            disabled={pct >= 90}
            className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Charity grid */}
      <div>
        <h3 className="font-semibold mb-4">Choose a Charity</h3>
        <div className="space-y-3">
          {charities.map(charity => (
            <button key={charity.id} onClick={() => setSelectedId(charity.id)}
              className={`w-full text-left card py-4 transition-all duration-200 ${
                selectedId === charity.id
                  ? "border-brand-500/60 glow-green"
                  : "hover:border-white/20"
              }`}>
              <div className="flex items-start gap-4">
                {charity.image_url && (
                  <img src={charity.image_url} alt={charity.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 opacity-80" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{charity.name}</h4>
                      {charity.is_featured && (
                        <span className="badge bg-gold-400/10 text-gold-400">
                          <Star size={10} fill="currentColor" /> Featured
                        </span>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedId === charity.id ? "border-brand-500 bg-brand-500" : "border-zinc-600"
                    }`}>
                      {selectedId === charity.id && <Check size={11} strokeWidth={3} className="text-dark-900" />}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed line-clamp-2">{charity.description}</p>
                  {charity.total_raised > 0 && (
                    <div className="text-xs text-brand-400 mt-1">{formatCurrency(charity.total_raised)} raised by the community</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving || !selectedId}
        className="btn-primary w-full py-4 disabled:opacity-60">
        {saving ? <Loader2 size={18} className="animate-spin" /> : <><Heart size={16} /> Save Charity Preferences</>}
      </button>
    </div>
  );
}
