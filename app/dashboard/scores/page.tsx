// app/dashboard/scores/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ScoreManager from "@/components/dashboard/ScoreManager";

export default async function ScoresPage() {
  const supabase =await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: scores }, { data: subscription }] = await Promise.all([
    supabase.from("golf_scores").select("*").eq("user_id", user.id).order("played_on", { ascending: false }),
    supabase.from("subscriptions").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const isActive = subscription?.status === "active";
  return <ScoreManager initialScores={scores ?? []} isSubscribed={isActive} userId={user.id} />;
}
