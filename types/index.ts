// types/index.ts — Shared TypeScript types for the platform

export type UserRole = "subscriber" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type SubscriptionPlan = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "lapsed" | "trialing";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  amount_pence: number;
  charity_percentage: number;
  selected_charity_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Charity {
  id: string;
  name: string;
  description: string | null;
  long_description: string | null;
  image_url: string | null;
  website_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  total_raised: number;
  created_at: string;
  updated_at: string;
}

export interface CharityEvent {
  id: string;
  charity_id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  created_at: string;
}

export interface GolfScore {
  id: string;
  user_id: string;
  score: number;
  played_on: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type DrawType = "random" | "algorithmic";
export type DrawStatus = "pending" | "simulated" | "published";

export interface Draw {
  id: string;
  month: number;
  year: number;
  draw_type: DrawType;
  status: DrawStatus;
  winning_numbers: number[];
  jackpot_pool: number;
  four_match_pool: number;
  three_match_pool: number;
  jackpot_rolled_over: boolean;
  rollover_amount: number;
  total_subscribers: number;
  simulation_result: SimulationResult | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SimulationResult {
  five_match_winners: number;
  four_match_winners: number;
  three_match_winners: number;
  total_prize_distributed: number;
  jackpot_rolls_over: boolean;
}

export type PrizeTier = "five_match" | "four_match" | "three_match";

export interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  scores_used: number[];
  match_count: number;
  prize_tier: PrizeTier | null;
  created_at: string;
}

export type VerificationStatus = "pending" | "approved" | "rejected";
export type PaymentStatus = "pending" | "paid";

export interface Winner {
  id: string;
  draw_id: string;
  draw_entry_id: string;
  user_id: string;
  prize_tier: PrizeTier;
  prize_amount: number;
  match_count: number;
  verification_status: VerificationStatus;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  admin_notes: string | null;
  payment_status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  profiles?: Profile;
  draws?: Draw;
}

export interface CharityDonation {
  id: string;
  user_id: string | null;
  charity_id: string;
  amount_pence: number;
  stripe_payment_intent_id: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

// ─── API Response Wrappers ───────────────────────────────────
export interface ApiSuccess<T> {
  data: T;
  error: null;
}
export interface ApiError {
  data: null;
  error: string;
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Dashboard Stats ─────────────────────────────────────────
export interface DashboardStats {
  totalUsers: number;
  activeSubscribers: number;
  totalPrizePool: number;
  totalCharityRaised: number;
  drawsCompleted: number;
}
