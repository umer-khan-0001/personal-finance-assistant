import { SupabaseClient } from '@supabase/supabase-js'
import { Transaction } from '@/types'

export interface AnomalyResult {
  transactions: Transaction[]
  anomalies: Array<{ transaction: Transaction; reason: string; zscore: number }>
}

export async function detectAnomalies(
  supabase: SupabaseClient,
  userId: string,
  lookbackMonths: number = 3
): Promise<AnomalyResult> {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Get monthly summaries for last N months
  const { data: summaries, error: summaryError } = await supabase
    .from('monthly_summaries')
    .select('category, total_spent')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(lookbackMonths)

  if (summaryError) throw summaryError

  // Calculate baseline per category
  const categoryStats: Record<string, { mean: number; stddev: number; values: number[] }> = {}

  summaries?.forEach((row) => {
    const cat = row.category || 'Uncategorized'
    const amount = parseFloat(row.total_spent.toString())

    if (!categoryStats[cat]) {
      categoryStats[cat] = { mean: 0, stddev: 0, values: [] }
    }
    categoryStats[cat].values.push(amount)
  })

  // Calculate mean and stddev for each category
  Object.entries(categoryStats).forEach(([, stats]) => {
    stats.mean = stats.values.reduce((a, b) => a + b, 0) / stats.values.length
    const variance =
      stats.values.reduce((sum, val) => sum + Math.pow(val - stats.mean, 2), 0) /
      stats.values.length
    stats.stddev = Math.sqrt(variance)
  })

  // Get current month transactions
  const { data: transactions, error: transactionError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)

  if (transactionError) throw transactionError

  // Find anomalies
  const anomalies: Array<{ transaction: Transaction; reason: string; zscore: number }> = []
  const firstTimeThreshold = 50

  const merchantCounts: Record<string, number> = {}
  transactions?.forEach((tx) => {
    merchantCounts[tx.merchant] = (merchantCounts[tx.merchant] || 0) + 1
  })

  transactions?.forEach((tx) => {
    const amount = Math.abs(tx.amount)
    const cat = tx.category || 'Uncategorized'
    const stats = categoryStats[cat]

    if (!stats || stats.stddev === 0) return

    // Calculate z-score
    const zscore = (amount - stats.mean) / stats.stddev

    let isAnomaly = false
    let reason = ''

    // Flag if outlier (>2 stddev)
    if (zscore > 2) {
      isAnomaly = true
      reason = `High amount for ${cat} (${zscore.toFixed(1)}σ above average)`
    }

    // Flag first-time merchants with large amounts
    if (merchantCounts[tx.merchant] === 1 && amount > firstTimeThreshold) {
      isAnomaly = true
      reason = `First transaction from ${tx.merchant} for $${amount.toFixed(2)}`
    }

    if (isAnomaly) {
      anomalies.push({
        transaction: tx,
        reason,
        zscore,
      })
    }
  })

  // Sort by z-score descending and limit to 10
  anomalies.sort((a, b) => b.zscore - a.zscore).splice(10)

  return {
    transactions: transactions || [],
    anomalies,
  }
}
