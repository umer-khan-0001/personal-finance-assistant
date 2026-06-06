'use client'

import { BudgetWithStatus } from '@/types'
import { Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  budget: BudgetWithStatus
  onDelete: () => void
}

export default function BudgetCard({ budget, onDelete }: Props) {
  const handleDelete = async () => {
    if (!confirm('Delete this budget?')) return

    try {
      await fetch(`/api/budgets?id=${budget.id}`, { method: 'DELETE' })
      onDelete()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{budget.category}</h3>
          <p className="text-sm text-gray-500">
            {budget.period === 'monthly' ? 'Monthly' : 'Weekly'} budget
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 text-gray-400 hover:text-red-600 transition"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span className={budget.isOver ? 'text-red-600' : 'text-gray-700'}>
            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
          </span>
          <span className="text-gray-500">{budget.percentage.toFixed(0)}%</span>
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
      </div>

      <div className="text-sm">
        {budget.isOver ? (
          <p className="text-red-600 font-medium">
            Over budget by {formatCurrency(Math.abs(budget.remaining))}
          </p>
        ) : (
          <p className="text-green-600 font-medium">
            {formatCurrency(budget.remaining)} remaining
          </p>
        )}
      </div>
    </div>
  )
}
