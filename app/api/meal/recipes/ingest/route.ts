import { NextResponse } from 'next/server'
import { ingestRecipe } from '@/lib/ai/ingestion'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { source, sourceType } = body

    if (!source || !sourceType) {
      return NextResponse.json(
        { error: 'Missing source or sourceType' },
        { status: 400 }
      )
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY

    const result = await ingestRecipe(
      source,
      sourceType as 'youtube' | 'instagram' | 'webpage' | 'text',
      rapidApiKey
    )

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Recipe ingestion failed:', error)
    return NextResponse.json(
      { error: 'Recipe ingestion failed' },
      { status: 500 }
    )
  }
}
