'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Member {
  id: string
  name: string
  role: string
  avatar?: string
  age?: number | null
  biologicalSex?: string | null
  weight?: number | null
  height?: number | null
  activityLevel?: string | null
  healthGoal?: string | null
  dietaryRestrictions?: string | null
  contactInfo?: string | null
}

interface AuthContextType {
  currentMember: Member | null
  isAuthenticated: boolean
  login: (memberId: string, pin: string) => Promise<boolean>
  logout: () => void
  allMembers: Member[]
  refreshMembers: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)

  async function loadMembers() {
    try {
      const res = await fetch('/api/members')
      if (res.ok) {
        const data = await res.json()
        setAllMembers(data)
      }
    } catch (e) {
      console.warn('Failed to load members')
    }
  }

  useEffect(() => {
    loadMembers()
    
    // Check for existing session - restore full member data from localStorage
    const savedMemberId = localStorage.getItem('family-os-member-id')
    const savedMemberData = localStorage.getItem('family-os-member-data')
    
    if (savedMemberId && savedMemberData) {
      try {
        const memberData = JSON.parse(savedMemberData)
        setCurrentMember(memberData)
      } catch {
        // Invalid data, clear session
        localStorage.removeItem('family-os-member-id')
        localStorage.removeItem('family-os-member-data')
      }
    }
    setIsLoading(false)
  }, [])

  async function login(memberId: string, pin: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, pin }),
      })

      if (response.ok) {
        const member = await response.json()
        localStorage.setItem('family-os-member-id', member.id)
        localStorage.setItem('family-os-member-data', JSON.stringify(member))
        setCurrentMember(member)
        return true
      }
      return false
    } catch (e) {
      console.error('Login failed:', e)
      return false
    }
  }

  function logout() {
    localStorage.removeItem('family-os-member-id')
    localStorage.removeItem('family-os-member-data')
    setCurrentMember(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        currentMember,
        isAuthenticated: !!currentMember,
        login,
        logout,
        allMembers,
        refreshMembers: loadMembers,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
