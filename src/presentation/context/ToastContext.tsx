/**
 * ToastContext
 *
 * Global notification system using React Context and the shadcn Toast (Sonner) component.
 * Provides a centralized way to display toast notifications throughout the application.
 *
 * **Features:**
 * - Context-based toast management
 * - Support for different toast variants (default, destructive)
 * - Title and description support
 * - Built on top of Sonner library (shadcn's recommended toast solution)
 *
 * **Usage:**
 * ```tsx
 * import { useToast } from '@/presentation/context/ToastContext'
 *
 * function MyComponent() {
 *   const { showToast } = useToast()
 *
 *   const handleClick = () => {
 *     showToast({
 *       title: 'Success',
 *       description: 'Operation completed successfully',
 *       variant: 'default'
 *     })
 *   }
 * }
 * ```
 */

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { toast as sonnerToast } from 'sonner'
import { Toaster } from '@/presentation/components/ui/sonner'

/**
 * Toast configuration options
 */
export interface ToastOptions {
  /**
   * Toast title - main message
   */
  title: string

  /**
   * Toast description - additional details (optional)
   */
  description?: string

  /**
   * Toast variant - determines styling and icon
   * - 'default': Standard informational toast (blue/neutral)
   * - 'destructive': Error/warning toast (red)
   */
  variant?: 'default' | 'destructive'
}

/**
 * Toast context value interface
 */
interface ToastContextValue {
  /**
   * Display a toast notification
   *
   * @param options - Toast configuration
   * @example
   * showToast({
   *   title: 'User created',
   *   description: 'John Doe has been added to the system',
   *   variant: 'default'
   * })
   */
  showToast: (options: ToastOptions) => void
}

/**
 * Toast Context
 */
const ToastContext = createContext<ToastContextValue | undefined>(undefined)

/**
 * Toast Provider Props
 */
interface ToastProviderProps {
  children: ReactNode
}

/**
 * ToastProvider Component
 *
 * Wraps the application to provide toast notification functionality.
 * Renders the Toaster component and manages toast state.
 *
 * @example
 * ```tsx
 * // In main.tsx or App.tsx
 * import { ToastProvider } from '@/presentation/context/ToastContext'
 *
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <YourApp />
 *     </ToastProvider>
 *   )
 * }
 * ```
 */
export function ToastProvider({ children }: ToastProviderProps) {
  /**
   * Show a toast notification using Sonner
   */
  const showToast = ({ title, description, variant = 'default' }: ToastOptions) => {
    // Construct the message
    const message = description ? (
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    ) : (
      title
    )

    // Display toast based on variant
    if (variant === 'destructive') {
      sonnerToast.error(message)
    } else {
      sonnerToast.success(message)
    }
  }

  const value: ToastContextValue = {
    showToast,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}

/**
 * useToast Hook
 *
 * Custom hook to access toast functionality from any component.
 * Must be used within a ToastProvider.
 *
 * @returns Toast context value with showToast function
 * @throws Error if used outside ToastProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showToast } = useToast()
 *
 *   const handleSuccess = () => {
 *     showToast({
 *       title: 'Success!',
 *       description: 'Your changes have been saved',
 *       variant: 'default'
 *     })
 *   }
 *
 *   const handleError = () => {
 *     showToast({
 *       title: 'Error',
 *       description: 'Something went wrong',
 *       variant: 'destructive'
 *     })
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleSuccess}>Save</button>
 *       <button onClick={handleError}>Trigger Error</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
