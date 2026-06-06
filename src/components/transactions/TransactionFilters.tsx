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
  'Income',
  'Uncategorized',
]

interface Props {
  onFilter: (filters: Record<string, string>) => void
}

export default function TransactionFilters({ onFilter }: Props) {
  const [category, setCategory] = useState('all')
  const [merchant, setMerchant] = useState('')

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    onFilter({ category: newCategory, merchant })
  }

  const handleMerchantChange = (newMerchant: string) => {
    setMerchant(newMerchant)
    onFilter({ category, merchant: newMerchant })
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Merchant
        </label>
        <input
          type="text"
          value={merchant}
          onChange={(e) => handleMerchantChange(e.target.value)}
          placeholder="Search merchant..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  )
}
