import React from 'react'
import { Wrench, Zap, Code, Palette, Database, Cloud } from 'lucide-react'

export default function Builder() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          AI App Builder
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Create powerful applications using AI agents. Simply describe what you want to build, 
          and our intelligent agents will handle the rest.
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-8 text-white text-center">
        <Zap className="w-16 h-16 mx-auto mb-4 text-primary-200" />
        <h2 className="text-2xl font-bold mb-2">Visual Builder Coming Soon!</h2>
        <p className="text-primary-100">
          We're building an amazing drag-and-drop interface powered by AI agents.
        </p>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-fit mx-auto mb-4">
            <Palette className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            UI Agent
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Automatically generates beautiful, responsive user interfaces based on your requirements.
          </p>
        </div>

        <div className="card p-6 text-center">
          <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg w-fit mx-auto mb-4">
            <Code className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Backend Agent
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Creates robust APIs, handles business logic, and implements security best practices.
          </p>
        </div>

        <div className="card p-6 text-center">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg w-fit mx-auto mb-4">
            <Database className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Database Agent
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Designs optimal database schemas and handles data relationships automatically.
          </p>
        </div>

        <div className="card p-6 text-center">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg w-fit mx-auto mb-4">
            <Wrench className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Integration Agent
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Connects your app with external services, APIs, and third-party tools seamlessly.
          </p>
        </div>

        <div className="card p-6 text-center">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg w-fit mx-auto mb-4">
            <Cloud className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Deployment Agent
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Handles deployment, scaling, and monitoring of your applications in the cloud.
          </p>
        </div>

        <div className="card p-6 text-center">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg w-fit mx-auto mb-4">
            <Zap className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            AI Orchestrator
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Coordinates all agents to work together seamlessly and efficiently.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Describe Your App
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tell us what you want to build in plain English. Our AI understands your requirements.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              AI Agents Build
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our specialized agents work together to create your app's frontend, backend, and database.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Deploy & Iterate
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your app is automatically deployed and ready to use. Make changes anytime with natural language.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}