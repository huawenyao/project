import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { authService } from '../../services/authService'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

interface ForgotPasswordForm {
  email: string
}

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<ForgotPasswordForm>()

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true)
    try {
      await authService.forgotPassword(data.email)
      setSent(true)
    } catch (error: any) {
      setError('root', {
        message: error.message || 'Failed to send reset email. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Check your email
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            We've sent a password reset link to your email address.
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </p>
        </div>

        <div className="text-center">
          <Link
            to="/auth/login"
            className="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Forgot your password?
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errors.root && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.root.message}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
              placeholder="Enter your email"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex justify-center items-center"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" color="white" className="mr-2" />
              Sending reset link...
            </>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>

      <div className="text-center">
        <Link
          to="/auth/login"
          className="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}