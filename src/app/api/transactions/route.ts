import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import * as queries from '@/lib/finance/queries'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    const transactions = await queries.getRecentTransactions(supabase, userId, {
      limit: 100,
    })

    return Response.json({ transactions })
  } catch (error) {
    console.error('Get transactions error:', error)
    return Response.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { date, amount, merchant, category, description } = body

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        date,
        amount,
        merchant,
        category: category || 'Uncategorized',
        description,
        source: 'manual',
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ transaction: data })
  } catch (error) {
    console.error('Create transaction error:', error)
    return Response.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
