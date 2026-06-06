import { GoogleGenAI } from '@google/genai'
import { SupabaseClient } from '@supabase/supabase-js'
import { Message, QueryIntent } from '@/types'
import { classifyIntent } from './router'
import { TOOLS, executeTool } from './tools'
import { MAIN_SYSTEM_PROMPT, TOOL_CALLING_SYSTEM_PROMPT } from './prompts'
import { extractReceiptData } from './vision'
import * as queries from '@/lib/finance/queries'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

export interface AgentParams {
  message: string
  imageBase64?: string
  conversationHistory: Message[]
  userId: string
  supabase: SupabaseClient
}

export interface AgentResponse {
  content: string
  intent: QueryIntent
  toolsUsed: string[]
  metadata: Record<string, unknown>
}

export async function runAgent(params: AgentParams): Promise<AgentResponse> {
  const { message, imageBase64, conversationHistory, userId, supabase } = params

  // Get user memory for context
  const userMemory = await queries.getUserMemory(supabase, userId)

  // Classify intent
  const { intent, confidence } = await classifyIntent(message, !!imageBase64)

  const toolsUsed: string[] = []
  let responseText = ''

  try {
    // Handle receipt OCR immediately if image present
    if (imageBase64 && (intent === 'RECEIPT_OCR' || confidence > 0.8)) {
      const extracted = await extractReceiptData(imageBase64)

      // Create transaction from receipt
      if (extracted.total > 0) {
        await queries.saveMessage(
          supabase,
          conversationHistory[0]?.conversation_id || '',
          userId,
          'assistant',
          `I extracted the following from your receipt:\n\nMerchant: ${extracted.merchant}\nDate: ${extracted.date}\nTotal: Rs. ${extracted.total.toFixed(2)}\nConfidence: ${extracted.confidence}\n\n${extracted.notes ? `Note: ${extracted.notes}` : ''}`
        )

        return {
          content: `I extracted the following from your receipt:\n\nMerchant: ${extracted.merchant}\nDate: ${extracted.date}\nTotal: Rs. ${extracted.total.toFixed(2)}\nConfidence: ${extracted.confidence}\n\n${extracted.notes ? `Note: ${extracted.notes}` : ''}`,
          intent: 'RECEIPT_OCR',
          toolsUsed,
          metadata: { extracted },
        }
      }
    }

    // Build conversation for LLM
    const systemMessage = MAIN_SYSTEM_PROMPT(userMemory) + '\n\n' + TOOL_CALLING_SYSTEM_PROMPT

    const contents: any[] = [
      ...conversationHistory
        .slice(-10)
        .map((msg) => ({
          role: (msg.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
          parts: [{ text: msg.content }],
        })),
      { role: 'user' as const, parts: [{ text: message }] },
    ]

    const config = {
      systemInstruction: systemMessage,
      maxOutputTokens: 1024,
      tools: [
        {
          functionDeclarations: TOOLS.map((tool) => ({
            name: tool.function.name,
            description: tool.function.description,
            parametersJsonSchema: tool.function.parameters,
          })),
        },
      ],
    }

    // First API call with tools
    let response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents,
      config,
    })

    let toolRounds = 0
    const maxToolRounds = 3

    // Tool calling loop
    while (response.functionCalls && response.functionCalls.length > 0 && toolRounds < maxToolRounds) {
      const functionCalls = response.functionCalls

      // Add the model's call to history
      contents.push({
        role: 'model' as const,
        parts: functionCalls.map(call => ({ functionCall: call }))
      })

      const functionResponses = []

      for (const call of functionCalls) {
        if (!call.name) continue

        toolsUsed.push(call.name)

        const toolResult = await executeTool(
          call.name,
          call.args as Record<string, unknown>,
          supabase,
          userId
        )

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: toolResult as Record<string, any>,
            id: call.id,
          }
        })
      }

      // Add the tool results to history
      contents.push({
        role: 'user' as const,
        parts: functionResponses
      })

      // Get next response
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents,
        config,
      })

      toolRounds++
    }

    // Extract final text response
    const textContent = response.text
    if (textContent) {
      responseText = textContent
    }

    if (!responseText) {
      responseText = 'I was unable to process your request. Please try again.'
    }
  } catch (error) {
    console.error('Agent error:', error)
    responseText = 'An error occurred processing your request. Please try again.'
  }

  return {
    content: responseText,
    intent,
    toolsUsed,
    metadata: {
      intent,
      confidence,
      toolsUsed,
    },
  }
}
