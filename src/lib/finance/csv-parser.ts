import { Transaction, TransactionCategory } from '@/types'
import { SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

interface ParseResult {
  valid: Transaction[]
  skipped: Array<{ row: number; reason: string; data?: Record<string, unknown> }>
}

const DATE_FORMATS = [
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
  /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
  /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
  /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, // MM/DD/YY
]

const CATEGORY_MAP: Record<string, TransactionCategory> = {
  'food': 'Food & Dining',
  'dining': 'Food & Dining',
  'restaurant': 'Food & Dining',
  'groceries': 'Groceries',
  'groc': 'Groceries',
  'supermarket': 'Groceries',
  'transport': 'Transport',
  'gas': 'Transport',
  'fuel': 'Transport',
  'transit': 'Transport',
  'entertainment': 'Entertainment',
  'movies': 'Entertainment',
  'gaming': 'Entertainment',
  'shopping': 'Shopping',
  'retail': 'Shopping',
  'healthcare': 'Healthcare',
  'medical': 'Healthcare',
  'housing': 'Housing',
  'rent': 'Housing',
  'mortgage': 'Housing',
  'utilities': 'Utilities',
  'subscriptions': 'Subscriptions',
  'travel': 'Travel',
  'hotel': 'Travel',
  'education': 'Education',
  'school': 'Education',
  'personal': 'Personal Care',
  'income': 'Income',
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null

  // Try each format
  for (const format of DATE_FORMATS) {
    const match = dateStr.trim().match(format)
    if (match) {
      let year, month, day

      if (format === DATE_FORMATS[0]) {
        // MM/DD/YYYY
        month = parseInt(match[1], 10)
        day = parseInt(match[2], 10)
        year = parseInt(match[3], 10)
      } else if (format === DATE_FORMATS[1]) {
        // YYYY-MM-DD
        year = parseInt(match[1], 10)
        month = parseInt(match[2], 10)
        day = parseInt(match[3], 10)
      } else if (format === DATE_FORMATS[2]) {
        // DD-MM-YYYY
        day = parseInt(match[1], 10)
        month = parseInt(match[2], 10)
        year = parseInt(match[3], 10)
      } else {
        // MM/DD/YY
        month = parseInt(match[1], 10)
        day = parseInt(match[2], 10)
        year = parseInt(match[3], 10)
        if (year < 100) {
          year += year < 50 ? 2000 : 1900
        }
      }

      if (month < 1 || month > 12 || day < 1 || day > 31) {
        continue
      }

      const date = new Date(year, month - 1, day)
      if (date.getMonth() !== month - 1) continue

      return date.toISOString().split('T')[0]
    }
  }

  return null
}

function parseAmount(amountStr: string): number | null {
  if (!amountStr) return null

  // Remove whitespace
  let normalized = amountStr.trim()

  // Check for parentheses (negative)
  const isNegative = normalized.includes('(') && normalized.includes(')')

  // Remove currency symbols, commas, parentheses
  normalized = normalized.replace(/[$,()]/g, '')

  const amount = parseFloat(normalized)

  if (isNaN(amount)) return null

  return isNegative ? -amount : amount
}

function normalizeMerchant(merchant: string): string {
  if (!merchant) return 'Unknown'

  return merchant
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .substring(0, 100)
}

function categorizeTransaction(category: string | undefined, merchant: string): TransactionCategory {
  if (!category && !merchant) return 'Uncategorized'

  const text = `${category || ''} ${merchant || ''}`.toLowerCase()

  for (const [key, categoryName] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(key)) {
      return categoryName
    }
  }

  return 'Uncategorized'
}

function generateHash(userId: string, date: string, amount: number, merchant: string): string {
  const input = `${userId}${date}${amount}${merchant}`
  return crypto.createHash('md5').update(input).digest('hex')
}

function detectColumns(
  headers: string[]
): { dateIdx: number; amountIdx: number; merchantIdx: number; categoryIdx: number } {
  const dateKeywords = ['date', 'transaction date', 'posted date', 'trans date', 'transaction_date']
  const amountKeywords = ['amount', 'debit', 'credit', 'transaction amount']
  const merchantKeywords = ['merchant', 'description', 'payee', 'name', 'memo']
  const categoryKeywords = ['category', 'type', 'transaction type', 'category_type']

  const lowerHeaders = headers.map((h) => h.toLowerCase())

  let dateIdx = -1,
    amountIdx = -1,
    merchantIdx = -1,
    categoryIdx = -1

  lowerHeaders.forEach((header, idx) => {
    if (dateKeywords.some((k) => header.includes(k))) dateIdx = idx
    if (amountKeywords.some((k) => header.includes(k))) amountIdx = idx
    if (merchantKeywords.some((k) => header.includes(k))) merchantIdx = idx
    if (categoryKeywords.some((k) => header.includes(k))) categoryIdx = idx
  })

  return { dateIdx, amountIdx, merchantIdx, categoryIdx }
}

export async function parseTransactionsCsv(
  csvString: string,
  userId: string,
  supabase: SupabaseClient
): Promise<ParseResult> {
  const lines = csvString
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    return { valid: [], skipped: [{ row: 0, reason: 'Empty or no data rows' }] }
  }

  // Parse CSV manually (simple approach)
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const { dateIdx, amountIdx, merchantIdx, categoryIdx } = detectColumns(headers)

  if (dateIdx === -1 || amountIdx === -1 || merchantIdx === -1) {
    return {
      valid: [],
      skipped: [
        {
          row: 0,
          reason: 'Could not detect required columns (date, amount, merchant)',
        },
      ],
    }
  }

  // Get existing hashes for dedup
  const { data: existingTx } = await supabase
    .from('transactions')
    .select('raw_hash')
    .eq('user_id', userId)

  const existingHashes = new Set(existingTx?.map((t) => t.raw_hash) || [])

  const valid: Transaction[] = []
  const skipped: Array<{ row: number; reason: string; data?: Record<string, unknown> }> = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values = line.split(',').map((v) => v.trim())

    if (values.length < Math.max(dateIdx, amountIdx, merchantIdx) + 1) {
      skipped.push({ row: i, reason: 'Not enough columns' })
      continue
    }

    const dateStr = values[dateIdx]
    const amountStr = values[amountIdx]
    const merchantStr = values[merchantIdx]
    const categoryStr = values[categoryIdx] || ''

    const date = parseDate(dateStr)
    if (!date) {
      skipped.push({
        row: i,
        reason: `Invalid date: ${dateStr}`,
        data: { date: dateStr },
      })
      continue
    }

    const amount = parseAmount(amountStr)
    if (amount === null) {
      skipped.push({
        row: i,
        reason: `Invalid amount: ${amountStr}`,
        data: { amount: amountStr },
      })
      continue
    }

    if (!merchantStr) {
      skipped.push({ row: i, reason: 'Missing merchant' })
      continue
    }

    const merchant = normalizeMerchant(merchantStr)
    const category = categorizeTransaction(categoryStr, merchant)

    const hash = generateHash(userId, date, amount, merchant)
    if (existingHashes.has(hash)) {
      skipped.push({
        row: i,
        reason: 'Duplicate transaction',
        data: { merchant, amount, date },
      })
      continue
    }

    valid.push({
      id: crypto.randomUUID(),
      user_id: userId,
      date,
      amount,
      merchant,
      category,
      description: merchantStr,
      source: 'csv',
      is_duplicate: false,
      created_at: new Date().toISOString(),
    })
  }

  return { valid, skipped }
}

export async function bulkImportTransactions(
  supabase: SupabaseClient,
  _userId: string,
  transactions: Transaction[]
): Promise<{ imported: number; duplicates: number; skipped: number; errors: string[] }> {
  const errors: string[] = []
  let imported = 0
  let duplicates = 0
  let skipped = 0

  // Batch insert in chunks
  const chunkSize = 500
  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize)

    const { error } = await supabase.from('transactions').insert(
      chunk.map((tx) => ({
        ...tx,
        raw_hash: generateHash(tx.user_id, tx.date, tx.amount, tx.merchant),
      }))
    )

    if (error) {
      errors.push(`Batch ${Math.floor(i / chunkSize)}: ${error.message}`)
      skipped += chunk.length
    } else {
      imported += chunk.length
    }
  }

  return { imported, duplicates, skipped, errors }
}
