/**
 * Project Audit Logs Page
 *
 * Displays audit logs for all operations within a project.
 * Accessible by both Admin and Super users.
 *
 * **Access Control:**
 * - Admin: View audit logs for assigned projects (excluding Super user actions)
 * - Super: View all audit logs for all projects
 *
 * **Features:**
 * - View all audit entries for the project
 * - Filter by user, action type, time range
 * - Time range presets (30m, 1h, 24h, 7d, 30d)
 * - Real-time data from Firestore
 * - Empty state when no logs exist
 *
 * @route /app/projects/:projectId/audit-logs
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { useCMSServices } from '@/presentation/hooks/useCMSServices'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import { Badge } from '@/presentation/components/ui/badge'
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
  History,
  ArrowLeft,
  AlertCircle,
  User,
  Clock,
  Database,
  Edit,
  Plus,
  Trash2,
  CheckCircle,
  LogIn,
  LogOut,
  Filter,
  X,
} from 'lucide-react'
import type { AuditLog, AuditAction } from '@/domain/entities/AuditLog'

type TimeRange = '30m' | '1h' | '24h' | '7d' | '30d' | 'all'

export function ProjectAuditLogsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { currentUser, userRole } = useAuth()
  const { selectedProject } = useProject()
  const cmsServices = useCMSServices()

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('24h')
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; email: string }>>([])

  /**
   * Fetch audit logs for the project
   */
  useEffect(() => {
    const fetchAuditLogs = async () => {
      if (!projectId || !currentUser) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('📜 ProjectAuditLogsPage: Fetching audit logs for project', projectId)

        // Build filters
        const filters: any = {
          projectId,
          limit: 100,
        }

        // Add time range filter
        if (selectedTimeRange !== 'all') {
          filters.timeRange = selectedTimeRange
        }

        // Add user filter
        if (selectedUser !== 'all') {
          filters.userId = selectedUser
        }

        // Add action filter
        if (selectedAction !== 'all') {
          filters.action = selectedAction as AuditAction
        }

        // Fetch logs using the audit logging use case
        const logs = await cmsServices.auditLogging.getProjectAuditLogs(
          projectId!,
          currentUser.uid,
          userRole || 'User',
          filters
        )

        setAuditLogs(logs)

        // Extract unique users from logs
        const users = Array.from(
          new Map(
            logs.map((log) => [
              log.userId,
              {
                id: log.userId,
                name: log.userName || log.userEmail,
                email: log.userEmail,
              },
            ])
          ).values()
        )
        setAvailableUsers(users)

        console.log(`✅ ProjectAuditLogsPage: Loaded ${logs.length} audit entries`)
      } catch (err: any) {
        console.error('❌ ProjectAuditLogsPage: Failed to fetch audit logs', err)
        setError(err.message || 'Failed to load audit logs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuditLogs()
  }, [projectId, currentUser, userRole, selectedUser, selectedAction, selectedTimeRange, cmsServices])

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSelectedUser('all')
    setSelectedAction('all')
    setSelectedTimeRange('24h')
  }

  /**
   * Get action badge
   */
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <Plus className="h-3 w-3 mr-1" />
            Created
          </Badge>
        )
      case 'update':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Edit className="h-3 w-3 mr-1" />
            Updated
          </Badge>
        )
      case 'delete':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <Trash2 className="h-3 w-3 mr-1" />
            Deleted
          </Badge>
        )
      case 'login':
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
            <LogIn className="h-3 w-3 mr-1" />
            Login
          </Badge>
        )
      case 'logout':
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            <LogOut className="h-3 w-3 mr-1" />
            Logout
          </Badge>
        )
      case 'role_change':
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            <User className="h-3 w-3 mr-1" />
            Role Change
          </Badge>
        )
      case 'project_assign':
        return (
          <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400">
            <Plus className="h-3 w-3 mr-1" />
            Assigned
          </Badge>
        )
      case 'project_unassign':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <Trash2 className="h-3 w-3 mr-1" />
            Unassigned
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <CheckCircle className="h-3 w-3 mr-1" />
            {action}
          </Badge>
        )
    }
  }

  /**
   * Format timestamp
   */
  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * Get time range label
   */
  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case '30m':
        return 'Last 30 minutes'
      case '1h':
        return 'Last hour'
      case '24h':
        return 'Last 24 hours'
      case '7d':
        return 'Last 7 days'
      case '30d':
        return 'Last 30 days'
      case 'all':
        return 'All time'
      default:
        return range
    }
  }

  /**
   * Loading state
   */
  if (isLoading) {
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
  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          <Button variant="ghost" onClick={() => navigate('/app/dashboard')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Failed to load audit logs</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  /**
   * No project selected state
   */
  if (!selectedProject || !projectId) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          <Button variant="ghost" onClick={() => navigate('/app/dashboard')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <History className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Project Selected</h3>
                <p className="text-sm text-slate-600">Please select a project to view its audit logs</p>
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
        <div className="mb-6 sm:mb-8">
          <Button variant="ghost" onClick={() => navigate('/app/dashboard')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                  Audit Logs
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {selectedProject.name} • {auditLogs.length} audit entr{auditLogs.length !== 1 ? 'ies' : 'y'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-blue-600" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Time Range Filter */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Time Range
                </label>
                <Select value={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as TimeRange)}>
                  <SelectTrigger>
                    <SelectValue>{getTimeRangeLabel(selectedTimeRange)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30m">Last 30 minutes</SelectItem>
                    <SelectItem value="1h">Last hour</SelectItem>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Filter */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  User
                </label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue>
                      {selectedUser === 'all' ? 'All Users' : availableUsers.find(u => u.id === selectedUser)?.name || 'Select User'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Filter */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Action
                </label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue>{selectedAction === 'all' ? 'All Actions' : selectedAction}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="role_change">Role Change</SelectItem>
                    <SelectItem value="project_assign">Project Assign</SelectItem>
                    <SelectItem value="project_unassign">Project Unassign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Audit Trail
            </CardTitle>
            <CardDescription>
              Complete history of all changes made in this project
              {userRole === 'Admin' && ' (Super user actions are hidden)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No Audit Logs
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedUser !== 'all' || selectedAction !== 'all' || selectedTimeRange !== '24h'
                    ? 'No audit entries match your filters. Try adjusting the filters.'
                    : 'No audit entries have been recorded for this project yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead className="hidden md:table-cell">User</TableHead>
                      <TableHead className="hidden lg:table-cell">Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{log.resourceType}</div>
                              {log.resourceName && (
                                <div className="text-xs text-slate-500 truncate">{log.resourceName}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{log.userName || log.userEmail}</div>
                              <Badge
                                variant="outline"
                                className={
                                  log.userRole === 'Super'
                                    ? 'text-purple-600 border-purple-200'
                                    : log.userRole === 'Admin'
                                    ? 'text-blue-600 border-blue-200'
                                    : 'text-slate-600 border-slate-200'
                                }
                              >
                                {log.userRole}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {log.changes && (
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              {Object.entries(log.changes).map(([key, value]) => (
                                <div key={key} className="truncate">
                                  <span className="font-medium">{key}:</span>{' '}
                                  {JSON.stringify(value.from)} → {JSON.stringify(value.to)}
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <span className="text-sm whitespace-nowrap">{formatTimestamp(log.timestamp)}</span>
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

        {/* Info Notice */}
        <div className="mt-6">
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Audit Logging</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                All create, update, and delete operations are automatically logged with user information and timestamps.
                {userRole === 'Admin' &&
                  ' As an Admin, you can only see logs for operations in projects you have access to, and Super user actions are hidden for security.'}
                {userRole === 'Super' && ' As a Super user, you can see all audit logs across all projects.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
