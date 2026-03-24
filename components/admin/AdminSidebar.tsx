// components/admin/AdminSidebar.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Trophy, Heart, Medal, BarChart3, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import type { Profile } from "@/types";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/draws", label: "Draw Management", icon: Trophy },
  { href: "/admin/charities", label: "Charities", icon: Heart },
  { href: "/admin/winners", label: "Winners", icon: Medal },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export default function AdminSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const Content = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/5">
        <div className="font-display text-xl font-bold text-gradient-green">FairwayHeart</div>
        <div className="text-xs text-red-400 mt-1 font-medium">Admin Console</div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(item => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive(item.href, item.exact)
                ? "bg-red-400/10 text-red-300 border border-red-400/20"
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}>
            <item.icon size={18} />{item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-500 hover:text-white mb-1">
          ← User Dashboard
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
      <button onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 glass rounded-xl flex items-center justify-center text-zinc-400">
        <Menu size={20} />
      </button>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 glass border-r border-white/5" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-zinc-500"><X size={20} /></button>
            <Content />
          </div>
        </div>
      )}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 glass border-r border-white/5 z-30">
        <Content />
      </aside>
    </>
  );
}
