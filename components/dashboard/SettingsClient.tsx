// components/dashboard/SettingsClient.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, CreditCard, Shield, Loader2, Save, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import type { Profile, Subscription } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface Props {
  profile: Profile | null;
  subscription: (Subscription & { charities?: { name: string } | null }) | null;
}

export default function SettingsClient({ profile, subscription }: Props) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });

  async function saveProfile() {
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile!.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated!");
    setSavingProfile(false);
  }

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) return toast.error("Passwords don't match");
    if (pwForm.next.length < 8) return toast.error("Password must be at least 8 characters");
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated!");
      setPwForm({ current: "", next: "", confirm: "" });
    }
    setChangingPw(false);
  }

  async function openBillingPortal() {
    setOpeningPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? "Could not open billing portal");
    } catch {
      toast.error("Failed to connect to billing");
    }
    setOpeningPortal(false);
  }

  const isActive = subscription?.status === "active";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1">Settings</h1>
        <p className="text-zinc-500 text-sm">Manage your account, subscription, and security</p>
      </div>

      {/* Profile */}
      <div className="card space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><User size={16} className="text-brand-400" /> Profile</h3>
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Full Name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Email</label>
          <input value={profile?.email ?? ""} disabled className="input-field opacity-50 cursor-not-allowed" />
          <p className="text-xs text-zinc-600 mt-1">Email cannot be changed here</p>
        </div>
        <button onClick={saveProfile} disabled={savingProfile} className="btn-primary text-sm py-2.5">
          {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Save Profile</>}
        </button>
      </div>

      {/* Subscription */}
      <div className="card space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><CreditCard size={16} className="text-brand-400" /> Subscription</h3>
        {subscription ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/3 rounded-xl p-3">
                <div className="text-xs text-zinc-500 mb-1">Plan</div>
                <div className="font-semibold capitalize">{subscription.plan}</div>
              </div>
              <div className="bg-white/3 rounded-xl p-3">
                <div className="text-xs text-zinc-500 mb-1">Status</div>
                <div className={`font-semibold ${isActive ? "text-green-400" : "text-orange-400"}`}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </div>
              </div>
              <div className="bg-white/3 rounded-xl p-3">
                <div className="text-xs text-zinc-500 mb-1">Amount</div>
                <div className="font-semibold">{formatCurrency(subscription.amount_pence / 100)}/{subscription.plan === "monthly" ? "mo" : "yr"}</div>
              </div>
              <div className="bg-white/3 rounded-xl p-3">
                <div className="text-xs text-zinc-500 mb-1">Renews</div>
                <div className="font-semibold text-sm">
                  {subscription.current_period_end ? formatDate(subscription.current_period_end) : "—"}
                </div>
              </div>
            </div>
            {subscription.charities && (
              <div className="bg-white/3 rounded-xl p-3">
                <div className="text-xs text-zinc-500 mb-1">Charity</div>
                <div className="font-semibold">{subscription.charities.name}</div>
                <div className="text-xs text-zinc-500">{subscription.charity_percentage}% of subscription</div>
              </div>
            )}
            {subscription.cancel_at_period_end && (
              <div className="p-3 rounded-xl bg-orange-400/10 border border-orange-400/20 text-sm text-orange-300">
                Subscription cancels at end of current period: {subscription.current_period_end ? formatDate(subscription.current_period_end) : "—"}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={openBillingPortal} disabled={openingPortal}
                className="btn-outline text-sm py-2.5">
                {openingPortal ? <Loader2 size={14} className="animate-spin" /> : <><ExternalLink size={14} /> Manage Billing</>}
              </button>
              <Link href="/dashboard/charity" className="btn-ghost text-sm py-2.5">Change Charity</Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm mb-4">No active subscription</p>
            <Link href="/subscribe" className="btn-primary text-sm">Subscribe Now</Link>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="card space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Shield size={16} className="text-brand-400" /> Security</h3>
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">New Password</label>
          <input type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
            className="input-field" placeholder="Min. 8 characters" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Confirm New Password</label>
          <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
            className="input-field" placeholder="Re-enter new password" />
        </div>
        <button onClick={changePassword} disabled={changingPw || !pwForm.next || !pwForm.confirm}
          className="btn-outline text-sm py-2.5 disabled:opacity-50">
          {changingPw ? <Loader2 size={14} className="animate-spin" /> : <><Shield size={14} /> Update Password</>}
        </button>
      </div>
    </div>
  );
}
