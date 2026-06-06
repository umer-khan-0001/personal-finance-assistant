'use client'

import { useState, useEffect } from 'react'
import { Transaction } from '@/types'
import TransactionTable from '@/components/transactions/TransactionTable'
import CsvUploader from '@/components/transactions/CsvUploader'
import TransactionFilters from '@/components/transactions/TransactionFilters'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions')
      const data = await res.json()
      setTransactions(data.transactions)
      setFilteredTransactions(data.transactions)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleFilter = (filters: Record<string, string>) => {
    let filtered = transactions

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter((tx) => tx.category === filters.category)
    }

    if (filters.merchant) {
      filtered = filtered.filter((tx) =>
        tx.merchant.toLowerCase().includes(filters.merchant.toLowerCase())
      )
    }

    setFilteredTransactions(filtered)
  }

  const handleUploadSuccess = () => {
    fetchTransactions()
  }

  return (
    <div className="flex-1 overflow-hidden p-4 md:p-8 flex flex-col space-y-6 max-w-7xl mx-auto w-full h-full min-h-0">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-2">Import and view your financial transactions</p>
      </div>

      <CsvUploader onSuccess={handleUploadSuccess} />

      <TransactionFilters onFilter={handleFilter} />

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {loading ? (
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        ) : (
          <TransactionTable transactions={filteredTransactions} />
        )}
      </div>
    </div>
  )
}
