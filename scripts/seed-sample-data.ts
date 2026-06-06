import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mock test user ID (use a real Clerk ID in production)
const TEST_USER_ID = 'test-user-123'

function generateMockTransactions() {
  const transactions: Array<{
    date: string
    amount: number
    merchant: string
    category: string
    source: string
  }> = []

  const categories = [
    'Food & Dining',
    'Groceries',
    'Transport',
    'Entertainment',
    'Shopping',
    'Subscriptions',
    'Utilities',
    'Healthcare',
  ]

  const merchants: Record<string, string[]> = {
    'Food & Dining': ['Chipotle', "Olive Garden", 'Starbucks', 'Panera'],
    'Groceries': ['Whole Foods', 'Safeway', 'Trader Joes', 'Costco'],
    'Transport': ['Shell Gas Station', 'Uber', 'Lyft', 'Delta Airlines'],
    'Entertainment': ['AMC Theaters', 'Spotify', 'Netflix', 'Hulu'],
    'Shopping': ['Target', 'Amazon', 'H&M', 'Nike'],
    'Subscriptions': ['Netflix', 'Spotify', 'Adobe', 'Microsoft'],
    'Utilities': ['Electric Co', 'Water Dept', 'Internet Isp'],
    'Healthcare': ['CVS Pharmacy', 'Walgreens', 'Dr Office'],
  }

  // Generate 18 months of transactions
  for (let monthOffset = -17; monthOffset <= 0; monthOffset++) {
    const month = new Date()
    month.setMonth(month.getMonth() + monthOffset)

    // 10-20 transactions per month
    const txCount = Math.floor(Math.random() * 11) + 10

    for (let i = 0; i < txCount; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)]
      const merchants = merchants[category]
      const merchant = merchants[Math.floor(Math.random() * merchants.length)]

      let amount: number

      // Create realistic patterns
      if (merchant === 'Netflix' || merchant === 'Spotify') {
        // Subscriptions ~$15
        amount = -(Math.random() * 5 + 10)
      } else if (
        category === 'Groceries' ||
        category === 'Food & Dining'
      ) {
        // Food: $5-$150
        amount = -(Math.random() * 145 + 5)
      } else if (category === 'Transport') {
        // Transport: $20-$100
        amount = -(Math.random() * 80 + 20)
      } else {
        // Other: $10-$200
        amount = -(Math.random() * 190 + 10)
      }

      // Add one large anomalous charge in month 3
      if (monthOffset === -3 && i === 0) {
        amount = -450
      }

      transactions.push({
        date: new Date(
          month.getFullYear(),
          month.getMonth(),
          Math.floor(Math.random() * 28) + 1
        )
          .toISOString()
          .split('T')[0],
        amount: parseFloat(amount.toFixed(2)),
        merchant,
        category,
        source: 'mock_bank',
      })
    }
  }

  return transactions
}

async function seed() {
  console.log('Generating sample data...')

  const transactions = generateMockTransactions()

  console.log(`Generated ${transactions.length} transactions`)

  // Insert transactions
  const { error: insertError } = await supabase
    .from('transactions')
    .insert(
      transactions.map((tx) => ({
        ...tx,
        user_id: TEST_USER_ID,
      }))
    )

  if (insertError) {
    console.error('Error inserting transactions:', insertError)
    return
  }

  console.log('✓ Transactions inserted')

  // Create sample budgets
  const budgets = [
    { category: 'Food & Dining', amount: 400, period: 'monthly' },
    { category: 'Groceries', amount: 300, period: 'monthly' },
    { category: 'Entertainment', amount: 100, period: 'monthly' },
    { category: 'Shopping', amount: 200, period: 'monthly' },
  ]

  const { error: budgetError } = await supabase
    .from('budgets')
    .insert(
      budgets.map((b) => ({
        ...b,
        user_id: TEST_USER_ID,
      }))
    )

  if (budgetError) {
    console.error('Error creating budgets:', budgetError)
    return
  }

  console.log('✓ Budgets created')

  // Create user memory
  const { error: memoryError } = await supabase
    .from('user_memory')
    .insert({
      user_id: TEST_USER_ID,
      preferences: {
        pay_day: 1,
        currency: 'USD',
        notes: 'Sample test user',
      },
    })

  if (memoryError && memoryError.code !== '23505') {
    console.error('Error creating memory:', memoryError)
    return
  }

  console.log('✓ User memory created')
  console.log('Seed completed!')
}

seed().catch(console.error)
