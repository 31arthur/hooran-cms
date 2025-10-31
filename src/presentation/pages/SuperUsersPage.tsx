/**
 * Super Users Page
 *
 * Displays all users in the system with role assignment capabilities.
 * Super users only.
 *
 * **Access Control:**
 * - Super users only
 *
 * **Features:**
 * - View all users in the system
 * - Edit user details
 * - Delete users
 * - Assign/change user roles
 * - Manage project assignments
 *
 * @route /app/super/users
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/presentation/context/AuthContext'
import { useCMSServices } from '@/presentation/hooks/useCMSServices'
import { useToast } from '@/presentation/context/ToastContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import { Badge } from '@/presentation/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Shield,
  AlertCircle,
  FolderKanban,
} from 'lucide-react'
import type { UserRole } from '@/domain/entities/User'

interface SystemUser {
  uid: string
  email: string
  displayName?: string
  name?: string
  role: UserRole
  projects: string[]
  createdAt: Date
  updatedAt: Date
}

export function SuperUsersPage() {

  const { currentUser } = useAuth()
  const cmsServices = useCMSServices()
  const { showToast } = useToast()

  const [users, setUsers] = useState<SystemUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [editForm, setEditForm] = useState({ displayName: '' })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  /**
   * Fetch all users in the system
   */
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('👥 SuperUsersPage: Fetching all users')

        // Fetch all users from Firestore
        const allUsers = await cmsServices.userManagement.getAllUsers(currentUser.uid)

        setUsers(allUsers as SystemUser[])
        console.log(`✅ SuperUsersPage: Loaded ${allUsers.length} users`)
      } catch (err: any) {
        console.error('❌ SuperUsersPage: Failed to fetch users', err)
        setError(err.message || 'Failed to load users')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [currentUser, cmsServices])

  /**
   * Handle role change
   */
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!currentUser) {
      showToast({
        title: 'Authentication Required',
        description: 'You must be logged in to change user roles',
        variant: 'destructive'
      })
      return
    }

    if (userId === currentUser.uid) {
      showToast({
        title: 'Action Not Allowed',
        description: 'You cannot change your own role',
        variant: 'destructive'
      })
      return
    }

    // Find the target user
    const targetUser = users.find(u => u.uid === userId)
    if (!targetUser) {
      showToast({
        title: 'User Not Found',
        description: 'The selected user could not be found',
        variant: 'destructive'
      })
      return
    }

    // Check if trying to change a Super user's role
    if (targetUser.role === 'Super') {
      showToast({
        title: 'Cannot Modify Super User',
        description: 'Super user role is permanent and cannot be changed',
        variant: 'destructive'
      })
      return
    }

    setUpdatingUserId(userId)

    try {
      console.log(`👥 SuperUsersPage: Updating user ${userId} role to ${newRole}`)

      // Update user role via use case
      await cmsServices.userManagement.updateUserRole(userId, newRole, currentUser.uid)

      // Update local state
      setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole, updatedAt: new Date() } : u))

      console.log('✅ SuperUsersPage: Role updated successfully')
      showToast({
        title: 'Role Updated Successfully',
        description: `User role has been changed to ${newRole}`,
        variant: 'default'
      })
    } catch (err: any) {
      console.error('❌ SuperUsersPage: Failed to update role', err)
      showToast({
        title: 'Failed to Update Role',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive'
      })

      // Revert the select dropdown back to original value on error
      setUsers([...users])
    } finally {
      setUpdatingUserId(null)
    }
  }

  /**
   * Handle edit user
   */
  const handleEditUser = (userId: string) => {
    const user = users.find(u => u.uid === userId)
    if (!user) return

    setEditingUser(user)
    setEditForm({
      displayName: user.displayName || user.name || '',
    })
    setIsEditDialogOpen(true)
  }

  /**
   * Handle save user edit
   */
  const handleSaveEdit = async () => {
    if (!editingUser || !currentUser) return

    // Validation
    if (!editForm.displayName.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Display name is required',
        variant: 'destructive'
      })
      return
    }

    setIsSavingEdit(true)

    try {
      console.log(`👥 SuperUsersPage: Updating user ${editingUser.uid} display name`)

      // Update user profile via use case
      await cmsServices.userManagement.updateUserProfile(
        editingUser.uid,
        { displayName: editForm.displayName },
        currentUser.uid
      )

      // Update local state
      setUsers(users.map(u =>
        u.uid === editingUser.uid
          ? { ...u, displayName: editForm.displayName, updatedAt: new Date() }
          : u
      ))

      console.log('✅ SuperUsersPage: User updated successfully')
      showToast({
        title: 'User Updated',
        description: 'User display name has been updated successfully',
        variant: 'default'
      })
      setIsEditDialogOpen(false)
      setEditingUser(null)
    } catch (err: any) {
      console.error('❌ SuperUsersPage: Failed to update user', err)
      showToast({
        title: 'Update Failed',
        description: err.message || 'Failed to update user information',
        variant: 'destructive'
      })
    } finally {
      setIsSavingEdit(false)
    }
  }

  /**
   * Handle cancel edit
   */
  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingUser(null)
    setEditForm({ displayName: '' })
  }

  /**
   * Handle delete user
   */
  const handleDeleteUser = async (userId: string) => {
    if (!currentUser) {
      showToast({
        title: 'Authentication Required',
        description: 'You must be logged in to delete users',
        variant: 'destructive'
      })
      return
    }

    if (userId === currentUser.uid) {
      showToast({
        title: 'Action Not Allowed',
        description: 'You cannot delete your own account',
        variant: 'destructive'
      })
      return
    }

    const userToDelete = users.find(u => u.uid === userId)
    if (!userToDelete) {
      showToast({
        title: 'User Not Found',
        description: 'The selected user could not be found',
        variant: 'destructive'
      })
      return
    }

    // Double confirmation for destructive action
    if (!confirm(
      `Are you sure you want to delete ${userToDelete.displayName || userToDelete.email}?\n\n` +
      `This will remove:\n` +
      `- User's Firestore document\n` +
      `- User's Firebase Auth account (when possible)\n\n` +
      `This action cannot be undone.`
    )) {
      return
    }

    try {
      console.log('👥 SuperUsersPage: Deleting user', userId)

      // Delete user via use case (deletes both Firestore and Auth)
      await cmsServices.userManagement.deleteUser(userId, currentUser.uid)

      // Remove from local state
      setUsers(users.filter(u => u.uid !== userId))

      console.log('✅ SuperUsersPage: User deleted successfully')
      showToast({
        title: 'User Deleted',
        description: `${userToDelete.displayName || userToDelete.email} has been successfully removed from the system`,
        variant: 'default'
      })
    } catch (err: any) {
      console.error('❌ SuperUsersPage: Failed to delete user', err)
      showToast({
        title: 'Delete Failed',
        description: err.message || 'Failed to delete user',
        variant: 'destructive'
      })
    }
  }

  /**
   * Get role badge color
   */
  const getRoleBadgeColor = (role: UserRole) => {
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
   * Main UI
   */
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                  All Users
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {users.length} total user{users.length !== 1 ? 's' : ''} in the system
                </p>
              </div>
            </div>

            <Button
              onClick={() => showToast({
                title: 'Coming Soon',
                description: 'Add user functionality will be available in a future update',
                variant: 'default'
              })}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              System Users
            </CardTitle>
            <CardDescription>
              View and manage all users with role assignment capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No Users Found
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No users are registered in the system
                </p>
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.uid} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold text-sm">
                              {(user.displayName || user.name)
                                ? (user.displayName || user.name)!
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .substring(0, 2)
                                : user.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {user.displayName || user.name || 'Unnamed User'}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {user.uid.substring(0, 12)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <span className="text-sm truncate">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.uid, value as UserRole)}
                            disabled={updatingUserId === user.uid || user.uid === currentUser?.uid || user.role === 'Super'}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue>
                                <Badge className={getRoleBadgeColor(user.role)}>
                                  <Shield className="h-3 w-3 mr-1" />
                                  {user.role}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Super">Super</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="User">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <FolderKanban className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {user.projects.length}
                            </span>
                          </div>
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
                              disabled={user.uid === currentUser?.uid}
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

        {/* Info Notice */}
        <div className="mt-6">
          <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-lg">
            <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                Super User Privileges
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                As a Super user, you can view all users in the system and assign roles. You can change
                user roles by selecting from the dropdown in the Role column. Note: You cannot change
                your own role or delete your own account.
              </p>
            </div>
          </div>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Display Name</DialogTitle>
              <DialogDescription>
                Update the user's display name. Email addresses cannot be changed for security reasons.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-displayName">Display Name *</Label>
                <Input
                  id="edit-displayName"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ displayName: e.target.value })}
                  placeholder="Enter display name"
                />
              </div>

              {editingUser && (
                <div className="pt-4 border-t space-y-3">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-900 dark:text-white">Email:</span>{' '}
                    <span className="font-mono">{editingUser.email}</span>
                    <span className="ml-2 text-xs text-slate-500">(read-only)</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-900 dark:text-white">User ID:</span>{' '}
                    <span className="font-mono text-xs">{editingUser.uid}</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-900 dark:text-white">Role:</span>{' '}
                    <Badge className={getRoleBadgeColor(editingUser.role)}>
                      {editingUser.role}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSavingEdit}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
