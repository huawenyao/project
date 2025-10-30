import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

interface SocketContextType {
  socket: Socket | null
  connected: boolean
  joinProject: (projectId: string) => void
  leaveProject: (projectId: string) => void
  sendAgentRequest: (data: any) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // In development mode with VITE_SKIP_AUTH, always connect
    const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'

    if (user || skipAuth) {
      initializeSocket()
    } else {
      disconnectSocket()
    }

    return () => {
      disconnectSocket()
    }
  }, [user])

  const initializeSocket = () => {
    const token = localStorage.getItem('auth_token')
    const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: skipAuth ? { skipAuth: true } : { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
      setConnected(true)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setConnected(false)
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        newSocket.connect()
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setConnected(false)
    })

    // Agent-related events
    newSocket.on('agent-response', (data) => {
      console.log('Agent response received:', data)
      toast.success('Agent task completed successfully')
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('agent-response', { detail: data }))
    })

    newSocket.on('agent-error', (data) => {
      console.error('Agent error:', data)
      toast.error(`Agent error: ${data.error}`)
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('agent-error', { detail: data }))
    })

    newSocket.on('agent-progress', (data) => {
      console.log('Agent progress:', data)
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('agent-progress', { detail: data }))
    })

    // App-related events
    newSocket.on('app-updated', (data) => {
      console.log('App updated:', data)
      toast.success('App updated successfully')
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('app-updated', { detail: data }))
    })

    newSocket.on('deployment-status', (data) => {
      console.log('Deployment status:', data)
      
      if (data.status === 'deployed') {
        toast.success('App deployed successfully!')
      } else if (data.status === 'failed') {
        toast.error('Deployment failed')
      }
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('deployment-status', { detail: data }))
    })

    // System notifications
    newSocket.on('notification', (data) => {
      console.log('Notification received:', data)
      
      switch (data.type) {
        case 'info':
          toast(data.message)
          break
        case 'success':
          toast.success(data.message)
          break
        case 'warning':
          toast(data.message, { icon: '⚠️' })
          break
        case 'error':
          toast.error(data.message)
          break
        default:
          toast(data.message)
      }
    })

    setSocket(newSocket)
  }

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setConnected(false)
    }
  }

  const joinProject = (projectId: string) => {
    if (socket && connected) {
      socket.emit('join-project', projectId)
      console.log('Joined project:', projectId)
    }
  }

  const leaveProject = (projectId: string) => {
    if (socket && connected) {
      socket.emit('leave-project', projectId)
      console.log('Left project:', projectId)
    }
  }

  const sendAgentRequest = (data: any) => {
    if (socket && connected) {
      socket.emit('agent-request', data)
      console.log('Agent request sent:', data)
    } else {
      toast.error('Not connected to server')
    }
  }

  const value: SocketContextType = {
    socket,
    connected,
    joinProject,
    leaveProject,
    sendAgentRequest
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}