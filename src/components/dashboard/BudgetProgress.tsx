'use client'

import { BudgetWithStatus } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  budgets: BudgetWithStatus[]
}

export default function BudgetProgress({ budgets }: Props) {
  if (budgets.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Budget Status</h2>
      <div className="space-y-4">
        {budgets.map((budget) => (
          <div key={budget.id} className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-gray-900">{budget.category}</span>
              <span className={`font-medium ${
                budget.isOver ? 'text-red-600' : 'text-gray-700'
              }`}>
                {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  budget.isOver
                    ? 'bg-red-600'
                    : budget.isWarning
                      ? 'bg-yellow-500'
                      : 'bg-green-600'
                }`}
                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
              />
            </div>
            <div className="text-sm text-gray-500">
              {budget.percentage.toFixed(0)}% used
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
