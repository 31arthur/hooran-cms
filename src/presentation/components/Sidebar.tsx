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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CollectionReference } from '@/domain/entities/ProjectRecords'

export function Sidebar() {
  const { userRole: _userRole } = useAuth()
  const { isSuper } = useRoleCheck()
  const { selectedProject } = useProject()

  const [tables, setTables] = useState<CollectionReference[]>([])
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  /**
   * Load tables from Firebase ProjectRecords
   */
  useEffect(() => {
    const loadTables = async () => {
      if (!selectedProject) {
        setTables([])
        return
      }

      setIsLoadingTables(true)
      try {
        const projectRecordsRepo = DIContainer.resolve<any>(DI_TYPES.ProjectRecordsRepository)
        const collections = await projectRecordsRepo.getCollectionsForProject(selectedProject.projectId)
        setTables(collections.filter((c: CollectionReference) => c.isActive))
        console.log(`✅ Sidebar: Loaded ${collections.length} tables for project ${selectedProject.projectId}`)
      } catch (error) {
        console.error('❌ Sidebar: Failed to load tables', error)
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
                  <NavLink
                    key={table.schemaId}
                    to={`/app/tables/${table.schemaId}`}
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
                          {getIcon(table.icon || 'table')}
                        </span>
                        <span className="flex-1 truncate">{table.collectionName}</span>
                        {table.entryCount !== undefined && (
                          <span className="text-xs text-gray-400">{table.entryCount}</span>
                        )}
                      </>
                    )}
                  </NavLink>
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
    </aside>
  )
}
