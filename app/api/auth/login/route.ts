import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { memberId, pin } = await request.json()

    if (!memberId || !pin) {
      return NextResponse.json({ error: 'Missing memberId or pin' }, { status: 400 })
    }

    const result = await db.select().from(members).where(eq(members.id, memberId))
    const member = result[0]

    if (!member || member.pin !== pin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    return NextResponse.json({
      id: member.id,
      name: member.name,
      role: member.role,
      avatar: member.avatar,
      age: member.age,
      biologicalSex: member.biologicalSex,
      weight: member.weight,
      height: member.height,
      activityLevel: member.activityLevel,
      healthGoal: member.healthGoal,
      dietaryRestrictions: member.dietaryRestrictions,
      contactInfo: member.contactInfo,
    })
  } catch (error) {
    console.error('Login failed:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
