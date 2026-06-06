import { QueryIntent } from '@/types'
import { CLASSIFICATION_PROMPT } from './prompts'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

const RULE_PATTERNS = [
  {
    pattern: /set\s+my\s+(\w+)\s+budget/i,
    intent: 'BUDGET_SET' as const,
  },
  {
    pattern: /receipt|uploaded|image|photo|picture/i,
    intent: 'RECEIPT_OCR' as const,
  },
  {
    pattern: /how\s+much.*spend|total\s+spent|spending\s+on/i,
    intent: 'SIMPLE_SPENDING_LOOKUP' as const,
  },
  {
    pattern: /subscription|recurring|monthly.*charge|annual.*fee/i,
    intent: 'SUBSCRIPTION_DETECTION' as const,
  },
  {
    pattern: /unusual|suspicious|strange|weird|unexpected/i,
    intent: 'ANOMALY_DETECTION' as const,
  },
  {
    pattern: /break.*down|by category|category.*breakdown|distribution/i,
    intent: 'CATEGORY_BREAKDOWN' as const,
  },
  {
    pattern: /compare|more than|less than|increase|decrease/i,
    intent: 'TIME_COMPARISON' as const,
  },
  {
    pattern: /budget.*status|on budget|over budget|budget.*remaining/i,
    intent: 'BUDGET_QUERY' as const,
  },
  {
    pattern: /what.*is|look.*up|who.*is|merchant|company|charge/i,
    intent: 'MERCHANT_LOOKUP' as const,
  },
  {
    pattern: /save|reduce|cut.*back|spend.*less|advice/i,
    intent: 'SAVINGS_ADVICE' as const,
  },
  {
    pattern: /summary|overview|total|month/i,
    intent: 'GENERAL_SUMMARY' as const,
  },
  {
    pattern: /i.*get.*paid|pay.*day|remember|my.*\(birthday|anniversary\)/i,
    intent: 'MEMORY_UPDATE' as const,
  },
]

function classifyByRules(message: string, hasImage: boolean): { intent: QueryIntent; confidence: number } | null {
  if (hasImage) {
    return { intent: 'RECEIPT_OCR', confidence: 0.95 }
  }

  for (const { pattern, intent } of RULE_PATTERNS) {
    if (pattern.test(message)) {
      return { intent, confidence: 0.85 }
    }
  }

  return null
}

export async function classifyIntent(
  message: string,
  hasImage: boolean
): Promise<{ intent: QueryIntent; confidence: number }> {
  // Try rule-based classification first
  const ruleResult = classifyByRules(message, hasImage)
  if (ruleResult) {
    return ruleResult
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: message,
      config: {
        systemInstruction: CLASSIFICATION_PROMPT,
        maxOutputTokens: 100,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            intent: { type: 'STRING' },
            confidence: { type: 'NUMBER' },
          },
          required: ['intent', 'confidence'],
        },
      },
    })

    const content = response.text
    if (content && typeof content === 'string') {
      const parsed = JSON.parse(content)
      return {
        intent: parsed.intent || 'UNKNOWN',
        confidence: parsed.confidence || 0.5,
      }
    }
  } catch (error) {
    console.error('Intent classification error:', error)
  }

  return { intent: 'UNKNOWN', confidence: 0 }
}
