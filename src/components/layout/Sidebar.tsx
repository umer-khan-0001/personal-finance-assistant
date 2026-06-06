'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  CreditCard,
  Wallet,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/chat', label: 'Chat', icon: MessageSquare },
  { href: '/app/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/app/budgets', label: 'Budgets', icon: Wallet },
  { href: '/app/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 bg-sidebar text-white flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Finance</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 text-center text-xs text-gray-400">
        Made by Umer for Revonix
      </div>
    </aside>
  )
}
