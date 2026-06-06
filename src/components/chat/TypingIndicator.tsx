'use client'

export default function TypingIndicator() {
  return (
    <div className="flex justify-start px-4 py-2">
      <div className="bg-gray-100 rounded-lg px-4 py-3 flex gap-1">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
      </div>
    </div>
  )
}
