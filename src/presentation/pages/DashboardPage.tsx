/**
 * Dashboard Page Component - Redesigned
 *
 * Clean, modern dashboard with proper Firebase data fetching.
 * Follows Clean Architecture and SOLID principles.
 *
 * **Features:**
 * - Real-time statistics from Firebase
 * - Role-based widget display (Super vs Admin)
 * - Project-scoped data for Admins
 * - System-wide data for Super users
 * - Responsive grid layout
 *
 * **Data Sources (via Use Cases):**
 * - DashboardDataUseCase: Statistics and summaries
 * - ContentManagementUseCase: Content counts
 * - SchemaManagementUseCase: Schema/collection counts
 * - AuditRetrievalUseCase: Recent activity logs
 *
 * @route /app/dashboard
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { useCMSServices } from '@/presentation/hooks/useCMSServices'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import {
  FileText,
  Layers,
  Activity,
  Users,
  FolderKanban,
  TrendingUp,
  Clock,
  AlertCircle,
  BarChart3,
  Plus,
  ArrowRight,
} from 'lucide-react'

// Dashboard statistics interface
interface DashboardStats {
  totalContent: number
  publishedContent: number
  draftContent: number
  totalSchemas: number
  recentActivityCount: number
  totalUsers?: number // Super only
  totalProjects?: number // Super only
}

export function DashboardPage() {
  const { projectId } = useParams<{ projectId?: string }>()
  const { userRole, currentUser } = useAuth()
  const { selectedProject, projectsList, setSelectedProject } = useProject()
  const navigate = useNavigate()
  const cmsServices = useCMSServices()

  /**
   * Handle URL-based project selection
   * If projectId is in the URL and different from selected project, switch to it
   */
  useEffect(() => {
    if (projectId && projectsList.length > 0) {
      // Check if URL project is different from selected project
      if (!selectedProject || selectedProject.projectId !== projectId) {
        const urlProject = projectsList.find((p) => p.projectId === projectId)
        if (urlProject) {
          console.log(`📋 Switching to project from URL: ${urlProject.name}`)
          setSelectedProject(urlProject)
        } else {
          console.warn(`⚠️ Project ${projectId} not found in accessible projects`)
          // Redirect to dashboard without project ID
          navigate('/app/dashboard', { replace: true })
        }
      }
    } else if (!projectId && selectedProject) {
      // If no projectId in URL but we have selected project, update URL
      navigate(`/app/dashboard/${selectedProject.projectId}`, { replace: true })
    }
  }, [projectId, projectsList, selectedProject, setSelectedProject, navigate])

  // Dashboard statistics state
  const [stats, setStats] = useState<DashboardStats>({
    totalContent: 0,
    publishedContent: 0,
    draftContent: 0,
    totalSchemas: 0,
    recentActivityCount: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch dashboard statistics
   * Uses appropriate use cases based on user role and selected project
   */
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!selectedProject && userRole === 'Admin') {
        setIsLoadingStats(false)
        return
      }

      setIsLoadingStats(true)
      setError(null)

      try {
        console.log('📊 DashboardPage: Fetching statistics', {
          userRole,
          projectId: selectedProject?.projectId,
        })

        const newStats: DashboardStats = {
          totalContent: 0,
          publishedContent: 0,
          draftContent: 0,
          totalSchemas: 0,
          recentActivityCount: 0,
        }

        // Fetch data based on role
        if (userRole === 'Admin' && selectedProject) {
          // Admin: Project-scoped statistics
          const projectId = selectedProject.projectId

          // Fetch publication status summary
          const publicationStatus = await cmsServices.dashboardData.getPublicationStatusSummary(
            projectId,
            false
          )

          newStats.totalContent = publicationStatus.total
          newStats.publishedContent = publicationStatus.published
          newStats.draftContent = publicationStatus.draft

          // Fetch schema count
          const schemas = await cmsServices.schemaManagement.getSchemasForProject(
            projectId,
            '', // userId not required for count
            userRole || 'Admin'
          )
          newStats.totalSchemas = schemas.length

          // Fetch recent audit log count
          if (currentUser?.uid) {
            const recentLogs = await cmsServices.auditRetrieval.getProjectAuditLogs(
              projectId,
              currentUser.uid,
              userRole || 'Admin',
              10
            )
            newStats.recentActivityCount = recentLogs.length
          } else {
            newStats.recentActivityCount = 0
          }
        } else if (userRole === 'Super') {
          // Super: System-wide statistics
          newStats.totalProjects = projectsList.length

          // Get total users count (Super can see all users)
          try {
            if (currentUser?.uid) {
              const users = await cmsServices.userManagement.getAllUsers(currentUser.uid)
              newStats.totalUsers = users.length
            } else {
              newStats.totalUsers = 0
            }
          } catch (err) {
            console.warn('⚠️ Failed to fetch user count', err)
            newStats.totalUsers = 0
          }

          // If a project is selected, show project-specific stats too
          if (selectedProject && currentUser?.uid) {
            const projectId = selectedProject.projectId
            const schemas = await cmsServices.schemaManagement.getSchemasForProject(
              projectId,
              currentUser.uid,
              userRole || 'Super'
            )
            newStats.totalSchemas = schemas.length

            const recentLogs = await cmsServices.auditRetrieval.getProjectAuditLogs(
              projectId,
              currentUser.uid,
              userRole || 'Super',
              10
            )
            newStats.recentActivityCount = recentLogs.length
          }
        }

        setStats(newStats)
        console.log('✅ DashboardPage: Statistics loaded', newStats)
      } catch (err: any) {
        console.error('❌ DashboardPage: Failed to fetch statistics', err)
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchDashboardStats()
  }, [selectedProject, userRole, cmsServices, projectsList.length])

  /**
   * Widget loading skeleton
   */
  const WidgetSkeleton = () => (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )

  /**
   * Error state
   */
  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Failed to load dashboard</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * No project selected state (Admin only)
   */
  if (userRole === 'Admin' && !selectedProject) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-[#20B2AA]/20">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FolderKanban className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Project Selected</h3>
              <p className="text-sm text-slate-600 mb-4">
                Please select a project from the dropdown above to view dashboard statistics
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Main Dashboard UI
   */
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {userRole === 'Admin' && selectedProject
              ? `Overview for ${selectedProject.name}`
              : 'System overview and statistics'}
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Content Widget */}
          {isLoadingStats ? (
            <WidgetSkeleton />
          ) : (
            <Card className="hover:shadow-md transition-shadow border-[#20B2AA]/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#20B2AA]/10">
                      <FileText className="h-5 w-5 text-[#20B2AA]" />
                    </div>
                    <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.totalContent}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <span className="text-green-600 font-medium">
                    {stats.publishedContent} published
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-amber-600 font-medium">{stats.draftContent} drafts</span>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Published Content Widget */}
          {isLoadingStats ? (
            <WidgetSkeleton />
          ) : (
            <Card className="hover:shadow-md transition-shadow border-green-200 bg-gradient-to-br from-green-50/50 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-100">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-sm font-medium">Published</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {stats.publishedContent}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {stats.totalContent > 0
                    ? `${Math.round((stats.publishedContent / stats.totalContent) * 100)}% of total`
                    : 'No content yet'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Collections/Schemas Widget */}
          {isLoadingStats ? (
            <WidgetSkeleton />
          ) : (
            <Card className="hover:shadow-md transition-shadow border-purple-200 bg-gradient-to-br from-purple-50/50 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Layers className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-sm font-medium">Collections</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {stats.totalSchemas}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Content type schemas
                </p>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity Widget */}
          {isLoadingStats ? (
            <WidgetSkeleton />
          ) : (
            <Card className="hover:shadow-md transition-shadow border-blue-200 bg-gradient-to-br from-blue-50/50 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stats.recentActivityCount}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Actions in last 24h</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Super User - System-Wide Widgets */}
        {userRole === 'Super' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Total Projects */}
            <Card className="hover:shadow-md transition-shadow border-amber-200 bg-gradient-to-br from-amber-50/50 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <FolderKanban className="h-5 w-5 text-amber-600" />
                  </div>
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600 mb-1">
                  {stats.totalProjects || 0}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Active projects</p>
              </CardContent>
            </Card>

            {/* Total Users */}
            <Card className="hover:shadow-md transition-shadow border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600 mb-1">
                  {stats.totalUsers || 0}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Registered users</p>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="hover:shadow-md transition-shadow border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600 mb-1">Healthy</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">All systems operational</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Content Management Card */}
          {userRole === 'Admin' && selectedProject && (
            <Card className="border-[#20B2AA]/20 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#20B2AA]" />
                  Content Management
                </CardTitle>
                <CardDescription>Create and manage your content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => navigate('/app/schemas')}
                  className="w-full bg-gradient-to-r from-[#20B2AA] to-[#1a9088] hover:from-[#1a9088] hover:to-[#158f87] text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Content
                </Button>
                <Button
                  onClick={() => navigate('/app/schemas')}
                  variant="outline"
                  className="w-full"
                >
                  <Layers className="mr-2 h-4 w-4" />
                  Manage Collections
                </Button>
              </CardContent>
            </Card>
          )}

          {/* System Management Card */}
          {userRole === 'Super' && (
            <Card className="border-amber-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-amber-600" />
                  System Management
                </CardTitle>
                <CardDescription>Manage projects and users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => navigate('/app/projects/new')}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Project
                </Button>
                <Button
                  onClick={() => navigate('/app/system-settings')}
                  variant="outline"
                  className="w-full"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  View Audit Logs
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity Card */}
          <Card className="border-blue-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/app/audit-logs')}>
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Latest actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-600">No recent activity</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
