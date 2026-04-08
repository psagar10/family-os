import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recipes, recipeIngredients, recipeSteps, recipeNutrition } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mealType = searchParams.get('mealType')
    const tag = searchParams.get('tag')
    const cookTime = searchParams.get('cookTime')

    let result = await db.select().from(recipes)

    // Filter
    if (mealType) {
      result = result.filter(r => r.mealType === mealType)
    }
    if (tag) {
      result = result.filter(r => {
        const tags = r.tags ? JSON.parse(r.tags) : []
        return tags.includes(tag)
      })
    }
    if (cookTime) {
      const maxTime = parseInt(cookTime)
      result = result.filter(r => (r.totalMins || 0) <= maxTime)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch recipes:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}
