# ⛳ FairwayHeart — Golf Charity Subscription Platform

A full-stack subscription platform combining golf performance tracking, charity fundraising, and a monthly draw-based reward engine. Built with **Next.js 14**, **Supabase**, **Stripe**, and **Tailwind CSS**.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth (JWT-based) |
| Payments | Stripe (Subscriptions + Webhooks) |
| Deployment | Vercel |
| Charts | Recharts |
| Notifications | react-hot-toast |

---

## 🚀 Setup Guide

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd golf-charity-platform
npm install
```

### 2. Create a new Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **Anon Key** from Settings → API
3. Also copy the **Service Role Key** (keep this secret!)
4. Run the full schema from `supabase-schema.sql` in the SQL Editor

### 3. Create a new Stripe account/project

1. Go to [stripe.com](https://stripe.com) → Dashboard
2. Create two products:
   - **Monthly Plan** — £9.99/month recurring → copy the Price ID
   - **Yearly Plan** — £89.99/year recurring → copy the Price ID
3. Set up webhook endpoint: `https://your-app.vercel.app/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
4. Copy the **Webhook Signing Secret**

### 4. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Create Storage Bucket in Supabase

In Supabase Dashboard → Storage:
1. Create a new bucket called `winner-proofs`
2. Set it to **Public** (so uploaded proofs can be viewed)
3. Add this RLS policy for uploads:
```sql
CREATE POLICY "Users can upload own proofs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'winner-proofs' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );
```

### 6. Create Admin User

After signing up normally, run this in Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

### 7. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📦 Deploy to Vercel

1. Push to GitHub
2. Import to [Vercel](https://vercel.com) → New Project
3. Add all environment variables from `.env.local`
4. Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
5. Update Stripe webhook URL to your Vercel domain
6. Deploy!

---

## 📁 Project Structure

```
golf-charity-platform/
├── app/
│   ├── page.tsx                    # Public homepage
│   ├── auth/
│   │   ├── login/page.tsx          # Login page
│   │   ├── signup/page.tsx         # Signup page
│   │   └── callback/route.ts       # Auth callback
│   ├── subscribe/
│   │   ├── page.tsx                # Plan selection
│   │   └── success/page.tsx        # Post-payment
│   ├── charities/page.tsx          # Public charity listing
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard shell
│   │   ├── page.tsx                # Overview
│   │   ├── scores/page.tsx         # Score management
│   │   ├── charity/page.tsx        # Charity selection
│   │   ├── draws/page.tsx          # Draw results
│   │   ├── winnings/page.tsx       # Prize tracking
│   │   └── settings/page.tsx       # Account settings
│   ├── admin/
│   │   ├── layout.tsx              # Admin shell
│   │   ├── page.tsx                # Admin overview
│   │   ├── users/page.tsx          # User management
│   │   ├── draws/page.tsx          # Draw management
│   │   ├── charities/page.tsx      # Charity management
│   │   ├── winners/page.tsx        # Winner verification
│   │   └── reports/page.tsx        # Analytics
│   └── api/
│       └── stripe/
│           ├── checkout/route.ts   # Create checkout session
│           ├── webhook/route.ts    # Stripe webhook handler
│           └── portal/route.ts     # Billing portal
├── components/
│   ├── layout/
│   │   ├── DashboardSidebar.tsx
│   │   └── DashboardHeader.tsx
│   ├── dashboard/
│   │   ├── ScoreManager.tsx        # Score CRUD
│   │   ├── CharitySelector.tsx     # Charity + % picker
│   │   ├── WinningsManager.tsx     # Winnings + proof upload
│   │   └── SettingsClient.tsx      # Profile + billing
│   └── admin/
│       ├── AdminSidebar.tsx
│       ├── DrawManager.tsx         # Draw create/simulate/publish
│       ├── CharityManager.tsx      # Charity CRUD
│       ├── AdminWinnersManager.tsx # Verification + payouts
│       └── ReportsClient.tsx       # Charts & analytics
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   └── server.ts               # Server client + admin client
│   ├── stripe.ts                   # Stripe config + prize calc
│   ├── draw-engine.ts              # Draw algorithm (random + weighted)
│   └── utils.ts                    # Formatting helpers
├── types/index.ts                  # TypeScript types
├── middleware.ts                   # Auth + role protection
└── supabase-schema.sql             # Full DB schema
```

---

## 🎮 Key Features

### Score System
- Enter up to 5 Stableford scores (1–45)
- Rolling window — oldest auto-removed when 6th is added (DB trigger)
- Edit/delete individual scores

### Draw Engine (`lib/draw-engine.ts`)
- **Random mode** — standard lottery-style draw
- **Algorithmic mode** — weighted by most frequent user scores
- **Admin simulation** — test run before publishing
- **Three prize tiers**: 5-match (jackpot), 4-match, 3-match
- **Jackpot rollover** — accumulates if no 5-match winner

### Prize Pool Logic
Each subscription contributes to the prize pool:
- 40% → Jackpot (5-match)
- 35% → 4-Number Match
- 25% → 3-Number Match
- Prizes split equally among winners in same tier

### Charity System
- Select charity at signup
- Minimum 10% contribution, adjustable up to 90%
- Independent donation option

### Winner Verification
1. Draw published → winner records created
2. Winner uploads screenshot proof
3. Admin reviews → Approve or Reject
4. If approved → Mark as Paid

---

## 🧪 Test Checklist

- [ ] User signup & login
- [ ] Subscribe (monthly and yearly)
- [ ] Score entry — 5-score rolling logic
- [ ] Score validation (1–45 range)
- [ ] Draw simulation & publish
- [ ] Charity selection & contribution %
- [ ] Winner proof upload
- [ ] Admin: verify and approve winners
- [ ] Admin: mark as paid
- [ ] Admin: charity CRUD
- [ ] Reports & analytics
- [ ] Mobile responsive
- [ ] Error handling (invalid inputs, failed payments)

---

## 🔑 Test Credentials

After setup, create:
- **Subscriber**: Sign up via `/auth/signup`
- **Admin**: Sign up then run SQL to set role = 'admin'

Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

---

Built for the Digital Heroes Full-Stack Development Trainee Selection Process.
