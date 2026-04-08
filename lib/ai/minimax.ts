import OpenAI from 'openai'

const apiKey = process.env.MINIMAX_API_KEY
const baseURL = process.env.MINIMAX_BASE_URL || 'https://v2.aicodee.com/'
const model = process.env.MINIMAX_MODEL || 'MiniMax-M2.7-highspeed'

if (!apiKey) {
  console.warn('MINIMAX_API_KEY not set. AI features will use mock responses.')
}

export const minimax = new OpenAI({
  apiKey: apiKey || 'mock-key',
  baseURL,
  dangerouslyAllowBrowser: true,
})

export interface AIRequest {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
}

export async function aiRequest(req: AIRequest): Promise<string> {
  if (!process.env.MINIMAX_API_KEY) {
    console.warn('MINIMAX_API_KEY not set, returning mock response')
    return JSON.stringify({ error: 'AI not configured' })
  }

  const response = await minimax.chat.completions.create({
    model,
    messages: req.messages,
    temperature: req.temperature ?? 0.7,
    max_tokens: req.maxTokens ?? 2048,
  })

  return response.choices[0]?.message?.content || ''
}

export async function aiJsonRequest<T>(req: AIRequest): Promise<T> {
  const content = await aiRequest(req)
  try {
    // Try to extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T
    }
    return JSON.parse(content) as T
  } catch (e) {
    console.error('Failed to parse AI response as JSON:', content)
    throw new Error('AI response was not valid JSON')
  }
}

// ============ PROMPTS ============

export const RECIPE_INGESTION_PROMPT = `You are a recipe extraction assistant. Extract a structured recipe from the source text.

Respond ONLY with valid JSON matching this schema:
{
  "name": string,
  "description": string,
  "cuisineTag": string | null,
  "mealType": "breakfast" | "lunch" | "dinner" | "snack",
  "baseServings": number,
  "prepMins": number,
  "cookMins": number,
  "difficulty": "easy" | "medium" | "hard",
  "ingredients": [{
    "name": string,
    "quantity": number,
    "unit": string,
    "prepNote": string | null,
    "isOptional": boolean,
    "substitution": string | null
  }],
  "steps": [{
    "sortOrder": number,
    "instruction": string,
    "isPassive": boolean,
    "timerMins": number | null,
    "leadTimeMins": number | null,
    "leadTimeNote": string | null
  }],
  "nutrition": {
    "calories": number,
    "proteinG": number,
    "carbsG": number,
    "fatG": number,
    "fibreG": number,
    "sugarG": number,
    "sodiumMg": number,
    "confidence": number
  },
  "tags": string[]
}

Use null for unknown fields. Estimate nutrition from standard food composition data; set confidence:0.5 for estimates.`

export const MEAL_PLANNING_PROMPT = `You are a family meal planning assistant. Select recipes for each slot in the week.

Optimise for:
1. Meeting each member's nutrition targets
2. Using leftover ingredients where possible
3. Cook time budgets
4. Dietary restrictions

Respond ONLY with valid JSON array:
[{
  "day": "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
  "mealType": "breakfast" | "lunch" | "dinner" | "snack",
  "recipeId": string,
  "isLeftoverOf": string | null,
  "portionNotes": { [memberId: string]: number }
}]`

export const TASK_PLANNING_PROMPT = `You are a family task planning assistant. Generate 2-3 ranked weekly task plans.

Constraints:
- Respect each member's weekly capacity (minutes)
- Balance workload fairly across members
- Pre-lock all meal-prep tasks (do not move/reassign/remove them)
- Schedule household tasks around pre-locked meal-prep tasks
- Consider current mode (vacation/sick/busy/guests/deep-clean)
- Do not exceed individual member capacity

Respond ONLY with valid JSON:
{
  "plans": [{
    "rank": number,
    "score": number,
    "assignments": [{
      "taskId": string,
      "assignedTo": string,
      "scheduledDate": "YYYY-MM-DD",
      "variant": "standard" | "light" | "quick",
      "notes": string
    }],
    "fairnessScore": number,
    "reasoning": string
  }]
}`
