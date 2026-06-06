# GitHub Copilot — Full Project Scaffolding Prompt
# Personal Finance Assistant (Revonix Take-Home Assessment)
# Paste this entire file into GitHub Copilot Chat (workspace mode) in an empty directory.

---

## INSTRUCTION TO COPILOT

You are scaffolding a complete, production-quality **Personal Finance Assistant** full-stack web application from scratch in this empty directory. Follow every section of this spec in order. Generate ALL files listed. Do not skip, stub without annotation, or leave `TODO` comments unless the section explicitly says to stub something. After generating each file, confirm with a one-line summary of what was created.

---

## 1. TECH STACK (EXACT)

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Full-stack, API routes, SSR, edge-ready |
| Language | **TypeScript (strict)** | Type safety across the whole app |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, consistent, accessible UI |
| Auth | **Clerk** | Managed multi-user auth, free tier, one-line setup |
| Database | **Supabase** (PostgreSQL + pgvector + Storage + RLS) | Managed DB, vector search, file storage, row-level security for multi-user isolation |
| ORM | **Supabase JS Client v2** | Direct, typed queries; no extra abstraction layer needed |
| AI — Primary Agent | **OpenAI GPT-4o** | Tool calling, vision (receipts), complex reasoning |
| AI — Fast/Cheap | **OpenAI GPT-4o-mini** | Query classification, simple answers, cost control |
| Web Search | **Tavily API** | Merchant lookup, unfamiliar charge research |
| Charts | **Recharts** | Spending visualizations |
| Form validation | **React Hook Form + Zod** | Type-safe forms |
| CSV parsing | **PapaParse** | Client-side CSV upload parsing |
| Date handling | **date-fns** | Lightweight date utilities |
| Notifications | **Sonner** (toast) | Clean toast notifications |

---

## 2. PROJECT STRUCTURE

Generate exactly this folder and file tree. Create every file listed:

```
finance-assistant/
├── .env.local.example          # All env vars documented (no real values)
├── .gitignore
├── README.md                   # Full design note (see Section 10)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── components.json             # shadcn/ui config
│
├── supabase/
│   └── schema.sql              # Full DB schema (see Section 4)
│
├── scripts/
│   └── seed-sample-data.ts     # Generate and upload sample transactions
│
├── src/
│   ├── middleware.ts            # Clerk auth middleware (protect all /app routes)
│   │
│   ├── app/
│   │   ├── layout.tsx           # Root layout with ClerkProvider
│   │   ├── page.tsx             # Landing/marketing page
│   │   ├── globals.css
│   │   │
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   │
│   │   └── app/                 # Authenticated app shell
│   │       ├── layout.tsx       # App shell: sidebar + header
│   │       ├── page.tsx         # Dashboard (spending overview)
│   │       │
│   │       ├── chat/
│   │       │   └── page.tsx     # Conversational assistant UI
│   │       │
│   │       ├── transactions/
│   │       │   └── page.tsx     # Transaction list + CSV upload
│   │       │
│   │       ├── budgets/
│   │       │   └── page.tsx     # Budget management
│   │       │
│   │       └── settings/
│   │           └── page.tsx     # User preferences + memory
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (Button, Card, etc.)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── dashboard/
│   │   │   ├── SpendingOverview.tsx   # Summary cards (this month, last month, etc.)
│   │   │   ├── CategoryChart.tsx      # Pie/donut chart by category
│   │   │   ├── SpendingTrend.tsx      # Line chart (monthly spend over time)
│   │   │   ├── RecentTransactions.tsx
│   │   │   ├── BudgetProgress.tsx     # Budget bars
│   │   │   ├── SubscriptionAlert.tsx  # Detected recurring charges
│   │   │   └── AnomalyAlert.tsx       # Flagged unusual transactions
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx         # Full chat UI wrapper
│   │   │   ├── MessageList.tsx        # Scrollable message history
│   │   │   ├── MessageBubble.tsx      # Individual message (user/assistant)
│   │   │   ├── ChatInput.tsx          # Text input + image upload button
│   │   │   └── TypingIndicator.tsx
│   │   ├── transactions/
│   │   │   ├── TransactionTable.tsx
│   │   │   ├── TransactionFilters.tsx
│   │   │   └── CsvUploader.tsx        # Drag-drop CSV upload with PapaParse
│   │   └── budgets/
│   │       ├── BudgetCard.tsx
│   │       └── BudgetForm.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser Supabase client
│   │   │   └── server.ts        # Server-side Supabase client (with Clerk JWT)
│   │   ├── ai/
│   │   │   ├── agent.ts         # Main AI agent orchestrator
│   │   │   ├── router.ts        # Query classifier / intent router
│   │   │   ├── tools.ts         # All tool definitions + implementations
│   │   │   ├── prompts.ts       # All system prompts
│   │   │   └── vision.ts        # Receipt OCR using GPT-4o vision
│   │   ├── finance/
│   │   │   ├── queries.ts       # All Supabase DB query functions
│   │   │   ├── aggregations.ts  # Spending aggregation helpers
│   │   │   ├── anomaly.ts       # Anomaly detection logic
│   │   │   ├── subscriptions.ts # Recurring charge detection
│   │   │   └── csv-parser.ts    # CSV normalization + dedup logic
│   │   └── utils.ts             # General utilities + cn()
│   │
│   ├── app/api/
│   │   ├── chat/
│   │   │   └── route.ts         # POST /api/chat — main AI endpoint (streaming)
│   │   ├── transactions/
│   │   │   ├── route.ts         # GET (list) + POST (create single)
│   │   │   └── upload/
│   │   │       └── route.ts     # POST /api/transactions/upload — CSV bulk import
│   │   ├── budgets/
│   │   │   └── route.ts         # GET + POST + PATCH + DELETE
│   │   ├── memory/
│   │   │   └── route.ts         # GET + PATCH user memory/preferences
│   │   ├── dashboard/
│   │   │   └── route.ts         # GET aggregated dashboard stats
│   │   └── receipts/
│   │       └── route.ts         # POST receipt image → extract + store transaction
│   │
│   └── types/
│       └── index.ts             # All shared TypeScript types/interfaces
```

---

## 3. ENVIRONMENT VARIABLES

Create `.env.local.example` with these keys (values as placeholders):

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# Tavily (web search for merchant lookup)
TAVILY_API_KEY=tvly-...
```

---

## 4. DATABASE SCHEMA (`supabase/schema.sql`)

Generate the complete SQL file for Supabase. Include Row Level Security policies on every table:

```sql
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
```

---

## 5. TYPESCRIPT TYPES (`src/types/index.ts`)

Generate a comprehensive types file with these interfaces:

```typescript
export interface Transaction {
  id: string;
  user_id: string;
  date: string;          // ISO date string
  amount: number;        // negative = expense, positive = income/refund
  merchant: string;
  category: TransactionCategory;
  description?: string;
  source: 'csv' | 'receipt' | 'mock_bank' | 'manual';
  is_duplicate: boolean;
  created_at: string;
}

export type TransactionCategory =
  | 'Food & Dining'
  | 'Groceries'
  | 'Transport'
  | 'Entertainment'
  | 'Shopping'
  | 'Healthcare'
  | 'Housing'
  | 'Utilities'
  | 'Subscriptions'
  | 'Travel'
  | 'Education'
  | 'Personal Care'
  | 'Income'
  | 'Uncategorized';

export interface MonthlySummary {
  year: number;
  month: number;
  category: string;
  total_spent: number;
  tx_count: number;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'weekly';
}

export interface BudgetWithStatus extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  isOver: boolean;
  isWarning: boolean;   // > 80%
}

export interface UserMemory {
  user_id: string;
  preferences: {
    pay_day?: number;            // day of month
    currency?: string;
    exclude_from_food?: string[];
    notes?: string;
    [key: string]: unknown;
  };
}

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    intent?: QueryIntent;
    tools_used?: string[];
    image_url?: string;
    sql_used?: string;
  };
  created_at: string;
}

export type QueryIntent =
  | 'SIMPLE_SPENDING_LOOKUP'    // "how much did I spend on X"
  | 'CATEGORY_BREAKDOWN'        // "break down my spending"
  | 'TIME_COMPARISON'           // "am I spending more than usual"
  | 'ANOMALY_DETECTION'         // "any unusual charges"
  | 'SUBSCRIPTION_DETECTION'    // "what subscriptions do I have"
  | 'BUDGET_QUERY'              // "how am I doing on my budget"
  | 'BUDGET_SET'                // "set my food budget to $400"
  | 'RECEIPT_OCR'               // user uploaded receipt image
  | 'MERCHANT_LOOKUP'           // "what is this charge from X"
  | 'GENERAL_SUMMARY'           // "summarize my finances"
  | 'MEMORY_UPDATE'             // "I get paid on the 1st"
  | 'SAVINGS_ADVICE'            // "where can I cut back"
  | 'UNKNOWN';

export interface DetectedSubscription {
  id: string;
  merchant: string;
  average_amount: number;
  frequency_days: number;
  last_seen: string;
  first_seen: string;
  is_acknowledged: boolean;
}

export interface DashboardStats {
  currentMonthTotal: number;
  lastMonthTotal: number;
  monthOverMonthChange: number;       // percentage
  topCategories: { category: string; total: number }[];
  recentTransactions: Transaction[];
  budgetStatus: BudgetWithStatus[];
  subscriptions: DetectedSubscription[];
  anomalies: Transaction[];
}

export interface ReceiptExtraction {
  merchant: string;
  date: string;
  total: number;
  currency: string;
  line_items: { name: string; amount: number }[];
  confidence: 'high' | 'medium' | 'low';
  notes?: string;         // e.g., "image was blurry, date uncertain"
}
```

---

## 6. AI AGENT ARCHITECTURE (`src/lib/ai/`)

This is the most critical section. Implement it carefully with full logic.

### 6a. Query Router (`src/lib/ai/router.ts`)

The router classifies user intent CHEAPLY before invoking expensive models.

```typescript
// Use GPT-4o-mini with a structured prompt to classify intent.
// Input: user message text
// Output: QueryIntent enum value
// Cost: ~0.001 per call (intentionally cheap)
// 
// Also implement a rule-based fast-path for obvious patterns:
// - Message starts with "set my X budget" → BUDGET_SET (no LLM needed)
// - Message contains "receipt" or has image_url → RECEIPT_OCR
// - Message matches /how much.*spend/i → SIMPLE_SPENDING_LOOKUP
// - Message mentions "subscription" → SUBSCRIPTION_DETECTION
// - Message mentions "unusual|suspicious|strange" → ANOMALY_DETECTION
// 
// Only call GPT-4o-mini if rule-based fails.
// Return intent + confidence score.

export async function classifyIntent(
  message: string,
  hasImage: boolean
): Promise<{ intent: QueryIntent; confidence: number }> { ... }
```

### 6b. Tool Definitions (`src/lib/ai/tools.ts`)

Define OpenAI function-calling tools. Each tool maps to a DB query function.
Implement ALL of the following tools with full logic:

```typescript
// TOOL 1: get_spending_summary
// Parameters: category (optional), start_date, end_date
// Returns: total amount, transaction count, top merchants
// Uses: Direct SQL aggregation — never sends raw transactions to LLM
// 
// TOOL 2: get_monthly_trend
// Parameters: category (optional), months (number, default 6)
// Returns: array of { year, month, total } for charting
// Note: reads from monthly_summaries table (pre-aggregated, fast for large data)
//
// TOOL 3: get_top_merchants
// Parameters: start_date, end_date, limit (default 10)
// Returns: merchant name + total spent + transaction count
//
// TOOL 4: detect_anomalies
// Parameters: lookback_months (default 3)
// Logic: 
//   1. Calculate per-category mean and stddev over lookback period
//   2. Find transactions where amount > (mean + 2*stddev) for that category
//   3. Also flag: merchants appearing for first time with amount > $50
//   4. Return up to 10 most recent anomalies
//
// TOOL 5: detect_subscriptions
// Parameters: none (uses stored detected_subscriptions table first)
// Logic:
//   1. Group transactions by merchant
//   2. For each merchant with 3+ occurrences, calculate intervals between charges
//   3. If stddev of intervals < 5 days, flag as subscription
//   4. Return detected subscriptions with estimated next charge date
//
// TOOL 6: get_budget_status
// Parameters: category (optional, returns all if omitted)
// Logic: JOIN budgets with monthly_summaries for current month
// Returns: BudgetWithStatus[]
//
// TOOL 7: set_budget
// Parameters: category, amount, period
// Returns: created/updated budget
//
// TOOL 8: get_user_memory
// Parameters: none
// Returns: full preferences object
//
// TOOL 9: update_user_memory  
// Parameters: key, value
// Logic: UPSERT into user_memory.preferences JSONB
//
// TOOL 10: search_merchant_info
// Parameters: merchant_name, charge_amount (optional)
// Logic: Call Tavily API with query like "what is [merchant_name] company charges"
// Returns: company description, website, likely service type
// Fallback: if Tavily fails, return "could not look up this merchant"
//
// TOOL 11: get_recent_transactions
// Parameters: limit (default 20), category (optional), merchant (optional)
// Returns: Transaction[] with basic fields
//
// TOOL 12: compare_periods
// Parameters: period1_start, period1_end, period2_start, period2_end, category (optional)
// Returns: { period1_total, period2_total, difference, percentage_change }
```

### 6c. Main Agent (`src/lib/ai/agent.ts`)

```typescript
// The agent orchestrates everything:
// 
// 1. Receive: { message, imageBase64 (optional), conversationHistory, userId }
// 
// 2. ROUTING DECISION:
//    if (hasImage && imageBase64) → go to RECEIPT_OCR path immediately
//    else → classify intent via router.ts
// 
// 3. CONTEXT LOADING (SMART — not all transactions):
//    - Always load: user_memory (tiny, always relevant)
//    - For SIMPLE_SPENDING_LOOKUP: run the specific SQL query, return only aggregates
//    - For TIME_COMPARISON: load monthly_summaries (never raw transactions)
//    - For ANOMALY_DETECTION: run anomaly detection query, return top 10
//    - For GENERAL_SUMMARY: load current month + last month summaries + budget status
//    - NEVER load all raw transactions into LLM context
// 
// 4. MODEL SELECTION:
//    - SIMPLE lookups: GPT-4o-mini (fast, cheap, sufficient)
//    - GENERAL_SUMMARY, SAVINGS_ADVICE, complex reasoning: GPT-4o
//    - RECEIPT_OCR: GPT-4o with vision
//    - MERCHANT_LOOKUP: GPT-4o-mini + Tavily tool call
// 
// 5. TOOL CALLING LOOP:
//    - Send message + relevant context + tools to chosen model
//    - Process tool calls (execute DB queries)
//    - Re-submit results
//    - Max 3 tool call rounds (prevent infinite loops)
// 
// 6. RESPONSE:
//    - Return: { content: string, intent, tools_used: string[], metadata }
//    - Save assistant message to DB
// 
// 7. EDGE CASE HANDLING (implement all):
//    - No transactions found: "I don't see any transactions for that period yet. 
//      Upload your transaction CSV to get started."
//    - Ambiguous question: Ask one clarifying question before proceeding
//    - Conflicting data: Note the discrepancy explicitly in response
//    - Tool call fails: Gracefully fall back, tell user what couldn't be retrieved
//    - Image unreadable: "The image was too unclear to extract details. 
//      Could you try a clearer photo? Here's what I could make out: [partial]"

export async function runAgent(params: AgentParams): Promise<AgentResponse> { ... }
```

### 6d. System Prompts (`src/lib/ai/prompts.ts`)

```typescript
// MAIN SYSTEM PROMPT (inject dynamically with user context):
export const MAIN_SYSTEM_PROMPT = (userMemory: UserMemory) => `
You are a personal finance assistant. You are helpful, direct, and numbers-focused.

USER CONTEXT:
${JSON.stringify(userMemory.preferences, null, 2)}

RULES:
- Always cite specific numbers and dates when answering questions.
- If you're not certain about something, say so clearly.
- Keep answers concise but complete. No unnecessary filler.
- When you detect something concerning (overspending, unusual charge), be direct.
- Use the user's remembered context (pay day, exclusions) in every relevant answer.
- Format currency as the user's preferred currency (default USD).
- When comparing periods, always say both absolute and percentage change.
- If asked about a merchant you looked up online, cite that it came from a web search.
`;

// RECEIPT OCR PROMPT:
export const RECEIPT_OCR_PROMPT = `
Extract all financial information from this receipt image.
Return a JSON object with: merchant, date (ISO format), total (number), currency, 
line_items (array of {name, amount}), confidence ('high'|'medium'|'low').

If the image is unclear, rotated, or partially cut off:
- Extract what you can
- Set confidence to 'low' or 'medium' accordingly
- Add a 'notes' field explaining the issue
- Never fabricate data you cannot see
- If the total is unreadable but line items are visible, sum the line items

If the receipt is in another language, translate merchant names and items to English.
`;

// INTENT CLASSIFICATION PROMPT:
export const CLASSIFICATION_PROMPT = `
Classify the user's financial query into exactly one of these intents:
SIMPLE_SPENDING_LOOKUP | CATEGORY_BREAKDOWN | TIME_COMPARISON | ANOMALY_DETECTION |
SUBSCRIPTION_DETECTION | BUDGET_QUERY | BUDGET_SET | RECEIPT_OCR | MERCHANT_LOOKUP |
GENERAL_SUMMARY | MEMORY_UPDATE | SAVINGS_ADVICE | UNKNOWN

Respond with only a JSON object: { "intent": "...", "confidence": 0.0-1.0 }
`;
```

---

## 7. FINANCE QUERY FUNCTIONS (`src/lib/finance/queries.ts`)

Implement all these typed Supabase query functions. These are called by the AI tools:

```typescript
// getSpendingSummary(userId, category?, startDate, endDate)
//   → SELECT category, SUM(ABS(amount)) as total, COUNT(*) from transactions
//     WHERE user_id = ? AND date BETWEEN ? AND ? AND amount < 0
//     GROUP BY category ORDER BY total DESC

// getMonthlySummaries(userId, months = 12)
//   → SELECT * FROM monthly_summaries WHERE user_id = ?
//     AND (year, month) >= (last N months)
//     ORDER BY year, month

// getTopMerchants(userId, startDate, endDate, limit = 10)
//   → SELECT merchant, SUM(ABS(amount)) as total, COUNT(*) as count
//     FROM transactions WHERE user_id = ? AND date BETWEEN ? AND ? AND amount < 0
//     GROUP BY merchant ORDER BY total DESC LIMIT ?

// detectAnomalies(userId, lookbackMonths = 3)
//   → Complex: calculate per-category baseline, return outliers
//   Implementation:
//     1. Get monthly_summaries for last N months grouped by category
//     2. Calculate avg and stddev per category
//     3. Get current month transactions per category
//     4. Return transactions in categories where month total > avg + (1.5 * stddev)

// detectSubscriptions(userId)
//   → First check detected_subscriptions table
//   → If stale (>7 days), re-run detection from transactions:
//     1. Find merchants with 3+ transactions
//     2. Calculate intervals, check if regular
//     3. Upsert results to detected_subscriptions

// getBudgetStatus(userId, category?)
//   → JOIN budgets with current month's monthly_summaries
//   → Calculate spent, remaining, percentage

// getUserMemory(userId)
//   → SELECT from user_memory WHERE user_id = ?
//   → If not exists, return empty preferences {}

// upsertUserMemory(userId, key, value)
//   → UPSERT user_memory, update preferences JSONB field

// getRecentTransactions(userId, filters)
//   → Typed filter object: { category?, merchant?, startDate?, endDate?, limit? }
```

---

## 8. CSV PARSER (`src/lib/finance/csv-parser.ts`)

Handle real-world messy CSV data:

```typescript
// parseTransactionsCsv(csvString: string, userId: string): Transaction[]
//
// COLUMN DETECTION (flexible, not rigid):
// Try to auto-detect columns by matching common header names:
//   date: ['date', 'transaction date', 'posted date', 'trans date']
//   amount: ['amount', 'debit', 'credit', 'transaction amount']
//   merchant: ['merchant', 'description', 'payee', 'name', 'memo']
//   category: ['category', 'type', 'transaction type']
//
// NORMALIZATION:
//   - Date: Try multiple formats (MM/DD/YYYY, YYYY-MM-DD, DD/MM/YYYY, "Jan 5, 2024")
//   - Amount: Strip $, commas, parentheses for negatives. Handle "Debit/Credit" columns.
//   - Merchant: Title-case, trim, truncate to 100 chars
//   - Category: Map common bank categories to our TransactionCategory enum
//     e.g., "FOOD_AND_DINING" → "Food & Dining", "GROC" → "Groceries"
//
// DEDUPLICATION:
//   - Generate hash: MD5(userId + date + amount + merchant)
//   - Mark rows where hash already exists in DB as is_duplicate: true
//   - Never insert duplicates — filter them before bulk insert
//
// VALIDATION:
//   - Skip rows where date is invalid or amount is NaN (log them, don't crash)
//   - Skip rows that are clearly header rows repeated mid-file
//   - Skip rows where merchant is empty
//   - Return { valid: Transaction[], skipped: { row, reason }[] }
//
// BULK INSERT:
//   - Use Supabase upsert with onConflict: raw_hash
//   - Batch in chunks of 500 rows to avoid timeout
//   - After insert, trigger recompute of monthly_summaries
```

---

## 9. API ROUTES

### `src/app/api/chat/route.ts`

```typescript
// POST /api/chat
// Body: { message: string, conversationId?: string, imageBase64?: string }
// Auth: Clerk — get userId from auth()
// 
// Implementation:
// 1. Validate auth, get userId
// 2. Get or create conversation
// 3. Load recent conversation history (last 10 messages — not unlimited)
// 4. Save user message to DB
// 5. Run agent: await runAgent({ message, imageBase64, conversationHistory, userId })
// 6. Save assistant response to DB
// 7. Return: { response: string, conversationId, intent, metadata }
//
// Use streaming response (ReadableStream) for better UX:
// stream the assistant response token by token
// Use: new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
```

### `src/app/api/transactions/upload/route.ts`

```typescript
// POST /api/transactions/upload
// Body: FormData with 'file' (CSV) or 'json' (array)
// 
// 1. Parse CSV with csv-parser.ts
// 2. Return preview of first 5 rows + column mapping for user to confirm
//    (Two-step: first call returns preview, second call with confirmed=true does import)
// 3. On confirmed import:
//    a. Bulk upsert transactions (skip duplicates)
//    b. Recompute monthly_summaries for affected months
//    c. Re-run subscription detection
//    d. Return: { imported: N, duplicates: N, skipped: N, errors: [] }
```

### `src/app/api/dashboard/route.ts`

```typescript
// GET /api/dashboard
// Returns: DashboardStats
// 
// IMPORTANT: This must be fast. Fetch all data in PARALLEL using Promise.all():
// [currentMonth, lastMonth, budgets, subscriptions, recentTx, anomalies]
// 
// Use pre-aggregated monthly_summaries — never scan raw transactions for dashboard
```

---

## 10. KEY REACT COMPONENTS

### `src/components/chat/ChatWindow.tsx`

Full implementation requirements:
- Maintains local message state + syncs with DB
- Handles streaming responses (read SSE stream, append tokens)
- Image upload: click paperclip icon → opens file picker → preview thumbnail
- Shows TypingIndicator while waiting
- Auto-scrolls to bottom on new messages
- Shows intent badge on assistant messages (e.g., "💡 Spending Lookup", "🔍 Web Search")
- Error state: shows retry button if request fails
- Empty state: shows 5 suggested questions as clickable chips:
  - "How much did I spend this month?"
  - "Do I have any subscriptions I forgot about?"
  - "What's my biggest spending category?"
  - "Am I over budget anywhere?"
  - "Summarize my finances"

### `src/components/transactions/CsvUploader.tsx`

- Drag-and-drop zone (react-dropzone style using Tailwind)
- Shows preview table of first 5 rows before import
- Column mapping UI if auto-detection is uncertain
- Progress bar during upload
- Shows results: "✓ 342 imported, 12 duplicates skipped, 3 rows had errors"

### `src/components/dashboard/SpendingOverview.tsx`

- 4 summary cards: This Month, Last Month, % Change, Largest Category
- Color-coded: green if spending down, red if up >10%

### `src/app/app/page.tsx` (Dashboard)

- Uses SWR or React Query for data fetching with stale-while-revalidate
- Shows skeleton loaders while data loads
- If no transactions yet: prominent "Get Started" CTA with CSV upload

---

## 11. SAMPLE DATA (`scripts/seed-sample-data.ts`)

Generate a TypeScript script that creates realistic sample transaction data:

```typescript
// Generate 18 months of transaction history for a test user
// Categories: Food & Dining, Groceries, Transport, Entertainment, 
//             Shopping, Subscriptions, Utilities, Healthcare
//
// Include realistic patterns:
// - Netflix ($15.99) every ~30 days → detected as subscription
// - Spotify ($9.99) every ~30 days → detected as subscription
// - Large grocery run on weekends ($80-150)
// - Coffee shops 3-4x per week ($4-7 each)
// - One anomalous large charge in month 3 (e.g., $450 at "BEST BUY")
// - Gas station charges varying $40-80
// - 2-3 duplicate rows intentionally → test dedup logic
// - 1 row with missing merchant → test validation
// - 1 row with invalid date → test validation
//
// Output: transactions.csv in /scripts/sample-data/
// Also: instructions in a README comment for how to import it
```

Also create `/scripts/sample-data/mock-bank-endpoint.ts`:

```typescript
// Express.js mini-server (or Next.js API route at /api/mock-bank)
// GET /api/mock-bank?userId=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns: JSON array of transactions in the date range
// Uses: the same sample data as the CSV
// Simulates a real bank API integration
```

---

## 12. MIDDLEWARE (`src/middleware.ts`)

```typescript
// Clerk auth middleware
// Protect all routes under /app/*
// Allow public: /, /sign-in, /sign-up, /api/mock-bank
// Redirect unauthenticated users to /sign-in

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/app(.*)', '/api/chat(.*)', '/api/transactions(.*)']);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});
```

---

## 13. SUPABASE CLIENT SETUP

### `src/lib/supabase/server.ts`

```typescript
// Server-side Supabase client that uses Clerk JWT for RLS
// The JWT sub claim contains Clerk userId, which matches user_id columns
// Use: createClient() from @supabase/supabase-js with custom auth header
// Inject Clerk session token so Supabase RLS policies fire correctly

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function createServerSupabaseClient() {
  const { getToken } = auth();
  const token = await getToken({ template: 'supabase' }); // Clerk JWT template
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}
```

---

## 14. README.md

Generate a comprehensive README that fulfills the assessment's design note requirement:

```markdown
# Personal Finance Assistant

## What Was Built

### Completed Features
- [x] Multi-user auth with Clerk
- [x] CSV transaction import with deduplication and validation
- [x] Conversational AI assistant with intent routing
- [x] Spending queries (by category, merchant, time period)
- [x] Receipt OCR via GPT-4o vision
- [x] Subscription detection (recurring charge pattern matching)
- [x] Anomaly/unusual activity flagging
- [x] Budget setting and tracking with alerts
- [x] Month-over-month spending comparison
- [x] Merchant lookup via web search (Tavily)
- [x] Plain-English spending summary
- [x] Savings suggestions (numbers-backed)
- [x] User memory / persistent context
- [x] Dashboard with charts and KPIs
- [x] Mock bank API endpoint

### Stubbed / Simplified
- Real bank OAuth (Plaid) — replaced with CSV import and mock endpoint
- Real-time transaction sync — would use webhooks in production
- Email alerts — noted in architecture but not implemented
- pgvector semantic search — schema ready, not wired to queries (would enable "find transactions about X")

## Architecture Decisions

### Query Routing (The Core Design)
The most important architectural decision is **not sending all transactions to the LLM**. 
Instead, every query is classified by intent first (GPT-4o-mini, ~$0.001), 
then routed to the right data strategy:

| Intent | Data Strategy | Model |
|---|---|---|
| Simple spending total | SQL aggregation → number only to LLM | GPT-4o-mini |
| Category breakdown | Pre-computed monthly_summaries | GPT-4o-mini |
| Time comparison | Monthly aggregates (not raw rows) | GPT-4o-mini |
| Anomaly detection | Statistical query (mean ± 2σ) | GPT-4o |
| Receipt OCR | Base64 image → vision model | GPT-4o |
| Merchant lookup | Tavily web search | GPT-4o-mini |
| Complex advice | Aggregated context | GPT-4o |

This keeps p50 response time under 2s for simple queries and cost per interaction 
under $0.01 for ~80% of queries.

### Scale Strategy
- **monthly_summaries table**: Pre-aggregated per user/month/category. Dashboard and 
  trend queries never touch raw transactions. Works identically whether the user has 
  1,000 or 1,000,000 transactions.
- **Raw transactions**: Only queried when absolutely necessary (anomaly detection, 
  specific transaction lookup). Always with user_id index + date range filter.
- **LLM context**: Hard cap — agent receives aggregated results, never a dump of raw rows.
- **Deduplication**: Hash-based at import time. Re-importing the same CSV is safe.

### Multi-User Isolation
Supabase Row Level Security policies ensure every query is scoped to the authenticated 
user's Clerk ID. Even if the API layer had a bug, the database layer enforces isolation.

### Handling Messy Real-World Data
- CSV parser tries 6 common date formats before failing
- Column names auto-detected with fuzzy matching
- Invalid rows are logged and returned to the user, not silently dropped
- Duplicate rows flagged by content hash, not position

## Trade-offs

| Decision | Trade-off |
|---|---|
| Clerk for auth | Vendor dependency vs. days saved on auth plumbing |
| Supabase for DB | Same trade-off — fast to ship, harder to self-host |
| Monthly summaries table | Extra write on import vs. fast reads at scale |
| OpenAI GPT-4o-mini for routing | Small chance of misclassification vs. cost |
| Tool calling (not RAG) | More deterministic than vector search for structured financial data |

## Setup Instructions
[Full setup steps here — see Getting Started section]
```

---

## 15. PACKAGE.JSON

Generate with all required dependencies:

```json
{
  "name": "finance-assistant",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "seed": "tsx scripts/seed-sample-data.ts"
  },
  "dependencies": {
    "next": "14.2.x",
    "react": "^18",
    "react-dom": "^18",
    "@clerk/nextjs": "^5",
    "@supabase/supabase-js": "^2",
    "openai": "^4",
    "ai": "^3",
    "recharts": "^2",
    "react-hook-form": "^7",
    "zod": "^3",
    "date-fns": "^3",
    "papaparse": "^5",
    "sonner": "^1",
    "lucide-react": "^0.400",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "class-variance-authority": "^0.7"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/papaparse": "^5",
    "tailwindcss": "^3",
    "autoprefixer": "^10",
    "postcss": "^8",
    "tsx": "^4"
  }
}
```

---

## 16. DESIGN AESTHETIC

The UI should feel like a **premium fintech product** — think Copilot Money / Linear aesthetic:
- Dark sidebar (#0f0f11) with light main content area
- Accent color: Electric indigo (#6366f1) for CTAs and highlights
- Font: `Geist` (Next.js default) for UI, monospace for numbers
- Cards with subtle shadows and 8px radius
- Spending amounts: use color coding (red for high spend, green for income)
- Transaction rows: hover state with subtle left border in accent color
- Charts: minimal grid lines, filled area charts for trends
- Chat bubbles: user = indigo, assistant = neutral gray card

---

## 17. GENERATION ORDER

Generate files in this order so each builds on the last:

1. `package.json` → `tsconfig.json` → `tailwind.config.ts` → `next.config.ts`
2. `.env.local.example`
3. `supabase/schema.sql`
4. `src/types/index.ts`
5. `src/lib/supabase/client.ts` → `src/lib/supabase/server.ts`
6. `src/lib/finance/queries.ts`
7. `src/lib/finance/aggregations.ts`
8. `src/lib/finance/anomaly.ts`
9. `src/lib/finance/subscriptions.ts`
10. `src/lib/finance/csv-parser.ts`
11. `src/lib/ai/prompts.ts`
12. `src/lib/ai/router.ts`
13. `src/lib/ai/tools.ts`
14. `src/lib/ai/vision.ts`
15. `src/lib/ai/agent.ts`
16. `src/middleware.ts`
17. All API routes
18. `src/app/layout.tsx` → root pages
19. All components (layout first, then dashboard, then chat, then transactions)
20. `scripts/seed-sample-data.ts`
21. `README.md`

---

## CRITICAL REMINDERS FOR COPILOT

- **TypeScript strict mode**: No `any` types. Use proper generics everywhere.
- **Error handling**: Every async function must have try/catch. Return typed error objects.
- **RLS assumption**: Server functions always use the Clerk-JWT Supabase client, never the service role key except in seed scripts.
- **Cost guards**: Agent must NEVER load more than 50 raw transactions into LLM context. Use aggregations.
- **Streaming**: The chat API route must stream the response. No waiting for full response before sending.
- **Dedup**: CSV import must hash-check before inserting. Idempotent re-imports.
- **Receipt failure modes**: If OCR returns low confidence, still return partial data with a user-facing warning.
- **Memory application**: Every agent call must load user_memory first and inject it into the system prompt.

Begin with file 1 and proceed through the order above. Confirm after each file.
```
