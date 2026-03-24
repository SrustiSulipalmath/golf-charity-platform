// app/dashboard/charity/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CharitySelector from "@/components/dashboard/CharitySelector";

export default async function CharityPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: charities }, { data: subscription }] = await Promise.all([
    supabase.from("charities").select("*").eq("is_active", true).order("is_featured", { ascending: false }),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return (
    <CharitySelector
      charities={charities ?? []}
      subscription={subscription}
      userId={user.id}
    />
  );
}
