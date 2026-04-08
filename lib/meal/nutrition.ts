import { db } from '@/lib/db'
import { members, memberNutritionTargets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ulid } from 'ulid'

// ============ PORTION MULTIPLIERS ============

export const PORTION_MULTIPLIERS = {
  adult: 1.0,
  child: 0.65,      // 6-12 years
  toddler: 0.35,    // 1-2 years
  baby: 0.15,       // < 1 year
} as const

export type AgeGroup = keyof typeof PORTION_MULTIPLIERS

export function getAgeGroup(age: number | null): AgeGroup {
  if (!age) return 'adult'
  if (age < 1) return 'baby'
  if (age < 3) return 'toddler'
  if (age < 13) return 'child'
  return 'adult'
}

export function getPortionMultiplier(member: { age: number | null; role: string }): number {
  if (member.role === 'child') return PORTION_MULTIPLIERS.child
  if (member.role === 'baby') return PORTION_MULTIPLIERS.baby
  return PORTION_MULTIPLIERS[getAgeGroup(member.age)]
}

// ============ ACTIVITY MULTIPLIERS ============

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
} as const

type ActivityLevel = keyof typeof ACTIVITY_MULTIPLIERS

function getActivityMultiplier(level: string): number {
  return ACTIVITY_MULTIPLIERS[level as ActivityLevel] || 1.55
}

// ============ SEX OFFSETS (Mifflin-St Jeor) ============

const SEX_OFFSET = {
  male: +5,
  female: -161,
  other: -78,
} as const

type BiologicalSex = keyof typeof SEX_OFFSET

function getSexOffset(sex: string | null): number {
  if (!sex) return -78 // default for 'other'
  return SEX_OFFSET[sex as BiologicalSex] ?? -78
}

// ============ GOAL ADJUSTMENTS ============

interface GoalAdjustment {
  calorieAdjustment: number // percentage
  proteinFloor: number // g/kg for weight loss
  proteinMultiplier: number
  macroSplit: { protein: number; carbs: number; fat: number }
}

const GOAL_ADJUSTMENTS: Record<string, GoalAdjustment> = {
  maintenance: { calorieAdjustment: 0, proteinFloor: 0.8, proteinMultiplier: 1, macroSplit: { protein: 0.25, carbs: 0.50, fat: 0.25 } },
  'weight-loss': { calorieAdjustment: -0.175, proteinFloor: 1.2, proteinMultiplier: 1, macroSplit: { protein: 0.35, carbs: 0.40, fat: 0.25 } },
  'muscle-gain': { calorieAdjustment: 0.10, proteinFloor: 1.6, proteinMultiplier: 1.3, macroSplit: { protein: 0.35, carbs: 0.40, fat: 0.25 } },
  'general-health': { calorieAdjustment: 0, proteinFloor: 0.8, proteinMultiplier: 1, macroSplit: { protein: 0.25, carbs: 0.50, fat: 0.25 } },
}

export function getGoalAdjustment(goal: string): GoalAdjustment {
  return GOAL_ADJUSTMENTS[goal] || GOAL_ADJUSTMENTS['maintenance']
}

// ============ WHO TABLE LOOKUPS ============

// WHO 2004 EER (Estimated Energy Requirements) for children
const WHO_CHILD_EER: Record<string, { ageRange: string; male: number; female: number }[]> = {
  '5-8': [{ ageRange: '5-8', male: 1400, female: 1250 }],
  '9-13': [{ ageRange: '9-13', male: 1800, female: 1650 }],
  '14-18': [{ ageRange: '14-18', male: 2300, female: 2000 }],
}

// WHO Toddler kcal (1-4 years)
const WHO_TODDLER_KCAL = {
  '1-2': { min: 900, max: 1000 },
  '3-4': { min: 1200, max: 1400 },
}

// WHO Baby (<1 year)
const WHO_BABY_KCAL = { min: 500, max: 700 }

function getWHOToddlerCalories(age: number): number {
  if (age >= 3) return (WHO_TODDLER_KCAL['3-4'].min + WHO_TODDLER_KCAL['3-4'].max) / 2
  return (WHO_TODDLER_KCAL['1-2'].min + WHO_TODDLER_KCAL['1-2'].max) / 2
}

// ============ MAIN CALCULATION ============

export interface NutritionTargets {
  tdeeKcal: number
  goalKcal: number
  proteinG: number
  carbsG: number
  fatG: number
  fibreG: number
  calciumMg: number
  ironMg: number
  vitaminDMcg: number
}

export function calculateNutritionTargets(member: {
  age: number | null
  biologicalSex: string | null
  weight: number | null // kg
  height: number | null // cm
  activityLevel: string
  healthGoal: string
}): NutritionTargets {
  const { age, biologicalSex, weight, height, activityLevel, healthGoal } = member

  let tdeeKcal: number

  if (!age || age >= 19) {
    // ============ ADULTS: Mifflin-St Jeor ============
    if (!weight || !height) {
      tdeeKcal = 2000 // Default fallback
    } else {
      const sexOffset = getSexOffset(biologicalSex)
      const activityMult = getActivityMultiplier(activityLevel)

      // Mifflin-St Jeor: (10 × weight_kg) + (6.25 × height_cm) − (5 × age) ± sex_offset
      const bmr = (10 * weight) + (6.25 * height) - (5 * (age || 30)) + sexOffset
      tdeeKcal = Math.round(bmr * activityMult)
    }
  } else if (age >= 5 && age < 19) {
    // ============ CHILDREN (5-18): WHO EER Table ============
    const ageRange = age < 13 ? '5-8' : age < 15 ? '9-13' : '14-18'
    const eerData = WHO_CHILD_EER[ageRange]?.[0]
    const baseEer = biologicalSex === 'male' ? eerData?.male || 1800 : eerData?.female || 1650
    tdeeKcal = baseEer
  } else if (age >= 1 && age < 5) {
    // ============ TODDLERS (1-4): WHO ============
    tdeeKcal = Math.round(getWHOToddlerCalories(age))
  } else {
    // ============ BABIES (<1): WHO ============
    tdeeKcal = Math.round((WHO_BABY_KCAL.min + WHO_BABY_KCAL.max) / 2)
  }

  // ============ GOAL ADJUSTMENT ============
  const adjustment = getGoalAdjustment(healthGoal)
  const goalKcal = Math.round(tdeeKcal * (1 + adjustment.calorieAdjustment))

  // ============ MACRO SPLIT ============
  const { macroSplit } = adjustment
  const proteinKcal = goalKcal * macroSplit.protein
  const carbsKcal = goalKcal * macroSplit.carbs
  const fatKcal = goalKcal * macroSplit.fat

  // Convert to grams (protein/carbs = 4 kcal/g, fat = 9 kcal/g)
  let proteinG = Math.round(proteinKcal / 4)
  
  // Apply protein floor for weight loss / muscle gain
  if (weight && adjustment.proteinFloor > 0) {
    const proteinFloor = weight * adjustment.proteinFloor
    proteinG = Math.max(proteinG, Math.round(proteinFloor))
  }

  const carbsG = Math.round(carbsKcal / 4)
  const fatG = Math.round(fatKcal / 9)

  // ============ DEFAULT MICRONUTRIENTS ============
  // These are general recommendations, could be personalized
  const fibreG = Math.round(goalKcal / 100) // ~1g per 100kcal is a rough guide

  return {
    tdeeKcal,
    goalKcal,
    proteinG,
    carbsG,
    fatG,
    fibreG,
    calciumMg: age && age < 19 ? 1300 : 1000, // mg
    ironMg: age && age < 19 ? 15 : 8, // mg
    vitaminDMcg: 20, // mcg (800 IU)
  }
}

// ============ DATABASE INTEGRATION ============

export async function calculateAndSaveTargets(memberId: string): Promise<NutritionTargets> {
  const [member] = await db.select().from(members).where(eq(members.id, memberId))
  
  if (!member) {
    throw new Error('Member not found')
  }

  const targets = calculateNutritionTargets({
    age: member.age,
    biologicalSex: member.biologicalSex,
    weight: member.weight,
    height: member.height,
    activityLevel: member.activityLevel || 'moderate',
    healthGoal: member.healthGoal || 'maintenance',
  })

  const now = Date.now()

  // Upsert targets
  await db.insert(memberNutritionTargets).values({
    memberId,
    ...targets,
    isCustom: 0,
    calculatedAt: now,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: memberNutritionTargets.memberId,
    set: {
      ...targets,
      isCustom: 0,
      updatedAt: now,
    },
  })

  return targets
}

export async function getMemberTargets(memberId: string): Promise<NutritionTargets | null> {
  const [targets] = await db.select().from(memberNutritionTargets)
    .where(eq(memberNutritionTargets.memberId, memberId))
  
  if (!targets) return null

  return {
    tdeeKcal: targets.tdeeKcal || 0,
    goalKcal: targets.goalKcal || 0,
    proteinG: targets.proteinG || 0,
    carbsG: targets.carbsG || 0,
    fatG: targets.fatG || 0,
    fibreG: targets.fibreG || 0,
    calciumMg: targets.calciumMg || 0,
    ironMg: targets.ironMg || 0,
    vitaminDMcg: targets.vitaminDMcg || 0,
  }
}
