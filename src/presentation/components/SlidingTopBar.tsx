/**
 * Sliding Top Bar Component
 *
 * A stylish top bar that slides down when toggled and automatically hides after 60 seconds.
 * Contains project selector and user information.
 *
 * **Features:**
 * - Hidden by default
 * - Slides down when toggle button is clicked
 * - Auto-hides after 60 seconds of inactivity
 * - Responsive design
 * - Smooth animations
 *
 * @route All /app/* routes
 */

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, FolderKanban, LogOut } from 'lucide-react'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { Button } from '@/presentation/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const AUTO_HIDE_DELAY = 60000 // 60 seconds

export function SlidingTopBar() {
  const { currentUser, userRole, signOut } = useAuth()
  const { selectedProject, projectsList, setSelectedProject } = useProject()
  const [isVisible, setIsVisible] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Toggle bar visibility
   */
  const toggleVisibility = () => {
    setIsVisible((prev) => !prev)
  }

  /**
   * Reset auto-hide timer
   */
  const resetAutoHideTimer = () => {
    // Clear existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }

    // Set new timeout if bar is visible
    if (isVisible) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false)
      }, AUTO_HIDE_DELAY)
    }
  }

  /**
   * Effect: Auto-hide timer
   */
  useEffect(() => {
    resetAutoHideTimer()

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [isVisible])

  /**
   * Handle sign out
   */
  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true)
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  /**
   * Handle project selection
   */
  const handleProjectSelect = (projectId: string) => {
    const project = projectsList.find((p) => p.projectId === projectId)
    if (project) {
      setSelectedProject(project)
    }
    resetAutoHideTimer() // Reset timer on interaction
  }

  /**
   * Handle bar interaction (reset timer)
   */
  const handleInteraction = () => {
    resetAutoHideTimer()
  }

  return (
    <div className="relative z-50">
      {/* Toggle Button */}
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50">
        <Button
          onClick={toggleVisibility}
          variant="ghost"
          size="sm"
          className={cn(
            'rounded-t-none rounded-b-lg shadow-lg border-t-0 transition-all duration-300',
            isVisible
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              : 'bg-gradient-to-r from-[#20B2AA] to-teal-600 text-white hover:from-teal-600 hover:to-[#20B2AA] hover:text-white border-transparent'
          )}
          onMouseEnter={handleInteraction}
        >
          {isVisible ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Hide</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Top Bar</span>
            </>
          )}
        </Button>
      </div>

      {/* Sliding Top Bar */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-lg transition-transform duration-300 ease-in-out',
          isVisible ? 'translate-y-0' : '-translate-y-full'
        )}
        onMouseEnter={handleInteraction}
        onMouseMove={handleInteraction}
      >
        <div className="flex h-14 sm:h-16 items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-4 pt-8">
          {/* Project Selector */}
          <div className="flex-1 flex justify-start sm:justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:min-w-[200px] md:min-w-[280px] sm:max-w-[320px] justify-between border-[#20B2AA]/30 hover:border-[#20B2AA] hover:bg-[#20B2AA]/5"
                  onClick={handleInteraction}
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
                {projectsList.length > 0 ? (
                  projectsList.map((project) => (
                    <DropdownMenuItem
                      key={project.projectId}
                      onClick={() => handleProjectSelect(project.projectId)}
                      className={cn(
                        'cursor-pointer',
                        selectedProject?.projectId === project.projectId &&
                          'bg-[#20B2AA]/10 text-[#20B2AA] font-medium'
                      )}
                    >
                      <FolderKanban className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-slate-500">{project.description || 'No description'}</div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-8 text-center text-sm text-slate-500">
                    No projects available
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full flex-shrink-0"
                onClick={handleInteraction}
              >
                <div className="flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-[#20B2AA] to-teal-600 text-white font-semibold text-sm">
                  {currentUser?.displayName
                    ? currentUser.displayName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)
                    : currentUser?.email?.substring(0, 2).toUpperCase() || 'U'}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {currentUser?.displayName || 'User'}
                  </p>
                  <p className="text-xs leading-none text-slate-500 truncate">
                    {currentUser?.email}
                  </p>
                  <p className="text-xs leading-none mt-1">
                    <span
                      className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                        userRole === 'Super'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          : userRole === 'Admin'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
                      )}
                    >
                      {userRole}
                    </span>
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} disabled={isLoggingOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Auto-hide indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#20B2AA] to-transparent opacity-30" />
      </div>
    </div>
  )
}
