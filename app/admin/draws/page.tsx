// app/admin/draws/page.tsx
import { createClient } from "@/lib/supabase/server";
import DrawManager from "@/components/admin/DrawManager";

export default async function AdminDrawsPage() {
  const supabase = await createClient();
  const [{ data: draws }, { count: activeSubscribers }] = await Promise.all([
    supabase.from("draws").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  return <DrawManager draws={draws ?? []} activeSubscribers={activeSubscribers ?? 0} />;
}
