-- ============================================================
-- Golf Charity Subscription Platform — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email           TEXT NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber','admin')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id               UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  plan                  TEXT NOT NULL CHECK (plan IN ('monthly','yearly')),
  status                TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive','cancelled','lapsed','trialing')),
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN DEFAULT FALSE,
  amount_pence          INTEGER NOT NULL DEFAULT 0,
  charity_percentage    INTEGER NOT NULL DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 90),
  selected_charity_id   UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on subscriptions" ON subscriptions
  USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- CHARITIES
-- ============================================================
CREATE TABLE charities (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  long_description TEXT,
  image_url     TEXT,
  website_url   TEXT,
  is_featured   BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  total_raised  NUMERIC(12,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE charities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active charities" ON charities
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage charities" ON charities
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add foreign key for subscription → charity
ALTER TABLE subscriptions
  ADD CONSTRAINT fk_subscription_charity
  FOREIGN KEY (selected_charity_id) REFERENCES charities(id);

-- ============================================================
-- CHARITY EVENTS
-- ============================================================
CREATE TABLE charity_events (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  charity_id  UUID REFERENCES charities(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  event_date  DATE NOT NULL,
  location    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE charity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read charity events" ON charity_events FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage charity events" ON charity_events
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- GOLF SCORES
-- ============================================================
CREATE TABLE golf_scores (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score       INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_on   DATE NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE golf_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scores" ON golf_scores
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all scores" ON golf_scores
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- DRAWS
-- ============================================================
CREATE TABLE draws (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  month           INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year            INTEGER NOT NULL,
  draw_type       TEXT NOT NULL DEFAULT 'random' CHECK (draw_type IN ('random','algorithmic')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','simulated','published')),
  winning_numbers INTEGER[] NOT NULL DEFAULT '{}',
  jackpot_pool    NUMERIC(12,2) DEFAULT 0,
  four_match_pool NUMERIC(12,2) DEFAULT 0,
  three_match_pool NUMERIC(12,2) DEFAULT 0,
  jackpot_rolled_over BOOLEAN DEFAULT FALSE,
  rollover_amount  NUMERIC(12,2) DEFAULT 0,
  total_subscribers INTEGER DEFAULT 0,
  simulation_result JSONB,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year)
);

ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published draws" ON draws
  FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage draws" ON draws
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- DRAW ENTRIES (which users participated in which draw)
-- ============================================================
CREATE TABLE draw_entries (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_id     UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scores_used INTEGER[] NOT NULL,
  match_count INTEGER DEFAULT 0,
  prize_tier  TEXT CHECK (prize_tier IN ('five_match','four_match','three_match')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own draw entries" ON draw_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage draw entries" ON draw_entries
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- WINNERS
-- ============================================================
CREATE TABLE winners (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_id         UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
  draw_entry_id   UUID REFERENCES draw_entries(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prize_tier      TEXT NOT NULL CHECK (prize_tier IN ('five_match','four_match','three_match')),
  prize_amount    NUMERIC(12,2) NOT NULL,
  match_count     INTEGER NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
  proof_url       TEXT,
  proof_uploaded_at TIMESTAMPTZ,
  admin_notes     TEXT,
  payment_status  TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid')),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own winnings" ON winners
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload proof" ON winners
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage winners" ON winners
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- CHARITY DONATIONS (direct donations not tied to gameplay)
-- ============================================================
CREATE TABLE charity_donations (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  charity_id    UUID REFERENCES charities(id) ON DELETE CASCADE NOT NULL,
  amount_pence  INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE charity_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own donations" ON charity_donations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage donations" ON charity_donations
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: Keep only 5 latest scores per user
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_score_limit()
RETURNS TRIGGER AS $$
DECLARE
  score_count INTEGER;
  oldest_score_id UUID;
BEGIN
  SELECT COUNT(*) INTO score_count
  FROM golf_scores WHERE user_id = NEW.user_id;

  IF score_count > 5 THEN
    SELECT id INTO oldest_score_id
    FROM golf_scores
    WHERE user_id = NEW.user_id
    ORDER BY played_on ASC, created_at ASC
    LIMIT 1;

    DELETE FROM golf_scores WHERE id = oldest_score_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_score_limit
  AFTER INSERT ON golf_scores
  FOR EACH ROW EXECUTE FUNCTION enforce_score_limit();

-- ============================================================
-- TRIGGER: Updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_golf_scores_updated_at BEFORE UPDATE ON golf_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_draws_updated_at BEFORE UPDATE ON draws FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_winners_updated_at BEFORE UPDATE ON winners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_charities_updated_at BEFORE UPDATE ON charities FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED: Sample charities
-- ============================================================
INSERT INTO charities (name, description, long_description, image_url, is_featured, is_active) VALUES
('Golf for Good', 'Using golf to transform lives in underserved communities', 'Golf for Good believes every child deserves the opportunity to experience the game of golf — and the life lessons it teaches. We run free clinics, provide equipment, and connect young people with mentors through the sport.', 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800', TRUE, TRUE),
('The Par 3 Foundation', 'Mental health awareness through sport and community', 'Par 3 brings people together through golf to tackle isolation, anxiety, and depression. Our open days, peer support groups, and ambassador programme have supported over 10,000 individuals since 2018.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800', FALSE, TRUE),
('Birdie & Beyond', 'Funding cancer research through charity golf events', 'Every round played on our platform contributes directly to cancer research breakthroughs. Birdie & Beyond has raised £4.2M since inception, funding 23 active research projects across the UK and Ireland.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800', FALSE, TRUE),
('Veterans on the Fairway', 'Supporting armed forces veterans through inclusive golf programmes', 'Golf is a powerful rehabilitative sport for veterans dealing with PTSD, physical injuries, and the challenges of civilian life. We provide free membership, coaching, and community for those who have served.', 'https://images.unsplash.com/photo-1562790351-d273a961e0e9?w=800', FALSE, TRUE),
('GreenHeart Trust', 'Environmental conservation through sustainable golf initiatives', 'Working with golf courses to restore natural habitats, reduce chemical use, and create biodiversity corridors. Over 500 courses now partner with GreenHeart to protect our natural landscapes.', 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=800', FALSE, TRUE);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_golf_scores_user_id ON golf_scores(user_id);
CREATE INDEX idx_golf_scores_played_on ON golf_scores(played_on DESC);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_draw_entries_draw_id ON draw_entries(draw_id);
CREATE INDEX idx_draw_entries_user_id ON draw_entries(user_id);
CREATE INDEX idx_winners_user_id ON winners(user_id);
CREATE INDEX idx_winners_draw_id ON winners(draw_id);
CREATE INDEX idx_winners_payment_status ON winners(payment_status);
