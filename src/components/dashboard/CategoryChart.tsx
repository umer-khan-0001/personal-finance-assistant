'use client'

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface Props {
  categories: Array<{ category: string; total: number }>
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

export default function CategoryChart({ categories }: Props) {
  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-[380px] flex items-center justify-center">
        <p className="text-gray-500">No spending data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col h-[380px]">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">
        Spending by Category
      </h2>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {categories.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
