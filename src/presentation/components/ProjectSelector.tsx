/**
 * Project Selector Component
 *
 * Mandatory gateway that appears after login for Super/Admin users.
 * Full-screen modal/page for selecting a project before accessing the CMS.
 *
 * **CRITICAL:** This component MUST be shown when selectedProject is null.
 * Without a selected project, no data operations can be performed (multi-tenancy).
 *
 * **User Logic:**
 * - Super users: See ALL projects
 * - Admin users: See ONLY assigned projects
 *
 * @example
 * ```tsx
 * import { ProjectSelector } from '@/presentation/components/ProjectSelector'
 * import { useProject } from '@/presentation/context/ProjectContext'
 *
 * function App() {
 *   const { selectedProject } = useProject()
 *
 *   if (!selectedProject) {
 *     return <ProjectSelector />
 *   }
 *
 *   return <Dashboard />
 * }
 * ```
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProject } from '@/presentation/context/ProjectContext'
import { useAuth } from '@/presentation/context/AuthContext'
import { useToast } from '@/presentation/context/ToastContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { FolderKanban, ArrowRight } from 'lucide-react'
import type { Project } from '@/presentation/context/ProjectContext'

export function ProjectSelector() {
  const navigate = useNavigate()
  const { projectsList, setSelectedProject, isLoading, error } = useProject()
  const { showToast } = useToast()
  const { userRole, userData } = useAuth()

  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)

  /**
   * Auto-redirect to project creation if no projects exist
   * Business Rule: Super users with no projects should be automatically redirected to create project page
   */
  useEffect(() => {
    if (!isLoading && projectsList.length === 0 && userRole === 'Super') {
      console.log('📋 No projects found - auto-redirecting Super user to create project page')
      navigate('/app/projects/new')
    }
  }, [isLoading, projectsList.length, userRole, navigate])

  /**
   * Handle project selection
   * Sets the project in context and redirects to dashboard
   */
  const handleSelectProject = (project: Project) => {
    console.log('📋 Project selected:', project.name, `(${project.projectId})`)

    // Set selected project in context (persists to sessionStorage)
    setSelectedProject(project)

    // Show success toast
    showToast({
      title: 'Project selected',
      description: `Switched to ${project.name}`,
      variant: 'default'
    })
    // Redirect to dashboard after selection
    console.log('🔄 Redirecting to /app/dashboard...')
    navigate('/app/dashboard')
  }

  /**
   * Loading state - Seafoam Green theme
   */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#20B2AA] mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-2 text-gray-900">Loading Projects</h2>
          <p className="text-gray-600">Please wait while we fetch your projects...</p>
        </div>
      </div>
    )
  }

  /**
   * Error state
   */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <CardTitle className="text-center text-destructive">Error Loading Projects</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Empty state - No projects available (Seafoam Green theme)
   */
  if (projectsList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-[#20B2AA]">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-[#20B2AA]/10 rounded-full flex items-center justify-center">
                <FolderKanban className="w-10 h-10 text-[#20B2AA]" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl text-gray-900">No Projects Available</CardTitle>
            <CardDescription className="text-center text-base mt-2">
              {userRole === 'Admin' ? (
                <>
                  You don't have any assigned projects yet.
                  <br />
                  <span className="font-semibold text-[#20B2AA]">
                    Please contact your Super Administrator.
                  </span>
                </>
              ) : (
                <>
                  No projects have been created yet.
                  <br />
                  Create your first project to get started.
                </>
              )}
            </CardDescription>
          </CardHeader>
          {userRole === 'Super' && (
            <CardContent className="text-center">
              <Button onClick={() => navigate("/app/projects/new")} className="w-full bg-gradient-to-r from-[#20B2AA] to-[#1a9088] hover:from-[#1a9088] hover:to-[#158f87] text-white shadow-md">
                <FolderKanban className="mr-2 h-5 w-5" />
                Create Project
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  /**
   * Main project selection UI - Seafoam Green theme
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header - Seafoam Green branding */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Hooran Logo */}
              <img
                src="/src/assets/hooran_logo.svg"
                alt="Hooran CMS Logo"
                className="w-14 h-14 shadow-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hooran CMS</h1>
                <p className="text-sm text-gray-600">Select a project to continue</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Signed in as <span className="font-medium text-gray-900">{userData?.email}</span>
              </p>
              <p className="text-xs text-gray-500">
                Role: <span className="font-semibold text-[#20B2AA]">{userRole}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Instructions - Seafoam themed */}
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-bold mb-3 text-gray-900">Select Your Project</h2>
            <p className="text-gray-700 mb-2 text-lg">
              {userRole === 'Super' && (
                <>You have access to <span className="font-bold text-[#20B2AA]">{projectsList.length}</span> project{projectsList.length !== 1 ? 's' : ''}</>
              )}
              {userRole === 'Admin' && (
                <>You have been assigned <span className="font-bold text-[#20B2AA]">{projectsList.length}</span> project{projectsList.length !== 1 ? 's' : ''}</>
              )}
            </p>
            <p className="text-sm text-gray-600">
              Click on a project to access its content and settings
            </p>
          </div>

          {/* Project Grid - Seafoam Green theme */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsList.map((project) => (
              <Card
                key={project.projectId}
                className={`cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 bg-white ${
                  hoveredProjectId === project.projectId
                    ? 'border-[#20B2AA] shadow-lg ring-2 ring-[#20B2AA]/20'
                    : 'border-gray-200 hover:border-[#20B2AA]/50'
                }`}
                onMouseEnter={() => setHoveredProjectId(project.projectId)}
                onMouseLeave={() => setHoveredProjectId(null)}
                onClick={() => handleSelectProject(project)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        hoveredProjectId === project.projectId
                          ? 'bg-gradient-to-br from-[#20B2AA] to-[#1a9088] text-white'
                          : 'bg-[#20B2AA]/10 text-[#20B2AA]'
                      }`}
                    >
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    {project.status && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          project.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {project.status}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <p className="font-mono">{project.projectId.substring(0, 12)}...</p>
                    </div>
                    <Button
                      size="sm"
                      className={`transition-all ${
                        hoveredProjectId === project.projectId
                          ? 'bg-gradient-to-r from-[#20B2AA] to-[#1a9088] hover:from-[#1a9088] hover:to-[#158f87] text-white'
                          : 'bg-[#20B2AA]/10 hover:bg-[#20B2AA] hover:text-white text-[#20B2AA]'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectProject(project)
                      }}
                    >
                      Select
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer Info - Seafoam themed */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#20B2AA]/10 to-[#1a9088]/10 border border-[#20B2AA]/20 text-[#20B2AA] px-6 py-4 rounded-xl shadow-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-semibold">
                Your selected project will be used for all content and data operations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectSelector
