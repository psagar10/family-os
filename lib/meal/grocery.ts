import { db } from '@/lib/db'
import { recipes, recipeIngredients, recipeNutrition, memberNutritionTargets, members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getAgeGroup, getPortionMultiplier, type AgeGroup } from './nutrition'

export interface GroceryItem {
  name: string
  quantity: number
  unit: string
  category: string
  inPantry: number
  deficit: number
  recipes: string[]
}

export interface GroceryList {
  items: GroceryItem[]
  totalItems: number
  pantryItems: number
  deficitItems: number
}

// Standard grocery categories for grouping
const CATEGORY_MAP: Record<string, string> = {
  chicken: 'Meat & Poultry',
  beef: 'Meat & Poultry',
  pork: 'Meat & Poultry',
  fish: 'Seafood',
  salmon: 'Seafood',
  shrimp: 'Seafood',
  milk: 'Dairy',
  cheese: 'Dairy',
  yogurt: 'Dairy',
  butter: 'Dairy',
  eggs: 'Dairy',
  bread: 'Bakery',
  rice: 'Grains & Pasta',
  pasta: 'Grains & Pasta',
  noodles: 'Grains & Pasta',
  flour: 'Baking',
  sugar: 'Baking',
  salt: 'Pantry',
  oil: 'Pantry',
  olive: 'Pantry',
  onion: 'Produce',
  garlic: 'Produce',
  tomato: 'Produce',
  potato: 'Produce',
  carrot: 'Produce',
  apple: 'Produce',
  banana: 'Produce',
  lemon: 'Produce',
  lettuce: 'Produce',
  spinach: 'Produce',
}

function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase()
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return category
  }
  return 'Other'
}

function normalizeUnit(unit: string): string {
  const u = unit.toLowerCase().trim()
  if (['tablespoon', 'tbsp', 'tbs'].includes(u)) return 'tbsp'
  if (['teaspoon', 'tsp'].includes(u)) return 'tsp'
  if (['cup', 'cups'].includes(u)) return 'cup'
  if (['pound', 'lb', 'lbs'].includes(u)) return 'lb'
  if (['ounce', 'oz'].includes(u)) return 'oz'
  if (['gram', 'g'].includes(u)) return 'g'
  if (['kilogram', 'kg'].includes(u)) return 'kg'
  if (['ml', 'milliliter', 'millilitre'].includes(u)) return 'ml'
  if (['liter', 'litre', 'l'].includes(u)) return 'l'
  if (['piece', 'pieces', 'whole'].includes(u)) return 'piece'
  return unit
}

export async function aggregateGroceryList(
  recipeIds: string[],
  familyMemberIds: string[],
  pantryItems: Array<{ name: string; quantity: number | null }> = []
): Promise<GroceryList> {
  const pantryMap = new Map<string, number>()
  for (const item of pantryItems) {
    if (item.quantity && item.quantity > 0) {
      pantryMap.set(item.name.toLowerCase(), item.quantity)
    }
  }

  // Get member portion multipliers
  const memberMultipliers: Record<string, number> = {}
  for (const memberId of familyMemberIds) {
    const [member] = await db.select().from(members).where(eq(members.id, memberId))
    if (member) {
      memberMultipliers[memberId] = getPortionMultiplier(member)
    }
  }

  // Calculate total multiplier (how many servings needed)
  const totalMultiplier = Object.values(memberMultipliers).reduce((a, b) => a + b, 0)

  // Aggregate ingredients from all recipes
  const aggregated = new Map<string, GroceryItem>()

  for (const recipeId of recipeIds) {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId))
    if (!recipe) continue

    const recipeMultiplier = recipe.baseServings || 4
    const portionsNeeded = totalMultiplier / recipeMultiplier

    const ingredients = await db.select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipeId))

    for (const ing of ingredients) {
      const key = `${ing.name.toLowerCase()}_${normalizeUnit(ing.unit)}`
      const quantity = ing.quantity * portionsNeeded

      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!
        existing.quantity += quantity
        if (!existing.recipes.includes(recipe.name)) {
          existing.recipes.push(recipe.name)
        }
      } else {
        const inPantry = pantryMap.get(ing.name.toLowerCase()) || 0
        aggregated.set(key, {
          name: ing.name,
          quantity,
          unit: normalizeUnit(ing.unit),
          category: categorizeIngredient(ing.name),
          inPantry,
          deficit: Math.max(0, quantity - inPantry),
          recipes: [recipe.name],
        })
      }
    }
  }

  const items = Array.from(aggregated.values())
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

  return {
    items,
    totalItems: items.length,
    pantryItems: items.filter(i => i.inPantry >= i.quantity).length,
    deficitItems: items.filter(i => i.deficit > 0).length,
  }
}

export async function getPantryDeficit(recipeIds: string[], familyMemberIds: string[]): Promise<GroceryItem[]> {
  const list = await aggregateGroceryList(recipeIds, familyMemberIds, [])
  return list.items.filter(i => i.deficit > 0)
}
