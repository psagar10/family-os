'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/providers/auth-provider'
import { ChefHat, ListTodo, Calendar, TrendingUp, Users, Clock } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { currentMember } = useAuth()

  const stats = [
    {
      title: 'This Week Meals',
      value: '18/28',
      subtitle: '3 slots remaining',
      icon: ChefHat,
      href: '/meal/planner',
      color: 'bg-orange-500',
    },
    {
      title: 'Tasks Today',
      value: '5',
      subtitle: '2 overdue',
      icon: ListTodo,
      href: '/tasks/planner',
      color: 'bg-blue-500',
    },
    {
      title: 'Grocery Items',
      value: '24',
      subtitle: 'For this week',
      icon: Calendar,
      href: '/meal/grocery',
      color: 'bg-green-500',
    },
    {
      title: 'Family Fairness',
      value: '92%',
      subtitle: 'Balanced workload',
      icon: TrendingUp,
      href: '/tasks/planner',
      color: 'bg-purple-500',
    },
  ]

  const quickActions = [
    { name: 'Add Recipe', href: '/meal/library', icon: ChefHat },
    { name: 'Plan Meals', href: '/meal/planner', icon: Calendar },
    { name: 'View Tasks', href: '/tasks/planner', icon: ListTodo },
    { name: 'Manage Members', href: '/members', icon: Users },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {currentMember?.name || 'Family'}
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link 
                key={action.name} 
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <action.icon className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium">{action.name}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ChefHat className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">Dinner: Pasta</span>
                </div>
                <span className="text-sm text-gray-500">7:00 PM</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ListTodo className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Clean kitchen</span>
                </div>
                <span className="text-sm text-gray-500">8:00 PM</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Family Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Parent 1</span>
                <span className="text-sm text-gray-500">2 tasks today</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Parent 2</span>
                <span className="text-sm text-gray-500">3 tasks today</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Toddler</span>
                <span className="text-sm text-gray-500">1 task today</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
