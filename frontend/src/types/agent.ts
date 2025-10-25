export interface Agent {
  id: string
  type: 'ui' | 'backend' | 'database' | 'integration' | 'deployment'
  name: string
  description: string
  status: 'available' | 'busy' | 'offline'
  capabilities: AgentCapability[]
  activeJobs: number
  lastActivity?: string
}

export interface AgentCapability {
  name: string
  description: string
  parameters: AgentParameter[]
  examples: string[]
}

export interface AgentParameter {
  name: string
  type: string
  required: boolean
  default?: any
  options?: string[]
  description?: string
}

export interface AgentRequest {
  requestId: string
  userId: string
  projectId: string
  type: 'create_app' | 'modify_app' | 'deploy_app' | 'integrate_service'
  description: string
  requirements?: string[]
  constraints?: string[]
  context?: any
}

export interface AgentResponse {
  requestId: string
  success: boolean
  result?: any
  error?: string
  steps: AgentStep[]
  estimatedTime?: number
  progress?: number
}

export interface AgentStep {
  agentType: string
  action: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  result?: any
  error?: string
  timestamp: Date
}

export interface AgentStatus {
  totalAgents: number
  activeRequests: number
  agents: Record<string, {
    available: boolean
    activeJobs: number
    lastActivity: string | null
  }>
}

export interface IntentAnalysis {
  intent: string
  entities: any[]
  confidence: number
  suggestedActions: string[]
}

export interface CodeGeneration {
  code: string
  language: string
  framework?: string
  description: string
}

export interface ComponentGeneration {
  code: string
  dependencies: string[]
  props: ComponentProp[]
  usage: string
}

export interface ComponentProp {
  name: string
  type: string
  required: boolean
  description: string
  default?: any
}

export interface CodeOptimization {
  optimizedCode: string
  improvements: string[]
  metrics: any
}