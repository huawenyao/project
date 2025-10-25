export interface User {
  id: string
  email: string
  name: string
  tier: 'free' | 'pro' | 'enterprise'
  createdAt: string
  updatedAt?: string
  lastLogin?: string
  avatar?: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: {
    email: boolean
    push: boolean
    agentUpdates: boolean
    deployments: boolean
  }
  editor: {
    fontSize: number
    tabSize: number
    wordWrap: boolean
    minimap: boolean
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: User
  token: string
  expiresIn: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}