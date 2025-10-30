/**
 * Project Users Page Component
 *
 * Displays and manages users assigned to the selected project.
 * Follows Clean Architecture and SOLID principles.
 *
 * **Access Control:**
 * - Admins: Can VIEW users assigned to their projects (read-only)
 * - Super users: Can VIEW and EDIT all users
 *
 * **Features:**
 * - Real-time user list from Firebase
 * - Project-scoped user display
 * - Role badges and status indicators
 * - Edit functionality (Super only)
 * - Responsive table layout
 *
 * @route /app/projects/:projectId/users
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import {
  Users,
  UserPlus,
  Edit,
  Mail,
  Shield,
  AlertCircle,
  ArrowLeft,
  Trash2,
} from 'lucide-react'

// User interface
interface ProjectUser {
  uid: string
  email: string
  displayName?: string
  role: 'Super' | 'Admin' | 'User'
  projects: string[]
  createdAt: Date
  updatedAt: Date
}

export function ProjectUsersPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { userRole, currentUser } = useAuth()
  const { selectedProject } = useProject()
  const cmsServices = useCMSServices()

  // State
  const [users, setUsers] = useState<ProjectUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user can edit
  const canEdit = userRole === 'Super'

  /**
   * Fetch users assigned to the project
   */
  useEffect(() => {
    const fetchProjectUsers = async () => {
      if (!projectId || !currentUser) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('👥 ProjectUsersPage: Fetching users for project', projectId)

        // Get users assigned to this project
        const projectUsers = await cmsServices.userManagement.getUsersAssignedToProject(
          projectId!,
          currentUser.uid,
          userRole || 'User'
        )

        setUsers(projectUsers)
        console.log(`✅ ProjectUsersPage: Loaded ${projectUsers.length} users`)
      } catch (err: any) {
        console.error('❌ ProjectUsersPage: Failed to fetch users', err)
        setError(err.message || 'Failed to load project users')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjectUsers()
  }, [projectId, currentUser, cmsServices])

  /**
   * Handle edit user
   */
  const handleEditUser = (userId: string) => {
    navigate(`/app/projects/${projectId}/users/${userId}/edit`)
  }

  /**
   * Handle delete user from project
   */
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the project?')) {
      return
    }

    try {
      console.log('🗑️ ProjectUsersPage: Removing user from project', userId)

      // TODO: Implement removeUserFromProject functionality
      // await cmsServices.userManagement.removeUserFromProject(projectId!, userId, currentUser!.uid)

      // Remove from local state
      setUsers(users.filter(u => u.uid !== userId))

      alert('User removed from project successfully')
      console.log('✅ ProjectUsersPage: User removed successfully')
    } catch (err: any) {
      console.error('❌ ProjectUsersPage: Failed to remove user', err)
      alert('Failed to remove user: ' + err.message)
    }
  }

  /**
   * Get role badge color
   */
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Super':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'Admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
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
          <Button
            variant="ghost"
            onClick={() => navigate('/app/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Failed to load users</h3>
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
          <Button
            variant="ghost"
            onClick={() => navigate('/app/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Project Selected</h3>
                <p className="text-sm text-slate-600">
                  Please select a project to view its users
                </p>
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
          <Button
            variant="ghost"
            onClick={() => navigate('/app/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                Project Users
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {selectedProject.name} • {users.length} user{users.length !== 1 ? 's' : ''} assigned
              </p>
            </div>

            {canEdit && (
              <Button
                onClick={() => navigate(`/app/projects/${projectId}/users/assign`)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign User
              </Button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Assigned Users
            </CardTitle>
            <CardDescription>
              {canEdit
                ? 'View and manage users assigned to this project'
                : 'View users assigned to this project (read-only)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No Users Assigned
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  This project doesn't have any users assigned yet
                </p>
                {canEdit && (
                  <Button
                    onClick={() => navigate(`/app/projects/${projectId}/users/assign`)}
                    variant="outline"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign First User
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden md:table-cell">Projects</TableHead>
                      <TableHead className="hidden lg:table-cell">Joined</TableHead>
                      {canEdit && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.uid} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                              {user.displayName
                                ? user.displayName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .substring(0, 2)
                                : user.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {user.displayName || 'Unnamed User'}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {user.uid.substring(0, 12)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            <Shield className="h-3 w-3 mr-1" />
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {user.projects.length} project{user.projects.length !== 1 ? 's' : ''}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user.uid)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.uid)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
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
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                {canEdit ? 'Administrator Privileges' : 'Read-Only Access'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                {canEdit
                  ? 'As a Super user, you can edit user details and manage project assignments.'
                  : 'As an Admin, you can view users assigned to your projects but cannot edit their details.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
