'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/auth-provider'
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  RotateCcw
} from 'lucide-react'
import { DAYS } from '@/lib/utils'

interface TaskAssignment {
  id: string
  taskName: string
  category: string
  estimatedMinutes: number
  priority: string
  assignedTo: string | null
  assigneeName?: string
  scheduledDate: string
  status: string
  source: string
}

interface FairnessScore {
  memberId: string
  memberName: string
  totalMinutes: number
  fairnessPercent: number
  taskCount: number
}

export default function TaskPlannerPage() {
  const { currentMember } = useAuth()
  const [weekStart, setWeekStart] = useState(new Date().toISOString().split('T')[0])
  const [assignments, setAssignments] = useState<TaskAssignment[]>([])
  const [fairnessScores, setFairnessScores] = useState<FairnessScore[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadAssignments()
  }, [weekStart])

  async function loadAssignments() {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/planner?weekStart=${weekStart}`)
      if (res.ok) {
        const data = await res.json()
        setAssignments(data.assignments || [])
        setFairnessScores(data.fairnessScores || [])
      }
    } catch (e) {
      console.error('Failed to load tasks')
    }
    setLoading(false)
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      // This would call the AI planner
      await new Promise(resolve => setTimeout(resolve, 2000))
      await loadAssignments()
    } finally {
      setGenerating(false)
    }
  }

  async function handleQuickDistribute() {
    setGenerating(true)
    try {
      const res = await fetch('/api/tasks/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quick-distribute',
          weekStart,
          taskIds: assignments.map(a => a.id),
          memberIds: fairnessScores.map(f => f.memberId),
        }),
      })
      if (res.ok) {
        await loadAssignments()
      }
    } finally {
      setGenerating(false)
    }
  }

  // Group assignments by day
  const assignmentsByDay: Record<string, TaskAssignment[]> = {}
  for (const day of DAYS) {
    assignmentsByDay[day] = assignments.filter(a => a.scheduledDate === day)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Task Planner</h1>
            <p className="text-muted-foreground">Week of {weekStart}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleQuickDistribute} disabled={generating}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Quick Distribute
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              <Sparkles className="w-4 h-4 mr-2" />
              {generating ? 'Generating...' : 'AI Plan'}
            </Button>
          </div>
        </div>

        {/* Fairness Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          {fairnessScores.map(score => (
            <Card key={score.memberId}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{score.memberName}</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    score.fairnessPercent >= 80 ? 'text-green-600' :
                    score.fairnessPercent >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {score.fairnessPercent}%
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{score.totalMinutes} min</span>
                  <span>{score.taskCount} tasks</span>
                </div>
                <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      score.fairnessPercent >= 80 ? 'bg-green-500' :
                      score.fairnessPercent >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score.fairnessPercent}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Week Grid */}
        <div className="grid gap-4 lg:grid-cols-7">
          {DAYS.map(day => (
            <Card key={day} className="min-h-[200px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{day}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {assignmentsByDay[day].length} tasks
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <div className="animate-pulse h-10 bg-muted rounded" />
                ) : assignmentsByDay[day].length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>
                ) : (
                  assignmentsByDay[day].map(assignment => (
                    <div 
                      key={assignment.id}
                      className={`p-2 rounded-lg border text-sm ${
                        assignment.source === 'meal-prep' 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-background'
                      }`}
                    >
                      <p className="font-medium truncate">{assignment.taskName}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {assignment.estimatedMinutes}m
                        {assignment.assigneeName && (
                          <>
                            <User className="w-3 h-3 ml-1" />
                            {assignment.assigneeName}
                          </>
                        )}
                      </div>
                      {assignment.source === 'meal-prep' && (
                        <span className="text-xs text-blue-600 mt-1">🍽️ Meal prep</span>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.filter(a => a.status === 'done').length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.filter(a => a.status === 'pending').length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignments.reduce((sum, a) => sum + (a.estimatedMinutes || 0), 0)}m
                </p>
                <p className="text-sm text-muted-foreground">Total Time</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
