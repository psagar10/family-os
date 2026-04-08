import { db } from '@/lib/db'
import { mealPlanSlots, taskAssignments, weekPlans, tasks, members, recipeSteps } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ulid } from 'ulid'
import { getWeekStart } from '@/lib/utils'

// Inject meal prep tasks from an active meal plan
export async function injectMealPrepTasks(
  mealPlanId: string,
  weekStart: string
): Promise<{
  success: boolean
  tasksCreated: number
  error?: string
}> {
  try {
    // Get the meal plan slots
    const slots = await db.select().from(mealPlanSlots)
      .where(eq(mealPlanSlots.mealPlanId, mealPlanId))

    // Get or create week plan for tasks
    let [weekPlan] = await db.select().from(weekPlans)
      .where(eq(weekPlans.weekStart, weekStart))

    if (!weekPlan) {
      const planId = ulid()
      await db.insert(weekPlans).values({
        id: planId,
        weekStart,
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      ;[weekPlan] = await db.select().from(weekPlans).where(eq(weekPlans.id, planId))
    }

    // Get recipe steps with lead times (passive prep)
    const recipeLeadTimes = new Map<string, number>()

    for (const slot of slots) {
      if (slot.recipeId && !slot.isLeftoverOf) {
        // Check for lead time steps
        const steps = await db.select().from(recipeSteps)
          .where(eq(recipeSteps.recipeId, slot.recipeId))

        for (const step of steps) {
          if (step.leadTimeMins && step.leadTimeMins > 0) {
            const existingLead = recipeLeadTimes.get(slot.recipeId) || 0
            recipeLeadTimes.set(slot.recipeId, Math.max(existingLead, step.leadTimeMins))
          }
        }
      }
    }

    // Create meal prep tasks
    let tasksCreated = 0

    // Group slots by day for batch cooking detection
    const slotsByDay: Record<string, typeof slots> = {}
    for (const slot of slots) {
      if (!slot.isLeftoverOf) {
        if (!slotsByDay[slot.day]) slotsByDay[slot.day] = []
        slotsByDay[slot.day].push(slot)
      }
    }

    for (const [day, daySlots] of Object.entries(slotsByDay)) {
      if (daySlots.length < 2) continue

      // Check for potential batch cooking (same cuisine or similar prep)
      const recipeIds = daySlots.map(s => s.recipeId).filter(Boolean)

      if (recipeIds.length >= 2) {
        // Create a batch cooking task
        const taskId = ulid()

        // Find any family member to assign (will be redistributed)
        const [member] = await db.select().from(members)

        await db.insert(tasks).values({
          id: taskId,
          name: `Batch Prep: ${daySlots.length} recipes`,
          description: `Prepare ingredients in advance for ${daySlots.length} recipes`,
          category: 'Meal Prep',
          estimatedMinutes: 30,
          priority: 'high',
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }).onConflictDoNothing()

        await db.insert(taskAssignments).values({
          id: ulid(),
          taskId,
          weekPlanId: weekPlan.id,
          assignedTo: member?.id || null,
          scheduledDate: day,
          variant: 'batch-cook',
          source: 'meal-prep',
        }).onConflictDoNothing()

        tasksCreated++
      }
    }

    // Create grocery shopping task for Saturday
    const groceryTaskId = ulid()
    const [firstMember] = await db.select().from(members)

    await db.insert(tasks).values({
      id: groceryTaskId,
      name: 'Weekly Grocery Shop',
      description: 'Purchase ingredients for the week\'s meal plan',
      category: 'Grocery & Errands',
      estimatedMinutes: 90,
      priority: 'high',
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).onConflictDoNothing()

    await db.insert(taskAssignments).values({
      id: ulid(),
      taskId: groceryTaskId,
      weekPlanId: weekPlan.id,
      assignedTo: firstMember?.id || null,
      scheduledDate: 'Saturday',
      variant: 'standard',
      source: 'meal-prep',
    }).onConflictDoNothing()

    tasksCreated++

    return { success: true, tasksCreated }
  } catch (error) {
    console.error('Meal bridge injection failed:', error)
    return {
      success: false,
      tasksCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Check if meal plan has been bridged
export async function isMealPlanBridged(mealPlanId: string): Promise<boolean> {
  const assignments = await db.select().from(taskAssignments)
    .where(eq(taskAssignments.weekPlanId, mealPlanId))

  return assignments.some(a => a.source === 'meal-prep')
}

// Get meal prep tasks for a week
export async function getMealPrepTasks(weekStart: string) {
  // Get week plan
  const [weekPlan] = await db.select().from(weekPlans)
    .where(eq(weekPlans.weekStart, weekStart))

  if (!weekPlan) return []

  const assignments = await db.select({
    assignment: taskAssignments,
    task: tasks,
    member: members,
  })
    .from(taskAssignments)
    .innerJoin(tasks, eq(tasks.id, taskAssignments.taskId))
    .leftJoin(members, eq(members.id, taskAssignments.assignedTo))
    .where(eq(taskAssignments.weekPlanId, weekPlan.id))

  return assignments
    .filter(a => a.assignment.source === 'meal-prep')
    .map(a => ({
      ...a.task,
      ...a.assignment,
      assignee: a.member,
    }))
}
