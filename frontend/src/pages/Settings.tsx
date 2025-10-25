import React from 'react'
import { User, Bell, Shield, Palette, Key, CreditCard } from 'lucide-react'

export default function Settings() {
  const settingsSections = [
    {
      id: 'profile',
      name: 'Profile',
      icon: User,
      description: 'Manage your account information'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      description: 'Configure notification preferences'
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield,
      description: 'Password and security settings'
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: Palette,
      description: 'Theme and display preferences'
    },
    {
      id: 'api',
      name: 'API Keys',
      icon: Key,
      description: 'Manage API keys and integrations'
    },
    {
      id: 'billing',
      name: 'Billing',
      icon: CreditCard,
      description: 'Subscription and payment settings'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account and application preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => (
          <button
            key={section.id}
            className="card-hover p-6 text-left transition-all duration-200 hover:scale-105"
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                <section.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {section.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {section.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Settings */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Quick Settings
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Email Notifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive email updates about your apps
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Agent Notifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get notified when agents complete tasks
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Auto-save Projects
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically save your work every few minutes
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}