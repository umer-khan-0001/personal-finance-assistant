-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- TRANSACTIONS
-- Each row represents one financial transaction.
-- user_id maps to Clerk user IDs (string).
CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  date          DATE NOT NULL,
  amount        NUMERIC(12, 2) NOT NULL,      -- negative = debit, positive = credit/refund
  merchant      TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'Uncategorized',
  description   TEXT,
  source        TEXT DEFAULT 'csv',           -- 'csv' | 'receipt' | 'mock_bank' | 'manual'
  is_duplicate  BOOLEAN DEFAULT FALSE,
  raw_hash      TEXT,                         -- MD5 of (user_id+date+amount+merchant) for dedup
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(user_id, category);
CREATE INDEX idx_transactions_merchant ON transactions(user_id, merchant);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own transactions"
  ON transactions FOR ALL
  USING (user_id = auth.jwt() ->> 'sub');

-- MONTHLY SUMMARIES (pre-computed for scale)
-- Recomputed on transaction insert/update via Supabase function.
CREATE TABLE monthly_summaries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  year        INT NOT NULL,
  month       INT NOT NULL,               -- 1-12
  category    TEXT NOT NULL,
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tx_count    INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, year, month, category)
);

ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own summaries"
  ON monthly_summaries FOR ALL
  USING (user_id = auth.jwt() ->> 'sub');

-- BUDGETS
CREATE TABLE budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  category    TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL,
  period      TEXT NOT NULL DEFAULT 'monthly',  -- 'monthly' | 'weekly'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, period)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own budgets"
  ON budgets FOR ALL
  USING (user_id = auth.jwt() ->> 'sub');

-- USER MEMORY / PREFERENCES
-- Key-value store for assistant context (pay date, exclusion rules, etc.)
CREATE TABLE user_memory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{}',
  -- Example preferences shape:
  -- { "pay_day": 1, "exclude_from_food": ["rent"], "currency": "USD", "notes": "..." }
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own memory"
  ON user_memory FOR ALL
  USING (user_id = auth.jwt() ->> 'sub');

-- CONVERSATIONS
CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  title       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own conversations"
  ON conversations FOR ALL
  USING (user_id = auth.jwt() ->> 'sub');

-- MESSAGES (chat history)
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}',  -- { "intent": "...", "tools_used": [...], "image_url": "..." }
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own messages"
  ON messages FOR ALL
  USING (user_id = auth.jwt() ->> 'sub');

-- RECEIPTS
CREATE TABLE receipts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  image_url       TEXT NOT NULL,
  extracted_data  JSONB,        -- { merchant, date, total, line_items[], confidence }
  transaction_id  UUID REFERENCES transactions(id),
  status          TEXT DEFAULT 'pending',   -- 'pending' | 'processed' | 'failed'
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own receipts"
  ON receipts FOR ALL
  USING (user_id = auth.jwt() ->> 'sub');

-- DETECTED SUBSCRIPTIONS (cached detection results)
CREATE TABLE detected_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  merchant        TEXT NOT NULL,
  average_amount  NUMERIC(12, 2),
  frequency_days  INT,              -- approximate days between charges
  last_seen       DATE,
  first_seen      DATE,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, merchant)
);

ALTER TABLE detected_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own subscriptions"
  ON detected_subscriptions FOR ALL
  USING (user_id = auth.jwt() ->> 'sub');
