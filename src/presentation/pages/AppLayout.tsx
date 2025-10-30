/**
 * App Layout Component
 *
 * Main application layout wrapper for authenticated routes.
 * Provides consistent layout structure for all /app/* routes.
 *
 * **CRITICAL: Mandatory Project Context Rule**
 * - Enforces that a project MUST be selected before accessing any /app/* routes
 * - If no project is selected, redirects to /app/select-project
 * - Exception: /app/select-project itself is exempt from this check
 *
 * **Security Flow:**
 * 1. Check authentication (loading → not authenticated → no CMS access)
 * 2. Check project context (if not selecting project AND no project selected → redirect)
 * 3. Render layout with Sidebar + Outlet
 *
 * @route /app/*
 */

import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { Sidebar } from '@/presentation/components'
import { CollapsibleTopBar } from '@/presentation/components/CollapsibleTopBar'

export function AppLayout() {
  const { currentUser, isLoading, hasCMSAccess } = useAuth()
  const { selectedProject, isLoading: projectLoading } = useProject()
  const location = useLocation()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to landing page if not authenticated
  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  // Redirect to landing page if user doesn't have CMS access
  if (!hasCMSAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the CMS. Only Admin and Super users can access this
            area.
          </p>
          <button
            onClick={() => (window.location.href = '/')}
            className="text-primary hover:underline"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  // MANDATORY PROJECT CONTEXT CHECK
  // If user is authenticated and authorized BUT no project is selected,
  // redirect to project selector (unless already on that page or creating a new project)
  const isOnProjectSelector = location.pathname === '/app/select-project'
  const isCreatingProject = location.pathname === '/app/projects/new'

  if (!projectLoading && !selectedProject && !isOnProjectSelector && !isCreatingProject) {
    console.log('⚠️ No project selected - redirecting to /app/select-project')
    return <Navigate to="/app/select-project" replace />
  }

  // If on project selector page but a project IS selected, redirect to dashboard
  if (isOnProjectSelector && selectedProject) {
    console.log('✅ Project already selected - redirecting to /app/dashboard')
    return <Navigate to="/app/dashboard" replace />
  }

  // Show loading state while projects are being fetched
  if (projectLoading && !isOnProjectSelector) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  // Render layout based on current route
  // Project selector has its own full-screen layout (no Sidebar)
  if (isOnProjectSelector) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Outlet />
      </div>
    )
  }

  // Render main app layout with Sidebar and Collapsible TopBar for all other routes
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Collapsible TopBar - toggles with button */}
      <CollapsibleTopBar />

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
