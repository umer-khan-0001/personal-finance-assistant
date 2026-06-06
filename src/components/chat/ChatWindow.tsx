'use client'

import { useState, useEffect } from 'react'
import { Message } from '@/types'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'

export default function ChatWindow() {
  const [conversationId, setConversationId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize new conversation
    const initializeConversation = async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Hi, I want to analyze my finances',
          }),
        })

        if (res.ok) {
          const reader = res.body?.getReader()
          if (reader) {
            const { value } = await reader.read()
            const text = new TextDecoder().decode(value)
            const responseMatch = text.match(/data: (.*)\n\n/)
            if (responseMatch) {
              const response = JSON.parse(responseMatch[1])
              // Extract conversation ID from first message
              setConversationId(response.conversationId || '')
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize conversation:', err)
      }
    }

    initializeConversation()
  }, [])

  const handleSendMessage = async (
    message: string,
    imageBase64?: string
  ) => {
    if (!message.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          imageBase64,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to send message')
      }

      const reader = res.body?.getReader()
      if (reader) {
        const { value } = await reader.read()
        const text = new TextDecoder().decode(value)
        const responseMatch = text.match(/data: (.*)\n\n/)
        if (responseMatch) {
          const response = JSON.parse(responseMatch[1])
          // Add messages to display
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              role: 'user',
              content: message,
              conversation_id: conversationId,
              created_at: new Date().toISOString(),
            },
            {
              id: Math.random().toString(),
              role: 'assistant',
              content: response.content,
              metadata: response.metadata,
              conversation_id: conversationId,
              created_at: new Date().toISOString(),
            },
          ])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Financial Assistant
            </h1>
            <p className="text-gray-600 mb-8">
              Ask me anything about your spending, budgets, or subscriptions
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'How much did I spend this month?',
                'Do I have any subscriptions?',
                "What's my biggest spending category?",
                'Am I over budget anywhere?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSendMessage(suggestion)}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition text-sm font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <MessageList messages={messages} />
          {isLoading && <TypingIndicator />}
          {error && (
            <div className="px-4 py-2 bg-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}
        </>
      )}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  )
}
