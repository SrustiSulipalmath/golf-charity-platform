// app/admin/charities/page.tsx
import { createClient } from "@/lib/supabase/server";
import CharityManager from "@/components/admin/CharityManager";

export default async function AdminCharitiesPage() {
  const supabase = await createClient();
  const { data: charities } = await supabase
    .from("charities")
    .select("*, charity_events(*)")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  return <CharityManager charities={charities ?? []} />;
}
