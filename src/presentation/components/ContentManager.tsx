/**
 * Content Manager Component
 *
 * Dynamically displays and manages content entries for a specific collection within a project.
 * Uses route parameters to determine which collection to display.
 *
 * **Route:** `/app/content/:collectionId`
 * **Access:** Only available to 'Admin' and 'Super' roles
 * **Scoping:** All data is scoped to the currently selected project
 *
 * **Data Flow:**
 * 1. Extract collectionId from route parameters
 * 2. Resolve IContentManagementUseCase from DI container
 * 3. Fetch schema definition using use case
 * 4. Fetch content entries using use case
 * 5. Display dynamic table based on schema fields
 *
 * **Architecture:**
 * - Uses Clean Architecture with dependency injection
 * - All business logic delegated to ContentManagementUseCase
 * - Component focuses solely on presentation and user interaction
 *
 * @example
 * ```tsx
 * // In Router.tsx
 * <Route path="content/:collectionId" element={<ContentManager />} />
 * ```
 */

import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { useUseCase } from '@/presentation/hooks/useUseCase'
import { DI_TYPES } from '@/domain/di'
import type { IContentManagementUseCase } from '@/application/usecases'
import type { ContentEntry, SchemaDefinition } from '@/domain/entities'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/presentation/components/ui/alert'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import { AlertCircle, Loader2, Database, Plus, MoreHorizontal, History, Eye, Trash2, Search, Filter, CheckCircle, FileX } from 'lucide-react'

/**
 * Route parameters interface
 */
interface ContentManagerParams {
  collectionId: string
}

/**
 * Content Manager Component
 *
 * Dynamically loads and displays content for a specific collection.
 *
 * **Requirements:**
 * 1. Extract collectionId from route parameters
 * 2. Resolve ContentManagementUseCase from DI container
 * 3. Fetch schema definition using use case
 * 4. Fetch content entries using use case
 * 5. Display loading and error states appropriately
 * 6. Render dynamic table based on schema fields
 */
export function ContentManager() {
  // Route parameters
  const { collectionId } = useParams<keyof ContentManagerParams>()
  const navigate = useNavigate()

  // Context hooks
  const { currentUser, userRole, hasCMSAccess } = useAuth()
  const { selectedProject, isLoading: projectsLoading } = useProject()

  // Use Case (DI Resolution)
  const contentManagementUseCase = useUseCase<IContentManagementUseCase>(
    DI_TYPES.ContentManagementUseCase
  )

  // State management
  const [schema, setSchema] = useState<SchemaDefinition | null>(null)
  const [contentEntries, setContentEntries] = useState<ContentEntry[]>([])
  const [isLoadingSchema, setIsLoadingSchema] = useState(false)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Selection state for batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)

  // Refresh trigger for re-fetching data
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  /**
   * Dynamically generate table columns based on schema fields
   * This creates a dynamic column configuration for the data table
   */
  const dynamicColumns = useMemo(() => {
    if (!schema || !schema.fields) return []

    console.log('🔍 DEBUG - Schema fields:', schema.fields)

    return schema.fields.map((field) => ({
      id: field.name,
      label: field.label,
      name: field.name,
      type: field.type,
      required: field.required,
    }))
  }, [schema])

  /**
   * Handle navigation to audit history page
   */
  const handleViewHistory = (contentId: string) => {
    navigate(`/app/audit/${collectionId}/${contentId}`)
  }

  /**
   * Handle navigation to content detail page
   */
  const handleViewDetails = (contentId: string) => {
    navigate(`/app/content/${collectionId}/${contentId}`)
  }

  /**
   * Handle status change for content entry
   * Updates content entry status with toast notification
   *
   * @param contentId - The ID of the content entry to update
   * @param newStatus - The new status ('published' or 'draft')
   * @param entryTitle - The title of the entry for display in toast
   */
  const handleStatusChange = async (
    contentId: string,
    newStatus: 'published' | 'draft',
    entryTitle: string
  ) => {
    if (!selectedProject || !currentUser) {
      toast.error('Unable to update status', {
        description: 'Missing required context',
      })
      return
    }

    try {
      console.log(`📝 ContentManager: Updating status for entry ${contentId} to ${newStatus}`)

      // Update content entry with only status field
      // contentManagementUseCase.updateEntry will handle audit logging automatically
      await contentManagementUseCase.updateEntry(
        selectedProject.projectId,
        collectionId!,
        contentId,
        { status: newStatus }, // Only update status field
        currentUser.uid
      )

      console.log('✅ ContentManager: Status updated successfully')

      // Show success toast notification
      toast.success(
        newStatus === 'published' ? 'Content published' : 'Content unpublished',
        {
          description: `"${entryTitle}" is now ${newStatus}`,
          icon: newStatus === 'published' ? <CheckCircle className="h-4 w-4" /> : <FileX className="h-4 w-4" />,
        }
      )

      // Refresh content list to show updated status
      setRefreshTrigger(prev => prev + 1)
    } catch (error: any) {
      console.error('❌ ContentManager: Failed to update status', error)

      toast.error('Failed to update status', {
        description: error.message || 'An error occurred while updating the content status',
      })
    }
  }

  /**
   * Handle selecting/deselecting all entries
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(contentEntries.map((entry) => entry.id))
      setSelectedIds(allIds)
    } else {
      setSelectedIds(new Set())
    }
  }

  /**
   * Handle selecting/deselecting a single entry
   */
  const handleSelectRow = (entryId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds)
    if (checked) {
      newSelectedIds.add(entryId)
    } else {
      newSelectedIds.delete(entryId)
    }
    setSelectedIds(newSelectedIds)
  }

  /**
   * Handle batch status update
   */
  const handleBatchStatusUpdate = async (newStatus: 'published' | 'draft') => {
    if (!selectedProject || !currentUser || selectedIds.size === 0) {
      toast.error('Unable to batch update', {
        description: 'Please select at least one entry',
      })
      return
    }

    try {
      setIsBatchProcessing(true)
      const selectedIdsArray = Array.from(selectedIds)

      console.log('Batch updating ' + selectedIdsArray.length + ' entries to status: ' + newStatus)

      await contentManagementUseCase.batchUpdateStatus(
        selectedProject.projectId,
        collectionId!,
        selectedIdsArray,
        newStatus,
        currentUser.uid
      )

      toast.success(
        'Batch update completed',
        {
          description: 'Updated ' + selectedIdsArray.length + ' entries to ' + newStatus,
          icon: newStatus === 'published' ? <CheckCircle className="h-4 w-4" /> : <FileX className="h-4 w-4" />,
        }
      )

      // Clear selection and refresh list
      setSelectedIds(new Set())
      setRefreshTrigger(prev => prev + 1)
    } catch (error: any) {
      console.error('Failed to batch update status:', error)

      toast.error('Batch update failed', {
        description: error.message || 'Some entries may not have been updated',
      })
    } finally {
      setIsBatchProcessing(false)
    }
  }

  /**
   * Format cell value based on field type
   */
  const formatCellValue = (value: any, fieldType: string): string => {
    if (value === null || value === undefined) return '-'

    switch (fieldType) {
      case 'boolean':
        return value ? 'Yes' : 'No'
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : String(value)
      case 'date':
        if (value instanceof Date) return value.toLocaleDateString()
        if (typeof value === 'string') return new Date(value).toLocaleDateString()
        return String(value)
      case 'richtext':
      case 'textarea':
        // Truncate long text
        const text = String(value)
        return text.length > 50 ? text.substring(0, 50) + '...' : text
      default:
        return String(value)
    }
  }

  /**
   * Fetch schema definition for the current collectionId
   */
  useEffect(() => {
    if (!selectedProject || !collectionId) {
      return
    }

    const fetchSchema = async () => {
      setIsLoadingSchema(true)
      setError(null)

      try {
        console.log('📋 ContentManager: Fetching schema for collection', collectionId)

        // Fetch schema by ID using use case
        const schemaData = await contentManagementUseCase.getSchemaById(selectedProject.projectId, collectionId)

        if (!schemaData) {
          setError(`Schema not found for collection: ${collectionId}`)
          setSchema(null)
          return
        }

        setSchema(schemaData)
        console.log('✅ ContentManager: Schema loaded', schemaData)
        console.log('🔍 DEBUG - Schema fields array:', schemaData.fields)
        console.log('🔍 DEBUG - Schema fields count:', schemaData.fields?.length || 0)
      } catch (err) {
        console.error('❌ ContentManager: Failed to fetch schema', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch schema')
        setSchema(null)
      } finally {
        setIsLoadingSchema(false)
      }
    }

    fetchSchema()
  }, [selectedProject, collectionId])

  /**
   * Fetch content entries for the current collectionId
   */
  useEffect(() => {
    if (!selectedProject || !collectionId || !schema) {
      return
    }

    const fetchContent = async () => {
      setIsLoadingContent(true)
      setError(null)

      try {
        console.log('📋 ContentManager: Fetching content entries', {
          projectId: selectedProject.projectId,
          collectionId,
          limit: 50,
          search: searchTerm || 'none',
          filter: filterStatus !== 'all' ? `status=${filterStatus}` : 'none',
        })

        // Build options for search and filter
        const options: any = { limit: 50 }

        // Add search if provided
        if (searchTerm && searchTerm.trim() !== '') {
          options.search = searchTerm.trim()
        }

        // Add filter if status is not 'all'
        if (filterStatus !== 'all') {
          options.filterField = 'status'
          options.filterValue = filterStatus
        }

        // Fetch content entries with search and filter using use case
        const entries = await contentManagementUseCase.getEntries(
          selectedProject.projectId,
          collectionId,
          options
        )

        setContentEntries(entries)
        console.log(`✅ ContentManager: Loaded ${entries.length} content entries`)

        // DEBUG: Log first entry to inspect data structure
        if (entries.length > 0) {
          console.log('🔍 DEBUG - First entry structure:', entries[0])
          console.log('🔍 DEBUG - First entry.data:', entries[0].data)
          console.log('🔍 DEBUG - First entry.data keys:', Object.keys(entries[0].data || {}))
        }
      } catch (err) {
        console.error('❌ ContentManager: Failed to fetch content', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch content entries')
        setContentEntries([])
      } finally {
        setIsLoadingContent(false)
      }
    }

    fetchContent()
  }, [selectedProject, collectionId, schema, searchTerm, filterStatus, refreshTrigger])

  /**
   * Role-based access control
   * Only Admin and Super roles can access this component
   */
  if (!hasCMSAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access the Content Manager.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Only users with 'Admin' or 'Super' roles can access this feature.
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
  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Loading projects...</p>
          </CardContent>
        </Card>
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
            <CardDescription>Please select a project to manage content.</CardDescription>
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
   * No collectionId in route
   */
  if (!collectionId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Collection Selected</CardTitle>
            <CardDescription>Please select a collection to view.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Navigate to a specific collection to view its content entries.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Loading schema state
   */
  if (isLoadingSchema) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 text-[#20B2AA] animate-spin" />
              <CardTitle>Loading Schema...</CardTitle>
            </div>
            <CardDescription>Fetching collection definition for {collectionId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
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
        <Alert className="border-red-500 bg-red-50 max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-700">Error Loading Content</AlertTitle>
          <AlertDescription className="text-red-600">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  /**
   * Schema not found state
   */
  if (!schema) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Schema Not Found</CardTitle>
            <CardDescription>
              No schema definition found for collection: {collectionId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              This collection may not exist in the current project, or you may not have permission
              to access it.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Project: <span className="font-mono">{selectedProject.name}</span>
              <br />
              Collection ID: <span className="font-mono">{collectionId}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Main Content View
   */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Collection Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Database className="h-8 w-8 text-[#20B2AA]" />
                {schema.name}
              </h1>
              {schema.description && (
                <p className="text-sm text-gray-500 mt-2">{schema.description}</p>
              )}
            </div>
            <Button className="bg-gradient-to-r from-[#20B2AA] to-[#1a9088] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add New Entry
            </Button>
          </div>

          {/* Project Scoping Indicator */}
          <div className="mt-4 p-3 bg-[#20B2AA]/10 border border-[#20B2AA]/30 rounded-md">
            <p className="text-sm text-gray-800">
              <span className="font-semibold">Scoping:</span> Showing data for collection{' '}
              <span className="font-mono bg-white px-2 py-0.5 rounded">{schema.name}</span>{' '}
              in project{' '}
              <span className="font-mono bg-white px-2 py-0.5 rounded">
                {selectedProject.name}
              </span>
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="mt-4 flex gap-4">
            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-[#20B2AA] focus:ring-[#20B2AA]"
                />
              </div>
              {searchTerm && (
                <p className="text-xs text-gray-500 mt-1">
                  Searching for entries with titles starting with "{searchTerm}"
                </p>
              )}
            </div>

            {/* Status Filter */}
            <div className="w-48">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="border-gray-300 focus:border-[#20B2AA] focus:ring-[#20B2AA]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || filterStatus !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                }}
                className="px-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Loading Content State */}
        {isLoadingContent && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-[#20B2AA] animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Loading content entries...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State - No Data Found */}
        {!isLoadingContent && contentEntries.length === 0 && (
          <Card className="border-[#20B2AA]/20">
            <CardContent className="pt-6">
              <div className="text-center py-16">
                <div className="relative inline-flex mb-6">
                  <div className="absolute inset-0 bg-[#20B2AA]/10 rounded-full blur-xl"></div>
                  <Database className="relative h-20 w-20 text-[#20B2AA] mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Data Found</h3>
                <p className="text-base text-gray-600 mb-2 max-w-md mx-auto">
                  There are no content entries in this collection yet.
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Get started by creating your first entry for <span className="font-semibold">{schema.name}</span>
                </p>
                <div className="flex flex-col items-center gap-4">
                  <Button
                    className="bg-gradient-to-r from-[#20B2AA] to-[#1a9088] text-white hover:shadow-lg transition-shadow"
                    size="lg"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create First Entry
                  </Button>
                  <div className="text-xs text-gray-400 bg-gray-50 px-4 py-2 rounded-md border border-gray-200">
                    <span className="font-semibold text-gray-600">Collection:</span>{' '}
                    <span className="font-mono">{collectionId}</span>
                    {' • '}
                    <span className="font-semibold text-gray-600">Project:</span>{' '}
                    <span className="font-mono">{selectedProject.projectId}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Table with Dynamic Columns */}
        {!isLoadingContent && contentEntries.length > 0 && (
          <Card className="border-[#20B2AA]/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Database className="h-5 w-5 text-[#20B2AA]" />
                    Content Entries ({contentEntries.length})
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Displaying {contentEntries.length} {contentEntries.length === 1 ? 'entry' : 'entries'} from {schema.name}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isBatchProcessing}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Bulk Actions ({selectedIds.size})
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleBatchStatusUpdate('published')}
                          disabled={isBatchProcessing}
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                          <span>Publish Selected</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleBatchStatusUpdate('draft')}
                          disabled={isBatchProcessing}
                        >
                          <FileX className="mr-2 h-4 w-4 text-amber-600" />
                          <span>Unpublish Selected</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                <Button
                  className="bg-gradient-to-r from-[#20B2AA] to-[#1a9088] text-white"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entry
                </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedIds.size === contentEntries.length && contentEntries.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="font-semibold">ID</TableHead>
                      {/* Dynamic column headers from schema fields */}
                      {dynamicColumns.map((column) => (
                        <TableHead key={column.id} className="font-semibold">
                          {column.label}
                          {column.required && <span className="text-red-500 ml-1">*</span>}
                        </TableHead>
                      ))}
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentEntries.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(entry.id)}
                            onCheckedChange={(checked) => handleSelectRow(entry.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-500 max-w-[100px]">
                          <div className="truncate" title={entry.id}>
                            {entry.id.substring(0, 8)}...
                          </div>
                        </TableCell>
                        {/* Dynamic data cells from schema fields */}
                        {dynamicColumns.map((column) => {
                          const cellValue = entry.data?.[column.name]
                          console.log(`🔍 DEBUG - Accessing column "${column.name}" (${column.label}):`, cellValue, '| entry.data:', entry.data)
                          return (
                            <TableCell key={column.id} className="max-w-xs">
                              <div className="truncate" title={formatCellValue(cellValue, column.type)}>
                                {formatCellValue(cellValue, column.type)}
                              </div>
                            </TableCell>
                          )
                        })}
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              entry.status === 'published'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : entry.status === 'archived'
                                  ? 'bg-gray-100 text-gray-700 border border-gray-200'
                                  : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            }`}
                          >
                            {entry.status || 'draft'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                          {entry.createdAt.toLocaleDateString()}
                        </TableCell>
                        {/* Actions Column with Dropdown Menu */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px]">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => handleViewDetails(entry.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer focus:bg-[#20B2AA]/10 focus:text-[#20B2AA]"
                                onClick={() => handleViewHistory(entry.id)}
                              >
                                <History className="mr-2 h-4 w-4" />
                                <span>View History</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Status Management - Quick Actions for Admins */}
                              {entry.status !== 'published' && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-green-600 focus:text-green-600 focus:bg-green-50"
                                  onClick={() =>
                                    handleStatusChange(
                                      entry.id,
                                      'published',
                                      entry.data?.title || entry.data?.name || `Entry ${entry.id.substring(0, 8)}`
                                    )
                                  }
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  <span>Publish</span>
                                </DropdownMenuItem>
                              )}
                              {entry.status === 'published' && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                                  onClick={() =>
                                    handleStatusChange(
                                      entry.id,
                                      'draft',
                                      entry.data?.title || entry.data?.name || `Entry ${entry.id.substring(0, 8)}`
                                    )
                                  }
                                >
                                  <FileX className="mr-2 h-4 w-4" />
                                  <span>Unpublish / Draft</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => {
                                  console.log('Delete entry:', entry.id)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Entry count footer */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <p>
                  Showing <span className="font-semibold text-gray-700">{contentEntries.length}</span> of{' '}
                  <span className="font-semibold text-gray-700">{contentEntries.length}</span> entries
                </p>
                <p className="text-xs">
                  <span className="text-[#20B2AA] font-semibold">Tip:</span> Click on the actions menu to view audit history
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

