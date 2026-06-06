'use client'

import { DetectedSubscription } from '@/types'
import { AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  subscriptions: DetectedSubscription[]
}

export default function SubscriptionAlert({ subscriptions }: Props) {
  if (subscriptions.length === 0) {
    return null
  }

  const unacknowledged = subscriptions.filter((s) => !s.is_acknowledged)

  if (unacknowledged.length === 0) {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900">Subscriptions Detected</h3>
          <p className="text-sm text-blue-700 mt-2">
            We found {unacknowledged.length} recurring charge
            {unacknowledged.length !== 1 ? 's' : ''}:
          </p>
          <ul className="mt-3 space-y-2">
            {unacknowledged.map((sub) => (
              <li key={sub.id} className="text-sm text-blue-700">
                <span className="font-medium">{sub.merchant}</span> -{' '}
                {formatCurrency(sub.average_amount)} every ~{sub.frequency_days} days
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
