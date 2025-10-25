import React, { ReactNode } from 'react'
import { Zap } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 xl:px-12 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="mx-auto max-w-sm">
          <div className="flex items-center mb-8">
            <Zap className="w-12 h-12 text-white" />
            <span className="ml-3 text-3xl font-bold text-white">
              AI Builder
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-6">
            Build Apps with AI Agents
          </h1>
          
          <p className="text-xl text-primary-100 mb-8">
            Transform your ideas into applications using intelligent AI agents. 
            No coding required - just describe what you want to build.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center text-primary-100">
              <div className="w-2 h-2 bg-primary-300 rounded-full mr-3" />
              <span>AI-powered app generation</span>
            </div>
            <div className="flex items-center text-primary-100">
              <div className="w-2 h-2 bg-primary-300 rounded-full mr-3" />
              <span>Visual drag-and-drop builder</span>
            </div>
            <div className="flex items-center text-primary-100">
              <div className="w-2 h-2 bg-primary-300 rounded-full mr-3" />
              <span>One-click deployment</span>
            </div>
            <div className="flex items-center text-primary-100">
              <div className="w-2 h-2 bg-primary-300 rounded-full mr-3" />
              <span>Intelligent automation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center justify-center mb-8 lg:hidden">
            <Zap className="w-8 h-8 text-primary-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">
              AI Builder
            </span>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  )
}