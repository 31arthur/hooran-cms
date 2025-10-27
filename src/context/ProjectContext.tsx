/**
 * Project Context
 *
 * Manages the multi-tenancy scope for Hooran CMS.
 * Provides selected project and list of accessible projects.
 *
 * **CRITICAL:** The selectedProject.projectId MUST be included in ALL
 * Firestore requests to enforce multi-tenancy data scoping.
 *
 * @example
 * ```tsx
 * import { useProject } from '@/context/ProjectContext'
 *
 * function MyComponent() {
 *   const { selectedProject, projectsList, setSelectedProject } = useProject()
 *
 *   // Use selectedProject.projectId in all Firestore queries
 *   const contentRef = getProjectScopedDocRef('content', docId, selectedProject.projectId)
 * }
 * ```
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { collection, getDocs, doc, getDoc, query, where, documentId } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from './AuthContext'

/**
 * Project metadata
 */
export interface Project {
  projectId: string
  name: string
  description?: string
  created_at?: any
  owner_id?: string
  status?: 'active' | 'suspended' | 'archived'
}

/**
 * Project Context Type
 */
interface ProjectContextType {
  /**
   * Currently selected project
   * NULL if no project is selected
   *
   * CRITICAL: This projectId MUST be used in all Firestore queries
   */
  selectedProject: Project | null

  /**
   * Set the currently selected project
   * Persists to sessionStorage
   */
  setSelectedProject: (project: Project | null) => void

  /**
   * List of projects the user can access
   * - Super admins: All projects
   * - Admins: Only assigned projects
   */
  projectsList: Project[]

  /**
   * Loading state while fetching projects
   */
  isLoading: boolean

  /**
   * Error message if project fetching fails
   */
  error: string | null
}

/**
 * Project Context
 */
const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

/**
 * Project Provider Props
 */
interface ProjectProviderProps {
  children: ReactNode
}

/**
 * Session storage key for persisting selected project
 */
const SELECTED_PROJECT_KEY = 'hooran_cms_selected_project'

/**
 * Project Provider Component
 *
 * Manages project selection and fetching based on user role.
 *
 * **Role-based fetching:**
 * - Super admins: Fetch ALL projects from top-level 'projects' collection
 * - Admins: Fetch only assigned projects based on user.projects array
 *
 * **IMPORTANT:** Only renders after successful authentication with Super/Admin role.
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <ProjectProvider>
 *     <App />
 *   </ProjectProvider>
 * </AuthProvider>
 * ```
 */
export function ProjectProvider({ children }: ProjectProviderProps) {
  const { currentUser, userRole, userData, hasCMSAccess, isLoading: authLoading } = useAuth()

  const [selectedProject, setSelectedProjectState] = useState<Project | null>(null)
  const [projectsList, setProjectsList] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Set selected project and persist to sessionStorage
   */
  const setSelectedProject = (project: Project | null) => {
    setSelectedProjectState(project)

    // Persist to sessionStorage
    if (project) {
      sessionStorage.setItem(SELECTED_PROJECT_KEY, JSON.stringify(project))
      console.log('✅ Selected project:', project.name, `(${project.projectId})`)
    } else {
      sessionStorage.removeItem(SELECTED_PROJECT_KEY)
      console.log('🔄 Project selection cleared')
    }
  }

  /**
   * Fetch all projects (Super admin)
   * Fetches from top-level 'projects' collection
   */
  const fetchAllProjects = async (): Promise<Project[]> => {
    try {
      console.log('📋 Fetching all projects (Super admin)...')
      const projectsRef = collection(db, 'projects')
      const querySnapshot = await getDocs(projectsRef)

      const projects: Project[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        projects.push({
          projectId: doc.id,
          name: data.name || doc.id,
          description: data.description,
          created_at: data.created_at,
          owner_id: data.owner_id,
          status: data.status || 'active',
        })
      })

      console.log(`✅ Fetched ${projects.length} projects`)
      return projects
    } catch (err) {
      console.error('❌ Error fetching all projects:', err)
      throw err
    }
  }

  /**
   * Fetch assigned projects (Admin)
   * Fetches only projects from user.projects array
   */
  const fetchAssignedProjects = async (assignedProjectIds: string[]): Promise<Project[]> => {
    try {
      console.log('📋 Fetching assigned projects (Admin)...', assignedProjectIds)

      if (!assignedProjectIds || assignedProjectIds.length === 0) {
        console.warn('⚠️ No assigned projects found for this admin')
        return []
      }

      const projects: Project[] = []

      // Fetch each assigned project document
      // Note: Firestore 'in' query is limited to 10 items, so we batch if needed
      const batchSize = 10
      for (let i = 0; i < assignedProjectIds.length; i += batchSize) {
        const batch = assignedProjectIds.slice(i, i + batchSize)

        const projectsRef = collection(db, 'projects')
        const q = query(projectsRef, where(documentId(), 'in', batch))
        const querySnapshot = await getDocs(q)

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          projects.push({
            projectId: doc.id,
            name: data.name || doc.id,
            description: data.description,
            created_at: data.created_at,
            owner_id: data.owner_id,
            status: data.status || 'active',
          })
        })
      }

      console.log(`✅ Fetched ${projects.length} assigned projects`)
      return projects
    } catch (err) {
      console.error('❌ Error fetching assigned projects:', err)
      throw err
    }
  }

  /**
   * Load projects based on user role
   */
  const loadProjects = async () => {
    if (!currentUser || !userRole || !hasCMSAccess) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let projects: Project[] = []

      if (userRole === 'Super') {
        // Super admin: Fetch ALL projects
        projects = await fetchAllProjects()
      } else if (userRole === 'Admin') {
        // Admin: Fetch only assigned projects
        const assignedProjectIds = userData?.projects || []
        projects = await fetchAssignedProjects(assignedProjectIds)
      }

      // Filter out archived projects (optional)
      const activeProjects = projects.filter((p) => p.status !== 'archived')

      setProjectsList(activeProjects)

      // Auto-select first project if no project is selected
      if (activeProjects.length > 0 && !selectedProject) {
        // Try to restore from sessionStorage
        const savedProject = sessionStorage.getItem(SELECTED_PROJECT_KEY)
        if (savedProject) {
          try {
            const parsed = JSON.parse(savedProject)
            // Verify the saved project is still in the list
            const found = activeProjects.find((p) => p.projectId === parsed.projectId)
            if (found) {
              setSelectedProjectState(found)
              console.log('✅ Restored selected project from session:', found.name)
            } else {
              // Saved project no longer accessible, select first
              setSelectedProject(activeProjects[0])
            }
          } catch {
            // Invalid saved data, select first
            setSelectedProject(activeProjects[0])
          }
        } else {
          // No saved project, select first
          setSelectedProject(activeProjects[0])
        }
      }

      setIsLoading(false)
    } catch (err: any) {
      console.error('❌ Error loading projects:', err)
      setError(err.message || 'Failed to load projects. Please try again.')
      setIsLoading(false)
    }
  }

  /**
   * Load projects when user is authenticated
   */
  useEffect(() => {
    if (!authLoading && currentUser && hasCMSAccess) {
      console.log('🔐 User authenticated with CMS access, loading projects...')
      loadProjects()
    } else if (!authLoading && !hasCMSAccess) {
      console.warn('⚠️ User does not have CMS access, skipping project loading')
      setIsLoading(false)
    }
  }, [authLoading, currentUser, hasCMSAccess, userRole])

  const value: ProjectContextType = {
    selectedProject,
    setSelectedProject,
    projectsList,
    isLoading,
    error,
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

/**
 * Custom hook to use the Project Context
 *
 * @throws {Error} If used outside of ProjectProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { selectedProject, projectsList, setSelectedProject } = useProject()
 *
 *   if (!selectedProject) {
 *     return <div>Please select a project</div>
 *   }
 *
 *   // Use selectedProject.projectId in all Firestore queries
 *   const docRef = getProjectScopedDocRef('content', docId, selectedProject.projectId)
 * }
 * ```
 */
export function useProject(): ProjectContextType {
  const context = useContext(ProjectContext)

  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }

  return context
}

/**
 * Export the context for advanced use cases
 */
export { ProjectContext }

/**
 * Export types for external use
 */
export type { ProjectContextType }
