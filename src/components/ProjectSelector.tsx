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
 * import { ProjectSelector } from '@/components/ProjectSelector'
 * import { useProject } from '@/context/ProjectContext'
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

import React, { useState } from 'react'
import { useProject } from '@/context/ProjectContext'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Project } from '@/context/ProjectContext'

export function ProjectSelector() {
  const { projectsList, setSelectedProject, isLoading, error } = useProject()
  const { userRole, userData } = useAuth()

  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)

  /**
   * Handle project selection
   */
  const handleSelectProject = (project: Project) => {
    console.log('📋 Project selected:', project.name, `(${project.projectId})`)
    setSelectedProject(project)
  }

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-2">Loading Projects</h2>
          <p className="text-muted-foreground">Please wait while we fetch your projects...</p>
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
   * Empty state - No projects available
   */
  if (projectsList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <CardTitle className="text-center">No Projects Available</CardTitle>
            <CardDescription className="text-center">
              {userRole === 'Admin'
                ? "You don't have any assigned projects yet. Please contact your administrator."
                : 'No projects have been created yet. Create your first project to get started.'}
            </CardDescription>
          </CardHeader>
          {userRole === 'Super' && (
            <CardContent className="text-center">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Create Project
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  /**
   * Main project selection UI
   */
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Hooran CMS</h1>
                <p className="text-sm text-muted-foreground">Select a project to continue</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{userData?.email}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Role: <span className="font-medium text-primary">{userRole}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Instructions */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-3">Select Your Project</h2>
            <p className="text-muted-foreground mb-2">
              {userRole === 'Super' && (
                <>You have access to <span className="font-semibold text-primary">{projectsList.length}</span> project{projectsList.length !== 1 ? 's' : ''}</>
              )}
              {userRole === 'Admin' && (
                <>You have been assigned <span className="font-semibold text-primary">{projectsList.length}</span> project{projectsList.length !== 1 ? 's' : ''}</>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              Click on a project to access its content and settings
            </p>
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsList.map((project) => (
              <Card
                key={project.projectId}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                  hoveredProjectId === project.projectId
                    ? 'border-primary shadow-md ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
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
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
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
                    <div className="text-xs text-muted-foreground">
                      <p className="font-mono">{project.projectId.substring(0, 12)}...</p>
                    </div>
                    <Button
                      size="sm"
                      className={`transition-all ${
                        hoveredProjectId === project.projectId
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          : 'bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectProject(project)
                      }}
                    >
                      Select
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-3 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium">
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
