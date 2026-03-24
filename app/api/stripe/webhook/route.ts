// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ✅ Add await here - createAdminClient is now async
  const supabase = await createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan as "monthly" | "yearly";
        if (!userId || !plan) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const planConfig = PLANS[plan];

        await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          plan,
          status: "active",
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          amount_pence: planConfig.amount,
          charity_percentage: 10,
          cancel_at_period_end: false,
        }, { onConflict: "user_id" });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        const statusMap: Record<string, string> = {
          active: "active",
          canceled: "cancelled",
          past_due: "lapsed",
          unpaid: "lapsed",
          trialing: "trialing",
          incomplete: "inactive",
          incomplete_expired: "inactive",
          paused: "inactive",
        };

        await supabase.from("subscriptions").update({
          status: statusMap[sub.status] ?? "inactive",
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        }).eq("stripe_subscription_id", sub.id);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase.from("subscriptions").update({ status: "cancelled" })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (subId) {
          await supabase.from("subscriptions").update({ status: "lapsed" })
            .eq("stripe_subscription_id", subId);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Required for Stripe webhooks — disable body parsing
export const config = { api: { bodyParser: false } };