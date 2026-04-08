import { db } from '@/lib/db'
import { 
  members, 
  taskTemplates, 
  tasks, 
  taskAssignments, 
  weekPlans,
  rules 
} from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { ulid } from 'ulid'
import { getWeekStart, DAYS } from '@/lib/utils'

export interface MemberAvailability {
  memberId: string
  memberName: string
  capacityMinutes: number
  workSchedule: string | null
}

export interface TaskWithTemplate {
  id: string
  name: string
  category: string
  estimatedMinutes: number
  priority: 'low' | 'medium' | 'high'
  isRecurring: boolean
  templateId: string | null
}

export interface FairnessScore {
  memberId: string
  memberName: string
  totalMinutes: number
  fairnessPercent: number
  taskCount: number
}

// Get member availability for a week
export async function getMemberAvailability(
  memberIds: string[],
  weekStart: string
): Promise<MemberAvailability[]> {
  const availability: MemberAvailability[] = []

  for (const memberId of memberIds) {
    const [member] = await db.select().from(members).where(eq(members.id, memberId))
    if (member) {
      availability.push({
        memberId,
        memberName: member.name,
        capacityMinutes: member.weeklyCapacityMinutes || 300,
        workSchedule: member.workSchedule,
      })
    }
  }

  return availability
}

// Calculate fairness scores based on current assignments
export async function calculateFairnessScores(
  weekPlanId: string,
  memberIds: string[]
): Promise<FairnessScore[]> {
  // Get all assignments for this week
  const assignments = await db.select().from(taskAssignments)
    .where(eq(taskAssignments.weekPlanId, weekPlanId))

  // Calculate total minutes per member
  const minutesPerMember: Record<string, number> = {}
  const taskCountPerMember: Record<string, number> = {}

  for (const memberId of memberIds) {
    minutesPerMember[memberId] = 0
    taskCountPerMember[memberId] = 0
  }

  for (const assignment of assignments) {
    if (assignment.assignedTo) {
      const task = await db.select().from(tasks).where(eq(tasks.id, assignment.taskId))
      if (task[0]) {
        minutesPerMember[assignment.assignedTo] += task[0].estimatedMinutes || 0
        taskCountPerMember[assignment.assignedTo]++
      }
    }
  }

  // Calculate total capacity and fairness
  const availability = await getMemberAvailability(memberIds, getWeekStart())
  const totalCapacity = availability.reduce((sum, a) => sum + a.capacityMinutes, 0)
  const avgMinutes = totalCapacity / memberIds.length

  const scores: FairnessScore[] = []

  for (const memberId of memberIds) {
    const [member] = await db.select().from(members).where(eq(members.id, memberId))
    const total = minutesPerMember[memberId] || 0
    const fairness = avgMinutes > 0 ? Math.round((1 - Math.abs(total - avgMinutes) / avgMinutes) * 100) : 100

    scores.push({
      memberId,
      memberName: member?.name || 'Unknown',
      totalMinutes: total,
      fairnessPercent: Math.max(0, fairness),
      taskCount: taskCountPerMember[memberId],
    })
  }

  return scores
}

// Simple scheduling algorithm - distributes tasks fairly
export async function distributeTasks(
  taskIds: string[],
  memberIds: string[],
  weekPlanId: string
): Promise<Array<{ taskId: string; memberId: string | null }>> {
  // Get availability
  const availability = await getMemberAvailability(memberIds, getWeekStart())
  
  // Track remaining capacity per member
  const remainingCapacity: Record<string, number> = {}
  for (const m of availability) {
    remainingCapacity[m.memberId] = m.capacityMinutes
  }

  // Sort tasks by priority and estimated time (hard tasks first)
  const tasksToSchedule: TaskWithTemplate[] = []
  for (const taskId of taskIds) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId))
    if (task) {
      tasksToSchedule.push({
        id: task.id,
        name: task.name,
        category: task.category,
        estimatedMinutes: task.estimatedMinutes || 30,
        priority: task.priority as 'low' | 'medium' | 'high',
        isRecurring: false,
        templateId: task.templateId,
      })
    }
  }

  // Sort: high priority first, then by time (longer tasks easier to fit)
  tasksToSchedule.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return b.estimatedMinutes - a.estimatedMinutes
  })

  const assignments: Array<{ taskId: string; memberId: string | null }> = []

  for (const task of tasksToSchedule) {
    // Find member with most remaining capacity
    let bestMember: string | null = null
    let maxCapacity = -1

    for (const memberId of memberIds) {
      if (remainingCapacity[memberId] >= task.estimatedMinutes) {
        if (remainingCapacity[memberId] > maxCapacity) {
          maxCapacity = remainingCapacity[memberId]
          bestMember = memberId
        }
      }
    }

    if (bestMember) {
      remainingCapacity[bestMember] -= task.estimatedMinutes
    }

    assignments.push({ taskId: task.id, memberId: bestMember })
  }

  return assignments
}

// Get all pending tasks for a week
export async function getWeeklyTasks(weekStart: string) {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndStr = weekEnd.toISOString().split('T')[0]

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

  // Get all assignments
  const assignments = await db.select({
    assignment: taskAssignments,
    task: tasks,
  })
    .from(taskAssignments)
    .innerJoin(tasks, eq(tasks.id, taskAssignments.taskId))
    .where(eq(taskAssignments.weekPlanId, weekPlan.id))

  return {
    weekPlan,
    assignments: assignments.map(a => ({
      ...a.assignment,
      task: a.task,
    })),
  }
}
