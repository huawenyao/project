import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Layout components
import Layout from './components/Layout/Layout'
import AuthLayout from './components/Layout/AuthLayout'

// Pages
import Dashboard from './pages/Dashboard'
import Builder from './pages/Builder'
import Apps from './pages/Apps'
import Templates from './pages/Templates'
import Agents from './pages/Agents'
import Settings from './pages/Settings'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'

// Components
import LoadingSpinner from './components/UI/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          {/* Public routes */}
          <Route path="/auth/*" element={
            user ? <Navigate to="/dashboard" replace /> : <AuthRoutes />
          } />
          
          {/* Protected routes */}
          <Route path="/*" element={
            user ? <ProtectedRoutes /> : <Navigate to="/auth/login" replace />
          } />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

function AuthRoutes() {
  return (
    <AuthLayout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </AuthLayout>
  )
}

function ProtectedRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/builder/:appId" element={<Builder />} />
        <Route path="/apps" element={<Apps />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App