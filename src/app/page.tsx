'use client'

import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Sparkles, ChevronRight } from 'lucide-react'

export default function Home() {
  const { isSignedIn } = useAuth()

  if (isSignedIn) {
    redirect('/app')
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-900 to-slate-950 flex flex-col justify-between text-white font-sans overflow-x-hidden">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            REVONIX FINANCE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-gray-300 hover:text-white transition"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.4)] transition"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto px-6 py-12 z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Hero Left */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Powered by Gemini AI
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-b from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
              Smart Financial <br />
              Management
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto lg:mx-0">
              Take complete control of your spending, track budgets, and chat with your personal AI financial advisor.
            </p>

            {/* Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-left max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-300">AI Spending Chat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-sm text-gray-300">Smart CSV Import</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-sm text-gray-300">Anomalies & Alerts</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Sign-in / Sign-up Callout card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              {/* Glow decoration */}
              <div className="absolute -inset-px bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-30 blur-lg -z-10" />

              <h2 className="text-2xl font-bold mb-2">Welcome to Revonix</h2>
              <p className="text-gray-400 text-sm mb-6">
                Sign in to manage your budgets, analyze statements, and track subscriptions.
              </p>

              <div className="space-y-4">
                <Link
                  href="/sign-up"
                  className="w-full flex justify-between items-center px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-[0_4px_20px_rgba(99,102,241,0.3)] transition group"
                >
                  <span>Create Account</span>
                  <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/sign-in"
                  className="w-full flex justify-between items-center px-6 py-4 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold rounded-xl transition group"
                >
                  <span>Access Existing Account</span>
                  <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <p className="text-center text-xs text-gray-500 mt-6">
                Secured and managed by Clerk Authentication.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/50 backdrop-blur-md py-6 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Revonix Finance. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Designed and Developed by Umer for Revonix
          </p>
        </div>
      </footer>
    </div>
  )
}
