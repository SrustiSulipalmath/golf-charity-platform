// lib/stripe.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
  typescript: true,
});

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    amount: 999,   // £9.99/month in pence
    label: "Monthly",
    interval: "month" as const,
  },
  yearly: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID!,
    amount: 8999,  // £89.99/year in pence (25% off)
    label: "Yearly",
    interval: "year" as const,
  },
};

// Prize pool distribution from subscriptions (after charity %)
// Subscription: £9.99/month
// Default charity %: 10% = ~£1.00 → charity
// Remaining: ~£8.99 → prize pool allocation
// Prize pool: 40% jackpot | 35% four-match | 25% three-match

export function calculatePrizePools(
  activeSubscribers: number,
  avgSubscriptionPence: number = 999,
  charityPct: number = 10,
  rolloverAmount: number = 0
): { jackpot: number; fourMatch: number; threeMatch: number; charityTotal: number } {
  const totalRevenue = activeSubscribers * avgSubscriptionPence;
  const charityTotal = Math.floor((totalRevenue * charityPct) / 100);
  const prizePool = totalRevenue - charityTotal;

  return {
    jackpot:    Math.floor(prizePool * 0.40) / 100 + rolloverAmount,
    fourMatch:  Math.floor(prizePool * 0.35) / 100,
    threeMatch: Math.floor(prizePool * 0.25) / 100,
    charityTotal: charityTotal / 100,
  };
}
