'use client'

import { Transaction } from '@/types'
import { AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  anomalies: Transaction[]
}

export default function AnomalyAlert({ anomalies }: Props) {
  if (anomalies.length === 0) {
    return null
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">Unusual Activity</h3>
          <p className="text-sm text-amber-700 mt-2">
            We detected {anomalies.length} unusual transaction
            {anomalies.length !== 1 ? 's' : ''}:
          </p>
          <ul className="mt-3 space-y-2">
            {anomalies.slice(0, 3).map((tx) => (
              <li key={tx.id} className="text-sm text-amber-700">
                <span className="font-medium">{tx.merchant}</span> -{' '}
                {formatCurrency(Math.abs(tx.amount))} on {tx.date} (
                {tx.category})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
