// app/auth/signup/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const pwChecks = [
    { label: "At least 8 characters", pass: form.password.length >= 8 },
    { label: "Contains a number", pass: /\d/.test(form.password) },
    { label: "Passwords match", pass: form.password === form.confirm && form.confirm.length > 0 },
  ];

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Passwords don't match");
    if (form.password.length < 8) return toast.error("Password too short");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success("Account created! Redirecting…");
      router.push("/subscribe");
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_30%,rgba(34,197,94,0.06)_0%,transparent_60%)]" />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="block text-center font-display text-2xl font-bold text-gradient-green mb-10">
          FairwayHeart
        </Link>
        <div className="card">
          <h1 className="font-display text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-zinc-500 text-sm mb-8">Start your journey — play, win, give.</p>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Full Name</label>
              <input type="text" required value={form.full_name} onChange={update("full_name")}
                className="input-field" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={update("email")}
                className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={form.password}
                  onChange={update("password")} className="input-field pr-12" placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Confirm Password</label>
              <input type={showPw ? "text" : "password"} required value={form.confirm}
                onChange={update("confirm")} className="input-field" placeholder="Re-enter password" />
            </div>

            {/* Password checks */}
            {form.password.length > 0 && (
              <div className="space-y-1.5">
                {pwChecks.map((c, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs transition-colors ${c.pass ? "text-brand-400" : "text-zinc-600"}`}>
                    <Check size={12} className={c.pass ? "opacity-100" : "opacity-30"} />
                    {c.label}
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={loading || !pwChecks.every(c => c.pass)}
              className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create Account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
