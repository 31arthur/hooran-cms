/**
 * User Assignment Page Component
 *
 * **SUPER ADMIN ONLY** - Manages Admin user project access assignments.
 *
 * This component allows Super admins to view all Admin users and manage their
 * project access through a compact multi-select dropdown interface.
 *
 * **Access:** Only available to 'Super' role.
 * **Data Storage:** Uses `projects` field (Array) in users collection.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/presentation/context/AuthContext'
import { useToast } from '@/presentation/context/ToastContext'
import type { UserRole } from '@/presentation/context/AuthContext'
import { useCMSServices } from '@/presentation/hooks/useCMSServices'
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
import { Checkbox } from '@/presentation/components/ui/checkbox'
import { Label } from '@/presentation/components/ui/label'
import { Badge } from '@/presentation/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/presentation/components/ui/dropdown-menu'
import { Edit2, Save, X } from 'lucide-react'

export interface AdminUser {
  id: string
  email: string
  display_name?: string
  role: UserRole
  projects: string[]
  created_at?: any
  updated_at?: any
}

export interface Project {
  projectId: string
  name: string
  description?: string
  status?: 'active' | 'suspended' | 'archived'
  owner_id?: string
  created_at?: any
}

interface ProjectEditorProps {
  admin: AdminUser
  projects: Project[]
  currentAssignments: string[]
  onSave: (userId: string, newProjectIds: string[]) => Promise<void>
}

function ProjectEditor({ admin, projects, currentAssignments, onSave }: ProjectEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<string[]>(currentAssignments)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelectedProjects(currentAssignments)
    }
  }, [isOpen, currentAssignments])

  const handleToggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSave(admin.id, selectedProjects)
      setIsOpen(false)
    } catch (error) {
      console.error('Error saving project assignments:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setSelectedProjects(currentAssignments)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit2 className="h-4 w-4" />
          Edit Access
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="p-4">
          <div className="mb-4">
            <h4 className="font-semibold text-sm mb-1">Edit Project Access</h4>
            <p className="text-xs text-muted-foreground">
              {admin.display_name || admin.email}
            </p>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-3 mb-4">
            {projects.map((project) => (
              <div
                key={project.projectId}
                className="flex items-start gap-3 p-2 hover:bg-muted rounded-md transition-colors"
              >
                <Checkbox
                  id={`${admin.id}-${project.projectId}-edit`}
                  checked={selectedProjects.includes(project.projectId)}
                  onCheckedChange={() => handleToggleProject(project.projectId)}
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`${admin.id}-${project.projectId}-edit`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {project.name}
                  </Label>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DropdownMenuSeparator className="my-3" />

          <div className="flex justify-between items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {selectedProjects.length} of {projects.length} selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#20B2AA] hover:bg-[#1a9d96] text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function UserAssignmentPage() {
  const { currentUser, userRole, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const { userManagement } = useCMSServices()

  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAdminsAndSuperUsers = async (): Promise<AdminUser[]> => {
    try {
      console.log('📋 Fetching Admin and Super users...')

      // Use UserManagementUseCase via useCMSServices hook
      const users = await userManagement.getAllUsers(currentUser!.uid)

      const adminList: AdminUser[] = users.map((user) => ({
        id: user.uid,
        email: user.email,
        display_name: user.displayName,
        role: user.role,
        projects: user.projects || [],
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      }))

      console.log(`✅ Fetched ${adminList.length} Admin/Super users`)
      return adminList
    } catch (err) {
      console.error('❌ Error fetching Admin/Super users:', err)
      throw err
    }
  }

  const fetchProjects = async (): Promise<Project[]> => {
    try {
      console.log('📋 Fetching all projects...')

      // Use DIContainer to get project repository through useCMSServices
      // For now, we'll use the projectSelection use case if available
      // or we can add a getAll method to ProjectSelection use case

      // NOTE: Ideally we'd have a ProjectManagement use case, but for now
      // we can use the DI container directly through useCMSServices internal access
      const { DIContainer, DI_TYPES } = await import('@/domain/di')
      const projectRepo = DIContainer.resolve<any>(DI_TYPES.ProjectRepository)

      const coreProjects = await projectRepo.getProjects()

      const projectList: Project[] = coreProjects.map((p: any) => ({
        projectId: p.projectId,
        name: p.name || p.projectId,
        description: p.description,
        status: p.status === 'Active' ? 'active' : p.status === 'Archived' ? 'archived' : 'suspended',
        owner_id: p.createdBy || p.owner_id,
        created_at: p.createdAt,
      }))

      const activeProjects = projectList.filter((p) => p.status !== 'archived')

      console.log(`✅ Fetched ${activeProjects.length} active projects`)
      return activeProjects
    } catch (err) {
      console.error('❌ Error fetching projects:', err)
      throw err
    }
  }

  useEffect(() => {
    const loadData = async () => {
      if (!authLoading && currentUser && userRole === 'Super') {
        try {
          setIsLoading(true)
          setError(null)

          const [adminList, projectList] = await Promise.all([
            fetchAdminsAndSuperUsers(),
            fetchProjects(),
          ])

          setAdmins(adminList)
          setProjects(projectList)

          setIsLoading(false)
        } catch (err: any) {
          console.error('❌ Error loading data:', err)
          setError(err.message || 'Failed to load data. Please try again.')
          setIsLoading(false)
        }
      } else if (!authLoading && userRole !== 'Super') {
        setIsLoading(false)
      }
    }

    loadData()
  }, [authLoading, currentUser, userRole])

  const handleSaveUserAssignments = async (userId: string, newProjectIds: string[]) => {
    if (!currentUser) {
      console.error('❌ No current user - cannot save assignments')
      return
    }

    try {
      console.log(`💾 Saving project assignments for user ${userId}...`)

      // Use UserManagementUseCase via useCMSServices hook
      await userManagement.updateUserProjectAssignments(
        userId,
        newProjectIds,
        currentUser.uid
      )

      setAdmins((prevAdmins) =>
        prevAdmins.map((admin) =>
          admin.id === userId
            ? { ...admin, projects: newProjectIds }
            : admin
        )
      )

      const admin = admins.find((a) => a.id === userId)
      showToast({
        title: 'Assignment updated',
        description: `Project access updated for ${admin?.display_name || admin?.email}`,
        variant: 'default',
      })

      console.log('✅ Project assignments saved successfully')
    } catch (err: any) {
      console.error('❌ Error saving assignments:', err)

      showToast({
        title: 'Failed to update assignments',
        description: err.message || 'An error occurred while updating project access',
        variant: 'destructive',
      })
    }
  }

  const getAssignedCount = (adminId: string): number => {
    const admin = admins.find((a) => a.id === adminId)
    return (admin?.projects || []).length
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (userRole !== 'Super') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Unauthorized Access</CardTitle>
            <CardDescription>
              You do not have permission to access the User Assignment page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This page is only accessible to users with the <strong>'Super'</strong> role.
            </p>
            <p className="text-sm text-gray-500">
              Current role: <span className="font-semibold">{userRole || 'Unknown'}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Loading admins and projects...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load data.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-[#20B2AA]">👥</span>
            User Assignment Management
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Manage project access for Admin users. Super users have automatic access to all projects.
          </p>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">CMS Users:</span>
              <span className="px-2 py-1 bg-[#20B2AA]/10 text-[#20B2AA] border border-[#20B2AA]/30 rounded-md font-medium">
                {admins.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Total Projects:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-200 rounded-md font-medium">
                {projects.length}
              </span>
            </div>
          </div>
        </div>

        {admins.length === 0 && (
          <Card className="border-[#20B2AA]/20">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No CMS Users Found</h3>
                <p className="text-sm text-gray-500">
                  There are no users with 'Admin' or 'Super' roles in the system yet.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {admins.length > 0 && projects.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📁</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Found</h3>
                <p className="text-sm text-gray-500">
                  There are no active projects in the system yet.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {admins.length > 0 && projects.length > 0 && (
          <Card className="border-[#20B2AA]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-[#20B2AA]">📋</span>
                User Project Assignments
              </CardTitle>
              <CardDescription>
                Manage project access for Admin users. Changes are saved immediately per user.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead className="w-[220px]">Email</TableHead>
                      <TableHead className="w-[100px]">Role</TableHead>
                      <TableHead className="w-[200px]">Assigned Projects</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {admin.display_name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">ID: {admin.id.substring(0, 8)}...</div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm text-gray-600">{admin.email}</div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={
                              admin.role === 'Super'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }
                          >
                            {admin.role}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            {admin.role === 'Super' ? (
                              <Badge className="bg-purple-100 text-purple-700 border border-purple-200">
                                All Projects
                              </Badge>
                            ) : (
                              <div className="text-sm">
                                <span className="font-semibold text-[#20B2AA]">
                                  {getAssignedCount(admin.id)}
                                </span>
                                <span className="text-gray-500"> of </span>
                                <span className="font-semibold">{projects.length}</span>
                                <span className="text-gray-500"> Projects Assigned</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {admin.role === 'Super' ? (
                            <span className="text-xs text-gray-400">
                              (Automatic Access)
                            </span>
                          ) : (
                            <ProjectEditor
                              admin={admin}
                              projects={projects}
                              currentAssignments={admin.projects}
                              onSave={handleSaveUserAssignments}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
