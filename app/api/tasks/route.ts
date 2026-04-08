import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ulid } from 'ulid'

export async function GET() {
  try {
    const allTasks = await db.select().from(tasks)
    return NextResponse.json(allTasks)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, category, description, estimatedMinutes, priority, isRecurring, templateId } = body

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }

    const taskId = ulid()
    const now = Date.now()

    await db.insert(tasks).values({
      id: taskId,
      templateId: templateId || null,
      name,
      description: description || null,
      category,
      estimatedMinutes: estimatedMinutes || 30,
      priority: priority || 'medium',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })

    const [newTask] = await db.select().from(tasks).where(eq(tasks.id, taskId))
    return NextResponse.json(newTask, { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
