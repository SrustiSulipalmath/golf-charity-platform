// app/dashboard/winnings/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WinningsManager from "@/components/dashboard/WinningsManager";

export default async function WinningsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: winners } = await supabase
    .from("winners")
    .select("*, draws(month, year, winning_numbers)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <WinningsManager winners={winners ?? []} userId={user.id} />;
}
