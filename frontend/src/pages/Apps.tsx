import React from 'react'
import { Plus, Search, Filter, Grid, List } from 'lucide-react'

export default function Apps() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Apps
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and deploy your AI-generated applications
          </p>
        </div>
        <button className="btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          New App
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search apps..."
              className="input pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline inline-flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Grid className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No apps yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Create your first app using our AI-powered builder
        </p>
        <button className="btn-primary">
          Create Your First App
        </button>
      </div>
    </div>
  )
}