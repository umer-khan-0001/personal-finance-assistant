'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface TrendData {
  month: string
  total: number
}

interface Props {
  data: TrendData[]
}

export default function SpendingTrend({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-[380px] flex items-center justify-center">
        <p className="text-gray-500">No trend data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col h-[380px]">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">
        Spending Trend (6 months)
      </h2>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#6366f1"
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
