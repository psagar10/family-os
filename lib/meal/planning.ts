import { aiJsonRequest, MEAL_PLANNING_PROMPT } from '@/lib/ai/minimax'
import { db } from '@/lib/db'
import { recipes, recipeNutrition, memberNutritionTargets, members, mealPlans, mealPlanSlots } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { ulid } from 'ulid'
import { getWeekStart, getWeekEnd, DAYS, MEAL_TYPES } from '@/lib/utils'

export interface MealPlanningContext {
  weekStart: string
  memberIds: string[]
  availableRecipeIds: string[]
  pantryIngredients: string[]
  constraints: {
    maxCookTimeMinutesPerDay?: number
    sharedMealDays?: string[]
  }
}

export interface PlannedSlot {
  day: string
  mealType: string
  recipeId: string
  isLeftoverOf: string | null
  portionNotes: Record<string, number>
}

export async function getMemberNutritionTargetsMap(memberIds: string[]): Promise<Record<string, {
  goalKcal: number
  proteinG: number
  carbsG: number
  fatG: number
}>> {
  const targets: Record<string, any> = {}
  
  for (const memberId of memberIds) {
    const [result] = await db.select().from(memberNutritionTargets)
      .where(eq(memberNutritionTargets.memberId, memberId))
    
    if (result) {
      targets[memberId] = {
        goalKcal: result.goalKcal || 2000,
        proteinG: result.proteinG || 50,
        carbsG: result.carbsG || 250,
        fatG: result.fatG || 65,
      }
    } else {
      // Default targets
      targets[memberId] = {
        goalKcal: 2000,
        proteinG: 50,
        carbsG: 250,
        fatG: 65,
      }
    }
  }
  
  return targets
}

export async function getRecipesWithNutrition(recipeIds: string[]) {
  const result: Array<any> = []
  
  for (const id of recipeIds) {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id))
    const [nutrition] = await db.select().from(recipeNutrition).where(eq(recipeNutrition.recipeId, id))
    
    if (recipe) {
      result.push({
        ...recipe,
        nutrition: nutrition || {
          calories: 500,
          proteinG: 20,
          carbsG: 50,
          fatG: 20,
        }
      })
    }
  }
  
  return result
}

export async function generateMealPlan(context: MealPlanningContext): Promise<{
  success: boolean
  slots?: PlannedSlot[]
  error?: string
}> {
  try {
    // Get member info
    const memberList: Array<{ id: string; name: string; age: number | null }> = []
    for (const id of context.memberIds) {
      const [m] = await db.select({ id: members.id, name: members.name, age: members.age })
        .from(members).where(eq(members.id, id))
      if (m) memberList.push(m)
    }

    // Get nutrition targets
    const nutritionTargets = await getMemberNutritionTargetsMap(context.memberIds)

    // Get recipes with nutrition
    const recipesData = await getRecipesWithNutrition(context.availableRecipeIds)

    // Build prompt with context
    const weekEnd = getWeekEnd(context.weekStart)
    
    const systemPrompt = `${MEAL_PLANNING_PROMPT}

Family Members:
${memberList.map(m => `- ${m.name} (${m.age ? `${m.age} years` : 'adult'})`).join('\n')}

Weekly Nutrition Targets per member:
${Object.entries(nutritionTargets).map(([id, t]) => `${id}: ${t.goalKcal} kcal, ${t.proteinG}g protein`).join('\n')}

Available Recipes (${recipesData.length}):
${recipesData.slice(0, 20).map(r => 
  `- ${r.id}: ${r.name} (${r.mealType}) - ${r.totalMins || 0}min - ${r.nutrition?.calories || 0} kcal/serving`
).join('\n')}

Constraints:
- Week: ${context.weekStart} to ${weekEnd}
- Max cook time per day: ${context.constraints.maxCookTimeMinutesPerDay || 120} minutes
${context.constraints.sharedMealDays?.length ? `- Shared meal days: ${context.constraints.sharedMealDays.join(', ')}` : ''}
${context.pantryIngredients.length ? `- In pantry: ${context.pantryIngredients.slice(0, 20).join(', ')}` : ''}

Respond ONLY with valid JSON array of meal slots.`

    const result = await aiJsonRequest<PlannedSlot[]>({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the optimal meal plan for this week.' }
      ],
      temperature: 0.5,
      maxTokens: 4096,
    })

    return { success: true, slots: result }
  } catch (error) {
    console.error('Meal planning failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Planning failed' }
  }
}

export async function createMealPlanFromSlots(
  weekStart: string,
  slots: PlannedSlot[]
): Promise<string> {
  const planId = ulid()
  const weekEnd = getWeekEnd(weekStart)
  const now = Date.now()

  await db.insert(mealPlans).values({
    id: planId,
    weekStart,
    weekEnd,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  })

  for (const slot of slots) {
    await db.insert(mealPlanSlots).values({
      id: ulid(),
      mealPlanId: planId,
      day: slot.day,
      mealType: slot.mealType,
      recipeId: slot.recipeId,
      isLeftoverOf: slot.isLeftoverOf,
      portionNotes: JSON.stringify(slot.portionNotes),
      status: 'planned',
    })
  }

  return planId
}

export async function getMealPlan(weekStart: string) {
  const [plan] = await db.select().from(mealPlans)
    .where(eq(mealPlans.weekStart, weekStart))

  if (!plan) return null

  const slots = await db.select().from(mealPlanSlots)
    .where(eq(mealPlanSlots.mealPlanId, plan.id))

  // Enrich slots with recipe info
  const enrichedSlots = await Promise.all(slots.map(async (slot) => {
    let recipe = null
    if (slot.recipeId) {
      [recipe] = await db.select().from(recipes).where(eq(recipes.id, slot.recipeId))
    }
    return { ...slot, recipe }
  }))

  return { ...plan, slots: enrichedSlots }
}

export async function activateMealPlan(planId: string): Promise<boolean> {
  const now = Date.now()
  
  await db.update(mealPlans)
    .set({ status: 'active', updatedAt: now })
    .where(eq(mealPlans.id, planId))

  return true
}
