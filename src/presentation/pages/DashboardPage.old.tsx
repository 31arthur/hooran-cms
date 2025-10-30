/**
 * Dashboard Page Component
 *
 * Main CMS home view after authentication.
 * Inspired by Strapi CMS Dashboard UI with Hooran's Seafoam Green theme.
 *
 * **Layout Structure:**
 * 1. Welcome Banner - Dynamic greeting with user name
 * 2. Information Widgets - Grid of data cards (2 columns on desktop)
 * 3. Quick Links/Help - Sidebar with documentation and support links
 *
 * **Multi-Tenancy:**
 * - Uses `useProject` hook to display selected project context
 * - All operations are scoped to the selected project
 *
 * **Role-Based Content:**
 * - Content differs between Admin and Super roles (see placeholders)
 * - Super admins have access to all projects
 * - Admins have access to assigned projects only
 *
 * @route /app/dashboard
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { toast } from 'sonner'
import { useDashboardData } from '@/presentation/hooks/useCMSServices'
import type { PublicationStatusDTO, AuditSummaryDTO } from '@/domain/dtos'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Bug,
  CheckCircle,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  Plus,
  FolderKanban,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Loader2,
  ScrollText,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  Waves,
} from 'lucide-react'

export function DashboardPage() {
  const { currentUser, userRole, userData } = useAuth()
  const { selectedProject, projectsList, isLoading: projectsLoading } = useProject()
  const navigate = useNavigate()
  const dashboardData = useDashboardData()

  // Publication statistics state (Admin only)
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatusDTO | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false)

  // System health state (Super only)
  const [criticalLogs, setCriticalLogs] = useState<AuditSummaryDTO[]>([])
  const [isLoadingCriticalLogs, setIsLoadingCriticalLogs] = useState<boolean>(false)

  // Extract display name from user data or email
  const displayName = userData?.display_name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'

  /**
   * Fetch publication statistics for Admin role
   * Uses DashboardDataUseCase for business logic
   */
  useEffect(() => {
    const fetchPublicationStats = async () => {
      // Only fetch for Admin role with selected project
      if (userRole !== 'Admin' || !selectedProject) {
        return
      }

      setIsLoadingStats(true)
      try {
        console.log('📊 DashboardPage: Fetching publication statistics', {
          projectId: selectedProject.projectId,
          projectName: selectedProject.name,
        })

        const stats = await dashboardData.getPublicationStatusSummary(
          selectedProject.projectId,
          false // No collection breakdown for now
        )

        setPublicationStatus(stats)

        console.log(`✅ DashboardPage: Publication stats loaded - Total: ${stats.total}, Published: ${stats.published}`)
      } catch (error) {
        console.error('❌ DashboardPage: Failed to fetch publication stats', error)
        setPublicationStatus(null)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchPublicationStats()
  }, [selectedProject, userRole, dashboardData])

  /**
   * Fetch critical audit logs for Super role
   * Uses DashboardDataUseCase for business logic
   */
  useEffect(() => {
    const fetchCriticalLogs = async () => {
      // Only fetch for Super role
      if (userRole !== 'Super') {
        return
      }

      setIsLoadingCriticalLogs(true)
      try {
        console.log('🚨 DashboardPage: Fetching critical audit logs for system health')

        // Fetch 3 most recent critical logs across all projects
        // Use a placeholder projectId since this is system-wide for Super users
        const logs = await dashboardData.getRecentCriticalLogs('system', 3, 24)

        setCriticalLogs(logs)

        console.log(`✅ DashboardPage: Loaded ${logs.length} critical audit logs`)
      } catch (error) {
        console.error('❌ DashboardPage: Failed to fetch critical logs', error)
        setCriticalLogs([])
      } finally {
        setIsLoadingCriticalLogs(false)
      }
    }

    fetchCriticalLogs()
  }, [userRole, dashboardData])

  // Mock data for Admin Dashboard (project-scoped)
  // In production, this would be fetched from Firestore filtered by selectedProject.projectId
  const mockRecentContent = selectedProject
    ? [
        {
          id: '1',
          title: 'Getting Started with Hooran CMS',
          collection: 'Articles',
          lastUpdated: '2025-01-27T10:30:00',
          projectId: selectedProject.projectId,
          status: 'Published',
        },
        {
          id: '2',
          title: 'Product Launch Announcement',
          collection: 'Blog Posts',
          lastUpdated: '2025-01-27T09:15:00',
          projectId: selectedProject.projectId,
          status: 'Published',
        },
        {
          id: '3',
          title: 'About Our Team',
          collection: 'Pages',
          lastUpdated: '2025-01-26T16:45:00',
          projectId: selectedProject.projectId,
          status: 'Draft',
        },
        {
          id: '4',
          title: 'Q1 2025 Roadmap',
          collection: 'Articles',
          lastUpdated: '2025-01-26T14:20:00',
          projectId: selectedProject.projectId,
          status: 'Review',
        },
        {
          id: '5',
          title: 'Privacy Policy Update',
          collection: 'Legal',
          lastUpdated: '2025-01-25T11:00:00',
          projectId: selectedProject.projectId,
          status: 'Published',
        },
      ]
    : []

  const mockDraftsCount = 42 // Mock draft count for selected project
  const mockCollectionsCount = 6 // Mock collections count for selected project

  // Mock data for Super Admin Dashboard (system-wide)
  // In production, this would be fetched from Firestore with system-level queries
  const mockTotalProjects = 14 // Total active projects in the system
  const mockNewAdminsThisMonth = 3 // New admins assigned this month
  const mockAuditLogsToday = 1200 // Audit log entries today

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
        {/* Welcome Banner / Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[#20B2AA] to-[#1a9088] shadow-lg shadow-[#20B2AA]/20">
              <Waves className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                Welcome back, {displayName}!
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Main Layout Grid: Content Area + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area (Information Widgets) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Project Context Card - PROMINENT */}
            <Card className="border-[#20B2AA]/20 bg-gradient-to-br from-white to-[#20B2AA]/5 dark:from-slate-800 dark:to-[#20B2AA]/10 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#20B2AA]/10">
                    <FolderKanban className="w-5 h-5 text-[#20B2AA]" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">Project Context</CardTitle>
                    <CardDescription>Currently active project scope</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#20B2AA]"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Loading project...
                    </span>
                  </div>
                ) : selectedProject ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-2xl font-bold text-[#20B2AA] mb-1">
                        {selectedProject.name}
                      </div>
                      {selectedProject.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedProject.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-xs">
                        <span className="text-slate-500 dark:text-slate-500">Project ID:</span>
                        <span className="ml-2 font-mono text-slate-700 dark:text-slate-300">
                          {selectedProject.projectId}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500 dark:text-slate-500">Status:</span>
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {selectedProject.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderKanban className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      No project selected
                    </p>
                    <Button size="sm" className="bg-[#20B2AA] hover:bg-[#1a9088]">
                      Select Project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Information Widgets Grid - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Role Widget */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-base">Your Role</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {userRole || 'Loading...'}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Access Level
                  </p>
                </CardContent>
              </Card>

              {/* Total Projects Widget */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <LayoutDashboard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-base">Projects</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {projectsLoading ? '...' : projectsList.length}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {userRole === 'Super' ? 'All Projects' : 'Assigned Projects'}
                  </p>
                </CardContent>
              </Card>

              {/* Content Items Widget */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#20B2AA]/10">
                      <FileText className="w-4 h-4 text-[#20B2AA]" />
                    </div>
                    <CardTitle className="text-base">Content Items</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">0</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    In this project
                  </p>
                </CardContent>
              </Card>

              {/* Analytics Widget */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <BarChart3 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle className="text-base">Activity</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">0</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Updates today
                  </p>
                </CardContent>
              </Card>
            </div>

            {/*
              ROLE-BASED CONTENT SECTION

              TODO (Prompt 16 & 17): Implement role-specific content
              - Admin users: See limited analytics, project-specific actions
              - Super users: See system-wide analytics, all projects management

              Placeholder for future role-specific widgets:
            */}
            {/* Super Admin-Specific System Widgets */}
            {userRole === 'Super' && (
              <div className="space-y-6">
                {/* System Overview Stats - 3 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Widget 1: Global Projects Count */}
                  <Card className="border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                          <FolderKanban className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <CardTitle className="text-base">Active Projects</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                        {mockTotalProjects}
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-500">
                        Total projects in system
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full text-xs border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/30"
                      >
                        <FolderKanban className="w-3 h-3 mr-2" />
                        View All Projects
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Widget 2: New Users/Admins */}
                  <Card className="border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                          <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-base">New Admins</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {mockNewAdminsThisMonth}
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-500">
                        Assigned this month
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full text-xs border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-900/30"
                      >
                        <Users className="w-3 h-3 mr-2" />
                        Manage Users
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Widget 3: Auditing Activity Summary */}
                  <Card className="border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                          <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <CardTitle className="text-base">Audit Logs</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        {mockAuditLogsToday.toLocaleString()}
                      </div>
                      <p className="text-sm text-purple-700 dark:text-purple-500">
                        Entries logged today
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full text-xs border-purple-300 hover:bg-purple-100 dark:border-purple-800 dark:hover:bg-purple-900/30"
                      >
                        <ScrollText className="w-3 h-3 mr-2" />
                        View Audit Logs
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* System Health Overview Widget */}
                <Card className="border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/50">
                          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">System Health Overview</CardTitle>
                          <CardDescription>
                            Recent critical events and system-wide issues
                          </CardDescription>
                        </div>
                      </div>
                      {!isLoadingCriticalLogs && criticalLogs.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30">
                          <div className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400 animate-pulse"></div>
                          <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                            {criticalLogs.length} Critical
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingCriticalLogs ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-red-600 dark:text-red-400 animate-spin mx-auto mb-3" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Scanning for critical events...
                        </p>
                      </div>
                    ) : criticalLogs.length > 0 ? (
                      <div className="space-y-3">
                        {criticalLogs.map((log, index) => (
                          <div
                            key={`${log.timestamp.getTime()}-${index}`}
                            className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800 transition-colors"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex-shrink-0">
                              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                  {log.action}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-500">
                                  {log.resourceType}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {log.summary}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {log.timestamp.toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {log.userId && (
                                  <span className="ml-2">
                                    • User: {log.userId}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-red-200 dark:border-red-900/50">
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Showing <strong>3 most recent</strong> critical events across all projects.
                            Critical events include deletions, errors, and failed operations.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-3">
                          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                          All Systems Healthy
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          No critical events detected in recent activity
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* System Health & Quick Actions */}
                <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">System Administration</CardTitle>
                          <CardDescription>
                            Global management and oversight tools
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                        <Users className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                        <span className="text-sm font-medium">Manage Users</span>
                        <span className="text-xs text-muted-foreground">User & role management</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                        <FolderKanban className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                        <span className="text-sm font-medium">Manage Projects</span>
                        <span className="text-xs text-muted-foreground">All projects access</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                        <Settings className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                        <span className="text-sm font-medium">System Settings</span>
                        <span className="text-xs text-muted-foreground">Global configuration</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Super Admin Privilege Notice */}
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                    <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      ⚠️ Super Administrator Access
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      You have full system-level privileges. All projects, users, and system settings are accessible.
                      Use with caution.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Admin-Specific Content Widgets */}
            {userRole === 'Admin' && selectedProject && (
              <div className="space-y-6">
                {/* Content Overview Stats - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Widget 2: Content Drafts Count */}
                  <Card className="border-[#20B2AA]/20 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <CardTitle className="text-base">Drafts Pending</CardTitle>
                        </div>
                        <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                          {mockDraftsCount}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Pending drafts in{' '}
                        <span className="font-semibold text-[#20B2AA]">
                          {selectedProject.name}
                        </span>
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full text-xs"
                      >
                        Review Drafts
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Widget 3: Content Types Overview */}
                  <Card className="border-[#20B2AA]/20 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#20B2AA]/10">
                            <Layers className="w-4 h-4 text-[#20B2AA]" />
                          </div>
                          <CardTitle className="text-base">Collections</CardTitle>
                        </div>
                        <div className="text-3xl font-bold text-[#20B2AA]">
                          {mockCollectionsCount}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Content types available in this project
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full text-xs"
                      >
                        Manage Collections
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Publication Status Widget */}
                <Card className="border-green-200 dark:border-green-900/50 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Publication Status</CardTitle>
                        <CardDescription className="text-xs">
                          Content publication overview
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingStats ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 dark:border-green-400 mx-auto mb-3"></div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Calculating statistics...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          {/* Total Entries */}
                          <div className="text-center p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                              {publicationStatus?.total || 0}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                              Total Entries
                            </div>
                          </div>

                          {/* Published Entries */}
                          <div className="text-center p-3 rounded-lg bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                              {publicationStatus?.published || 0}
                            </div>
                            <div className="text-xs text-green-700 dark:text-green-500 font-medium">
                              Published
                            </div>
                          </div>

                          {/* Drafts/Unpublished */}
                          <div className="text-center p-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800">
                            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                              {publicationStatus?.draft || 0}
                            </div>
                            <div className="text-xs text-amber-700 dark:text-amber-500 font-medium">
                              Unpublished
                            </div>
                          </div>
                        </div>

                        {/* Publication Rate Indicator */}
                        {publicationStatus && publicationStatus.total > 0 && (
                          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                Publication Rate
                              </span>
                              <span className="text-xs font-bold text-green-700 dark:text-green-400">
                                {publicationStatus.publishedPercentage}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, publicationStatus.publishedPercentage)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Project Context */}
                        <div className="pt-3 border-t border-green-200 dark:border-green-800">
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-semibold">Project-scoped statistics for:</span>
                            <br />
                            <span className="font-bold text-[#20B2AA]">
                              {selectedProject.name}
                            </span>
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Widget 1: Recently Updated Content Table */}
                <Card className="border-blue-200 dark:border-blue-900/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          Recently Updated Content
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Latest 5 content entries in {selectedProject.name}
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {mockRecentContent.length > 0 ? (
                      <div className="rounded-md border border-slate-200 dark:border-slate-800">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                              <TableHead className="font-semibold">Title</TableHead>
                              <TableHead className="font-semibold">Collection</TableHead>
                              <TableHead className="font-semibold">Status</TableHead>
                              <TableHead className="font-semibold text-right">
                                Last Updated
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockRecentContent.map((item) => (
                              <TableRow
                                key={item.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-900/30 cursor-pointer"
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    {item.title}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {item.collection}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      item.status === 'Published'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : item.status === 'Draft'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right text-sm text-slate-600 dark:text-slate-400">
                                  {formatRelativeTime(item.lastUpdated)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No recent content updates</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Admin Info Notice */}
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Project-Scoped Content Management
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                      All data shown is filtered by your currently selected project:{' '}
                      <span className="font-semibold">{selectedProject.name}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Show message if Admin but no project selected */}
            {userRole === 'Admin' && !selectedProject && (
              <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FolderKanban className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      No Project Selected
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Please select a project to view content management widgets
                    </p>
                    <Button className="bg-[#20B2AA] hover:bg-[#1a9088]">
                      Select Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Links / Help Section (Sidebar) */}
            {/* Quick Actions Card - Role-Based */}
            <Card className="sticky top-6 border-[#20B2AA]/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#20B2AA]" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-xs">
                  {userRole === 'Super' ? 'System management actions' : 'Content management actions'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Admin-Specific Actions */}
                {userRole === 'Admin' && selectedProject && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-[#20B2AA]/10 hover:border-[#20B2AA]"
                      onClick={() => navigate('/app/schemas')}
                    >
                      <Plus className="mr-2 h-4 w-4 text-[#20B2AA]" />
                      <span>Create New Content</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-amber-50 hover:border-amber-300"
                      onClick={() => {
                        // TODO: Navigate to content list filtered by draft status
                        toast.success('Review Drafts', {
                          description: 'This will filter content by draft status'
                        })
                      }}
                    >
                      <Edit3 className="mr-2 h-4 w-4 text-amber-600" />
                      <span>Review Drafts</span>
                    </Button>
                  </>
                )}

                {/* Super-Specific Actions */}
                {userRole === 'Super' && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-purple-50 hover:border-purple-300"
                      onClick={() => navigate('/app/projects/new')}
                    >
                      <FolderKanban className="mr-2 h-4 w-4 text-purple-600" />
                      <span>Create New Project</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => navigate('/app/system-settings')}
                    >
                      <Settings className="mr-2 h-4 w-4 text-blue-600" />
                      <span>Manage System Settings</span>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

          <div className="lg:col-span-1 space-y-4">
            {/* Quick Links Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[#20B2AA]" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Content Manager Button - Prominent for Admin users */}
                {userRole === 'Admin' && selectedProject && (
                  <Button className="w-full bg-gradient-to-r from-[#20B2AA] to-[#1a9088] hover:from-[#1a9088] hover:to-[#158881] text-white shadow-md hover:shadow-lg transition-all">
                    <FileText className="mr-2 h-4 w-4" />
                    Go to Content Manager
                  </Button>
                )}

                {/* Manage Projects & Users Button - Prominent for Super users */}
                {userRole === 'Super' && (
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg transition-all">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Manage Projects & Users
                  </Button>
                )}

                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#20B2AA]/10 group-hover:bg-[#20B2AA]/20 transition-colors">
                    <BookOpen className="w-4 h-4 text-[#20B2AA]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      Documentation
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      User guides & API docs
                    </div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      Help Center
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      FAQs & tutorials
                    </div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                    <Bug className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      Report a Bug
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      Submit feedback
                    </div>
                  </div>
                </button>
              </CardContent>
            </Card>

            {/* Version Info Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#20B2AA] to-[#1a9088]">
                    <Waves className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Hooran CMS
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      Version 0.1.0
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span>All systems operational</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#20B2AA]"></div>
                    <span>Multi-tenancy active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
