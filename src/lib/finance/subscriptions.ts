import { SupabaseClient } from '@supabase/supabase-js'
import { DetectedSubscription } from '@/types'

export interface SubscriptionCandidate {
  merchant: string
  occurrences: number
  averageAmount: number
  frequencyDays: number
  stddevDays: number
  lastSeen: string
  firstSeen: string
}

export async function detectSubscriptions(
  supabase: SupabaseClient,
  userId: string
): Promise<DetectedSubscription[]> {
  // Check if detected_subscriptions is fresh (< 7 days)
  const { data: existingSubscriptions } = await supabase
    .from('detected_subscriptions')
    .select('*')
    .eq('user_id', userId)

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  if (existingSubscriptions && existingSubscriptions.length > 0) {
    const lastUpdated = new Date(existingSubscriptions[0].created_at || now)
    if (lastUpdated > sevenDaysAgo) {
      return existingSubscriptions
    }
  }

  // Re-run detection from transactions
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('merchant, amount, date')
    .eq('user_id', userId)
    .lt('amount', 0)
    .order('date', { ascending: true })

  if (txError) throw txError

  if (!transactions || transactions.length === 0) {
    return []
  }

  // Group by merchant
  const merchantTransactions: Record<
    string,
    Array<{ amount: number; date: string }>
  > = {}

  transactions.forEach((tx) => {
    if (!merchantTransactions[tx.merchant]) {
      merchantTransactions[tx.merchant] = []
    }
    merchantTransactions[tx.merchant].push({
      amount: Math.abs(tx.amount),
      date: tx.date,
    })
  })

  // Find subscription candidates
  const subscriptionCandidates: SubscriptionCandidate[] = []

  Object.entries(merchantTransactions).forEach(([merchant, txs]) => {
    if (txs.length < 3) return

    // Calculate intervals between transactions
    const intervals: number[] = []
    for (let i = 1; i < txs.length; i++) {
      const prevDate = new Date(txs[i - 1].date)
      const currDate = new Date(txs[i].date)
      const daysDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      intervals.push(daysDiff)
    }

    // Calculate mean and stddev of intervals
    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - meanInterval, 2), 0) /
      intervals.length
    const stddevInterval = Math.sqrt(variance)

    // Check if regular (low stddev relative to mean)
    if (stddevInterval < 5 && meanInterval > 0) {
      const averageAmount =
        txs.reduce((sum, tx) => sum + tx.amount, 0) / txs.length
      subscriptionCandidates.push({
        merchant,
        occurrences: txs.length,
        averageAmount,
        frequencyDays: Math.round(meanInterval),
        stddevDays: Math.round(stddevInterval),
        lastSeen: txs[txs.length - 1].date,
        firstSeen: txs[0].date,
      })
    }
  })

  // Upsert detected subscriptions
  for (const candidate of subscriptionCandidates) {
    await supabase.from('detected_subscriptions').upsert(
      {
        user_id: userId,
        merchant: candidate.merchant,
        average_amount: candidate.averageAmount,
        frequency_days: candidate.frequencyDays,
        last_seen: candidate.lastSeen,
        first_seen: candidate.firstSeen,
        is_acknowledged: false,
      },
      { onConflict: 'user_id, merchant' }
    )
  }

  // Return all detected subscriptions
  const { data: detected } = await supabase
    .from('detected_subscriptions')
    .select('*')
    .eq('user_id', userId)

  return detected || []
}

export function estimateNextChargeDate(
  lastSeen: string,
  frequencyDays: number
): string {
  const date = new Date(lastSeen)
  date.setDate(date.getDate() + frequencyDays)
  return date.toISOString().split('T')[0]
}
