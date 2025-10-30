/**
 * TopBar Component
 *
 * Main navigation bar displayed at the top of all authenticated pages.
 * Contains project selector dropdown (center) and user account dropdown (right).
 *
 * **Features:**
 * - Project Selector: Dropdown to switch between projects with "Create New Project" option
 * - User Account: Display user info with dropdown for profile, settings, and logout
 * - Responsive design with Hooran Seafoam Green theme
 *
 * **Clean Architecture:**
 * - Uses context for state management (AuthContext, ProjectContext)
 * - Pure presentation component with no business logic
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
  FolderKanban,
  Plus,
  User,
  Settings,
  LogOut,
  Check,
} from 'lucide-react'

export function TopBar() {
  const navigate = useNavigate()
  const { currentUser, userData, userRole, signOut } = useAuth()
  const { selectedProject, projectsList, setSelectedProject } = useProject()
  const { showToast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
      console.error('❌ TopBar: Logout failed', error)
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
    <div className="w-full border-b bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex h-14 sm:h-16 items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-4">
        {/* Left: Project Selector Dropdown */}
        <div className="flex-1 flex justify-start sm:justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:min-w-[200px] md:min-w-[280px] sm:max-w-[320px] justify-between border-[#20B2AA]/30 hover:border-[#20B2AA] hover:bg-[#20B2AA]/5"
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
            <DropdownMenuContent align="center" className="w-[320px]">
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
                <div className="hidden md:flex flex-col items-start">
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
  )
}
