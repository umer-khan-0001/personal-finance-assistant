import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { extractReceiptData } from '@/lib/ai/vision'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { imageBase64, mimeType } = body

    if (!imageBase64) {
      return Response.json({ error: 'Image data required' }, { status: 400 })
    }

    // Extract receipt data
    const extracted = await extractReceiptData(imageBase64, mimeType)

    // Store receipt in DB
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('receipts')
      .insert({
        user_id: userId,
        image_url: '',
        extracted_data: extracted,
        status: extracted.confidence === 'low' ? 'pending' : 'processed',
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ receipt: data, extracted })
  } catch (error) {
    console.error('Receipt processing error:', error)
    return Response.json({ error: 'Failed to process receipt' }, { status: 500 })
  }
}
