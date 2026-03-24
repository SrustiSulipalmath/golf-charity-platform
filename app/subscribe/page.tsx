// app/subscribe/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Heart, Loader2, Shield, Trophy } from "lucide-react";
import toast from "react-hot-toast";

const PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    price: "£9.99",
    per: "/ month",
    description: "Perfect for getting started",
    annualEquiv: null,
    features: [
      "Enter up to 5 Stableford scores",
      "Monthly prize draw entry",
      "10%+ to your chosen charity",
      "Full dashboard access",
      "Cancel any time",
    ],
    popular: false,
    badge: null,
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "£89.99",
    per: "/ year",
    description: "Best value — 2 months free",
    annualEquiv: "£7.50/mo",
    features: [
      "Everything in Monthly",
      "2 months free (save £29.89)",
      "Priority charity spotlight",
      "Yearly member badge",
      "Early access to new features",
    ],
    popular: true,
    badge: "Most Popular",
  },
];

export default function SubscribePage() {
  const [selected, setSelected] = useState("yearly");
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error === "not_authenticated") {
        window.location.href = `/auth/signup?redirect=/subscribe`;
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch {
      toast.error("Failed to connect to payment provider");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-dark-900 py-20 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(34,197,94,0.07)_0%,transparent_60%)]" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <Link href="/" className="inline-block font-display text-2xl font-bold text-gradient-green mb-8">
            FairwayHeart
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Choose your <span className="text-gradient-green">plan</span>
          </h1>
          <p className="text-zinc-400 text-lg">Play. Win. Give. Simple pricing, real impact.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {PLANS.map(plan => (
            <button key={plan.id} onClick={() => setSelected(plan.id)}
              className={`card text-left transition-all duration-300 relative group ${
                selected === plan.id
                  ? "border-brand-500/60 glow-green"
                  : "hover:border-white/20"
              }`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-dark-900 text-xs font-bold px-4 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm text-zinc-400 mb-1">{plan.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-black">{plan.price}</span>
                    <span className="text-zinc-500 text-sm">{plan.per}</span>
                  </div>
                  {plan.annualEquiv && (
                    <div className="text-brand-400 text-sm mt-1">Just {plan.annualEquiv}</div>
                  )}
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selected === plan.id ? "border-brand-500 bg-brand-500" : "border-zinc-600"
                }`}>
                  {selected === plan.id && <Check size={12} className="text-dark-900" strokeWidth={3} />}
                </div>
              </div>

              <p className="text-zinc-500 text-sm mb-5">{plan.description}</p>

              <ul className="space-y-2.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check size={14} className="text-brand-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <button onClick={handleSubscribe} disabled={loading}
          className="btn-primary w-full py-4 text-lg max-w-md mx-auto flex glow-green disabled:opacity-70">
          {loading ? <Loader2 size={20} className="animate-spin" /> : (
            <>Subscribe Now <ArrowRight size={18} /></>
          )}
        </button>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-zinc-600">
          <div className="flex items-center gap-1.5"><Shield size={14} /> Stripe-secured payment</div>
          <div className="flex items-center gap-1.5"><Heart size={14} /> 10%+ to charity always</div>
          <div className="flex items-center gap-1.5"><Trophy size={14} /> Monthly prize draw</div>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-brand-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
