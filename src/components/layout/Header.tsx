'use client'

import { UserButton } from '@clerk/nextjs'

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Personal Finance</h1>
        <UserButton />
      </div>
    </header>
  )
}
