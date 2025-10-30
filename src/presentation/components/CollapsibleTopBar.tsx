/**
 * Collapsible Top Bar Component
 *
 * A clean top bar that can be toggled to show/hide with smooth animations.
 * Positioned to snap beside the sidebar when visible.
 * Contains project selector and user information.
 *
 * **Features:**
 * - Hidden by default
 * - Smooth slide-down animation when toggled
 * - Positioned beside sidebar (not overlapping)
 * - Project selector dropdown
 * - User avatar with dropdown menu
 * - Responsive design with Hooran Seafoam Green theme
 *
 * @route All /app/* routes
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { useToast } from '@/presentation/context/ToastContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu'
import { Button } from '@/presentation/components/ui/button'
import { Avatar, AvatarFallback } from '@/presentation/components/ui/avatar'
import {
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Plus,
  User,
  Settings,
  LogOut,
  Check,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function CollapsibleTopBar() {
  const navigate = useNavigate()
  const { currentUser, userData, userRole, signOut } = useAuth()
  const { selectedProject, projectsList, setSelectedProject } = useProject()
  const { showToast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Extract display name
  const displayName =
    userData?.display_name ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'User'

  // Get user initials for avatar
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  /**
   * Toggle top bar visibility
   */
  const toggleVisibility = () => {
    setIsVisible((prev) => !prev)
  }

  /**
   * Handle project selection
   */
  const handleProjectSelect = (projectId: string) => {
    const project = projectsList.find((p) => p.projectId === projectId)
    if (project) {
      setSelectedProject(project)
      showToast({
        title: 'Project switched',
        description: `Now viewing ${project.name}`,
        variant: 'default',
      })
    }
  }

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      showToast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
        variant: 'default',
      })
      navigate('/')
    } catch (error) {
      console.error('❌ CollapsibleTopBar: Logout failed', error)
      showToast({
        title: 'Logout failed',
        description: 'An error occurred while logging out',
        variant: 'destructive',
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="relative">
      {/* Toggle Button - Fixed at top center */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <Button
          onClick={toggleVisibility}
          size="sm"
          className={cn(
            'rounded-lg shadow-lg transition-all duration-300',
            isVisible
              ? 'bg-white dark:bg-slate-900 text-slate-700 hover:bg-slate-100 border border-slate-200'
              : 'bg-gradient-to-r from-[#20B2AA] to-[#1a9088] text-white hover:from-[#1a9088] hover:to-[#20B2AA]'
          )}
        >
          {isVisible ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Hide</span>
            </>
          ) : (
            <>
              <Menu className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Show Bar</span>
            </>
          )}
        </Button>
      </div>

      {/* Collapsible Top Bar - Positioned beside sidebar */}
      <div
        className={cn(
          'fixed top-0 left-60 lg:left-64 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-md transition-all duration-300 ease-in-out z-40',
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        )}
      >
        <div className="flex h-16 items-center px-6 gap-4">
          {/* Left: Project Selector Dropdown */}
          <div className="flex-1 flex justify-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[240px] max-w-[320px] justify-between border-[#20B2AA]/30 hover:border-[#20B2AA] hover:bg-[#20B2AA]/5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderKanban className="h-4 w-4 text-[#20B2AA] flex-shrink-0" />
                    <span className="font-medium truncate">
                      {selectedProject ? selectedProject.name : 'Select Project'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[320px]">
                <DropdownMenuLabel className="text-xs text-slate-500 uppercase">
                  Your Projects ({projectsList.length})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Project List */}
                <div className="max-h-[300px] overflow-y-auto">
                  {projectsList.map((project) => (
                    <DropdownMenuItem
                      key={project.projectId}
                      onClick={() => handleProjectSelect(project.projectId)}
                      className="cursor-pointer flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#20B2AA]/10">
                          <FolderKanban className="w-4 h-4 text-[#20B2AA]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {project.name}
                          </div>
                          {project.description && (
                            <div className="text-xs text-slate-500 truncate">
                              {project.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedProject?.projectId === project.projectId && (
                        <Check className="h-4 w-4 text-[#20B2AA] flex-shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>

                {/* Create New Project Button (Super Only) */}
                {userRole === 'Super' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate('/app/projects/new')}
                      className="cursor-pointer bg-gradient-to-r from-[#20B2AA]/5 to-[#1a9088]/5 hover:from-[#20B2AA]/10 hover:to-[#1a9088]/10"
                    >
                      <div className="flex items-center gap-2 py-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#20B2AA]/10">
                          <Plus className="h-4 w-4 text-[#20B2AA]" />
                        </div>
                        <span className="font-medium text-[#20B2AA]">
                          Create New Project
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right: User Account Dropdown */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-[#20B2AA] to-[#1a9088] text-white font-semibold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {displayName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {userRole}
                    </span>
                  </div>

                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {currentUser?.email}
                    </p>
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#20B2AA]/10 text-[#20B2AA] mt-1 w-fit">
                      {userRole}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Profile */}
                <DropdownMenuItem
                  onClick={() => navigate('/app/profile')}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>

                {/* Project Settings (if project selected) */}
                {selectedProject && (
                  <DropdownMenuItem
                    onClick={() => navigate('/app/project-settings')}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Project Settings</span>
                  </DropdownMenuItem>
                )}

                {/* System Settings (Super only) */}
                {userRole === 'Super' && (
                  <DropdownMenuItem
                    onClick={() => navigate('/app/system-settings')}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>System Settings</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {/* Logout */}
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
