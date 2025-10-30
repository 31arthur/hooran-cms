/**
 * Project Creation Page Component
 *
 * EXCLUSIVE to Super role users for creating new projects in the multi-tenant CMS.
 *
 * **Access Control:**
 * - Only Super users can access this page
 * - Displays "Access Denied" message for non-Super users
 *
 * **Functionality:**
 * - Form to create new projects with name and slug/ID
 * - Optional field to assign an initial Admin user by email
 * - Auto-generates project slug from name (editable)
 * - Creates project in Firestore and assigns initial Admin if provided
 *
 * @route /app/projects/new
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { DIContainer, DI_TYPES } from '@/domain/di'
import type { ISettingsManagementUseCase } from '@/application/usecases'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'
import {
  ShieldOff,
  FolderPlus,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

export function ProjectCreationPage() {
  const { userRole, currentUser } = useAuth()
  const navigate = useNavigate()

  // Form state
  const [projectName, setProjectName] = useState('')
  const [projectSlug, setProjectSlug] = useState('')
  const [initialAdminEmail, setInitialAdminEmail] = useState('')
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)

  // UI state
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  /**
   * Auto-generate slug from project name
   * Only auto-generate if user hasn't manually edited the slug
   */
  useEffect(() => {
    if (!isSlugManuallyEdited && projectName) {
      const generatedSlug = projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .substring(0, 50) // Limit length

      setProjectSlug(generatedSlug)
    }
  }, [projectName, isSlugManuallyEdited])

  /**
   * Handle manual slug editing
   */
  const handleSlugChange = (value: string) => {
    setIsSlugManuallyEdited(true)
    setProjectSlug(value)
  }

  /**
   * Validate form inputs
   */
  const validateForm = (): string | null => {
    if (!projectName.trim()) {
      return 'Project name is required'
    }

    if (!projectSlug.trim()) {
      return 'Project slug/ID is required'
    }

    // Validate slug format (only lowercase alphanumeric and hyphens)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(projectSlug)) {
      return 'Project slug must contain only lowercase letters, numbers, and hyphens (no spaces or special characters)'
    }

    // Validate email format if provided
    if (initialAdminEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(initialAdminEmail.trim())) {
        return 'Invalid email format for initial admin'
      }
    }

    return null
  }

  /**
   * Handle project creation
   */
  const handleCreateProject = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsCreating(true)

    try {
      console.log('🚀 ProjectCreationPage: Creating new project', {
        name: projectName.trim(),
        slug: projectSlug.trim(),
        initialAdmin: initialAdminEmail.trim() || null,
      })

      // Use SettingsManagementUseCase instead of direct service call
      // The Use Case handles project creation, admin assignment, and audit logging
      const settingsUseCase = DIContainer.resolve<ISettingsManagementUseCase>(
        DI_TYPES.SettingsManagementUseCase
      )

      const result = await settingsUseCase.createProject(
        projectName.trim(),
        projectSlug.trim(),
        initialAdminEmail.trim() || null,
        currentUser!.uid
      )

      console.log('✅ ProjectCreationPage: Project created successfully', {
        projectId: result.projectId,
        adminAssigned: result.adminAssigned,
      })

      if (initialAdminEmail.trim() && !result.adminAssigned) {
        setSuccessMessage(
          `Project "${projectName}" created successfully! Note: Initial admin assignment failed - user may not exist.`
        )
      } else {
        setSuccessMessage(`Project "${projectName}" created successfully!`)
      }

      // Redirect to project selector after short delay
      // Business Rule: After creating a project, user should return to select-project page
      setTimeout(() => {
        navigate('/app/select-project')
      }, 2000)
    } catch (error: any) {
      console.error('❌ ProjectCreationPage: Failed to create project', error)
      setErrorMessage(error.message || 'Failed to create project. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  /**
   * Handle cancel - navigate back to project selector
   */
  const handleCancel = () => {
    navigate('/app/select-project')
  }

  // Access Control: Only Super users can access this page
  if (userRole !== 'Super') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-200 dark:border-red-900/50">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30">
                <ShieldOff className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl text-red-700 dark:text-red-400">
                Access Denied
              </CardTitle>
            </div>
            <CardDescription>
              You do not have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-sm text-red-800 dark:text-red-300">
                This page is restricted to <strong>Super</strong> role users only. Project creation
                requires system-level privileges.
              </AlertDescription>
            </Alert>

            <div className="mt-6">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Project Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main UI for Super users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-3xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project Selection
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
              <FolderPlus className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                Create New Project
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Set up a new multi-tenant project in the CMS
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-amber-200 dark:border-amber-900/50">
          <CardHeader>
            <CardTitle className="text-xl">Project Details</CardTitle>
            <CardDescription>
              Enter the project information. The slug will be auto-generated from the name but can
              be customized.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Message */}
            {successMessage && (
              <Alert className="border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-sm text-green-800 dark:text-green-300">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {errorMessage && (
              <Alert className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-sm text-red-800 dark:text-red-300">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Project Name Field */}
            <div className="space-y-2">
              <label
                htmlFor="projectName"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Project Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="projectName"
                type="text"
                placeholder="My Awesome Project"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isCreating}
                className="text-base"
              />
              <p className="text-xs text-slate-500 dark:text-slate-500">
                A human-readable name for the project
              </p>
            </div>

            {/* Project Slug/ID Field */}
            <div className="space-y-2">
              <label
                htmlFor="projectSlug"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Project Slug/ID <span className="text-red-500">*</span>
              </label>
              <Input
                id="projectSlug"
                type="text"
                placeholder="my-awesome-project"
                value={projectSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={isCreating}
                className="text-base font-mono"
              />
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Unique identifier for the project (lowercase letters, numbers, and hyphens only).
                Auto-generated from name but editable.
              </p>
            </div>

            {/* Initial Admin Email Field (Optional) */}
            <div className="space-y-2">
              <label
                htmlFor="initialAdminEmail"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Initial Admin Email <span className="text-slate-400">(Optional)</span>
              </label>
              <Input
                id="initialAdminEmail"
                type="email"
                placeholder="admin@example.com"
                value={initialAdminEmail}
                onChange={(e) => setInitialAdminEmail(e.target.value)}
                disabled={isCreating}
                className="text-base"
              />
              <p className="text-xs text-slate-500 dark:text-slate-500">
                If provided, this user will be immediately assigned as an Admin for this project.
                User must already exist in the system.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 dark:border-slate-700" />

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateProject}
                disabled={isCreating}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Create Project
                  </>
                )}
              </Button>

              <Button
                onClick={handleCancel}
                disabled={isCreating}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Notice */}
        <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Super Administrator Action
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Creating a new project will set up a new multi-tenant workspace with its own isolated
              data collections. All actions are logged in the audit trail.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
