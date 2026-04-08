'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/providers/auth-provider'
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Activity,
  Target,
  Scale,
  Ruler
} from 'lucide-react'

interface Member {
  id: string
  name: string
  role: string
  age: number | null
  biologicalSex: string | null
  weight: number | null
  height: number | null
  activityLevel: string | null
  healthGoal: string | null
  dietaryRestrictions: string | null
}

export default function MembersPage() {
  const { currentMember, refreshMembers, allMembers } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    try {
      const res = await fetch('/api/members')
      if (res.ok) {
        const data = await res.json()
        setMembers(data)
      }
    } catch (e) {
      console.error('Failed to load members')
    }
    setLoading(false)
  }

  const activityOptions = [
    { value: 'sedentary', label: 'Sedentary', multiplier: 1.2 },
    { value: 'light', label: 'Light', multiplier: 1.375 },
    { value: 'moderate', label: 'Moderate', multiplier: 1.55 },
    { value: 'active', label: 'Active', multiplier: 1.725 },
    { value: 'very-active', label: 'Very Active', multiplier: 1.9 },
  ]

  const healthGoals = [
    { value: 'maintenance', label: 'Maintain Weight' },
    { value: 'weight-loss', label: 'Weight Loss' },
    { value: 'muscle-gain', label: 'Muscle Gain' },
    { value: 'general-health', label: 'General Health' },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Family Members</h1>
            <p className="text-muted-foreground">Manage your household</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>

        {/* Member Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {members.map(member => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <CardTitle>{member.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Age & Demographics */}
                <div className="flex gap-2 flex-wrap text-sm">
                  {member.age && (
                    <span className="px-2 py-1 bg-muted rounded-full">
                      {member.age} years old
                    </span>
                  )}
                  {member.biologicalSex && (
                    <span className="px-2 py-1 bg-muted rounded-full capitalize">
                      {member.biologicalSex}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  {member.weight && (
                    <div className="flex items-center gap-2 text-sm">
                      <Scale className="w-4 h-4 text-muted-foreground" />
                      <span>{member.weight} kg</span>
                    </div>
                  )}
                  {member.height && (
                    <div className="flex items-center gap-2 text-sm">
                      <Ruler className="w-4 h-4 text-muted-foreground" />
                      <span>{member.height} cm</span>
                    </div>
                  )}
                </div>

                {/* Health Profile */}
                <div className="space-y-2 pt-2 border-t">
                  {member.activityLevel && (
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="capitalize">{member.activityLevel.replace('-', ' ')}</span>
                    </div>
                  )}
                  {member.healthGoal && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="capitalize">{member.healthGoal.replace('-', ' ')}</span>
                    </div>
                  )}
                </div>

                {/* Dietary Restrictions */}
                {member.dietaryRestrictions && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Dietary:</p>
                    <div className="flex gap-1 flex-wrap">
                      {member.dietaryRestrictions.split(',').map((r, i) => (
                        <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                          {r.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  {member.id !== currentMember?.id && (
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Nutrition Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Family Nutrition Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Each family member's nutritional targets are calculated based on their age, 
              weight, height, activity level, and health goals. Update member profiles to 
              recalculate daily targets for meal planning.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {members.filter(m => m.role === 'admin' && m.weight && m.height).map(member => {
                const activityMultipliers: Record<string, number> = {
                  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, 'very-active': 1.9
                }
                const multiplier = activityMultipliers[member.activityLevel || 'moderate'] || 1.55
                const base = 10 * (member.weight || 70) + 6.25 * (member.height || 170) - 5 * (member.age || 30) + (member.biologicalSex === 'male' ? 5 : -161)
                const tdee = Math.round(base * multiplier)
                return (
                  <div key={member.id} className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">~{tdee} kcal/day</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
