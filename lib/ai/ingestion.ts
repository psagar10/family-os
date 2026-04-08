import { aiJsonRequest, RECIPE_INGESTION_PROMPT } from './minimax'
import { db } from '@/lib/db'
import { recipes, recipeIngredients, recipeSteps, recipeNutrition } from '@/lib/db/schema'
import { ulid } from 'ulid'
import * as cheerio from 'cheerio'

export interface IngestedRecipe {
  name: string
  description: string | null
  cuisineTag: string | null
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  baseServings: number
  prepMins: number
  cookMins: number
  difficulty: 'easy' | 'medium' | 'hard'
  ingredients: Array<{
    name: string
    quantity: number
    unit: string
    prepNote: string | null
    isOptional: boolean
    substitution: string | null
  }>
  steps: Array<{
    sortOrder: number
    instruction: string
    isPassive: boolean
    timerMins: number | null
    leadTimeMins: number | null
    leadTimeNote: string | null
  }>
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fibreG: number
    sugarG: number
    sodiumMg: number
    confidence: number
  }
  tags: string[]
}

export interface IngestionResult {
  success: boolean
  recipeId?: string
  error?: string
  recipe?: IngestedRecipe
  requiresReview?: boolean
}

// ============ YOUTUBE EXTRACTION ============

export interface ExtractedContent {
  content: string
  source: string
  sourceType: string
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export async function extractFromYouTube(videoUrl: string): Promise<ExtractedContent> {
  const videoId = extractYouTubeId(videoUrl)
  if (!videoId) throw new Error('Invalid YouTube URL')

  try {
    // Try to use youtube-transcript-api dynamically
    const { YouTubeTranscriptApi } = await import('youtube-transcript-api')
    const transcript = await YouTubeTranscriptApi.getTranscript(videoId)
    const content = transcript.map((entry: { text: string }) => entry.text).join(' ')
    return { content, source: videoUrl, sourceType: 'youtube' }
  } catch (error) {
    console.warn('YouTube transcript failed, trying scrape:', error)
    // Fallback to basic scrape
    return await scrapeYouTubeDescription(videoUrl)
  }
}

async function scrapeYouTubeDescription(url: string): Promise<ExtractedContent> {
  try {
    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const description = $('meta[name="description"]').attr('content') || ''
    const title = $('meta[property="og:title"]').attr('content') || ''
    
    return { content: `${title}. ${description}`, source: url, sourceType: 'youtube' }
  } catch {
    return { content: '', source: url, sourceType: 'youtube' }
  }
}

// ============ INSTAGRAM EXTRACTION ============

export async function extractFromInstagram(postUrl: string, rapidApiKey?: string): Promise<ExtractedContent> {
  if (!rapidApiKey) {
    throw new Error('RapidAPI key required for Instagram extraction')
  }

  try {
    const url = new URL('https://instagram-scraper-api2.p.rapidapi.com/v1/post')
    url.searchParams.set('url_or_username_or_id', postUrl)

    const response = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
      }
    })

    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status}`)
    }

    const data = await response.json()
    
    // Extract caption/description which usually contains ingredients
    const caption = data.data?.caption || 
                    data.data?.edge_media_to_caption?.edges?.[0]?.node?.text || ''
    
    return { content: caption, source: postUrl, sourceType: 'instagram' }
  } catch (error) {
    console.error('Instagram extraction failed:', error)
    throw new Error('Failed to extract from Instagram. Try pasting the recipe text directly.')
  }
}

// ============ BLOG/WEBPAGE EXTRACTION ============

export async function extractFromWebpage(url: string): Promise<ExtractedContent> {
  try {
    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Remove script and style elements
    $('script, style, nav, header, footer, aside').remove()
    
    // Try to find main content
    const articleText = $('article').text() || 
                        $('main').text() || 
                        $('.recipe-content, .recipe-body, .post-content').text() ||
                        $('body').text()
    
    return { content: articleText.trim(), source: url, sourceType: 'webpage' }
  } catch {
    throw new Error('Failed to fetch webpage')
  }
}

// ============ TEXT/TRANSCRIPT PARSING ============

export async function parseRecipeText(text: string): Promise<IngestedRecipe> {
  const result = await aiJsonRequest<IngestedRecipe>({
    messages: [
      { role: 'system', content: RECIPE_INGESTION_PROMPT },
      { role: 'user', content: `Extract the recipe from this content:\n\n${text}` }
    ],
    temperature: 0.3,
    maxTokens: 4096
  })
  
  return result
}

// ============ MAIN INGESTION FUNCTION ============

export async function ingestRecipe(
  source: string,
  sourceType: 'youtube' | 'instagram' | 'webpage' | 'text',
  rapidApiKey?: string
): Promise<IngestionResult> {
  try {
    let extracted: ExtractedContent

    switch (sourceType) {
      case 'youtube':
        extracted = await extractFromYouTube(source)
        break
      case 'instagram':
        extracted = await extractFromInstagram(source, rapidApiKey)
        break
      case 'webpage':
        extracted = await extractFromWebpage(source)
        break
      case 'text':
        extracted = { content: source, source: '', sourceType: 'text' }
        break
      default:
        return { success: false, error: 'Invalid source type' }
    }

    const content = extracted.content

    if (content.length < 50) {
      return { success: false, error: 'Not enough content to parse recipe' }
    }

    const parsed = await parseRecipeText(content)

    // Save to database
    const recipeId = ulid()
    const now = Date.now()

    await db.insert(recipes).values({
      id: recipeId,
      name: parsed.name,
      description: parsed.description,
      cuisineTag: parsed.cuisineTag,
      mealType: parsed.mealType,
      baseServings: parsed.baseServings,
      prepMins: parsed.prepMins,
      cookMins: parsed.cookMins,
      totalMins: parsed.prepMins + parsed.cookMins,
      difficulty: parsed.difficulty,
      tags: JSON.stringify(parsed.tags || []),
      sourceUrl: source,
      sourceType: sourceType,
      createdAt: now,
      updatedAt: now,
    })

    // Save ingredients
    for (const ing of parsed.ingredients) {
      await db.insert(recipeIngredients).values({
        id: ulid(),
        recipeId,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        prepNote: ing.prepNote,
        isOptional: ing.isOptional ? 1 : 0,
        substitution: ing.substitution,
        sortOrder: parsed.ingredients.indexOf(ing),
      })
    }

    // Save steps
    for (const step of parsed.steps) {
      await db.insert(recipeSteps).values({
        id: ulid(),
        recipeId,
        sortOrder: step.sortOrder,
        instruction: step.instruction,
        isPassive: step.isPassive ? 1 : 0,
        timerMins: step.timerMins,
        leadTimeMins: step.leadTimeMins,
        leadTimeNote: step.leadTimeNote,
      })
    }

    // Save nutrition
    await db.insert(recipeNutrition).values({
      recipeId,
      perServings: parsed.baseServings,
      ...parsed.nutrition,
      updatedAt: now,
    })

    return {
      success: true,
      recipeId,
      recipe: parsed,
      requiresReview: parsed.nutrition.confidence < 0.7
    }
  } catch (error) {
    console.error('Recipe ingestion failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
