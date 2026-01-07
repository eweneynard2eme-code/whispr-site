-- Create entitlements table for subscription status
CREATE TABLE IF NOT EXISTS entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  has_plus boolean DEFAULT false,
  plus_status text DEFAULT 'none' CHECK (plus_status IN ('active', 'past_due', 'canceled', 'none')),
  plus_current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unlocks table for one-time purchases
CREATE TABLE IF NOT EXISTS unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('moment', 'media')),
  character_id text NOT NULL,
  situation_id text,
  moment_level text CHECK (moment_level IN ('private', 'intimate', 'exclusive')),
  media_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, type, character_id, situation_id, moment_level),
  UNIQUE (user_id, type, character_id, media_id)
);

-- Create payments table for tracking all transactions
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  stripe_event_id text UNIQUE,
  type text NOT NULL CHECK (type IN ('moment', 'media', 'plus')),
  moment_level text CHECK (moment_level IN ('private', 'intimate', 'exclusive')),
  character_id text,
  situation_id text,
  media_id text,
  amount integer,
  currency text DEFAULT 'usd',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entitlements
CREATE POLICY "entitlements_select_own" ON entitlements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "entitlements_insert_own" ON entitlements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "entitlements_update_own" ON entitlements
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for unlocks
CREATE POLICY "unlocks_select_own" ON unlocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "unlocks_insert_own" ON unlocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for payments (users can only see their own)
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_stripe_customer ON entitlements(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_unlocks_user_id ON unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_unlocks_lookup ON unlocks(user_id, type, character_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_event ON payments(stripe_event_id);

-- Create trigger to auto-create entitlements row for new users
CREATE OR REPLACE FUNCTION create_entitlements_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.entitlements (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_entitlements ON auth.users;
CREATE TRIGGER on_auth_user_created_entitlements
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_entitlements_for_new_user();
