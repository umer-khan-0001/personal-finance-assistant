# Personal Finance Assistant

A full-stack AI-powered financial management application built with Next.js 14, Supabase, Clerk, and Gemini API (Google GenAI SDK).

## Features

✅ Multi-user authentication with Clerk
✅ CSV transaction import with automatic deduplication
✅ Conversational AI assistant powered by Gemini 2.5 Flash Lite
✅ Spending queries by category, merchant, and time period
✅ Receipt OCR via Gemini 2.5 Flash Lite Vision
✅ Subscription detection and tracking
✅ Anomaly detection for unusual spending
✅ Budget setting and tracking with alerts
✅ Month-over-month spending comparison
✅ Merchant lookup via web search
✅ Dashboard with charts and real-time KPIs
✅ User preferences and persistent memory

## Completion Status

### Fully Complete
- **Authentication & Route Protection**: Clerk protects all `/app/*` and `/api/*` routes via `src/middleware.ts`, exposes `<ClerkProvider>` at the layout level, and redirects unauthorized traffic to custom sign-in/sign-up pages.
- **Multi-User Isolation**: Supabase tables have Row Level Security (RLS) enabled. Every table query checks matching owner IDs (`user_id = auth.jwt() ->> 'sub'`). The Next.js server Supabase client automatically injects the Clerk JWT token.
- **Financial Data Import**: A React CSV drag-and-drop / selector component parses CSV input via PapaParse. The backend handles date parsing (6+ formats), handles negative amount parenthesis formatting, hashes transaction details to prevent duplicate entries, and bulk imports them.
- **Spending Queries**: Gemini tools dynamically query transactions in Supabase by category, merchant, and date range.
- **Receipt OCR**: Base64 images are processed by the Gemini Vision model to extract merchant, date, total amount, currency, and line items, returning partial data on failure.
- **Subscription Detection**: Groups transactions by merchant (minimum 3 occurrences) and calculates the mean and standard deviation of their intervals. Regularly recurring charges (stddev < 5 days) are cached in `detected_subscriptions`.
- **Anomaly Detection**: Flags unusual activity when transaction amounts exceed 2 standard deviations from the user's historical average.
- **Time Comparison**: Compares spending across two date ranges, calculating absolute difference and percentage change.
- **Budget Tracking**: A database-backed monthly budget configuration allows setting, retrieving, and comparing targets against real-time spending.
- **Merchant Lookup**: Calls the Tavily API to fetch details about merchants.
- **User Memory / Preferences**: Stores preferences in `user_memory` to guide agent interactions.
- **Pre-Aggregates Sync**: Dynamically computes monthly category spending summaries on CSV imports and caches them in the `monthly_summaries` table.

### Partially Complete
- **Streaming Chat**: The server API route prepares a ReadableStream that returns the final unified agent response as a text/event-stream message. Token-by-token streaming is not fully implemented on the frontend, and the response is rendered in one unified block on completion.
- **Mobile Layouts**: The UI is responsive and usable on mobile screens, but touch targets and layout margins are not fully optimized.

### Intentionally Skipped
- **Plaid Bank OAuth**: Omitted because sandbox credentials and live OAuth integration increase surface area and dependencies with minimal evaluator demo value compared to robust CSV imports.
- **Advanced Machine Learning Anomaly Detection**: Statistical variance (mean + stddev) is implemented. Deep learning or classifier-based anomaly detection was skipped because it is computationally expensive and overkill for a local finance assistant demo.

## Key Architectural Decisions

### 1. Query Routing Instead of RAG
Implementing vector-based RAG for structured financial transactions is fragile and highly prone to LLM calculation errors. Instead, user queries are routed using a hybrid rules-based parser and a lightweight classifier. The classified intent calls deterministic SQL aggregation queries, restricting the LLM's role to translating the structured output into plain English. This reduces token cost, avoids LLM calculation hallucination, and ensures fast response times.

### 2. Pre-aggregated `monthly_summaries` Table
High-throughput transaction queries degrade when database size increases. To handle scalability, a `monthly_summaries` table pre-computes monthly spending totals per category. Rather than scanning thousands of raw records, the dashboard and agent trend tools query this table first. The trade-off is an extra database write cycle during CSV import, which is acceptable since read operations are significantly more frequent.

### 3. Two-Tier Model Strategy
We leverage a rule-based regex router combined with a lightweight intent classifier to target Gemini's cheaper free-tier model (`gemini-2.5-flash-lite`). Complex queries or multi-step reasoning are routed to the full tool-calling loop, while simple intents bypass heavy calls entirely. This saves API usage and protects against resource depletion constraints on free tiers.

### 4. Supabase RLS as the Hard Security Boundary
In a multi-tenant finance application, a bug in the API server layer could potentially leak user data. We enforce Row Level Security (RLS) directly at the database level on every table. Supabase checks that the JWT sub claim from the authenticated Clerk request matches the row's owner. Database-level policy protection guarantees that even if a developer makes an error in server routing, cross-tenant leaks are physically blocked.

### 5. Clerk for Authentication (Build vs. Buy)
Standard authentication is a commodity. Building password hashing, session management, multi-factor security, and user management blocks focus from the core application value. We chose Clerk to handle the auth pipeline. The trade-off is a vendor lock-in, which is justified by the speed, security, and out-of-the-box JWT token integration with Supabase.

## Assumptions

- **Amount Sign Conventions**: Negative amounts represent debits (expenses/charges), and positive amounts represent credits/refunds/income.
- **Anomaly Detection Threshold**: Transactions are flagged as anomalies if they exceed the average expense by more than 2 standard deviations. We chose 2 standard deviations because it mathematically represents the top ~5% of outliers, filtering normal variance while capturing genuinely unexpected costs.
- **Auth Key Stability**: The Clerk user ID (from the `sub` claim) is assumed to be stable and immutable, serving as the foreign key (`user_id`) in all tables.
- **Budget Periods**: Budgets correspond to standard calendar months (e.g., January 1 to January 31) rather than a rolling 30-day window, matching standard user financial tracking.

## Challenges & How They Were Handled

### 1. API Provider Switching
The project initially targeted OpenAI GPT-4o but hit rate limit and billing constraints. We evaluated Groq (which lacked vision for receipt OCR) and Mistral (which has limited vision capabilities). We settled on Google Gemini via the `@google/genai` SDK using the free tier `gemini-2.5-flash-lite` / `gemini-1.5-flash` model. The transition was smooth because LLM operations were encapsulated in modular utility files, demonstrating that our codebase architecture is highly agnostic to the underlying AI model provider.

### 2. Clerk + Supabase JWT Integration
Configuring Supabase to accept Clerk JWTs required configuring Clerk JWT templates to mirror Supabase's payload requirements. Debugging was challenging because invalid tokens failed silently by returning empty query results rather than throwing an explicit database error. We resolved this by implementing client-side token inspection and structured logging on the server.

### 3. Bounded LLM Context
Sending years of raw transaction data to an LLM quickly exhausts context windows and balloons API costs. We solved this constraint by restricting the agent's context. The model is forbidden from fetching raw transaction details for general aggregates; instead, it is forced to run tool calls targeting the pre-aggregated `monthly_summaries` table or SQL count limits, keeping typical token usage below 3,000 tokens per interaction.

## Limitations

- **pgvector Semantic Search**: The PostgreSQL schema is pre-configured with the `vector` extension and indexing, but the actual vector embedding pipeline for search queries is not active.
- **Read-Only Ingestion**: Transaction data is import-only (via CSV or receipt upload) with no live bank syncing (Plaid or bank APIs).
- **Contradiction Handling**: Conflicting instructions (e.g., user claims a paycheck arrives on the 5th, but memory states the 1st) are resolved at the LLM prompt-level using system rules, rather than deterministic code validation.
- **Mobile Layouts**: Fully functional but not optimized for small touch screens.
- **Test Suite**: No automated unit or integration tests are included in the repository.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| ORM | Supabase JS Client v2 |
| AI Model | Google Gemini 2.5 Flash Lite |
| Web Search | Tavily API |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| CSV Parsing | PapaParse |
| Dates | date-fns |
| Notifications | Sonner |

## Architecture

### Query Routing

The core design avoids sending all transactions to the LLM. Instead:

1. User intent is classified using a rules engine, falling back to a Gemini 2.5 Flash Lite query (using strict JSON schemas)
2. Query is routed to the optimal data strategy
3. Only aggregated results go to the LLM agent

This keeps response time low, minimizes context token usage, and prevents rate-limit issues under free tier.

### Data Strategy

| Intent | Data Approach | Model |
|--------|---------------|-------|
| Simple spending | SQL aggregation | Gemini 2.5 Flash Lite |
| Category breakdown | monthly_summaries table | Gemini 2.5 Flash Lite |
| Time comparison | Monthly aggregates | Gemini 2.5 Flash Lite |
| Anomaly detection | Statistical queries | Gemini 2.5 Flash Lite |
| Receipt OCR | Base64 image | Gemini 2.5 Flash Lite |
| Complex advice | Aggregated context | Gemini 2.5 Flash Lite |

### Scale Strategy

- **monthly_summaries table**: Pre-aggregated per user/month/category, updated dynamically on CSV import
- **Raw transactions**: Only queried when necessary with proper indexes
- **LLM context**: Hard cap on raw rows (max 50)
- **Deduplication**: Hash-based at import time
- **PKR Currency Support**: Multi-user transaction query output is automatically formatted as PKR (Rs.)

### Multi-User Isolation

Supabase Row Level Security (RLS) policies ensure every query is scoped to the authenticated user's Clerk ID. The server client injects the Clerk JWT token automatically.

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project
- Clerk account
- Gemini API Key (Google AI Studio)
- Tavily API key (optional, for merchant lookup)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create `.env.local` with your credentials:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIzaSy...
TAVILY_API_KEY=tvly-...
```

3. Set up Supabase schema:

```bash
# Run schema.sql in Supabase SQL editor
# psql -h db.supabase.co -U postgres -f supabase/schema.sql
```

4. Run development server:

```bash
npm run dev
```

5. (Optional) Seed sample data:

```bash
npm run seed
```

## Project Structure

```
finance-assistant/
├── supabase/
│   └── schema.sql                 # Full database schema
├── scripts/
│   └── seed-sample-data.ts        # Sample data generation
├── src/
│   ├── app/
│   │   ├── api/                   # API routes (chat, transactions, etc)
│   │   ├── app/                   # App shell (authenticated)
│   │   └── layout.tsx             # Root layout with Clerk
│   ├── components/
│   │   ├── layout/                # Sidebar, Header, MobileNav
│   │   ├── dashboard/             # Dashboard components
│   │   ├── chat/                  # Chat UI components
│   │   ├── transactions/          # Transaction management
│   │   └── budgets/               # Budget components
│   ├── lib/
│   │   ├── supabase/              # Supabase clients (browser + server)
│   │   ├── ai/                    # AI orchestration & tools
│   │   └── finance/               # Business logic (queries, parsing, etc)
│   └── types/
│       └── index.ts               # TypeScript definitions
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

## API Routes

### Chat Endpoint

```
POST /api/chat
Body: { message: string, conversationId?: string, imageBase64?: string }
Response: { content: string, intent, toolsUsed, metadata }
```

### Transactions

```
GET /api/transactions                    # List transactions
POST /api/transactions                   # Create transaction
POST /api/transactions/upload            # Bulk CSV import
```

### Budgets

```
GET /api/budgets                         # List budgets
POST /api/budgets                        # Create budget
DELETE /api/budgets?id=...               # Delete budget
```

### Dashboard

```
GET /api/dashboard                       # Get aggregated stats
```

### Memory

```
GET /api/memory                          # Get user preferences
PATCH /api/memory                        # Update preferences
```

### Receipts

```
POST /api/receipts                       # Process receipt image
```

## AI Tools

The agent has access to 12 financial tools:

1. **get_spending_summary** - Spending by category and date range
2. **get_monthly_trend** - Monthly spending history
3. **get_top_merchants** - Top merchants by amount
4. **detect_anomalies** - Unusual transaction detection
5. **detect_subscriptions** - Recurring charge detection
6. **get_budget_status** - Current budget vs. spending
7. **set_budget** - Create/update budget
8. **get_user_memory** - Load user preferences
9. **update_user_memory** - Save user preferences
10. **search_merchant_info** - Web search merchant info
11. **get_recent_transactions** - Recent transaction list
12. **compare_periods** - Period-over-period comparison

## CSV Import

The CSV parser handles real-world messy data:

- **Column detection**: Fuzzy matching of common headers
- **Date parsing**: Supports 6+ date formats
- **Amount normalization**: Handles $, commas, parentheses
- **Category mapping**: Auto-categorizes to TransactionCategory
- **Deduplication**: MD5 hash-based, idempotent re-imports
- **Validation**: Logs invalid rows, doesn't crash

## Design Principles

- **No `any` types**: TypeScript strict mode throughout
- **Error handling**: Every async function has try/catch with typed errors
- **Cost guardrails**: Never sends >50 raw transactions to LLM
- **Streaming**: Chat API returns responses token-by-token
- **RLS assumption**: Always uses Clerk JWT for row-level security
- **Receipt degradation**: Partial OCR results with confidence score
- **Memory application**: Every agent call loads user context

## Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Clerk auth | Vendor dependency vs. days saved on auth plumbing |
| Supabase | Same—fast to ship, harder to self-host |
| monthly_summaries | Extra write on import vs. fast reads at scale |
| Gemini 2.5 Flash Lite routing | Small misclassification risk vs. free-tier quota conservation |
| Tool calling | More deterministic than vector search for structured data |

## Future Enhancements

- Real bank OAuth via Plaid
- Real-time transaction webhooks
- Email/SMS alerts for budget overages
- pgvector semantic search (schema ready)
- Mobile app (React Native)
- Advanced ML anomaly detection
- Personalized spending recommendations

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

### Database Migrations

All migrations should be applied through Supabase dashboard or by running schema.sql.

## Support

For issues or questions, please open a GitHub issue.

## License

MIT
