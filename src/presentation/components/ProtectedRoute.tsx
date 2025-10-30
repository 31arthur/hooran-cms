/**
 * Protected Route Component
 *
 * Enforces authentication and role-based access control for CMS routes.
 * Only users with 'Super' or 'Admin' roles can access protected routes.
 *
 * **Security Features:**
 * - Redirects unauthenticated users to landing page
 * - Blocks users without proper CMS roles (Super/Admin)
 * - Shows loading state during authentication check
 * - Provides clear error messages for access denial
 *
 * @example
 * ```tsx
 * import { ProtectedRoute } from '@/presentation/components/ProtectedRoute'
 *
 * // In Router.tsx
 * <Route
 *   path="/app/*"
 *   element={
 *     <ProtectedRoute>
 *       <AppLayout />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import { AlertCircle, ShieldAlert } from 'lucide-react'

/**
 * Protected Route Props
 */
interface ProtectedRouteProps {
  /**
   * The component(s) to render if all checks pass
   */
  children: ReactNode
}

/**
 * Loading Skeleton Component
 * Displays a full-screen loading state while authentication is being verified
 */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md space-y-6 p-8">
        {/* Logo/Header Skeleton */}
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>

        {/* Content Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-3/4" />
        </div>

        {/* Status Text */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground animate-pulse">
            Verifying authentication...
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Access Denied Component
 * Displays when user is authenticated but doesn't have required CMS role
 */
function AccessDenied() {
  const { signOut, userData, error } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-lg p-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-red-200 dark:border-red-900 overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 dark:bg-red-700 px-6 py-8 text-center">
            <div className="flex justify-center mb-4">
              <ShieldAlert className="h-16 w-16 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Access Denied
            </h1>
            <p className="text-red-100">
              CMS Access Restricted
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* User Info */}
            {userData && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Signed in as:</span>
                  <span className="font-medium">{userData.email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your role:</span>
                  <span className="font-mono font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                    {userData.role || 'User'}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold mb-2 text-sm">
                Required Permissions:
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                  <span>Role: <strong className="text-foreground">Super</strong> or <strong className="text-foreground">Admin</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                  <span>Access granted by system administrator</span>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                Please contact your system administrator to request CMS access with the appropriate role.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                Sign Out
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-medium rounded-lg transition-colors duration-200"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Protected Route Component
 *
 * Implements a three-stage authentication and authorization check:
 * 1. Loading: Show skeleton while verifying auth state
 * 2. Authentication: Redirect to landing if not logged in
 * 3. Authorization: Check for Super/Admin role, show access denied if insufficient
 *
 * @param props - Component props
 * @returns Protected component or redirect
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { currentUser, userRole, isLoading, hasCMSAccess } = useAuth()

  // Log authentication checks for debugging
  useEffect(() => {
    if (!isLoading) {
      console.log('🛡️ ProtectedRoute Check:', {
        isAuthenticated: !!currentUser,
        userEmail: currentUser?.email,
        userRole: userRole,
        hasCMSAccess: hasCMSAccess,
      })
    }
  }, [isLoading, currentUser, userRole, hasCMSAccess])

  // Stage 1: Loading - Show skeleton while checking authentication
  if (isLoading) {
    console.log('🔄 ProtectedRoute: Loading authentication state...')
    return <LoadingSkeleton />
  }

  // Stage 2: Authentication Check - Redirect to landing if not authenticated
  if (!currentUser) {
    console.warn('⚠️ ProtectedRoute: User not authenticated, redirecting to landing page')
    return <Navigate to="/" replace />
  }

  // Stage 3: Authorization Check - Verify CMS access (Super or Admin role)
  if (!hasCMSAccess) {
    console.error(
      `🚫 ProtectedRoute: Access denied for user "${currentUser.email}" with role "${userRole}"`
    )
    return <AccessDenied />
  }

  // All checks passed - render protected content
  console.log(`✅ ProtectedRoute: Access granted for ${currentUser.email} (${userRole})`)
  return <>{children}</>
}

/**
 * Export the AccessDenied component for use in other parts of the app
 */
export { AccessDenied }
