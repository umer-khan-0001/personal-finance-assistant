'use client'

import { useEffect, useState } from 'react'
import { DashboardStats } from '@/types'
import SpendingOverview from '@/components/dashboard/SpendingOverview'
import CategoryChart from '@/components/dashboard/CategoryChart'
import SpendingTrend from '@/components/dashboard/SpendingTrend'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import BudgetProgress from '@/components/dashboard/BudgetProgress'
import SubscriptionAlert from '@/components/dashboard/SubscriptionAlert'
import AnomalyAlert from '@/components/dashboard/AnomalyAlert'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) {
          throw new Error(`Failed to fetch dashboard stats: ${res.statusText}`)
        }
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden p-4 md:p-8 flex flex-col space-y-6 max-w-7xl mx-auto w-full h-full min-h-0">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Real-time overview of your personal finances</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6">
        <SpendingOverview stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryChart categories={stats.topCategories} />
          <SpendingTrend data={stats.spendingTrend || []} />
        </div>

        {stats.anomalies && stats.anomalies.length > 0 && <AnomalyAlert anomalies={stats.anomalies} />}

        {stats.subscriptions && stats.subscriptions.length > 0 && (
          <SubscriptionAlert subscriptions={stats.subscriptions} />
        )}

        {stats.budgetStatus && stats.budgetStatus.length > 0 && (
          <BudgetProgress budgets={stats.budgetStatus} />
        )}

        <RecentTransactions transactions={stats.recentTransactions} />
      </div>
    </div>
  )
}
