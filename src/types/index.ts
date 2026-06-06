export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  amount: number;
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
  isWarning: boolean;
}

export interface UserMemory {
  user_id: string;
  preferences: {
    pay_day?: number;
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
  | 'SIMPLE_SPENDING_LOOKUP'
  | 'CATEGORY_BREAKDOWN'
  | 'TIME_COMPARISON'
  | 'ANOMALY_DETECTION'
  | 'SUBSCRIPTION_DETECTION'
  | 'BUDGET_QUERY'
  | 'BUDGET_SET'
  | 'RECEIPT_OCR'
  | 'MERCHANT_LOOKUP'
  | 'GENERAL_SUMMARY'
  | 'MEMORY_UPDATE'
  | 'SAVINGS_ADVICE'
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
  monthOverMonthChange: number;
  topCategories: { category: string; total: number }[];
  recentTransactions: Transaction[];
  budgetStatus: BudgetWithStatus[];
  subscriptions: DetectedSubscription[];
  anomalies: Transaction[];
  spendingTrend?: { month: string; total: number }[];
}

export interface ReceiptExtraction {
  merchant: string;
  date: string;
  total: number;
  currency: string;
  line_items: { name: string; amount: number }[];
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}
