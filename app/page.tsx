// app/page.tsx
import Link from "next/link";
import { ArrowRight, Heart, Trophy, Target, Users, Star, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

async function getFeaturedCharity() {
  const supabase = createClient();
  const { data } = await supabase
    .from("charities")
    .select("*")
    .eq("is_featured", true)
    .single();
  return data;
}

async function getStats() {
  const supabase = createClient();
  const [{ count: subscribers }, { data: draws }] = await Promise.all([
    supabase.from("subscriptions").select("*", { count: "exact" }).eq("status", "active"),
    supabase.from("draws").select("jackpot_pool,four_match_pool,three_match_pool").eq("status", "published"),
  ]);
  const totalPrizes = draws?.reduce((sum, d) => sum + d.jackpot_pool + d.four_match_pool + d.three_match_pool, 0) ?? 0;
  return { subscribers: subscribers ?? 0, totalPrizes };
}

export default async function HomePage() {
  const [featured, stats] = await Promise.all([getFeaturedCharity(), getStats()]);

  return (
    <div className="min-h-screen bg-dark-900 text-white overflow-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5">
        <Link href="/" className="font-display text-xl font-bold text-gradient-green">
          FairwayHeart
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <Link href="/charities" className="hover:text-white transition-colors">Charities</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          <Link href="#draws" className="hover:text-white transition-colors">Prize Draws</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-ghost text-sm">Sign in</Link>
          <Link href="/subscribe" className="btn-primary text-sm">
            Subscribe <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background mesh */}
        <div className="absolute inset-0 bg-mesh-green" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.08)_0%,transparent_70%)]" />

        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-gold-500/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full glass border border-brand-500/30 px-4 py-2 text-sm text-brand-300 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            Monthly draw now open · Join {stats.subscribers.toLocaleString()}+ members
          </div>

          <h1 className="page-title mb-6 animate-slide-up" style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
            Golf with a <span className="text-gradient-green">purpose</span>
            <br />that changes{" "}
            <span className="text-gradient-gold italic">everything</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up stagger-2" style={{ opacity: 0, animationFillMode: "forwards" }}>
            Enter your Stableford scores each month. Win real prizes from the community pool.
            And support the charity that matters most to you — automatically, every month.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-3" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <Link href="/subscribe" className="btn-primary text-base px-8 py-4 glow-green">
              Start for £9.99/month <ArrowRight size={18} />
            </Link>
            <Link href="#how-it-works" className="btn-outline text-base px-8 py-4">
              See how it works
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16 text-sm text-zinc-500 animate-fade-in stagger-4" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-white">{stats.subscribers.toLocaleString()}</div>
              <div>Active Members</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-gold-400">£{stats.totalPrizes.toLocaleString()}</div>
              <div>Total Prizes Paid</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-brand-400">5+</div>
              <div>Charity Partners</div>
            </div>
          </div>

          <div className="mt-16 animate-float">
            <ChevronDown className="mx-auto text-zinc-600" size={28} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-medium tracking-widest uppercase mb-3">The Platform</p>
            <h2 className="section-title">Four steps. One powerful loop.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Star size={24} />, step: "01", title: "Subscribe", desc: "Choose monthly or yearly. A portion goes to your charity of choice, the rest builds the prize pool." },
              { icon: <Target size={24} />, step: "02", title: "Score", desc: "Enter your last 5 Stableford scores. They form your draw entry — updated with every round you play." },
              { icon: <Trophy size={24} />, step: "03", title: "Draw", desc: "Each month, 5 winning numbers are drawn. Match 3, 4, or all 5 of your scores to win from the pool." },
              { icon: <Heart size={24} />, step: "04", title: "Give", desc: "Your chosen charity receives its share every cycle. You can increase your contribution any time." },
            ].map((item, i) => (
              <div key={i} className="card hover:border-brand-500/30 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-400 group-hover:bg-brand-500/25 transition-colors">
                    {item.icon}
                  </div>
                  <span className="font-mono text-zinc-700 text-sm">{item.step}</span>
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIZE DRAW ── */}
      <section id="draws" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(34,197,94,0.05)_0%,transparent_70%)]" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <p className="text-brand-400 text-sm font-medium tracking-widest uppercase mb-3">Monthly Prize Draw</p>
            <h2 className="section-title">Three ways to win</h2>
            <p className="text-zinc-400 mt-4 max-w-2xl mx-auto">Every month, five winning numbers are drawn from 1–45. Your last 5 Stableford scores are your entries. Match more to win more.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { tier: "3 Match", share: "25%", desc: "Match any 3 of your 5 scores to the drawn numbers", color: "brand" },
              { tier: "4 Match", share: "35%", desc: "Match 4 of your scores for a major prize", color: "gold" },
              { tier: "5 Match 🏆", share: "40%", desc: "Match all 5 — win the full jackpot (rolls over if unclaimed!)", color: "gold", jackpot: true },
            ].map((item, i) => (
              <div key={i} className={`card text-center ${item.jackpot ? "border-gold-500/30 glow-gold" : ""}`}>
                <div className={`text-4xl font-display font-black mb-1 ${item.jackpot ? "text-gradient-gold" : "text-gradient-green"}`}>
                  {item.share}
                </div>
                <div className="text-xs text-zinc-500 mb-4 font-mono">of prize pool</div>
                <h3 className="font-display text-xl font-bold mb-3">{item.tier}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                {item.jackpot && (
                  <div className="mt-4 text-xs text-gold-400 bg-gold-400/10 rounded-full px-3 py-1 inline-block">
                    Jackpot rolls over monthly
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHARITY SPOTLIGHT ── */}
      {featured && (
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="card overflow-hidden md:flex gap-0">
              {featured.image_url && (
                <div className="md:w-2/5 h-64 md:h-auto relative overflow-hidden">
                  <img src={featured.image_url} alt={featured.name} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-dark-800/80" />
                </div>
              )}
              <div className="p-8 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 text-xs text-gold-400 font-medium bg-gold-400/10 rounded-full px-3 py-1 mb-4 w-fit">
                  <Star size={12} fill="currentColor" /> Featured Charity
                </div>
                <h3 className="font-display text-3xl font-bold mb-3">{featured.name}</h3>
                <p className="text-zinc-400 leading-relaxed mb-6">{featured.description}</p>
                <div className="flex items-center gap-4">
                  <Link href="/charities" className="btn-primary text-sm">
                    Support this charity <Heart size={14} />
                  </Link>
                  <span className="text-sm text-zinc-500">+4 more charities to choose from</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,197,94,0.1)_0%,transparent_60%)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="page-title mb-6">
            Ready to play <span className="text-gradient-green">with purpose?</span>
          </h2>
          <p className="text-zinc-400 text-lg mb-10">
            Join the community where every score matters — for you, for your charity, and for the jackpot.
          </p>
          <Link href="/subscribe" className="btn-primary text-lg px-10 py-5 glow-green">
            Subscribe Now — From £9.99/mo <ArrowRight size={20} />
          </Link>
          <p className="text-zinc-600 text-sm mt-6">No hidden fees. Cancel any time. 10% always goes to your charity.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <span className="font-display font-bold text-zinc-400">FairwayHeart</span>
          <div className="flex gap-6">
            <Link href="/charities" className="hover:text-zinc-300 transition-colors">Charities</Link>
            <Link href="/auth/login" className="hover:text-zinc-300 transition-colors">Sign In</Link>
            <Link href="/subscribe" className="hover:text-zinc-300 transition-colors">Subscribe</Link>
          </div>
          <span>© {new Date().getFullYear()} FairwayHeart. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
