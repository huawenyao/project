import axios from 'axios'
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest
} from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/login', {
      email,
      password
    })
    
    if (!response.data.success) {
      throw new Error('Login failed')
    }
    
    return response.data.data
  },

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/register', {
      email,
      password,
      name
    })
    
    if (!response.data.success) {
      throw new Error('Registration failed')
    }
    
    return response.data.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ success: boolean; data: User }>('/me')
    
    if (!response.data.success) {
      throw new Error('Failed to get user data')
    }
    
    return response.data.data
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<{ success: boolean; data: User }>('/me', data)
    
    if (!response.data.success) {
      throw new Error('Failed to update profile')
    }
    
    return response.data.data
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await api.put<{ success: boolean }>('/password', data)
    
    if (!response.data.success) {
      throw new Error('Failed to change password')
    }
  },

  async forgotPassword(email: string): Promise<void> {
    const response = await api.post<{ success: boolean }>('/forgot-password', { email })
    
    if (!response.data.success) {
      throw new Error('Failed to send reset email')
    }
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    const response = await api.post<{ success: boolean }>('/reset-password', data)
    
    if (!response.data.success) {
      throw new Error('Failed to reset password')
    }
  },

  async verifyEmail(token: string): Promise<void> {
    const response = await api.post<{ success: boolean }>('/verify-email', { token })
    
    if (!response.data.success) {
      throw new Error('Failed to verify email')
    }
  },

  async resendVerification(email: string): Promise<void> {
    const response = await api.post<{ success: boolean }>('/resend-verification', { email })
    
    if (!response.data.success) {
      throw new Error('Failed to resend verification')
    }
  },

  async refreshToken(): Promise<{ token: string; expiresIn: string }> {
    const refreshToken = localStorage.getItem('refresh_token')
    const response = await api.post<{ success: boolean; data: { token: string; expiresIn: string } }>('/refresh', {
      refreshToken
    })
    
    if (!response.data.success) {
      throw new Error('Failed to refresh token')
    }
    
    return response.data.data
  },

  async logout(): Promise<void> {
    try {
      await api.post('/logout')
    } catch (error) {
      // Ignore logout errors, just clear local storage
      console.warn('Logout request failed:', error)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
    }
  }
}