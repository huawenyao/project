import React from 'react'
import { Bot, Activity, Settings, Zap } from 'lucide-react'

export default function Agents() {
  const agents = [
    {
      id: 'ui-agent',
      name: 'UI Agent',
      type: 'Frontend',
      status: 'active',
      description: 'Generates beautiful, responsive user interfaces',
      capabilities: ['React Components', 'CSS Styling', 'Responsive Design', 'Accessibility'],
      activeJobs: 2,
      lastActivity: '2 minutes ago'
    },
    {
      id: 'backend-agent',
      name: 'Backend Agent',
      type: 'Backend',
      status: 'active',
      description: 'Creates robust APIs and server-side logic',
      capabilities: ['REST APIs', 'Authentication', 'Database Integration', 'Security'],
      activeJobs: 1,
      lastActivity: '5 minutes ago'
    },
    {
      id: 'database-agent',
      name: 'Database Agent',
      type: 'Database',
      status: 'active',
      description: 'Designs and optimizes database schemas',
      capabilities: ['Schema Design', 'Query Optimization', 'Data Migration', 'Indexing'],
      activeJobs: 0,
      lastActivity: '1 hour ago'
    },
    {
      id: 'integration-agent',
      name: 'Integration Agent',
      type: 'Integration',
      status: 'idle',
      description: 'Connects apps with external services',
      capabilities: ['API Integration', 'Webhooks', 'Third-party Services', 'Data Sync'],
      activeJobs: 0,
      lastActivity: '3 hours ago'
    },
    {
      id: 'deployment-agent',
      name: 'Deployment Agent',
      type: 'DevOps',
      status: 'active',
      description: 'Handles deployment and infrastructure',
      capabilities: ['Cloud Deployment', 'CI/CD', 'Monitoring', 'Scaling'],
      activeJobs: 1,
      lastActivity: '10 minutes ago'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'idle':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'offline':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Agents
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage your intelligent AI agents
          </p>
        </div>
        <button className="btn-outline inline-flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Configure Agents
        </button>
      </div>

      {/* Agent Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Bot className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Agents</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">4</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Jobs</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">4</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Requests</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">127</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-4">
        {agents.map((agent) => (
          <div key={agent.id} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <Bot className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {agent.name}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {agent.type}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {agent.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {agent.capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Active Jobs: {agent.activeJobs}</span>
                    <span>Last Activity: {agent.lastActivity}</span>
                  </div>
                </div>
              </div>
              <button className="btn-ghost">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}