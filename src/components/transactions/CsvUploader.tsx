'use client'

import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { Transaction } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  onSuccess: () => void
}

export default function CsvUploader({ onSuccess }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<Transaction[] | null>(null)
  const [totalRows, setTotalRows] = useState(0)
  const [skipped, setSkipped] = useState<any[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file?.type === 'text/csv' || file?.name.endsWith('.csv')) {
      handleFileUpload(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    setUploadedFile(file)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/transactions/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.preview) {
        setPreview(data.preview)
        setTotalRows(data.totalRows)
        setSkipped(data.skippedRows)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmUpload = async () => {
    try {
      const file = uploadedFile
      if (!file) return

      setIsLoading(true)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('confirmed', 'true')

      const res = await fetch('/api/transactions/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.imported > 0) {
        setPreview(null)
        setSkipped([])
        setUploadedFile(null)
        setTotalRows(0)
        onSuccess()
      }
    } catch (error) {
      console.error('Import failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (preview) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Import Preview</h2>
        <div className="space-y-4">
          {preview.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Sample rows:</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-2 py-1">Date</th>
                      <th className="text-left px-2 py-1">Merchant</th>
                      <th className="text-left px-2 py-1">Amount</th>
                      <th className="text-left px-2 py-1">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((tx, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-2 py-1">{tx.date}</td>
                        <td className="px-2 py-1">{tx.merchant}</td>
                        <td className="px-2 py-1">{formatCurrency(Math.abs(tx.amount))}</td>
                        <td className="px-2 py-1">{tx.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {skipped.length > 0 && (
            <div className="bg-yellow-50 p-3 rounded">
              <p className="text-sm font-medium text-yellow-800">
                {skipped.length} rows skipped:
              </p>
              <ul className="mt-2 text-xs text-yellow-700 space-y-1">
                {skipped.slice(0, 3).map((s, idx) => (
                  <li key={idx}>Row {s.row}: {s.reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                setPreview(null)
                setUploadedFile(null)
                setTotalRows(0)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmUpload}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Importing...' : `Confirm & Import ${totalRows} rows`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
        isDragging
          ? 'border-indigo-600 bg-indigo-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
      <p className="font-semibold text-gray-900 mb-1">
        Drop your CSV file here
      </p>
      <p className="text-sm text-gray-500">
        or click to browse
      </p>
      {isLoading && (
        <p className="text-sm text-indigo-600 mt-2">Processing...</p>
      )}
    </div>
  )
}
