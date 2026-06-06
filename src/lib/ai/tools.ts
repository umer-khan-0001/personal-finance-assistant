import { SupabaseClient } from '@supabase/supabase-js'
import * as queries from '@/lib/finance/queries'
import * as aggregations from '@/lib/finance/aggregations'
import * as anomaly from '@/lib/finance/anomaly'
import * as subscriptions from '@/lib/finance/subscriptions'

export const TOOLS: any[] = [
  {
    type: 'function',
    function: {
      name: 'get_spending_summary',
      description: 'Get spending summary for a date range, optionally filtered by category',
      parameters: {
        type: 'object' as const,
        properties: {
          category: {
            type: 'string',
            description: 'Optional category filter',
          },
          start_date: {
            type: 'string',
            description: 'Start date (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date (YYYY-MM-DD)',
          },
        },
        required: ['start_date', 'end_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_monthly_trend',
      description: 'Get monthly spending trend for charting',
      parameters: {
        type: 'object' as const,
        properties: {
          category: {
            type: 'string',
            description: 'Optional category filter',
          },
          months: {
            type: 'number',
            description: 'Number of months to retrieve (default 6)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_top_merchants',
      description: 'Get top merchants by spending amount',
      parameters: {
        type: 'object' as const,
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date (YYYY-MM-DD)',
          },
          limit: {
            type: 'number',
            description: 'Number of merchants to return (default 10)',
          },
        },
        required: ['start_date', 'end_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'detect_anomalies',
      description: 'Detect unusual spending patterns',
      parameters: {
        type: 'object' as const,
        properties: {
          lookback_months: {
            type: 'number',
            description: 'Number of months to analyze (default 3)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'detect_subscriptions',
      description: 'Detect recurring subscription charges',
      parameters: {
        type: 'object' as const,
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budget_status',
      description: 'Get budget status for current month',
      parameters: {
        type: 'object' as const,
        properties: {
          category: {
            type: 'string',
            description: 'Optional category filter',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_budget',
      description: 'Set or update a budget for a category',
      parameters: {
        type: 'object' as const,
        properties: {
          category: {
            type: 'string',
            description: 'Category name',
          },
          amount: {
            type: 'number',
            description: 'Budget amount',
          },
          period: {
            type: 'string',
            enum: ['monthly', 'weekly'],
            description: 'Budget period (default monthly)',
          },
        },
        required: ['category', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_user_memory',
      description: 'Get user preferences and memory',
      parameters: {
        type: 'object' as const,
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_user_memory',
      description: 'Update user preferences and memory',
      parameters: {
        type: 'object' as const,
        properties: {
          key: {
            type: 'string',
            description: 'Preference key',
          },
          value: {
            type: 'string',
            description: 'Preference value',
          },
        },
        required: ['key', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_merchant_info',
      description: 'Look up information about a merchant',
      parameters: {
        type: 'object' as const,
        properties: {
          merchant_name: {
            type: 'string',
            description: 'Merchant name',
          },
          charge_amount: {
            type: 'number',
            description: 'Optional charge amount',
          },
        },
        required: ['merchant_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_transactions',
      description: 'Get recent transactions with optional filters',
      parameters: {
        type: 'object' as const,
        properties: {
          limit: {
            type: 'number',
            description: 'Number of transactions (default 20)',
          },
          category: {
            type: 'string',
            description: 'Optional category filter',
          },
          merchant: {
            type: 'string',
            description: 'Optional merchant filter',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_periods',
      description: 'Compare spending between two time periods',
      parameters: {
        type: 'object' as const,
        properties: {
          period1_start: {
            type: 'string',
            description: 'First period start (YYYY-MM-DD)',
          },
          period1_end: {
            type: 'string',
            description: 'First period end (YYYY-MM-DD)',
          },
          period2_start: {
            type: 'string',
            description: 'Second period start (YYYY-MM-DD)',
          },
          period2_end: {
            type: 'string',
            description: 'Second period end (YYYY-MM-DD)',
          },
          category: {
            type: 'string',
            description: 'Optional category filter',
          },
        },
        required: ['period1_start', 'period1_end', 'period2_start', 'period2_end'],
      },
    },
  },
]

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<unknown> {
  try {
    switch (toolName) {
      case 'get_spending_summary': {
        const result = await queries.getSpendingSummary(
          supabase,
          userId,
          (toolInput.category as string) || null,
          toolInput.start_date as string,
          toolInput.end_date as string
        )
        return { success: true, data: result }
      }

      case 'get_monthly_trend': {
        const result = await aggregations.getSpendingByMonth(
          supabase,
          userId,
          (toolInput.category as string) || undefined,
          (toolInput.months as number) || 6
        )
        return { success: true, data: result }
      }

      case 'get_top_merchants': {
        const result = await queries.getTopMerchants(
          supabase,
          userId,
          toolInput.start_date as string,
          toolInput.end_date as string,
          (toolInput.limit as number) || 10
        )
        return { success: true, data: result }
      }

      case 'detect_anomalies': {
        const result = await anomaly.detectAnomalies(
          supabase,
          userId,
          (toolInput.lookback_months as number) || 3
        )
        return {
          success: true,
          data: result.anomalies.slice(0, 10).map((a) => ({
            merchant: a.transaction.merchant,
            amount: a.transaction.amount,
            date: a.transaction.date,
            reason: a.reason,
          })),
        }
      }

      case 'detect_subscriptions': {
        const result = await subscriptions.detectSubscriptions(supabase, userId)
        return {
          success: true,
          data: result.map((s) => ({
            merchant: s.merchant,
            average_amount: s.average_amount,
            frequency_days: s.frequency_days,
            last_seen: s.last_seen,
          })),
        }
      }

      case 'get_budget_status': {
        const result = await queries.getBudgetStatus(
          supabase,
          userId,
          (toolInput.category as string) || undefined
        )
        return { success: true, data: result }
      }

      case 'set_budget': {
        const result = await queries.createBudget(
          supabase,
          userId,
          toolInput.category as string,
          toolInput.amount as number,
          (toolInput.period as 'monthly' | 'weekly') || 'monthly'
        )
        return { success: true, data: result }
      }

      case 'get_user_memory': {
        const result = await queries.getUserMemory(supabase, userId)
        return { success: true, data: result }
      }

      case 'update_user_memory': {
        const memory = await queries.getUserMemory(supabase, userId)
        const updated = {
          ...memory.preferences,
          [toolInput.key as string]: toolInput.value,
        }
        const result = await queries.upsertUserMemory(supabase, userId, updated)
        return { success: true, data: result }
      }

      case 'search_merchant_info': {
        // Tavily API call would go here - for now return placeholder
        return {
          success: true,
          data: {
            merchant: toolInput.merchant_name,
            description: 'Merchant information lookup not yet configured',
          },
        }
      }

      case 'get_recent_transactions': {
        const result = await queries.getRecentTransactions(supabase, userId, {
          category: (toolInput.category as string) || undefined,
          merchant: (toolInput.merchant as string) || undefined,
          limit: (toolInput.limit as number) || 20,
        })
        return { success: true, data: result }
      }

      case 'compare_periods': {
        const period1 = await queries.getSpendingSummary(
          supabase,
          userId,
          (toolInput.category as string) || null,
          toolInput.period1_start as string,
          toolInput.period1_end as string
        )
        const period2 = await queries.getSpendingSummary(
          supabase,
          userId,
          (toolInput.category as string) || null,
          toolInput.period2_start as string,
          toolInput.period2_end as string
        )

        const total1 = period1.reduce((sum, cat) => sum + cat.total, 0)
        const total2 = period2.reduce((sum, cat) => sum + cat.total, 0)
        const diff = total2 - total1
        const pctChange = total1 > 0 ? ((diff / total1) * 100).toFixed(1) : '0'

        return {
          success: true,
          data: {
            period1_total: parseFloat(total1.toFixed(2)),
            period2_total: parseFloat(total2.toFixed(2)),
            difference: parseFloat(diff.toFixed(2)),
            percentage_change: parseFloat(pctChange),
          },
        }
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
