import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { taskTemplates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const templates = await db.select().from(taskTemplates)
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Failed to fetch task templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}
