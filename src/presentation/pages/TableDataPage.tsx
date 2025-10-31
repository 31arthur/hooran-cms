/**
 * Table Data Page
 *
 * Dynamic page that displays content/records for a specific table (collection/schema).
 * Loads schema definition and displays data in a structured format with filtering.
 *
 * **Features:**
 * - Dynamic schema loading
 * - Structured table display with all fields
 * - Filter by user (admin/creator)
 * - Filter by date range
 * - Search across all fields
 * - Create/Edit/Delete records
 * - Pagination
 * - Responsive design
 *
 * @route /app/tables/:schemaId
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { useCMSServices } from '@/presentation/hooks/useCMSServices'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Badge } from '@/presentation/components/ui/badge'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Edit,
  Trash2,
  AlertCircle,
  Database,
  X,
} from 'lucide-react'
import type { SchemaDefinition } from '@/domain/entities/SchemaDefinition'
import type { ContentEntry } from '@/domain/entities/ContentEntry'
import { RecordCreateDialog } from '@/presentation/components/RecordCreateDialog'
import { RecordEditDialog } from '@/presentation/components/RecordEditDialog'

interface TableRecord {
  id: string
  [key: string]: any
  createdBy?: string
  createdAt?: Date
  updatedBy?: string
  updatedAt?: Date
}

type DateFilter = '24h' | '7d' | '30d' | 'all'

/**
 * MediaThumbnail Component
 * Fetches and displays media thumbnail from Firebase Storage by media ID
 */
const MediaThumbnail: React.FC<{ mediaId: string }> = ({ mediaId }) => {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { mediaManagement } = useCMSServices()
  const { selectedProject } = useProject()
  const { currentUser } = useAuth()

  useEffect(() => {
    const fetchMediaUrl = async () => {
      try {
        if (!selectedProject || !currentUser) return

        // Fetch media metadata from Firestore
        const media = await mediaManagement.getMediaById(
          mediaId,
          selectedProject.projectId,
          currentUser.uid,
          'User' // Role for viewing media
        )
        if (media) {
          setUrl(media.url)
        }
      } catch (error) {
        console.error('Failed to fetch media:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMediaUrl()
  }, [mediaId, selectedProject, currentUser, mediaManagement])

  if (loading) {
    return (
      <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 animate-pulse" />
    )
  }

  if (!url) {
    return (
      <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
        <span className="text-xs text-gray-400">?</span>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt="Media thumbnail"
      className="w-12 h-12 object-cover rounded border border-gray-200"
      onError={(e) => {
        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23eee" width="48" height="48"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999"%3E✕%3C/text%3E%3C/svg%3E'
      }}
    />
  )
}

export function TableDataPage() {
  const { schemaId } = useParams<{ schemaId: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { selectedProject } = useProject()
  const cmsServices = useCMSServices()

  // Schema and data
  const [schema, setSchema] = useState<SchemaDefinition | null>(null)
  const [records, setRecords] = useState<TableRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<TableRecord[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [showFilters, setShowFilters] = useState(false)

  // UI state
  const [isLoadingSchema, setIsLoadingSchema] = useState(true)
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ContentEntry | null>(null)

  /**
   * Load schema definition
   */
  useEffect(() => {
    const loadSchema = async () => {
      if (!schemaId || !selectedProject || !currentUser) return

      setIsLoadingSchema(true)
      setError(null)

      try {
        console.log(`📋 TableDataPage: Loading schema ${schemaId}`)
        const schemaData = await cmsServices.schemaManagement.getSchemaById(
          selectedProject.projectId,
          schemaId,
          currentUser.uid,
          'Super' // TODO: Use actual user role
        )

        if (!schemaData) {
          throw new Error('Schema not found')
        }

        setSchema(schemaData)
        console.log(`✅ TableDataPage: Schema loaded successfully`)
        console.log('🔍 DEBUG - Schema fields:', schemaData.fields)
        console.log('🔍 DEBUG - Schema field names:', schemaData.fields.map(f => f.name))
      } catch (err: any) {
        console.error('❌ TableDataPage: Failed to load schema', err)
        setError(err.message || 'Failed to load schema')
      } finally {
        setIsLoadingSchema(false)
      }
    }

    loadSchema()
  }, [schemaId, selectedProject, currentUser, cmsServices])

  /**
   * Load table records
   */
  const loadRecords = async () => {
    if (!schema || !selectedProject || !currentUser) return

    setIsLoadingRecords(true)

    try {
      console.log(`📊 TableDataPage: Loading records for schema ${schema.id}`)

      // Fetch actual records from Firestore using content management use case
      const entries = await cmsServices.contentManagement.getContentEntries(
        selectedProject.projectId,
        schema.id,
        { limit: 1000 }, // options
        currentUser.uid,
        'Super' // TODO: Use actual user role
      )

      // DEBUG: Log what entries look like
      console.log('🔍 DEBUG - Raw entries from use case:', entries)
      if (entries.length > 0) {
        console.log('🔍 DEBUG - First entry from use case:', entries[0])
        console.log('🔍 DEBUG - First entry.data from use case:', (entries[0] as any).data)
      }

      // Transform ContentListDTO to TableRecord format
      const tableRecords: TableRecord[] = entries.map((entry) => ({
        ...entry,
        id: entry.id,
      }))

      setRecords(tableRecords)
      setFilteredRecords(tableRecords)
      console.log(`✅ TableDataPage: Loaded ${tableRecords.length} records`)

      // DEBUG: Log first record structure
      if (tableRecords.length > 0) {
        console.log('🔍 DEBUG - First record:', tableRecords[0])
        console.log('🔍 DEBUG - First record.data:', tableRecords[0].data)
        console.log('🔍 DEBUG - First record.data keys:', Object.keys(tableRecords[0].data || {}))
      }
    } catch (err: any) {
      console.error('❌ TableDataPage: Failed to load records', err)
      setError(err.message || 'Failed to load records')
    } finally {
      setIsLoadingRecords(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [schema, selectedProject, currentUser])

  /**
   * Apply filters to records
   */
  useEffect(() => {
    let filtered = [...records]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((record) => {
        return Object.values(record).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      })
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter((record) => record.createdBy === userFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const cutoffDate = new Date()

      switch (dateFilter) {
        case '24h':
          cutoffDate.setHours(now.getHours() - 24)
          break
        case '7d':
          cutoffDate.setDate(now.getDate() - 7)
          break
        case '30d':
          cutoffDate.setDate(now.getDate() - 30)
          break
      }

      filtered = filtered.filter((record) => {
        const recordDate = record.createdAt ? new Date(record.createdAt) : null
        return recordDate && recordDate >= cutoffDate
      })
    }

    setFilteredRecords(filtered)
  }, [records, searchQuery, userFilter, dateFilter])

  /**
   * Handle create new record
   */
  const handleCreateRecord = () => {
    setIsCreateDialogOpen(true)
  }

  /**
   * Handle record created
   */
  const handleRecordCreated = async (recordId: string) => {
    console.log(`✅ Record created with ID: ${recordId}`)
    // Reload records to show the new one
    await loadRecords()
  }

  /**
   * Handle edit record
   */
  const handleEditRecord = async (recordId: string) => {
    if (!selectedProject || !schema || !currentUser) return

    try {
      // Fetch the full record data
      const entry = await cmsServices.contentManagement.getContentEntryById(
        selectedProject.projectId,
        schema.id,
        recordId,
        currentUser.uid,
        'Super' // TODO: Use actual user role
      )

      if (entry) {
        setSelectedRecord(entry.entry)
        setIsEditDialogOpen(true)
      }
    } catch (err: any) {
      console.error('Failed to load record for editing:', err)
      alert('Failed to load record: ' + err.message)
    }
  }

  /**
   * Handle record updated
   */
  const handleRecordUpdated = async (recordId: string) => {
    console.log(`✅ Record updated with ID: ${recordId}`)
    // Reload records to show the updates
    await loadRecords()
  }

  /**
   * Handle delete record
   */
  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    if (!selectedProject || !schema || !currentUser) return

    try {
      await cmsServices.contentManagement.deleteContentEntry(
        selectedProject.projectId,
        schema.id,
        recordId,
        currentUser.uid,
        'Super' // TODO: Use actual user role
      )

      console.log(`✅ Record deleted: ${recordId}`)
      // Remove from local state
      setRecords(records.filter((r) => r.id !== recordId))
    } catch (err: any) {
      console.error('Failed to delete record:', err)
      alert('Failed to delete record: ' + err.message)
    }
  }

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchQuery('')
    setUserFilter('all')
    setDateFilter('all')
  }

  /**
   * Render field value based on field type
   */
  const renderFieldValue = (field: any, value: any) => {
    if (value === undefined || value === null) return '-'

    switch (field.type) {
      case 'photo':
      case 'media':
        // Single image - MediaThumbnail component will fetch the URL
        if (typeof value === 'string') {
          return <MediaThumbnail mediaId={value} />
        }
        return '-'

      case 'multiplePhotos':
      case 'multipleMedia':
        // Multiple images - show first with count
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div className="flex items-center gap-2">
              <MediaThumbnail mediaId={value[0]} />
              {value.length > 1 && (
                <span className="text-xs text-gray-500">+{value.length - 1}</span>
              )}
            </div>
          )
        }
        return '-'

      case 'video':
        // Single video - show play icon
        if (typeof value === 'string') {
          return (
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
              </div>
            </div>
          )
        }
        return '-'

      case 'multipleVideos':
        // Multiple videos - show count
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
              </div>
              <span className="text-xs text-gray-500">{value.length} videos</span>
            </div>
          )
        }
        return '-'

      case 'svg':
        // SVG - show small preview
        if (typeof value === 'string' && value.trim()) {
          return (
            <div className="w-12 h-12 flex items-center justify-center border border-gray-200 rounded bg-white overflow-hidden">
              <div
                dangerouslySetInnerHTML={{ __html: value }}
                className="w-10 h-10"
              />
            </div>
          )
        }
        return '-'

      case 'boolean':
        return value ? '✓' : '✗'

      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-'

      case 'datetime':
        return value ? new Date(value).toLocaleString() : '-'

      default:
        // For text, number, etc.
        return String(value).length > 50 ? String(value).substring(0, 50) + '...' : String(value)
    }
  }

  /**
   * Loading state
   */
  if (isLoadingSchema) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  /**
   * Error state
   */
  if (error || !schema) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Failed to load table</h3>
                  <p className="text-sm text-red-700 mt-1">{error || 'Schema not found'}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="mt-3"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  /**
   * Main UI
   */
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#20B2AA] to-[#1a9488]">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                  {schema.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {schema.description || 'No description'} • {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <Button
              onClick={handleCreateRecord}
              className="bg-gradient-to-r from-[#20B2AA] to-[#1a9488] hover:from-[#1a9488] hover:to-[#148078] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Record
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search all fields..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* User Filter */}
                <div>
                  <Label htmlFor="user-filter">Filter by User</Label>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger id="user-filter">
                      <User className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value={currentUser?.uid || ''}>My Records</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter */}
                <div>
                  <Label htmlFor="date-filter">Filter by Date</Label>
                  <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
                    <SelectTrigger id="date-filter">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters */}
              {(searchQuery || userFilter !== 'all' || dateFilter !== 'all') && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary">
                      Search: {searchQuery}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => setSearchQuery('')}
                      />
                    </Badge>
                  )}
                  {userFilter !== 'all' && (
                    <Badge variant="secondary">
                      User: {userFilter === currentUser?.uid ? 'Me' : userFilter}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => setUserFilter('all')}
                      />
                    </Badge>
                  )}
                  {dateFilter !== 'all' && (
                    <Badge variant="secondary">
                      Date: {dateFilter}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => setDateFilter('all')}
                      />
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Records</CardTitle>
            <CardDescription>
              Showing {filteredRecords.length} of {records.length} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRecords ? (
              <div className="text-center py-12">
                <div className="text-sm text-gray-500">Loading records...</div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Records Found
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {records.length === 0
                    ? 'Create your first record to get started'
                    : 'Try adjusting your filters'}
                </p>
                <Button onClick={handleCreateRecord} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Record
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {schema.fields.map((field) => (
                        <TableHead key={field.name}>{field.label}</TableHead>
                      ))}
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        {schema.fields.map((field) => {
                          const fieldValue = record.data?.[field.name]
                          console.log(`🔍 DEBUG - Field "${field.name}" (${field.label}):`, fieldValue, '| record.data:', record.data)
                          return (
                            <TableCell key={field.name}>
                              {renderFieldValue(field, fieldValue)}
                            </TableCell>
                          )
                        })}
                        <TableCell>
                          {record.createdAt
                            ? new Date(record.createdAt).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRecord(record.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Record Dialog */}
      {schema && (
        <RecordCreateDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          schema={schema}
          onRecordCreated={handleRecordCreated}
        />
      )}

      {/* Edit Record Dialog */}
      {schema && selectedRecord && (
        <RecordEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          schema={schema}
          record={selectedRecord}
          onRecordUpdated={handleRecordUpdated}
        />
      )}
    </div>
  )
}
