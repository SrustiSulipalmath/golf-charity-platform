// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { Profile } from "@/types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <AdminSidebar profile={profile as Profile} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="lg:ml-0 ml-12">
            <span className="badge bg-red-400/10 text-red-300 border border-red-400/20">Admin Panel</span>
          </div>
          <span className="text-sm text-zinc-500">{profile?.full_name}</span>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
