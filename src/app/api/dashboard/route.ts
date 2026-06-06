import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import * as queries from '@/lib/finance/queries'
import * as aggregations from '@/lib/finance/aggregations'
import * as subscriptionsModule from '@/lib/finance/subscriptions'
import * as anomalyModule from '@/lib/finance/anomaly'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear

    const currentMonthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
    const currentMonthEnd = new Date(currentYear, currentMonth, 0)
      .toISOString()
      .split('T')[0]

    const lastMonthStart = `${lastYear}-${String(lastMonth).padStart(2, '0')}-01`
    const lastMonthEnd = new Date(lastYear, lastMonth, 0).toISOString().split('T')[0]

    // Fetch all data in parallel
    const [
      currentMonthSpending,
      lastMonthSpending,
      budgetStatus,
      subscriptions,
      recentTx,
      anomalies,
    ] = await Promise.all([
      queries
        .getSpendingSummary(supabase, userId, null, currentMonthStart, currentMonthEnd)
        .then((data) =>
          Math.abs(data.reduce((sum, cat) => sum + cat.total, 0))
        ),
      queries
        .getSpendingSummary(supabase, userId, null, lastMonthStart, lastMonthEnd)
        .then((data) =>
          Math.abs(data.reduce((sum, cat) => sum + cat.total, 0))
        ),
      queries.getBudgetStatus(supabase, userId),
      subscriptionsModule.detectSubscriptions(supabase, userId),
      queries.getRecentTransactions(supabase, userId, { limit: 10 }),
      anomalyModule
        .detectAnomalies(supabase, userId, 3)
        .then((data) => data.anomalies.slice(0, 5).map((a) => a.transaction)),
    ])

    const monthOverMonthChange =
      lastMonthSpending > 0
        ? ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100
        : 0

    const topCategories = await aggregations.getTopCategories(
      supabase,
      userId,
      currentMonthStart,
      currentMonthEnd,
      5
    )

    const spendingTrend = await aggregations.getSpendingTrend(supabase, userId, 6)

    return Response.json({
      currentMonthTotal: currentMonthSpending,
      lastMonthTotal: lastMonthSpending,
      monthOverMonthChange,
      topCategories,
      recentTransactions: recentTx,
      budgetStatus,
      subscriptions,
      anomalies,
      spendingTrend,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard' },
      { status: 500 }
    )
  }
}
