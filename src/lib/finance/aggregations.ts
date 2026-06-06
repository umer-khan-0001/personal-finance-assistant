import { SupabaseClient } from '@supabase/supabase-js'
import { MonthlySummary } from '@/types'

export interface SpendingByMonth {
  year: number
  month: number
  total: number
}

export async function getSpendingByMonth(
  supabase: SupabaseClient,
  userId: string,
  category?: string,
  months: number = 12
): Promise<SpendingByMonth[]> {
  let query = supabase
    .from('monthly_summaries')
    .select('year, month, total_spent')
    .eq('user_id', userId)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query.order('year', { ascending: false }).order('month', { ascending: false }).limit(months)

  if (error) throw error

  return (data || [])
    .map((row) => ({
      year: row.year,
      month: row.month,
      total: parseFloat(row.total_spent.toString()),
    }))
    .sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year))
}

export function calculateMonthOverMonthChange(
  currentTotal: number,
  lastTotal: number
): number {
  if (lastTotal === 0) return 0
  return ((currentTotal - lastTotal) / lastTotal) * 100
}

export function getCategoryPercentage(
  categoryTotal: number,
  allCategoriesTotal: number
): number {
  if (allCategoriesTotal === 0) return 0
  return (categoryTotal / allCategoriesTotal) * 100
}

export async function getTopCategories(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string,
  limit: number = 5
): Promise<{ category: string; total: number; percentage: number }[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .lt('amount', 0)

  if (error) throw error

  const grouped: Record<string, number> = {}

  data?.forEach((row) => {
    const cat = row.category || 'Uncategorized'
    grouped[cat] = (grouped[cat] || 0) + Math.abs(row.amount)
  })

  const total = Object.values(grouped).reduce((sum, val) => sum + val, 0)

  return Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category, amount]) => ({
      category,
      total: parseFloat(amount.toFixed(2)),
      percentage: parseFloat(((amount / total) * 100).toFixed(1)),
    }))
}

export function getTotalSpending(summaries: MonthlySummary[]): number {
  return summaries.reduce((sum, s) => sum + parseFloat(s.total_spent.toString()), 0)
}

export async function getSpendingTrend(
  supabase: SupabaseClient,
  userId: string,
  monthsCount: number = 6
): Promise<{ month: string; total: number }[]> {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsCount + 1, 1)
  const startDateStr = startDate.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount')
    .eq('user_id', userId)
    .gte('date', startDateStr)
    .lt('amount', 0)

  if (error) throw error

  const trendMap = new Map<string, number>()
  for (let i = 0; i < monthsCount; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1 - i), 1)
    const monthKey = d.toLocaleDateString('en-US', { month: 'short' })
    trendMap.set(monthKey, 0)
  }

  data?.forEach((tx) => {
    const txDate = new Date(tx.date)
    const monthKey = txDate.toLocaleDateString('en-US', { month: 'short' })
    if (trendMap.has(monthKey)) {
      trendMap.set(monthKey, trendMap.get(monthKey)! + Math.abs(parseFloat(tx.amount)))
    }
  })

  return Array.from(trendMap.entries()).map(([month, total]) => ({
    month,
    total: Math.round(total),
  }))
}
