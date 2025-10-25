import React from 'react'
import { FileText, Search, Filter, Star } from 'lucide-react'

export default function Templates() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            App Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Start with pre-built templates and customize with AI
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              className="input pl-10"
            />
          </div>
        </div>
        <button className="btn-outline inline-flex items-center">
          <Filter className="w-4 h-4 mr-2" />
          Filter by Category
        </button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {['All', 'E-commerce', 'Dashboard', 'CRM', 'Blog', 'Portfolio', 'SaaS'].map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === 'All'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Coming Soon */}
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Templates Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We're preparing a collection of beautiful, AI-customizable templates
        </p>
        <div className="flex items-center justify-center text-yellow-600 dark:text-yellow-400">
          <Star className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">Stay tuned for amazing templates!</span>
        </div>
      </div>
    </div>
  )
}