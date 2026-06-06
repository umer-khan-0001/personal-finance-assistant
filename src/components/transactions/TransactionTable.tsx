'use client'

import { Transaction } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  transactions: Transaction[]
}

export default function TransactionTable({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Merchant
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Category
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Description
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                Amount
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition"
              >
                <td className="px-6 py-3 text-sm text-gray-900">
                  {new Date(tx.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  {tx.merchant}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {tx.category}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {tx.description || '-'}
                </td>
                <td className={`px-6 py-3 text-sm font-semibold text-right ${
                  tx.amount < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {tx.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                </td>
                <td className="px-6 py-3 text-sm text-center">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                    {tx.source}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
