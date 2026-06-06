'use client'

import { useState, useEffect } from 'react'
import { BudgetWithStatus } from '@/types'
import BudgetCard from '@/components/budgets/BudgetCard'
import BudgetForm from '@/components/budgets/BudgetForm'

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithStatus[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets')
      const data = await res.json()
      setBudgets(data.budgetStatus)
    } catch (error) {
      console.error('Failed to fetch budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [])

  const handleBudgetCreated = () => {
    fetchBudgets()
  }

  const handleBudgetDeleted = () => {
    fetchBudgets()
  }

  return (
    <div className="flex-1 overflow-hidden p-4 md:p-8 flex flex-col space-y-6 max-w-7xl mx-auto w-full h-full min-h-0">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
        <p className="text-gray-500 mt-2">Set and manage your spending budgets</p>
      </div>

      <BudgetForm onSuccess={handleBudgetCreated} />

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {loading ? (
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onDelete={handleBudgetDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
