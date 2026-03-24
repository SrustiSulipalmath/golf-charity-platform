// app/subscribe/success/page.tsx
import Link from "next/link";
import { CheckCircle, ArrowRight, Target, Heart } from "lucide-react";

export default function SubscribeSuccessPage() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(34,197,94,0.1)_0%,transparent_60%)]" />
      <div className="relative z-10 max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-24 h-24 rounded-full bg-brand-500/20 border-2 border-brand-500/40 flex items-center justify-center mx-auto mb-8 glow-green">
          <CheckCircle size={44} className="text-brand-400" />
        </div>

        <h1 className="font-display text-4xl font-bold mb-4">
          You're in! 🎉
        </h1>
        <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
          Welcome to FairwayHeart. Your subscription is active — now let's get your scores in and your charity chosen.
        </p>

        <div className="space-y-3 mb-10">
          {[
            { icon: <Target size={18} />, title: "Add your first 5 scores", desc: "Enter your recent Stableford scores to enter the next draw", href: "/dashboard/scores" },
            { icon: <Heart size={18} />, title: "Choose your charity", desc: "Pick which cause your subscription supports every month", href: "/dashboard/charity" },
          ].map((step, i) => (
            <Link key={i} href={step.href}
              className="card text-left flex items-center gap-4 hover:border-brand-500/30 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-400 shrink-0 group-hover:bg-brand-500/25 transition-colors">
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{step.title}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{step.desc}</div>
              </div>
              <ArrowRight size={16} className="text-zinc-600 group-hover:text-brand-400 transition-colors" />
            </Link>
          ))}
        </div>

        <Link href="/dashboard" className="btn-primary w-full py-4 text-base">
          Go to Dashboard <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
