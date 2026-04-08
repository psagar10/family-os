import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ulid } from 'ulid'

export async function GET() {
  try {
    const allMembers = await db.select().from(members)
    return NextResponse.json(allMembers)
  } catch (error) {
    console.error('Failed to fetch members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name, pin, role, age, biologicalSex, weight, height,
      activityLevel, healthGoal, dietaryRestrictions, contactInfo
    } = body

    if (!name || !pin) {
      return NextResponse.json({ error: 'Name and PIN are required' }, { status: 400 })
    }

    const memberId = ulid()
    const now = Date.now()

    await db.insert(members).values({
      id: memberId,
      name,
      pin,
      role: role || 'member',
      age: age || null,
      biologicalSex: biologicalSex || null,
      weight: weight || null,
      height: height || null,
      activityLevel: activityLevel || 'moderate',
      healthGoal: healthGoal || 'maintenance',
      dietaryRestrictions: dietaryRestrictions || null,
      notificationChannels: JSON.stringify(['push']),
      contactInfo: JSON.stringify(contactInfo || {}),
      createdAt: now,
    })

    const [newMember] = await db.select().from(members).where(eq(members.id, memberId))
    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error('Failed to create member:', error)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}
