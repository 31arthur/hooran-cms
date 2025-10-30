/**
 * Audit Log Page Component
 *
 * Displays audit history for a specific content entry.
 * Shows all CREATE, UPDATE, and DELETE operations with timestamps,
 * user information, and change details.
 *
 * **Route:** `/app/audit/:collectionId/:contentId`
 * **Access:** Only available to 'Admin' and 'Super' roles
 * **Scoping:** All data is scoped to the currently selected project
 *
 * **Data Flow:**
 * 1. Extract collectionId and contentId from route parameters
 * 2. Get projectId from useProject context
 * 3. Fetch audit logs from AuditService
 * 4. Display logs in chronological order (newest first)
 *
 * @example
 * ```tsx
 * // In Router.tsx
 * <Route path="audit/:collectionId/:contentId" element={<AuditLogPage />} />
 * ```
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { AuditService } from '@/services'
import type { AuditLogEntry } from '@/domain/entities'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import {
  AlertCircle,
  Loader2,
  ArrowLeft,
  History,
  Clock,
  User as UserIcon,
  FileEdit,
  FileText,
  Trash2,
  Plus,
  CheckCircle,
  Database,
} from 'lucide-react'

/**
 * Route parameters interface
 */
interface AuditLogParams {
  collectionId: string
  contentId: string
}

/**
 * Audit Log Page Component
 *
 * Displays a comprehensive audit trail for a content entry.
 */
export function AuditLogPage() {
  // Route parameters
  const { collectionId, contentId } = useParams<keyof AuditLogParams>()
  const navigate = useNavigate()

  // Context hooks
  const { currentUser, userRole, hasCMSAccess } = useAuth()
  const { selectedProject, isLoading: projectsLoading } = useProject()

  // State management
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch audit logs for the content entry
   */
  useEffect(() => {
    if (!selectedProject || !contentId) {
      return
    }

    const fetchAuditLogs = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log('📋 AuditLogPage: Fetching audit logs', {
          projectId: selectedProject.projectId,
          contentId,
        })

        const logs = await AuditService.getResourceAuditTrail(
          selectedProject.projectId,
          'CONTENT',
          contentId
        )

        setAuditLogs(logs)
        console.log(`✅ AuditLogPage: Loaded ${logs.length} audit log entries`)
      } catch (err) {
        console.error('❌ AuditLogPage: Failed to fetch audit logs', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch audit logs')
        setAuditLogs([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuditLogs()
  }, [selectedProject, contentId])

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    if (collectionId) {
      navigate(`/app/content/${collectionId}/${contentId}`)
    } else {
      navigate(-1)
    }
  }

  /**
   * Get icon for action type
   */
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Plus className="h-4 w-4" />
      case 'UPDATE':
        return <FileEdit className="h-4 w-4" />
      case 'DELETE':
        return <Trash2 className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  /**
   * Get badge color for action type
   */
  const getActionBadgeClass = (action: string): string => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'DELETE':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  /**
   * Format details object for display
   */
  const formatDetails = (details: Record<string, any> | undefined): string => {
    if (!details) return 'No details available'

    const parts: string[] = []

    // Show change summary if available
    if (details.change_summary) {
      return details.change_summary
    }

    // Show field changes
    if (details.field_changes && Array.isArray(details.field_changes)) {
      parts.push(`Changed fields: ${details.field_changes.join(', ')}`)
    }

    // Show status change
    if (details.new_status) {
      parts.push(`Status: ${details.old_status || 'unknown'} → ${details.new_status}`)
    }

    // Show collection info
    if (details.collectionId) {
      parts.push(`Collection: ${details.collectionId}`)
    }

    return parts.length > 0 ? parts.join(' • ') : 'No details available'
  }

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'Unknown'

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch (e) {
      return 'Invalid date'
    }
  }

  /**
   * Format user ID for display
   */
  const formatUserId = (userId: string): string => {
    if (!userId) return 'Unknown'
    // Show first 8 characters of user ID
    return userId.length > 12 ? `${userId.substring(0, 12)}...` : userId
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
              You do not have permission to view audit logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Only users with 'Admin' or 'Super' roles can view audit logs.
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
  if (projectsLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 text-[#20B2AA] animate-spin" />
                <CardTitle>Loading Audit Logs...</CardTitle>
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
            <CardDescription>Please select a project to view audit logs.</CardDescription>
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
            Back
          </Button>
          <Alert className="border-red-500 bg-red-50 max-w-2xl">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-700">Error Loading Audit Logs</AlertTitle>
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  /**
   * Main Audit Log View
   */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <History className="h-8 w-8 text-[#20B2AA]" />
                Audit History
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Complete change history for this content entry
              </p>
            </div>
          </div>

          {/* Context Information */}
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

        {/* Audit Logs Table */}
        {auditLogs.length === 0 ? (
          <Card className="border-[#20B2AA]/20">
            <CardContent className="pt-6">
              <div className="text-center py-16">
                <div className="relative inline-flex mb-6">
                  <div className="absolute inset-0 bg-[#20B2AA]/10 rounded-full blur-xl"></div>
                  <History className="relative h-20 w-20 text-[#20B2AA] mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Audit Logs Found</h3>
                <p className="text-base text-gray-600 mb-2 max-w-md mx-auto">
                  There are no audit log entries for this content item yet.
                </p>
                <p className="text-sm text-gray-500">
                  Audit logs will appear here when changes are made to this content.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-[#20B2AA]/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <History className="h-5 w-5 text-[#20B2AA]" />
                    Audit Trail ({auditLogs.length} entries)
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Showing all changes made to this content entry
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 text-[#20B2AA]" />
                  <span>Scoped to project</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold w-[180px]">Timestamp</TableHead>
                      <TableHead className="font-semibold w-[120px]">Action</TableHead>
                      <TableHead className="font-semibold w-[150px]">User</TableHead>
                      <TableHead className="font-semibold">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-mono text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getActionBadgeClass(
                              log.action
                            )}`}
                          >
                            {getActionIcon(log.action)}
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-600">
                          <div className="flex items-center gap-2" title={log.userId}>
                            <UserIcon className="h-3 w-3 text-gray-400" />
                            {formatUserId(log.userId)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          <div className="max-w-xl">
                            {formatDetails(log.details)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary Footer */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <p>
                  Total entries:{' '}
                  <span className="font-semibold text-gray-700">{auditLogs.length}</span>
                </p>
                <p className="text-xs">
                  <span className="text-[#20B2AA] font-semibold">Note:</span> Audit logs are
                  retained for compliance and security purposes
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
