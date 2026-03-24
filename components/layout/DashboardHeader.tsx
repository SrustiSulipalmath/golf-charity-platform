// components/layout/DashboardHeader.tsx
import { Bell, CreditCard } from "lucide-react";
import Link from "next/link";
import type { Profile, Subscription } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  active:   "text-green-400 bg-green-400/10 border-green-400/20",
  inactive: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  cancelled:"text-red-400 bg-red-400/10 border-red-400/20",
  lapsed:   "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

export default function DashboardHeader({
  profile, subscription,
}: {
  profile: Profile | null;
  subscription: (Subscription & { charities?: { name: string } | null }) | null;
}) {
  const status = subscription?.status ?? "inactive";
  const isActive = status === "active";

  return (
    <header className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="lg:ml-0 ml-12">
        <h2 className="text-sm text-zinc-500">
          Welcome back, <span className="text-white font-medium">{profile?.full_name?.split(" ")[0] ?? "Member"}</span>
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Subscription badge */}
        <div className={cn("badge border", STATUS_STYLES[status] ?? STATUS_STYLES.inactive)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-green-400" : "bg-zinc-500")} />
          {subscription?.plan ? `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan` : "No Subscription"}
        </div>

        {!isActive && (
          <Link href="/subscribe" className="btn-primary text-xs py-1.5 px-3">
            <CreditCard size={13} /> Subscribe
          </Link>
        )}

        <button className="w-9 h-9 glass-light rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors relative">
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}
