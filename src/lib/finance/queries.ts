import { SupabaseClient } from '@supabase/supabase-js'
import { Transaction, MonthlySummary, BudgetWithStatus, Budget, UserMemory, DetectedSubscription } from '@/types'

export async function getSpendingSummary(
  supabase: SupabaseClient,
  userId: string,
  category: string | null,
  startDate: string,
  endDate: string
): Promise<{ category: string; total: number; count: number }[]> {
  let query = supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .lt('amount', 0)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) throw error

  const grouped: Record<string, { total: number; count: number }> = {}

  data?.forEach((row) => {
    const cat = row.category || 'Uncategorized'
    if (!grouped[cat]) {
      grouped[cat] = { total: 0, count: 0 }
    }
    grouped[cat].total += Math.abs(row.amount)
    grouped[cat].count += 1
  })

  return Object.entries(grouped).map(([cat, { total, count }]) => ({
    category: cat,
    total: parseFloat(total.toFixed(2)),
    count,
  }))
}

export async function getMonthlySummaries(
  supabase: SupabaseClient,
  userId: string,
  months: number = 12
): Promise<MonthlySummary[]> {
  const { data, error } = await supabase
    .from('monthly_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(months)

  if (error) throw error

  return data || []
}

export async function getTopMerchants(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<{ merchant: string; total: number; count: number }[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('merchant, amount')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .lt('amount', 0)

  if (error) throw error

  const grouped: Record<string, { total: number; count: number }> = {}

  data?.forEach((row) => {
    if (!grouped[row.merchant]) {
      grouped[row.merchant] = { total: 0, count: 0 }
    }
    grouped[row.merchant].total += Math.abs(row.amount)
    grouped[row.merchant].count += 1
  })

  return Object.entries(grouped)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit)
    .map(([merchant, { total, count }]) => ({
      merchant,
      total: parseFloat(total.toFixed(2)),
      count,
    }))
}

export async function getRecentTransactions(
  supabase: SupabaseClient,
  userId: string,
  filters?: {
    category?: string
    merchant?: string
    startDate?: string
    endDate?: string
    limit?: number
  }
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.merchant) {
    query = query.eq('merchant', filters.merchant)
  }

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('date', filters.endDate)
  }

  query = query.limit(filters?.limit || 20)

  const { data, error } = await query

  if (error) throw error

  return data || []
}

export async function getBudgetStatus(
  supabase: SupabaseClient,
  userId: string,
  category?: string
): Promise<BudgetWithStatus[]> {
  let budgetQuery = supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)

  if (category) {
    budgetQuery = budgetQuery.eq('category', category)
  }

  const { data: budgets, error: budgetError } = await budgetQuery

  if (budgetError) throw budgetError

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const { data: summaries, error: summaryError } = await supabase
    .from('monthly_summaries')
    .select('*')
    .eq('user_id', userId)
    .eq('year', currentYear)
    .eq('month', currentMonth)

  if (summaryError) throw summaryError

  const summaryMap = new Map(
    summaries?.map((s) => [`${s.category}-${s.period || 'monthly'}`, s.total_spent]) || []
  )

  return (budgets || []).map((budget) => {
    const spent = summaryMap.get(`${budget.category}-${budget.period}`) || 0
    const remaining = Math.max(0, budget.amount - spent)
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0

    return {
      ...budget,
      spent: parseFloat(spent.toFixed(2)),
      remaining: parseFloat(remaining.toFixed(2)),
      percentage: parseFloat(percentage.toFixed(1)),
      isOver: spent > budget.amount,
      isWarning: percentage > 80,
    }
  })
}

export async function getUserMemory(
  supabase: SupabaseClient,
  userId: string
): Promise<UserMemory> {
  const { data, error } = await supabase
    .from('user_memory')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return (
    data || {
      user_id: userId,
      preferences: {},
    }
  )
}

export async function upsertUserMemory(
  supabase: SupabaseClient,
  userId: string,
  preferences: Record<string, unknown>
): Promise<UserMemory> {
  const { data, error } = await supabase
    .from('user_memory')
    .upsert(
      {
        user_id: userId,
        preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) throw error

  return data
}

export async function createBudget(
  supabase: SupabaseClient,
  userId: string,
  category: string,
  amount: number,
  period: 'monthly' | 'weekly' = 'monthly'
): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      {
        user_id: userId,
        category,
        amount,
        period,
      },
      { onConflict: 'user_id, category, period' }
    )
    .select()
    .single()

  if (error) throw error

  return data
}

export async function getBudgets(
  supabase: SupabaseClient,
  userId: string
): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error

  return data || []
}

export async function deleteBudget(
  supabase: SupabaseClient,
  budgetId: string
): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', budgetId)

  if (error) throw error
}

export async function getDetectedSubscriptions(
  supabase: SupabaseClient,
  userId: string
): Promise<DetectedSubscription[]> {
  const { data, error } = await supabase
    .from('detected_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('last_seen', { ascending: false })

  if (error) throw error

  return data || []
}

export async function createConversation(
  supabase: SupabaseClient,
  userId: string,
  title?: string
): Promise<string> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: title || `Conversation ${new Date().toLocaleDateString()}`,
    })
    .select('id')
    .single()

  if (error) throw error

  return data.id
}

export async function getConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
  limit: number = 10
): Promise<any[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data || []).reverse()
}

export async function saveMessage(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      metadata: metadata || {},
    })
    .select('id')
    .single()

  if (error) throw error

  return data.id
}
