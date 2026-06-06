'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export default function SettingsPage() {
  const { user } = useUser()
  const [preferences, setPreferences] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        const res = await fetch('/api/memory')
        const data = await res.json()
        setPreferences(data.memory.preferences)
      } catch (error) {
        console.error('Failed to fetch memory:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMemory()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/memory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      })
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
  }

  return (
    <div className="flex-1 overflow-hidden p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-xs text-gray-500 mt-1">Manage your preferences and memory</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2 text-gray-900">Account</h2>
        <p className="text-sm text-gray-600">Email: {user?.primaryEmailAddress?.emailAddress}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-900">Preferences</h2>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Pay Day (day of month)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={(preferences.pay_day as number) || ''}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    pay_day: parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Currency
              </label>
              <input
                type="text"
                value={(preferences.currency as string) || 'PKR'}
                onChange={(e) =>
                  setPreferences({ ...preferences, currency: e.target.value })
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Notes
            </label>
            <textarea
              value={(preferences.notes as string) || ''}
              onChange={(e) =>
                setPreferences({ ...preferences, notes: e.target.value })
              }
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
