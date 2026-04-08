'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/auth-provider'
import { Plus, Calendar, Users } from 'lucide-react'
import Link from 'next/link'

export default function MealPlannerPage() {
  const { currentMember } = useAuth()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meal Planner</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            This Week
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Generate Plan
          </Button>
        </div>
      </div>

      {/* Week Grid Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Week of April 7, 2025</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="border rounded-lg p-2 min-h-[200px]">
                <div className="font-medium text-sm mb-2">{day}</div>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">Breakfast</div>
                  <div className="text-xs text-gray-500">Lunch</div>
                  <div className="text-xs text-gray-500">Dinner</div>
                  <div className="text-xs text-gray-500">Snack</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meal Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">18</div>
            <div className="text-sm text-gray-500">Meals Planned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-500">65%</div>
            <div className="text-sm text-gray-500">Leftover Usage</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-500">4.2h</div>
            <div className="text-sm text-gray-500">Cook Time</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
