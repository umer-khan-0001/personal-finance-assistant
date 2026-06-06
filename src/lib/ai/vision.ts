import { GoogleGenAI } from '@google/genai'
import { ReceiptExtraction } from '@/types'
import { RECEIPT_OCR_PROMPT } from './prompts'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

export async function extractReceiptData(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ReceiptExtraction> {
  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType,
          },
        },
        'Extract all financial information from this receipt.',
      ],
      config: {
        systemInstruction: RECEIPT_OCR_PROMPT,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            merchant: { type: 'STRING' },
            date: { type: 'STRING' },
            total: { type: 'NUMBER' },
            currency: { type: 'STRING' },
            line_items: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING' },
                  amount: { type: 'NUMBER' },
                },
                required: ['name', 'amount'],
              },
            },
            confidence: { type: 'STRING' },
            notes: { type: 'STRING' },
          },
          required: ['merchant', 'date', 'total', 'currency', 'line_items', 'confidence'],
        },
      },
    })

    const content = response.text
    if (content && typeof content === 'string') {
      // Parse the JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0])

        return {
          merchant: extracted.merchant || 'Unknown',
          date: extracted.date || new Date().toISOString().split('T')[0],
          total: extracted.total || 0,
          currency: extracted.currency || 'USD',
          line_items: extracted.line_items || [],
          confidence: extracted.confidence || 'low',
          notes: extracted.notes,
        }
      }
    }

    return {
      merchant: 'Unknown',
      date: new Date().toISOString().split('T')[0],
      total: 0,
      currency: 'USD',
      line_items: [],
      confidence: 'low',
      notes: 'Failed to parse receipt image',
    }
  } catch (error) {
    console.error('Receipt extraction error:', error)
    return {
      merchant: 'Unknown',
      date: new Date().toISOString().split('T')[0],
      total: 0,
      currency: 'USD',
      line_items: [],
      confidence: 'low',
      notes: 'Error extracting receipt data',
    }
  }
}
