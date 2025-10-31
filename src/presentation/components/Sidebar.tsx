/**
 * Sidebar Component
 *
 * Primary CMS navigation sidebar with role-based sections.
 *
 * Features:
 * - Navigation section (Dashboard, Settings)
 * - Super Powers section (Super only: Super Settings, Collections, Users)
 * - Admin Control section (Audit Logs, Users)
 * - Tables section (dynamic collections loaded from Firebase ProjectRecords)
 * - Role-based visibility
 * - Active route highlighting
 * - Responsive design
 *
 * @route All /app/* routes
 */

import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { useRoleCheck } from '@/presentation/hooks/useRoleCheck'
import { useToast } from '@/presentation/context/ToastContext'
import { DIContainer, DI_TYPES } from '@/domain/di'
import {
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  Image,
  Video,
  Newspaper,
  ShoppingBag,
  Tag,
  Folder,
  Zap,
  Database,
  History,
  Shield,
  Table as TableIcon,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SchemaDefinition } from '@/domain/entities/SchemaDefinition'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'

export function Sidebar() {
  const { userRole: _userRole, currentUser } = useAuth()
  const { isSuper } = useRoleCheck()
  const { selectedProject } = useProject()
  const { showToast } = useToast()

  const [tables, setTables] = useState<SchemaDefinition[]>([])
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [tableToDelete, setTableToDelete] = useState<SchemaDefinition | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  /**
   * Load tables (schemas) from project's schemas array
   * NEW: Fetches from root-level schemas collection using project.schemas array
   */
  useEffect(() => {
    const loadTables = async () => {
      if (!selectedProject) {
        setTables([])
        return
      }

      setIsLoadingTables(true)
      try {
        // Fetch schemas using SchemaRepository
        const schemaRepo = DIContainer.resolve<any>(DI_TYPES.SchemaRepository)
        const schemas = await schemaRepo.getSchemasForProject(selectedProject.projectId)

        // Filter out system schemas if needed
        const userSchemas = schemas.filter((s: SchemaDefinition) => !s.isSystem)

        setTables(userSchemas)
        console.log(`✅ Sidebar: Loaded ${userSchemas.length} schemas for project ${selectedProject.projectId}`)
      } catch (error) {
        console.error('❌ Sidebar: Failed to load schemas', error)
        setTables([])
      } finally {
        setIsLoadingTables(false)
      }
    }

    loadTables()
  }, [selectedProject, refreshTrigger])

  /**
   * Listen for custom event to refresh tables when collections are created/updated
   */
  useEffect(() => {
    const handleRefreshTables = (event: CustomEvent) => {
      const { projectId } = event.detail || {}
      // Only refresh if it's for the current project or no project specified
      if (!projectId || projectId === selectedProject?.projectId) {
        console.log('🔄 Sidebar: Refreshing tables due to collection change')
        setRefreshTrigger(prev => prev + 1)
      }
    }

    // Listen for the custom event
    window.addEventListener('refreshTables' as any, handleRefreshTables as any)

    // Cleanup
    return () => {
      window.removeEventListener('refreshTables' as any, handleRefreshTables as any)
    }
  }, [selectedProject])

  /**
   * Get icon component based on icon string
   */
  const getIcon = (iconName?: string) => {
    const iconMap: Record<string, any> = {
      'newspaper': Newspaper,
      'file-text': FileText,
      'image': Image,
      'shopping-bag': ShoppingBag,
      'tag': Tag,
      'video': Video,
      'folder': Folder,
      'database': Database,
      'table': TableIcon,
    }
    const IconComponent = iconMap[iconName || 'table'] || TableIcon
    return <IconComponent className="h-4 w-4" />
  }

  /**
   * Handle delete icon click
   */
  const handleDeleteClick = (e: React.MouseEvent, table: SchemaDefinition) => {
    e.preventDefault()
    e.stopPropagation()
    setTableToDelete(table)
    setDeleteConfirmName('')
    setIsDeleteDialogOpen(true)
  }

  /**
   * Handle table deletion
   */
  const handleDeleteTable = async () => {
    if (!tableToDelete || !selectedProject || !currentUser) return

    setIsDeleting(true)

    try {
      console.log(`🗑️ Sidebar: Deleting schema/table ${tableToDelete.name}`)

      // Get schema management use case and delete the schema (which will also delete all content)
      const schemaManagementUseCase = DIContainer.resolve<any>(DI_TYPES.SchemaManagementUseCase)
      await schemaManagementUseCase.deleteSchema(
        selectedProject.projectId,
        tableToDelete.id,
        currentUser.uid
      )

      // Remove from local state
      setTables(tables.filter(t => t.id !== tableToDelete.id))

      // Trigger refresh
      setRefreshTrigger(prev => prev + 1)

      // Close dialog
      setIsDeleteDialogOpen(false)
      setTableToDelete(null)
      setDeleteConfirmName('')

      showToast({
        title: 'Table Deleted',
        description: `"${tableToDelete.name}" and all its content have been permanently deleted`,
        variant: 'default'
      })

      console.log(`✅ Sidebar: Schema/table deleted successfully`)
    } catch (err: any) {
      console.error('❌ Sidebar: Failed to delete table', err)
      showToast({
        title: 'Delete Failed',
        description: err.message || 'Failed to delete table',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * Handle dialog close
   */
  const handleCloseDialog = () => {
    if (!isDeleting) {
      setIsDeleteDialogOpen(false)
      setTableToDelete(null)
      setDeleteConfirmName('')
    }
  }

  return (
    <aside className="w-60 lg:w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 overflow-hidden">
      {/* Navigation Content */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Fixed Navigation Section */}
        <div className="px-3 mb-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>
          <div className="space-y-1">
            {/* Dashboard */}
            <NavLink
              to="/app/dashboard"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#20B2AA]/10 text-[#20B2AA]'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <LayoutDashboard className={cn('h-4 w-4', isActive && 'text-[#20B2AA]')} />
                  Dashboard
                </>
              )}
            </NavLink>

            {/* Settings */}
            <NavLink
              to="/app/settings"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#20B2AA]/10 text-[#20B2AA]'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Settings className={cn('h-4 w-4', isActive && 'text-[#20B2AA]')} />
                  Settings
                </>
              )}
            </NavLink>
          </div>
        </div>

        {/* Super Powers Section (Super Only) */}
        {isSuper && (
          <div className="px-3 mb-6">
            <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              Super Powers
            </div>
            <div className="space-y-1">
              {/* Super Settings */}
              <NavLink
                to="/app/super/settings"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-purple-500/10 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Shield className={cn('h-4 w-4', isActive && 'text-purple-700')} />
                    Super Settings
                  </>
                )}
              </NavLink>

              {/* Collections */}
              <NavLink
                to="/app/super/collections"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-purple-500/10 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Database className={cn('h-4 w-4', isActive && 'text-purple-700')} />
                    Collections
                  </>
                )}
              </NavLink>

              {/* All Users */}
              <NavLink
                to="/app/super/users"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-purple-500/10 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Users className={cn('h-4 w-4', isActive && 'text-purple-700')} />
                    Users
                  </>
                )}
              </NavLink>
            </div>
          </div>
        )}

        {/* Admin Control Section */}
        {selectedProject && (
          <div className="px-3 mb-6">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Admin Control
            </div>
            <div className="space-y-1">
              {/* Audit Logs */}
              <NavLink
                to={`/app/projects/${selectedProject.projectId}/audit-logs`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-500/10 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <History className={cn('h-4 w-4', isActive && 'text-blue-700')} />
                    Audit Logs
                  </>
                )}
              </NavLink>

              {/* Users - View users assigned to selected project */}
              <NavLink
                to={`/app/projects/${selectedProject.projectId}/users`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-500/10 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Users className={cn('h-4 w-4', isActive && 'text-blue-700')} />
                    Users
                  </>
                )}
              </NavLink>
            </div>
          </div>
        )}

        {/* Tables Section (Dynamic Collections from Firebase) */}
        {selectedProject && (
          <div className="px-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Tables
            </div>
            {isLoadingTables ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                Loading tables...
              </div>
            ) : tables.length > 0 ? (
              <div className="space-y-1">
                {tables.map((table) => (
                  <div key={table.id} className="relative group">
                    <NavLink
                      to={`/app/tables/${table.id}`}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-[#20B2AA]/10 text-[#20B2AA]'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={cn(isActive && 'text-[#20B2AA]')}>
                            {getIcon('table')}
                          </span>
                          <span className="flex-1 truncate">{table.name}</span>
                          {/* Delete icon - only visible on hover and for Super users */}
                          {isSuper && (
                            <button
                              onClick={(e) => handleDeleteClick(e, table)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                              title="Delete table"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </button>
                          )}
                        </>
                      )}
                    </NavLink>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No tables available
              </div>
            )}
          </div>
        )}

        {/* No Project Selected Message */}
        {!selectedProject && !isSuper && (
          <div className="px-6 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-700">
                Select a project to view tables
              </p>
            </div>
          </div>
        )}
      </nav>

      {/* Footer Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500 text-center">
          v1.0.0
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Table</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the table "{tableToDelete?.name}" and all of its content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-name">
                To confirm deletion, type the table name exactly as shown: <span className="font-bold text-red-600">{tableToDelete?.name}</span>
              </Label>
              <Input
                id="confirm-name"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Enter table name"
                disabled={isDeleting}
              />
            </div>

            {tableToDelete && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-red-900">
                  What will be deleted:
                </p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>Table schema definition ({tableToDelete.fields.length} fields)</li>
                  <li>All content entries in this table</li>
                  <li>All associated media files</li>
                  <li>All associated metadata</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTable}
              disabled={isDeleting || deleteConfirmName !== tableToDelete?.name}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
