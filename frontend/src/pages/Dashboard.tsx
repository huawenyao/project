import React from 'react'
import { 
  Plus, 
  Zap, 
  TrendingUp, 
  Users, 
  Clock,
  ArrowRight,
  Bot,
  Layers,
  Activity
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const stats = [
    {
      name: 'Total Apps',
      value: '12',
      change: '+2 this week',
      changeType: 'positive',
      icon: Layers
    },
    {
      name: 'Active Agents',
      value: '5',
      change: 'All systems operational',
      changeType: 'neutral',
      icon: Bot
    },
    {
      name: 'Deployments',
      value: '8',
      change: '+3 this month',
      changeType: 'positive',
      icon: TrendingUp
    },
    {
      name: 'Build Time Saved',
      value: '24h',
      change: 'vs traditional coding',
      changeType: 'positive',
      icon: Clock
    }
  ]

  const recentApps = [
    {
      id: '1',
      name: 'E-commerce Dashboard',
      type: 'Web App',
      status: 'deployed',
      lastModified: '2 hours ago',
      preview: '/api/placeholder/300/200'
    },
    {
      id: '2',
      name: 'Customer CRM',
      type: 'Business App',
      status: 'building',
      lastModified: '1 day ago',
      preview: '/api/placeholder/300/200'
    },
    {
      id: '3',
      name: 'Analytics Portal',
      type: 'Dashboard',
      status: 'draft',
      lastModified: '3 days ago',
      preview: '/api/placeholder/300/200'
    }
  ]

  const quickActions = [
    {
      name: 'Create New App',
      description: 'Start building with AI assistance',
      href: '/builder',
      icon: Plus,
      color: 'bg-primary-600 hover:bg-primary-700'
    },
    {
      name: 'Browse Templates',
      description: 'Use pre-built templates',
      href: '/templates',
      icon: Layers,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'Manage Agents',
      description: 'Configure AI agents',
      href: '/agents',
      icon: Bot,
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-primary-100 text-lg">
              Ready to build something amazing with AI agents?
            </p>
          </div>
          <div className="hidden md:block">
            <Zap className="w-16 h-16 text-primary-200" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </dd>
                  <dd className={`text-sm ${
                    stat.changeType === 'positive' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {stat.change}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="group relative rounded-xl p-6 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{ background: action.color.split(' ')[0] }}
            >
              <div className="flex items-center">
                <action.icon className="w-8 h-8 mr-4" />
                <div>
                  <h3 className="text-lg font-semibold">{action.name}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </div>
              <ArrowRight className="absolute top-6 right-6 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Apps */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Recent Apps
          </h2>
          <Link
            to="/apps"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            View all
          </Link>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recentApps.map((app) => (
            <div key={app.id} className="card-hover overflow-hidden">
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-12 h-12 text-gray-400" />
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    app.status === 'deployed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : app.status === 'building'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {app.status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {app.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {app.type}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {app.lastModified}
                  </span>
                  <Link
                    to={`/builder/${app.id}`}
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Activity */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Agent Activity
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  UI Agent completed dashboard layout
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  2 minutes ago
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Backend Agent generated API endpoints
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  15 minutes ago
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Database Agent optimized queries
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  1 hour ago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}