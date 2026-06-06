import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { runAgent } from '@/lib/ai/agent'
import * as queries from '@/lib/finance/queries'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { message, conversationId, imageBase64 } = body

    const supabase = await createServerSupabaseClient()

    // Get or create conversation
    let convId = conversationId
    if (!convId) {
      convId = await queries.createConversation(supabase, userId)
    }

    // Load recent conversation history
    const history = await queries.getConversationMessages(supabase, convId, 10)

    // Save user message
    await queries.saveMessage(supabase, convId, userId, 'user', message, {
      image_url: imageBase64 ? 'uploaded' : undefined,
    })

    // Run agent
    const response = await runAgent({
      message,
      imageBase64,
      conversationHistory: history,
      userId,
      supabase,
    })

    // Save assistant response
    await queries.saveMessage(supabase, convId, userId, 'assistant', response.content, {
      intent: response.intent,
      tools_used: response.toolsUsed,
    })

    // Stream response back
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(response)}\n\n`))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
