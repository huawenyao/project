import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Wrench, 
  Layers, 
  FileText, 
  Bot, 
  Settings,
  Menu,
  X,
  Zap
} from 'lucide-react'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Builder', href: '/builder', icon: Wrench },
  { name: 'Apps', href: '/apps', icon: Layers },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out lg:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Zap className="w-8 h-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                AI Builder
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Zap className="w-8 h-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                AI Builder
              </span>
            </div>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded-md bg-white dark:bg-gray-800 shadow-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </>
  )
}

function SidebarContent() {
  const location = useLocation()

  return (
    <nav className="flex-1 px-4 py-6 space-y-1">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href || 
          (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
        
        return (
          <NavLink
            key={item.name}
            to={item.href}
            className={clsx(
              'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
              isActive
                ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <item.icon
              className={clsx(
                'mr-3 h-5 w-5 flex-shrink-0',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
              )}
            />
            {item.name}
          </NavLink>
        )
      })}
    </nav>
  )
}