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
