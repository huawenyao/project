import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authService } from '../services/authService'
import { User } from '../types/auth'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // Skip authentication if VITE_SKIP_AUTH is true
      if (import.meta.env.VITE_SKIP_AUTH === 'true') {
        const demoUser: User = {
          id: 'demo-user-001',
          email: 'demo@aibuilder.studio',
          name: 'Demo User',
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setUser(demoUser)
        setLoading(false)
        return
      }

      const token = localStorage.getItem('auth_token')
      if (token) {
        const userData = await authService.getCurrentUser()
        setUser(userData)
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      localStorage.removeItem('auth_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const { user: userData, token } = await authService.login(email, password)
      localStorage.setItem('auth_token', token)
      setUser(userData)
      toast.success('Welcome back!')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
      throw error
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const { user: userData, token } = await authService.register(email, password, name)
      localStorage.setItem('auth_token', token)
      setUser(userData)
      toast.success('Account created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data)
      setUser(updatedUser)
      toast.success('Profile updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Profile update failed')
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
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