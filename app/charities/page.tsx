// app/charities/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Heart, ExternalLink, Star, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function CharitiesPage() {
  const supabase = createClient();
  const { data: charities } = await (await supabase)
    .from("charities")
    .select("*, charity_events(*)")
    .eq("is_active", true)
    .order("is_featured", { ascending: false });

  return (
    <div className="min-h-screen bg-dark-900 py-20 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(34,197,94,0.05)_0%,transparent_60%)]" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm mb-10">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="mb-12">
          <p className="text-brand-400 text-sm font-medium tracking-widest uppercase mb-3">Our Partners</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Charities that <span className="text-gradient-green">matter</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl">
            Every subscription automatically contributes to your chosen charity.
            Browse our partners below and choose who your golf supports.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {(charities ?? []).map((charity) => (
            <div key={charity.id} className={`card group overflow-hidden transition-all duration-300 hover:border-brand-500/30 ${charity.is_featured ? "border-gold-500/30" : ""}`}>
              {charity.is_featured && (
                <div className="flex items-center gap-1.5 text-xs text-gold-400 font-medium mb-4">
                  <Star size={12} fill="currentColor" /> Featured Charity
                </div>
              )}

              {charity.image_url && (
                <div className="w-full h-44 rounded-xl overflow-hidden mb-5 bg-dark-700">
                  <img src={charity.image_url} alt={charity.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                </div>
              )}

              <h3 className="font-display text-xl font-bold mb-2">{charity.name}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">{charity.description}</p>

              {charity.total_raised > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <Heart size={14} className="text-brand-400" />
                  <span className="text-sm text-zinc-400">
                    <span className="text-brand-300 font-semibold">{formatCurrency(charity.total_raised)}</span> raised through the platform
                  </span>
                </div>
              )}

              {/* Upcoming events */}
              {charity.charity_events?.length > 0 && (
                <div className="border-t border-white/5 pt-4 mb-4">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-2">Upcoming Events</p>
                  <div className="space-y-1.5">
                    {charity.charity_events.slice(0, 2).map((ev: { id: string; title: string; event_date: string; location: string | null }) => (
                      <div key={ev.id} className="flex items-center gap-2 text-sm">
                        <span className="text-brand-400 font-mono text-xs">
                          {new Date(ev.event_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                        <span className="text-zinc-300">{ev.title}</span>
                        {ev.location && <span className="text-zinc-600 text-xs">· {ev.location}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Link href="/subscribe" className="btn-primary text-sm py-2 px-4">
                  Support this <Heart size={13} />
                </Link>
                {charity.website_url && (
                  <a href={charity.website_url} target="_blank" rel="noopener noreferrer"
                    className="btn-ghost text-sm py-2 px-3">
                    Visit <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
