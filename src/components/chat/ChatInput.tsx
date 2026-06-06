'use client'

import { useRef, useState } from 'react'
import { Send, Paperclip } from 'lucide-react'

interface Props {
  onSendMessage: (message: string, imageBase64?: string) => void
  isLoading: boolean
}

export default function ChatInput({ onSendMessage, isLoading }: Props) {
  const [message, setMessage] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!message.trim()) return
    onSendMessage(message, imagePreview || undefined)
    setMessage('')
    setImagePreview(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setImagePreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {imagePreview && (
        <div className="mb-4 flex items-center gap-2">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-16 w-16 object-cover rounded"
          />
          <button
            onClick={() => setImagePreview(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Remove
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          disabled={isLoading}
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your finances..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={3}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
