/**
 * AuthContext Usage Examples
 *
 * This file contains practical examples of how to use the AuthContext
 * for authentication state management and role-based access control.
 */

import React from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'

/**
 * Example 1: Basic Protected Component
 *
 * Shows how to protect a component and require authentication
 */
export function ProtectedComponent() {
  const { currentUser, userRole, isLoading, hasCMSAccess } = useAuth()

  // 1. Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // 2. Redirect to login if not authenticated
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to continue</p>
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md">
            Sign In
          </button>
        </div>
      </div>
    )
  }

  // 3. Check CMS access (only Super and Admin)
  if (!hasCMSAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Access Denied</h2>
          <p className="text-muted-foreground mb-2">
            You need Administrator or Super Admin privileges to access the CMS.
          </p>
          <p className="text-sm text-muted-foreground">
            Your current role: <span className="font-semibold">{userRole || 'Unknown'}</span>
          </p>
        </div>
      </div>
    )
  }

  // 4. User has access - show content
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Welcome to CMS</h1>
      <p className="text-muted-foreground">
        You are signed in as: <span className="font-semibold">{currentUser.email}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Role: <span className="font-semibold">{userRole}</span>
      </p>
    </div>
  )
}

/**
 * Example 2: Reusable Protected Route Wrapper
 *
 * Component that wraps other components and enforces authentication
 */
interface RequireAuthProps {
  children: ReactNode
  requireCMSAccess?: boolean
}

export function RequireAuth({ children, requireCMSAccess = true }: RequireAuthProps) {
  const { currentUser, hasCMSAccess, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!currentUser) {
    return <LoginPrompt />
  }

  if (requireCMSAccess && !hasCMSAccess) {
    return <AccessDenied />
  }

  return <>{children}</>
}

/**
 * Example 3: User Profile Display
 *
 * Shows user information from auth context
 */
export function UserProfile() {
  const { currentUser, userData, userRole } = useAuth()

  if (!currentUser || !userData) {
    return <div>Not logged in</div>
  }

  return (
    <div className="bg-card border rounded-lg p-6 max-w-md">
      <div className="flex items-center gap-4 mb-4">
        <img
          src={userData.photo_url || '/default-avatar.png'}
          alt="User avatar"
          className="w-16 h-16 rounded-full"
        />
        <div>
          <h3 className="text-xl font-semibold">
            {userData.display_name || currentUser.email}
          </h3>
          <p className="text-sm text-muted-foreground">{currentUser.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Role:</span>
          <span className="font-semibold">
            <RoleBadge role={userRole} />
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Projects:</span>
          <span className="font-semibold">{userData.projects.length}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">User ID:</span>
          <span className="text-xs font-mono">{currentUser.uid.substring(0, 8)}...</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Example 4: Role Badge Component
 *
 * Visual representation of user role
 */
interface RoleBadgeProps {
  role: 'Super' | 'Admin' | 'User' | null
}

function RoleBadge({ role }: RoleBadgeProps) {
  const styles = {
    Super: 'bg-purple-100 text-purple-800 border-purple-300',
    Admin: 'bg-blue-100 text-blue-800 border-blue-300',
    User: 'bg-gray-100 text-gray-800 border-gray-300',
    null: 'bg-gray-100 text-gray-800 border-gray-300',
  }

  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded border ${
        styles[role || 'null']
      }`}
    >
      {role || 'Unknown'}
    </span>
  )
}

/**
 * Example 5: Conditional Navigation
 *
 * Navigation that changes based on user role
 */
export function Navigation() {
  const { userRole, hasCMSAccess } = useAuth()

  return (
    <nav className="bg-card border-b">
      <div className="container mx-auto px-4 py-4">
        <ul className="flex gap-6">
          <li>
            <a href="/dashboard" className="text-foreground hover:text-primary">
              Dashboard
            </a>
          </li>

          {hasCMSAccess && (
            <>
              <li>
                <a href="/content" className="text-foreground hover:text-primary">
                  Content
                </a>
              </li>
              <li>
                <a href="/media" className="text-foreground hover:text-primary">
                  Media
                </a>
              </li>
            </>
          )}

          {userRole === 'Admin' && (
            <li>
              <a href="/users" className="text-foreground hover:text-primary">
                Users
              </a>
            </li>
          )}

          {userRole === 'Super' && (
            <>
              <li>
                <a href="/projects" className="text-foreground hover:text-primary">
                  Projects
                </a>
              </li>
              <li>
                <a href="/settings" className="text-foreground hover:text-primary">
                  Settings
                </a>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

/**
 * Example 6: Error Display
 *
 * Shows authentication errors
 */
export function AuthErrorDisplay() {
  const { error } = useAuth()

  if (!error) return null

  return (
    <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
      <h4 className="font-semibold mb-1">Authentication Error</h4>
      <p className="text-sm">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="text-sm underline mt-2"
      >
        Retry
      </button>
    </div>
  )
}

/**
 * Example 7: Project Selector
 *
 * Dropdown to select user's available projects
 */
export function ProjectSelector() {
  const { userData } = useAuth()
  const [selectedProject, setSelectedProject] = React.useState<string>('')

  if (!userData || userData.projects.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No projects available
      </div>
    )
  }

  return (
    <div>
      <label htmlFor="project" className="block text-sm font-medium mb-2">
        Select Project
      </label>
      <select
        id="project"
        value={selectedProject}
        onChange={(e) => setSelectedProject(e.target.value)}
        className="w-full px-3 py-2 border rounded-md bg-background"
      >
        <option value="">Select a project...</option>
        {userData.projects.map((projectId) => (
          <option key={projectId} value={projectId}>
            {projectId}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground mt-1">
        You have access to {userData.projects.length} project(s)
      </p>
    </div>
  )
}

/**
 * Example 8: Loading Screen Component
 */
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        <p className="text-muted-foreground">Please wait while we verify your authentication</p>
      </div>
    </div>
  )
}

/**
 * Example 9: Login Prompt Component
 */
function LoginPrompt() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="bg-card border rounded-lg p-8 max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
        <p className="text-muted-foreground mb-6">
          You need to be signed in to access this page
        </p>
        <div className="space-y-3">
          <button className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold hover:bg-primary/90">
            Sign In
          </button>
          <button className="w-full border border-input px-6 py-3 rounded-md font-semibold hover:bg-accent">
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Example 10: Access Denied Component
 */
function AccessDenied() {
  const { userRole } = useAuth()

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="bg-card border rounded-lg p-8 max-w-md text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-destructive">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this page.
          </p>
        </div>

        <div className="bg-muted p-4 rounded-md mb-6">
          <p className="text-sm text-muted-foreground mb-1">Your current role:</p>
          <p className="font-semibold">
            <RoleBadge role={userRole} />
          </p>
        </div>

        <div className="text-left text-sm space-y-2">
          <p className="font-semibold">Required access levels:</p>
          <ul className="list-disc list-inside text-muted-foreground ml-2">
            <li>Super Admin</li>
            <li>Administrator</li>
          </ul>
        </div>

        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-3">
            If you believe this is an error, please contact your system administrator.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="text-sm text-primary hover:underline"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Example 11: Complete App Structure with AuthContext
 *
 * Shows how to structure your entire app with the AuthContext
 */
export function AppWithAuth() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthErrorDisplay />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <RequireAuth>
          {/* Your CMS content here */}
          <h1>CMS Dashboard</h1>
        </RequireAuth>
      </main>
    </div>
  )
}
