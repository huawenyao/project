import axios from 'axios'
import {
  Agent,
  AgentRequest,
  AgentResponse,
  AgentStatus,
  IntentAnalysis,
  CodeGeneration,
  ComponentGeneration,
  CodeOptimization
} from '../types/agent'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/agents`,
  timeout: 30000, // Longer timeout for AI operations
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

// Handle errors
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

export const agentService = {
  async getStatus(): Promise<AgentStatus> {
    const response = await api.get<{ success: boolean; data: AgentStatus }>('/status')
    
    if (!response.data.success) {
      throw new Error('Failed to get agent status')
    }
    
    return response.data.data
  },

  async getActiveRequests(): Promise<AgentRequest[]> {
    const response = await api.get<{ success: boolean; data: { activeRequests: AgentRequest[] } }>('/requests')
    
    if (!response.data.success) {
      throw new Error('Failed to get active requests')
    }
    
    return response.data.data.activeRequests
  },

  async submitRequest(request: Omit<AgentRequest, 'requestId' | 'userId'>): Promise<{ requestId: string; status: string }> {
    const response = await api.post<{ success: boolean; data: { requestId: string; status: string } }>('/request', request)
    
    if (!response.data.success) {
      throw new Error('Failed to submit agent request')
    }
    
    return response.data.data
  },

  async getRequestStatus(requestId: string): Promise<AgentRequest> {
    const response = await api.get<{ success: boolean; data: AgentRequest }>(`/request/${requestId}`)
    
    if (!response.data.success) {
      throw new Error('Failed to get request status')
    }
    
    return response.data.data
  },

  async cancelRequest(requestId: string): Promise<void> {
    const response = await api.delete<{ success: boolean }>(`/request/${requestId}`)
    
    if (!response.data.success) {
      throw new Error('Failed to cancel request')
    }
  },

  async analyzeIntent(input: string, context?: any): Promise<IntentAnalysis> {
    const response = await api.post<{ success: boolean; data: IntentAnalysis }>('/analyze-intent', {
      input,
      context
    })
    
    if (!response.data.success) {
      throw new Error('Failed to analyze intent')
    }
    
    return response.data.data
  },

  async generateCode(
    description: string,
    language: string,
    framework?: string,
    context?: any
  ): Promise<CodeGeneration> {
    const response = await api.post<{ success: boolean; data: CodeGeneration }>('/generate-code', {
      description,
      language,
      framework,
      context
    })
    
    if (!response.data.success) {
      throw new Error('Failed to generate code')
    }
    
    return response.data.data
  },

  async generateComponent(
    componentType: string,
    requirements: string[] = [],
    framework: string = 'react'
  ): Promise<ComponentGeneration> {
    const response = await api.post<{ success: boolean; data: ComponentGeneration }>('/generate-component', {
      componentType,
      requirements,
      framework
    })
    
    if (!response.data.success) {
      throw new Error('Failed to generate component')
    }
    
    return response.data.data
  },

  async optimizeCode(
    code: string,
    language: string,
    optimizationGoals: string[] = ['performance', 'readability']
  ): Promise<CodeOptimization> {
    const response = await api.post<{ success: boolean; data: CodeOptimization }>('/optimize-code', {
      code,
      language,
      optimizationGoals
    })
    
    if (!response.data.success) {
      throw new Error('Failed to optimize code')
    }
    
    return response.data.data
  },

  async getCapabilities(agentType?: string): Promise<Record<string, any>> {
    const url = agentType ? `/capabilities?agentType=${agentType}` : '/capabilities'
    const response = await api.get<{ success: boolean; data: any }>(url)
    
    if (!response.data.success) {
      throw new Error('Failed to get agent capabilities')
    }
    
    return response.data.data
  },

  async getHealth(): Promise<{ orchestrator: any; ai: any; overall: boolean }> {
    const response = await api.get<{ success: boolean; data: any }>('/health')
    
    if (!response.data.success) {
      throw new Error('Failed to get agent health')
    }
    
    return response.data.data
  }
}