'use client'

import { DashboardStats } from '@/types'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  stats: DashboardStats
}

export default function SpendingOverview({ stats }: Props) {
  const cards = [
    {
      label: 'This Month',
      value: stats.currentMonthTotal,
      subtext: 'YTD spending',
    },
    {
      label: 'Last Month',
      value: stats.lastMonthTotal,
      subtext: 'Previous period',
    },
    {
      label: 'Change',
      value: stats.monthOverMonthChange,
      subtext: 'Month-over-month',
      isPercentage: true,
      trend:
        stats.monthOverMonthChange > 0 ? 'up' : 'down',
    },
    {
      label: 'Top Category',
      value: stats.topCategories[0]?.total || 0,
      subtext: stats.topCategories[0]?.category || 'N/A',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600"
        >
          <p className="text-sm font-medium text-gray-600">{card.label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">
              {card.isPercentage
                ? `${card.value.toFixed(1)}%`
                : formatCurrency(card.value)}
            </p>
            {card.trend && (
              card.trend === 'up' ? (
                <TrendingUp className="w-5 h-5 text-red-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-600" />
              )
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">{card.subtext}</p>
        </div>
      ))}
    </div>
  )
}
