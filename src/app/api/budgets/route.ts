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

    const budgets = await queries.getBudgets(supabase, userId)
    const budgetStatus = await queries.getBudgetStatus(supabase, userId)

    return Response.json({ budgets, budgetStatus })
  } catch (error) {
    console.error('Get budgets error:', error)
    return Response.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { category, amount, period } = body

    const supabase = await createServerSupabaseClient()

    const budget = await queries.createBudget(
      supabase,
      userId,
      category,
      amount,
      period || 'monthly'
    )

    return Response.json({ budget })
  } catch (error) {
    console.error('Create budget error:', error)
    return Response.json({ error: 'Failed to create budget' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const budgetId = searchParams.get('id')

    if (!budgetId) {
      return Response.json({ error: 'Budget ID required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    await queries.deleteBudget(supabase, budgetId)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete budget error:', error)
    return Response.json({ error: 'Failed to delete budget' }, { status: 500 })
  }
}
