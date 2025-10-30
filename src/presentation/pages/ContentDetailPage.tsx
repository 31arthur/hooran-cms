/**
 * Content Detail Page Component
 *
 * Displays and allows editing of a single content entry.
 * Uses a two-column layout with dynamic form fields and metadata sidebar.
 *
 * **Route:** `/app/content/:collectionId/:contentId`
 * **Access:** Only available to 'Admin' and 'Super' roles
 * **Scoping:** All data is scoped to the currently selected project
 *
 * **Data Flow:**
 * 1. Extract collectionId and contentId from route parameters
 * 2. Get projectId from useProject context
 * 3. Fetch content entry from DataService
 * 4. Fetch schema definition from SchemaService
 * 5. Display dynamic form based on schema fields
 * 6. Show metadata sidebar with status and timestamps
 *
 * @example
 * ```tsx
 * // In Router.tsx
 * <Route path="content/:collectionId/:contentId" element={<ContentDetailPage />} />
 * ```
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { useUseCase } from '@/presentation/hooks/useUseCase'
import { DI_TYPES } from '@/domain/di'
import type { IContentManagementUseCase, ISchemaManagementUseCase } from '@/application/usecases'
import type { ContentEntry, SchemaDefinition } from '@/domain/entities'
import { DynamicForm, type DynamicFormRef } from '@/presentation/components/DynamicForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/presentation/components/ui/alert'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import {
  AlertCircle,
  Loader2,
  Save,
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Shield,
  Database,
  Trash2,
} from 'lucide-react'

/**
 * Route parameters interface
 */
interface ContentDetailParams {
  collectionId: string
  contentId: string
}

/**
 * Content Detail Page Component
 *
 * Provides a comprehensive interface for viewing and editing content entries.
 */
export function ContentDetailPage() {
  // Route parameters
  const { collectionId, contentId } = useParams<keyof ContentDetailParams>()
  const navigate = useNavigate()

  // Context hooks
  const { currentUser, userRole, hasCMSAccess } = useAuth()
  const { selectedProject, isLoading: projectsLoading } = useProject()

  // Use Cases (DI Resolution)
  const contentManagementUseCase = useUseCase<IContentManagementUseCase>(
    DI_TYPES.ContentManagementUseCase
  )
  const schemaManagementUseCase = useUseCase<ISchemaManagementUseCase>(
    DI_TYPES.SchemaManagementUseCase
  )

  // State management
  const [contentEntry, setContentEntry] = useState<ContentEntry | null>(null)
  const [schema, setSchema] = useState<SchemaDefinition | null>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [isLoadingSchema, setIsLoadingSchema] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state for content data
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formStatus, setFormStatus] = useState<'draft' | 'published' | 'archived'>('draft')

  // Ref for DynamicForm component
  const formRef = useRef<DynamicFormRef>(null)

  /**
   * Fetch schema definition for the collection
   */
  useEffect(() => {
    if (!selectedProject || !collectionId) {
      return
    }

    const fetchSchema = async () => {
      setIsLoadingSchema(true)
      setError(null)

      try {
        console.log('📋 ContentDetailPage: Fetching schema', { collectionId })

        const schemaData = await schemaManagementUseCase.getSchemaById(
          selectedProject.projectId,
          collectionId,
          currentUser!.uid,
          userRole || 'User'
        )

        if (!schemaData) {
          setError(`Schema not found for collection: ${collectionId}`)
          setSchema(null)
          return
        }

        setSchema(schemaData)
        console.log('✅ ContentDetailPage: Schema loaded', schemaData)
      } catch (err) {
        console.error('❌ ContentDetailPage: Failed to fetch schema', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch schema')
        setSchema(null)
      } finally {
        setIsLoadingSchema(false)
      }
    }

    fetchSchema()
  }, [selectedProject, collectionId])

  /**
   * Fetch content entry data
   */
  useEffect(() => {
    if (!selectedProject || !collectionId || !contentId) {
      return
    }

    const fetchContent = async () => {
      setIsLoadingContent(true)
      setError(null)

      try {
        console.log('📋 ContentDetailPage: Fetching content entry', {
          projectId: selectedProject.projectId,
          collectionId,
          contentId,
        })

        const result = await contentManagementUseCase.getContentEntryById(
          selectedProject.projectId,
          collectionId,
          contentId,
          currentUser!.uid,
          userRole || 'User'
        )

        const entry = result?.entry

        if (!entry) {
          setError(`Content entry not found: ${contentId}`)
          setContentEntry(null)
          return
        }

        setContentEntry(entry)
        setFormData(entry.data || {})
        setFormStatus(entry.status || 'draft')
        console.log('✅ ContentDetailPage: Content entry loaded', entry)
      } catch (err) {
        console.error('❌ ContentDetailPage: Failed to fetch content', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch content entry')
        setContentEntry(null)
      } finally {
        setIsLoadingContent(false)
      }
    }

    fetchContent()
  }, [selectedProject, collectionId, contentId])

  /**
   * Handle form data changes from DynamicForm
   */
  const handleFormChange = (updatedData: Record<string, any>) => {
    setFormData(updatedData)
  }

  /**
   * Handle status change
   */
  const handleStatusChange = (status: 'draft' | 'published' | 'archived') => {
    setFormStatus(status)
  }

  /**
   * Handle save operation
   */
  const handleSave = async () => {
    if (!selectedProject || !collectionId || !contentId || !currentUser) {
      return
    }

    // Get form data from DynamicForm ref
    const currentFormData = formRef.current?.getFormData() || formData

    // Validate form before saving
    const validation = formRef.current?.validateForm()
    if (validation && !validation.isValid) {
      setError(`Please fill in all required fields: ${validation.errors.join(', ')}`)
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      console.log('💾 ContentDetailPage: Saving content entry', {
        projectId: selectedProject.projectId,
        collectionId,
        contentId,
        data: currentFormData,
      })

      await contentManagementUseCase.updateContentEntry(
        selectedProject.projectId,
        collectionId,
        contentId,
        {
          data: currentFormData,
          status: formStatus,
        },
        currentUser.uid,
        userRole || 'User'
      )

      setSuccessMessage('Content saved successfully!')
      console.log('✅ ContentDetailPage: Content saved')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('❌ ContentDetailPage: Failed to save content', err)
      setError(err instanceof Error ? err.message : 'Failed to save content')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handle delete operation
   */
  const handleDelete = async () => {
    if (!selectedProject || !collectionId || !contentId || !currentUser) {
      return
    }

    // Confirm deletion with user
    const entryName =
      contentEntry?.data?.title ||
      contentEntry?.data?.name ||
      contentEntry?.data?.label ||
      `Entry ${contentId.substring(0, 8)}`

    const confirmed = window.confirm(
      `Are you sure you want to delete "${entryName}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      console.log('🗑️ ContentDetailPage: Deleting content entry', {
        projectId: selectedProject.projectId,
        collectionId,
        contentId,
      })

      await contentManagementUseCase.deleteContentEntry(
        selectedProject.projectId,
        collectionId,
        contentId,
        currentUser.uid,
        userRole || 'User'
      )

      console.log('✅ ContentDetailPage: Content deleted successfully')

      // Navigate back to content list after successful deletion
      navigate(`/app/content/${collectionId}`)
    } catch (err) {
      console.error('❌ ContentDetailPage: Failed to delete content', err)
      setError(err instanceof Error ? err.message : 'Failed to delete content')
      setIsDeleting(false)
    }
  }

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigate(`/app/content/${collectionId}`)
  }

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
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Only users with 'Admin' or 'Super' roles can view and edit content.
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
  if (projectsLoading || isLoadingSchema || isLoadingContent) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 text-[#20B2AA] animate-spin" />
                <CardTitle>Loading Content Entry...</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  /**
   * No project selected state
   */
  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Project Selected</CardTitle>
            <CardDescription>Please select a project to view content.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Select a project from the project selector to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Error state
   */
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collection
          </Button>
          <Alert className="border-red-500 bg-red-50 max-w-2xl">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-700">Error</AlertTitle>
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  /**
   * Content not found state
   */
  if (!contentEntry || !schema) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collection
          </Button>
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Content Not Found</CardTitle>
              <CardDescription>
                The requested content entry could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                This entry may have been deleted or you may not have permission to access it.
              </p>
              <p className="text-xs text-gray-500 mt-4">
                Collection ID: <span className="font-mono">{collectionId}</span>
                <br />
                Content ID: <span className="font-mono">{contentId}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  /**
   * Main Content Detail View
   */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {schema.name}
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-[#20B2AA]" />
                Edit Content Entry
              </h1>
              {schema.description && (
                <p className="text-sm text-gray-500 mt-2">{schema.description}</p>
              )}
            </div>
          </div>

          {/* Context Information - Prominently Display IDs */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-[#20B2AA]/10 border border-[#20B2AA]/30 rounded-md">
              <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Database className="h-3 w-3" />
                Project ID
              </p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {selectedProject.projectId}
              </p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Database className="h-3 w-3" />
                Collection ID
              </p>
              <p className="text-sm font-mono text-gray-900 break-all">{collectionId}</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
              <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Content ID
              </p>
              <p className="text-sm font-mono text-gray-900 break-all">{contentId}</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700">Success</AlertTitle>
            <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Dynamic Content Form */}
          <div className="lg:col-span-2">
            <Card className="border-[#20B2AA]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#20B2AA]" />
                  Content Fields
                </CardTitle>
                <CardDescription>
                  Edit the content fields for this entry
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* DynamicForm Component - Renders all form fields */}
                <DynamicForm
                  ref={formRef}
                  schema={schema.fields}
                  initialData={contentEntry.data || {}}
                  onChange={handleFormChange}
                  showDescriptions={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Metadata Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Save Button Card */}
              <Card className="border-[#20B2AA]/20">
                <CardContent className="pt-6">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[#20B2AA] to-[#1a9088] text-white hover:shadow-lg transition-all"
                    size="lg"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Status Card */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-600" />
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={formStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Metadata Card */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Created</p>
                    <p className="text-gray-900">
                      {contentEntry.createdAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {contentEntry.createdAt.toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Last Updated</p>
                    <p className="text-gray-900">
                      {contentEntry.updatedAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {contentEntry.updatedAt.toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Created By
                    </p>
                    <p className="text-gray-900 font-mono text-xs break-all">
                      {contentEntry.createdBy}
                    </p>
                  </div>

                  {contentEntry.updatedBy && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Updated By
                      </p>
                      <p className="text-gray-900 font-mono text-xs break-all">
                        {contentEntry.updatedBy}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delete Card */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-red-700">
                    <Trash2 className="h-4 w-4" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600 mb-3">
                    Permanently delete this content entry. This action cannot be undone.
                  </p>
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting || isSaving}
                    variant="destructive"
                    className="w-full"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Entry
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
