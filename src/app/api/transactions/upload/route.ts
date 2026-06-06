import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { parseTransactionsCsv, bulkImportTransactions } from '@/lib/finance/csv-parser'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const confirmed = formData.get('confirmed') === 'true'

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const csvString = await file.text()
    const supabase = await createServerSupabaseClient()

    // Parse CSV
    const { valid, skipped } = await parseTransactionsCsv(csvString, userId, supabase)

    // If not confirmed, return preview
    if (!confirmed) {
      return Response.json({
        preview: valid.slice(0, 5),
        totalRows: valid.length,
        skippedRows: skipped,
        message: `Ready to import ${valid.length} transactions. ${skipped.length} rows skipped.`,
      })
    }

    // Bulk import
    const result = await bulkImportTransactions(supabase, userId, valid)

    return Response.json(result)
  } catch (error) {
    console.error('CSV upload error:', error)
    return Response.json({ error: 'Failed to process CSV' }, { status: 500 })
  }
}
