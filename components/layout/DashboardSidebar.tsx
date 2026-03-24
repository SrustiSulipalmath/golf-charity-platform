// components/layout/DashboardSidebar.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Target, Heart, Trophy, Medal, LogOut, Settings, X, Menu } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import type { Profile } from "@/types";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/scores", label: "My Scores", icon: Target },
  { href: "/dashboard/charity", label: "My Charity", icon: Heart },
  { href: "/dashboard/draws", label: "Draw Results", icon: Trophy },
  { href: "/dashboard/winnings", label: "My Winnings", icon: Medal },
];

export default function DashboardSidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/5">
        <Link href="/" className="font-display text-xl font-bold text-gradient-green">
          FairwayHeart
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-semibold text-sm">
            {getInitials(profile?.full_name)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{profile?.full_name ?? "Member"}</div>
            <div className="text-xs text-zinc-500 truncate">{profile?.email}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(item => (
          <Link key={item.href} href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive(item.href, item.exact)
                ? "bg-brand-500/15 text-brand-300 border border-brand-500/25"
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}>
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <Link href="/dashboard/settings" onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
          <Settings size={18} /> Settings
        </Link>
        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-red-400 hover:bg-red-400/5 transition-all">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 glass rounded-xl flex items-center justify-center text-zinc-400">
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 glass border-r border-white/5"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X size={20} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 glass border-r border-white/5 z-30">
        <SidebarContent />
      </aside>
    </>
  );
}
