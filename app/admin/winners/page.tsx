// app/admin/winners/page.tsx
import { createClient } from "@/lib/supabase/server";
import AdminWinnersManager from "@/components/admin/AdminWinnersManager";

export default async function AdminWinnersPage() {
  const supabase = await createClient();
  const { data: winners } = await supabase
    .from("winners")
    .select("*, profiles(full_name, email), draws(month, year, winning_numbers)")
    .order("created_at", { ascending: false });

  return <AdminWinnersManager winners={winners ?? []} />;
}
