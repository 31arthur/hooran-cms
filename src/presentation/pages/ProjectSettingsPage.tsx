/**
 * Project Settings Page Component
 *
 * Allows Admin and Super users to view and edit project metadata.
 * This page is project-scoped and uses the currently selected project's context.
 *
 * **Route:** `/app/settings`
 * **Access:** Available to 'Admin' and 'Super' roles
 * **Scoping:** All operations are scoped to the currently selected project
 *
 * **Features:**
 * - Display current project name prominently
 * - Edit project name and status
 * - Automatic audit logging on updates (via ProjectService + additional PROJECT_SETTINGS log)
 * - Toast notifications for success/error feedback
 * - Redirect to project selector if no project is selected
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { useToast } from '@/presentation/context/ToastContext'
import { DIContainer, DI_TYPES } from '@/domain/di'
import type { ISettingsManagementUseCase } from '@/application/usecases'
import type { ProjectMetadata } from '@/domain/entities/Project'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import {
  Loader2,
  Save,
  Settings,
  ArrowLeft,
  FolderCog,
} from 'lucide-react'

/**
 * Project Settings Page Component
 *
 * Provides interface for editing project metadata with audit logging.
 */
export function ProjectSettingsPage() {
  const navigate = useNavigate()
  const { currentUser, userRole, hasCMSAccess } = useAuth()
  const { selectedProject, isLoading: projectsLoading, setSelectedProject } = useProject()
  const { showToast } = useToast()

  // Form state
  const [projectName, setProjectName] = useState('')
  const [projectStatus, setProjectStatus] = useState<'Active' | 'Draft' | 'Archived'>('Draft')
  const [hasChanges, setHasChanges] = useState(false)

  // Operation state
  const [isSaving, setIsSaving] = useState(false)

  /**
   * Initialize form with project data
   */
  useEffect(() => {
    if (selectedProject) {
      setProjectName(selectedProject.name || '')
      setProjectStatus((selectedProject.status || 'Draft') as 'Active' | 'Draft' | 'Archived')
    }
  }, [selectedProject])

  /**
   * Track if form has unsaved changes
   */
  useEffect(() => {
    if (!selectedProject) return

    const nameChanged = projectName !== (selectedProject.name || '')
    const statusChanged = projectStatus !== (selectedProject.status || 'Draft')
    setHasChanges(nameChanged || statusChanged)
  }, [projectName, projectStatus, selectedProject])

  /**
   * Handle save operation
   */
  const handleSave = async () => {
    if (!selectedProject || !currentUser) {
      showToast({
        title: 'Error',
        description: 'Missing project or user context',
        variant: 'destructive',
      })
      return
    }

    if (!projectName.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Project name cannot be empty',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    try {
      console.log('💾 ProjectSettingsPage: Saving project metadata', {
        projectId: selectedProject.projectId,
        name: projectName,
        status: projectStatus,
      })

      // Prepare metadata for update
      const metadata: ProjectMetadata = {
        name: projectName.trim(),
        status: projectStatus,
      }

      // Use SettingsManagementUseCase instead of direct service calls
      // The Use Case handles both project update and audit logging internally
      const settingsUseCase = DIContainer.resolve<ISettingsManagementUseCase>(
        DI_TYPES.SettingsManagementUseCase
      )

      await settingsUseCase.updateProjectMetadata(
        selectedProject.projectId,
        metadata,
        currentUser.uid
      )

      console.log('✅ ProjectSettingsPage: Project metadata updated successfully')

      // Update local selected project context
      // Note: ProjectContext uses different status values (lowercase)
      if (setSelectedProject) {
        const contextStatus =
          projectStatus === 'Active' ? 'active' :
          projectStatus === 'Archived' ? 'archived' :
          'suspended' // Draft maps to suspended in context

        setSelectedProject({
          ...selectedProject,
          name: projectName,
          status: contextStatus as 'active' | 'suspended' | 'archived',
        })
      }

      // Show success toast
      showToast({
        title: 'Settings updated',
        description: `Project "${projectName}" settings updated successfully`,
        variant: 'default',
      })

      setHasChanges(false)
    } catch (err) {
      console.error('❌ ProjectSettingsPage: Failed to save project settings', err)

      // Show error toast
      showToast({
        title: 'Failed to save settings',
        description: err instanceof Error ? err.message : 'An error occurred while saving project settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handle cancel operation
   */
  const handleCancel = () => {
    if (selectedProject) {
      setProjectName(selectedProject.name || '')
      setProjectStatus((selectedProject.status || 'Draft') as 'Active' | 'Draft' | 'Archived')
      setHasChanges(false)
    }
  }

  /**
   * Redirect to project selector if no project is selected
   */
  useEffect(() => {
    if (!projectsLoading && !selectedProject) {
      console.log('⚠️ No project selected, redirecting to project selector')
      navigate('/app/select-project')
    }
  }, [projectsLoading, selectedProject, navigate])

  /**
   * Role-based access control
   */
  if (!hasCMSAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access project settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Only users with 'Admin' or 'Super' roles can access project settings.
            </p>
            {currentUser && (
              <p className="text-sm text-gray-500 mt-2">
                Current role: <span className="font-semibold">{userRole || 'Unknown'}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Loading state
   */
  if (projectsLoading || !selectedProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 text-[#20B2AA] animate-spin mb-4" />
              <p className="text-gray-600">Loading project settings...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Main Settings UI
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/dashboard')}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-12 h-12 bg-gradient-to-br from-[#20B2AA] to-[#1a9088] rounded-lg flex items-center justify-center shadow-md">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
                <p className="text-sm text-gray-600">
                  Manage settings for{' '}
                  <span className="font-semibold text-[#20B2AA]">{selectedProject.name}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-[#20B2AA]/10 text-[#20B2AA] px-3 py-1.5 rounded-full font-semibold border border-[#20B2AA]/30">
                {userRole}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Project Context Card */}
          <Card className="mb-6 border-[#20B2AA]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderCog className="h-5 w-5 text-[#20B2AA]" />
                Current Project Context
              </CardTitle>
              <CardDescription>
                You are editing settings for the currently selected project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-[#20B2AA]/5 border border-[#20B2AA]/20 rounded-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Project ID</p>
                  <p className="text-sm font-mono text-gray-900 break-all">
                    {selectedProject.projectId}
                  </p>
                </div>
                <div className="p-3 bg-[#20B2AA]/5 border border-[#20B2AA]/20 rounded-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Current Name</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedProject.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Metadata Form */}
          <Card className="shadow-lg border-l-4 border-l-[#20B2AA]">
            <CardHeader>
              <CardTitle>Project Metadata</CardTitle>
              <CardDescription>
                Edit core project information. Changes will be audited automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Name Field */}
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-gray-900 font-semibold">
                  Project Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="projectName"
                  placeholder="e.g., My Awesome Project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="border-gray-300 focus:border-[#20B2AA] focus:ring-[#20B2AA]"
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500">
                  The display name for this project
                </p>
              </div>

              {/* Project Status Field */}
              <div className="space-y-2">
                <Label htmlFor="projectStatus" className="text-gray-900 font-semibold">
                  Project Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={projectStatus}
                  onValueChange={(value: 'Active' | 'Draft' | 'Archived') =>
                    setProjectStatus(value)
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#20B2AA] focus:ring-[#20B2AA]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>Draft</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Active">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Active</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Archived">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span>Archived</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Current operational status of the project
                </p>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> All changes to project settings are automatically
                  logged in the audit trail for compliance and traceability.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 shadow-md">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {hasChanges
                  ? isSaving
                    ? 'Saving changes...'
                    : 'You have unsaved changes'
                  : 'No unsaved changes'}
              </p>
              <p className="text-xs text-gray-500">
                {hasChanges
                  ? 'Click "Save Changes" to update the project settings'
                  : 'All changes are saved'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={!hasChanges || isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-[#20B2AA] to-[#1a9088] hover:from-[#1a9088] hover:to-[#158f87] text-white shadow-md"
                disabled={!hasChanges || isSaving || !projectName.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
