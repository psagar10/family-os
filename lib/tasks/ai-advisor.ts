import { aiRequest, aiJsonRequest, TASK_PLANNING_PROMPT } from '@/lib/ai/minimax'
import { db } from '@/lib/db'
import { members, taskAssignments, tasks, weekPlans, rules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ulid } from 'ulid'
import { getWeekStart, DAYS } from '@/lib/utils'
import { distributeTasks, calculateFairnessScores, type FairnessScore } from './engine'

export interface TaskPlan {
  id: string
  name: string
  description: string
  assignments: Array<{
    taskName: string
    assigneeName: string
    day: string
  }>
  fairnessScores: FairnessScore[]
  totalMinutes: number
}

export interface PlanningContext {
  weekStart: string
  includeRecurring: boolean
  memberIds: string[]
  preLockedAssignments: Array<{
    taskId: string
    assigneeName: string
    day: string
  }>
}

// Generate 2-3 ranked task plans using AI
export async function generateTaskPlans(context: PlanningContext): Promise<{
  success: boolean
  plans?: TaskPlan[]
  error?: string
}> {
  try {
    // Get member info
    const memberList: Array<{ id: string; name: string; capacity: number }> = []
    for (const id of context.memberIds) {
      const [m] = await db.select({
        id: members.id,
        name: members.name,
        capacity: members.weeklyCapacityMinutes,
      }).from(members).where(eq(members.id, id))
      if (m) memberList.push({ id: m.id, name: m.name, capacity: m.capacity || 300 })
    }

    // Get pre-locked meal-prep tasks (these won't be moved)
    const preLocked = context.preLockedAssignments

    // Get pending tasks
    const allTasks = await db.select().from(tasks).where(eq(tasks.status, 'pending'))
    const recurringTasks = context.includeRecurring
      ? await db.select().from(tasks).where(eq(tasks.status, 'recurring'))
      : []

    // Combine and deduplicate
    const taskMap = new Map<string, typeof tasks.$inferSelect>()
    for (const t of [...allTasks, ...recurringTasks]) {
      taskMap.set(t.id, t)
    }
    const tasksList = Array.from(taskMap.values())

    // Build prompt
    const systemPrompt = `${TASK_PLANNING_PROMPT}

Family Members:
${memberList.map(m => `- ${m.name}: ${m.capacity} min/week available`).join('\n')}

Week: ${context.weekStart}

Pre-locked assignments (do NOT move these):
${preLocked.map(p => `- ${p.taskId} assigned to ${p.assigneeName} on ${p.day}`).join('\n')}

Available Tasks (${tasksList.length}):
${tasksList.slice(0, 30).map(t => 
  `- ${t.id}: ${t.name} (${t.category}) - ${t.estimatedMinutes || 30}min - ${t.priority} priority`
).join('\n')}

Generate 2-3 ranked plans that distribute tasks fairly across family members.
Respond ONLY with valid JSON array of plans.`

    const result = await aiJsonRequest<TaskPlan[]>({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate fair task plans for this week.' }
      ],
      temperature: 0.6,
      maxTokens: 4096,
    })

    return { success: true, plans: result }
  } catch (error) {
    console.error('Task planning failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Planning failed' }
  }
}

// Apply a task plan
export async function applyTaskPlan(plan: TaskPlan, weekStart: string): Promise<{
  success: boolean
  weekPlanId?: string
  error?: string
}> {
  try {
    // Get or create week plan
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

    // Apply assignments from plan
    for (const assignment of plan.assignments) {
      const [member] = await db.select().from(members)
        .where(eq(members.name, assignment.assigneeName))
      
      if (!member) continue

      // Find task by name (simplified - in production would use ID)
      const [task] = await db.select().from(tasks)
        .where(eq(tasks.name, assignment.taskName))

      if (!task) continue

      // Create assignment
      await db.insert(taskAssignments).values({
        id: ulid(),
        taskId: task.id,
        weekPlanId: weekPlan.id,
        assignedTo: member.id,
        scheduledDate: assignment.day,
        source: 'ai-plan',
      }).onConflictDoNothing()
    }

    return { success: true, weekPlanId: weekPlan.id }
  } catch (error) {
    console.error('Failed to apply task plan:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to apply plan' }
  }
}

// Quick fair distribution (no AI)
export async function quickDistribute(
  taskIds: string[],
  memberIds: string[],
  weekStart: string
): Promise<{
  success: boolean
  weekPlanId?: string
  fairnessScores?: FairnessScore[]
}> {
  try {
    // Get or create week plan
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

    // Distribute tasks
    const distribution = await distributeTasks(taskIds, memberIds, weekPlan.id)

    // Create assignments
    for (const { taskId, memberId } of distribution) {
      if (!memberId) continue

      // Find a day for this member (simple round-robin)
      const existing = await db.select().from(taskAssignments)
        .where(eq(taskAssignments.assignedTo, memberId))

      const usedDays = new Set(existing.map(a => a.scheduledDate))
      const availableDay = DAYS.find(d => !usedDays.has(d)) || DAYS[0]

      await db.insert(taskAssignments).values({
        id: ulid(),
        taskId,
        weekPlanId: weekPlan.id,
        assignedTo: memberId,
        scheduledDate: availableDay,
        source: 'auto-distribute',
      }).onConflictDoNothing()
    }

    // Calculate fairness
    const fairnessScores = await calculateFairnessScores(weekPlan.id, memberIds)

    return { success: true, weekPlanId: weekPlan.id, fairnessScores }
  } catch (error) {
    console.error('Quick distribute failed:', error)
    return { success: false }
  }
}
