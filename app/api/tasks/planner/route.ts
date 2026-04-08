import { NextResponse } from 'next/server'
import { generateTaskPlans, applyTaskPlan, quickDistribute } from '@/lib/tasks/ai-advisor'
import { getMealPrepTasks } from '@/lib/tasks/mealBridge'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ulid } from 'ulid'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('weekStart') || new Date().toISOString().split('T')[0]

  try {
    // Get meal-prep tasks (pre-locked)
    const mealPrepTasks = await getMealPrepTasks(weekStart)
    const preLocked = mealPrepTasks.map(t => ({
      taskId: t.id,
      assigneeName: t.assignee?.name || 'Unassigned',
      day: t.scheduledDate,
    }))

    // Get member IDs
    const memberList = await db.select().from(members)
    const memberIds = memberList.map(m => m.id)

    // Generate plans
    const result = await generateTaskPlans({
      weekStart,
      includeRecurring: true,
      memberIds,
      preLockedAssignments: preLocked,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ plans: result.plans })
  } catch (error) {
    console.error('Planner failed:', error)
    return NextResponse.json({ error: 'Failed to generate plans' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, weekStart, plan, taskIds, memberIds } = body

    if (action === 'apply-plan' && plan) {
      const result = await applyTaskPlan(plan, weekStart)
      return NextResponse.json(result)
    }

    if (action === 'quick-distribute' && taskIds && memberIds) {
      const result = await quickDistribute(taskIds, memberIds, weekStart)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Planner action failed:', error)
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}
