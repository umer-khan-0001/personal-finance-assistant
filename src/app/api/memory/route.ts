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

    const memory = await queries.getUserMemory(supabase, userId)

    return Response.json({ memory })
  } catch (error) {
    console.error('Get memory error:', error)
    return Response.json({ error: 'Failed to fetch memory' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { preferences } = body

    const supabase = await createServerSupabaseClient()

    const memory = await queries.upsertUserMemory(supabase, userId, preferences)

    return Response.json({ memory })
  } catch (error) {
    console.error('Update memory error:', error)
    return Response.json({ error: 'Failed to update memory' }, { status: 500 })
  }
}
