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

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden flex gap-1 p-2 bg-white border-t border-gray-200 overflow-x-auto">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded text-xs transition-colors flex-shrink-0 ${
              isActive
                ? 'bg-accent text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
