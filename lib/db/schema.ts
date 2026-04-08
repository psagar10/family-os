import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// ============ SHARED TABLES ============

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  pin: text('pin').notNull(),
  avatar: text('avatar'),
  role: text('role').notNull().default('member'),
  age: integer('age'),
  biologicalSex: text('biological_sex'),
  weight: real('weight'),
  height: real('height'),
  activityLevel: text('activity_level').default('moderate'),
  healthGoal: text('health_goal').default('maintenance'),
  dietaryRestrictions: text('dietary_restrictions'),
  medicalNotes: text('medical_notes'),
  notificationChannels: text('notification_channels'),
  contactInfo: text('contact_info'),
  weeklyCapacityMinutes: integer('weekly_capacity_minutes').default(300),
  workSchedule: text('work_schedule'),
  createdAt: integer('created_at').notNull(),
})

export const calendarEvents = sqliteTable('calendar_events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  allDay: integer('all_day').default(1),
  source: text('source').default('manual'),
  externalId: text('external_id'),
  createdAt: integer('created_at').notNull(),
})

// ============ MEAL PLANNER TABLES ============

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  canonicalId: text('canonical_id'),
  versionName: text('version_name').default('Original'),
  name: text('name').notNull(),
  description: text('description'),
  cuisineTag: text('cuisine_tag'),
  mealType: text('meal_type').notNull(),
  baseServings: integer('base_servings').notNull().default(4),
  prepMins: integer('prep_mins').default(0),
  cookMins: integer('cook_mins').default(0),
  totalMins: integer('total_mins').default(0),
  difficulty: text('difficulty').default('medium'),
  isSharedMeal: integer('is_shared_meal').default(0),
  tags: text('tags'),
  sourceUrl: text('source_url'),
  sourceType: text('source_type'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const recipeIngredients = sqliteTable('recipe_ingredients', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(),
  prepNote: text('prep_note'),
  substitution: text('substitution'),
  isOptional: integer('is_optional').default(0),
  sortOrder: integer('sort_order').notNull(),
})

export const recipeSteps = sqliteTable('recipe_steps', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull(),
  instruction: text('instruction').notNull(),
  isPassive: integer('is_passive').default(0),
  timerMins: integer('timer_mins'),
  leadTimeMins: integer('lead_time_mins'),
  leadTimeNote: text('lead_time_note'),
})

export const recipeNutrition = sqliteTable('recipe_nutrition', {
  recipeId: text('recipe_id').primaryKey().references(() => recipes.id),
  perServings: integer('per_servings').notNull().default(1),
  calories: real('calories'),
  proteinG: real('protein_g'),
  carbsG: real('carbs_g'),
  fatG: real('fat_g'),
  fibreG: real('fibre_g'),
  sugarG: real('sugar_g'),
  sodiumMg: real('sodium_mg'),
  confidence: real('confidence').default(0.7),
  updatedAt: integer('updated_at').notNull(),
})

export const mealPlans = sqliteTable('meal_plans', {
  id: text('id').primaryKey(),
  weekStart: text('week_start').notNull(),
  weekEnd: text('week_end').notNull(),
  status: text('status').notNull().default('draft'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const mealPlanSlots = sqliteTable('meal_plan_slots', {
  id: text('id').primaryKey(),
  mealPlanId: text('meal_plan_id').notNull().references(() => mealPlans.id),
  day: text('day').notNull(),
  mealType: text('meal_type').notNull(),
  recipeId: text('recipe_id').references(() => recipes.id),
  isLeftoverOf: text('is_leftover_of'),
  portionNotes: text('portion_notes'),
  status: text('status').default('planned'),
  actualRecipeId: text('actual_recipe_id').references(() => recipes.id),
  feedbackNote: text('feedback_note'),
  rating: integer('rating'),
})

export const pantryItems = sqliteTable('pantry_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  quantity: real('quantity'),
  unit: text('unit'),
  addedAt: integer('added_at').notNull(),
  expiresAt: integer('expires_at'),
})

export const memberNutritionTargets = sqliteTable('member_nutrition_targets', {
  memberId: text('member_id').primaryKey().references(() => members.id),
  tdeeKcal: real('tdee_kcal'),
  goalKcal: real('goal_kcal'),
  proteinG: real('protein_g'),
  carbsG: real('carbs_g'),
  fatG: real('fat_g'),
  fibreG: real('fibre_g'),
  calciumMg: real('calcium_mg'),
  ironMg: real('iron_mg'),
  vitaminDMcg: real('vitamin_d_mcg'),
  isCustom: integer('is_custom').default(0),
  calculatedAt: integer('calculated_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

// ============ TASK PLANNER TABLES ============

export const taskTemplates = sqliteTable('task_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  estimatedMinutes: integer('estimated_minutes').default(30),
  isRecurring: integer('is_recurring').default(0),
  recurrencePattern: text('recurrence_pattern'),
  priority: text('priority').default('medium'),
  createdAt: integer('created_at').notNull(),
})

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  templateId: text('template_id').references(() => taskTemplates.id),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  estimatedMinutes: integer('estimated_minutes').default(30),
  priority: text('priority').default('medium'),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const taskAssignments = sqliteTable('task_assignments', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id),
  weekPlanId: text('week_plan_id').notNull().references(() => weekPlans.id),
  assignedTo: text('assigned_to').references(() => members.id),
  scheduledDate: text('scheduled_date').notNull(),
  variant: text('variant').default('standard'),
  status: text('status').default('pending'),
  source: text('source').default('manual'),
  notes: text('notes'),
})

export const weekPlans = sqliteTable('week_plans', {
  id: text('id').primaryKey(),
  weekStart: text('week_start').notNull(),
  status: text('status').notNull().default('draft'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const rules = sqliteTable('rules', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  config: text('config').notNull(),
  isActive: integer('is_active').default(1),
  createdAt: integer('created_at').notNull(),
})

export const modes = sqliteTable('modes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: integer('is_active').default(0),
  createdAt: integer('created_at').notNull(),
})

export const notificationLog = sqliteTable('notification_log', {
  id: text('id').primaryKey(),
  memberId: text('member_id').references(() => members.id),
  channel: text('channel').notNull(),
  message: text('message').notNull(),
  sentAt: integer('sent_at').notNull(),
  status: text('status').notNull(),
})

// ============ TYPE EXPORTS ============

export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
export type Recipe = typeof recipes.$inferSelect
export type NewRecipe = typeof recipes.$inferInsert
export type RecipeIngredient = typeof recipeIngredients.$inferSelect
export type RecipeStep = typeof recipeSteps.$inferSelect
export type RecipeNutrition = typeof recipeNutrition.$inferSelect
export type MealPlan = typeof mealPlans.$inferSelect
export type MealPlanSlot = typeof mealPlanSlots.$inferSelect
export type PantryItem = typeof pantryItems.$inferSelect
export type MemberNutritionTarget = typeof memberNutritionTargets.$inferSelect
export type TaskTemplate = typeof taskTemplates.$inferSelect
export type Task = typeof tasks.$inferSelect
export type TaskAssignment = typeof taskAssignments.$inferSelect
export type WeekPlan = typeof weekPlans.$inferSelect
export type Rule = typeof rules.$inferSelect
export type Mode = typeof modes.$inferSelect
