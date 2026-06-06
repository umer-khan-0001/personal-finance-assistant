'use client'

import { useState } from 'react'
import { TransactionCategory } from '@/types'

const CATEGORIES: TransactionCategory[] = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Housing',
  'Utilities',
  'Subscriptions',
  'Travel',
  'Education',
  'Personal Care',
]

interface Props {
  onSuccess: () => void
}

export default function BudgetForm({ onSuccess }: Props) {
  const [category, setCategory] = useState(CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || parseFloat(amount) <= 0) return

    setLoading(true)

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount: parseFloat(amount),
          period,
        }),
      })

      if (res.ok) {
        setAmount('')
        setCategory(CATEGORIES[0])
        setPeriod('monthly')
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create budget:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow p-6"
    >
      <h2 className="text-lg font-semibold mb-4 text-gray-900">
        Create New Budget
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TransactionCategory)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Period
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'monthly' | 'weekly')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !amount}
        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-medium"
      >
        {loading ? 'Creating...' : 'Create Budget'}
      </button>
    </form>
  )
}
