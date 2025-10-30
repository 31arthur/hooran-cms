/**
 * Firebase Project Repository
 *
 * Concrete implementation of IProjectRepository using Firebase Firestore.
 * This is the ONLY place in the application where Project-related Firebase SDK calls occur.
 *
 * **CRITICAL: Framework Independence**
 * This class:
 * - Implements IProjectRepository interface
 * - Contains ALL Firebase-specific code for projects
 * - Converts Firebase types to domain entities using ProjectAdapter
 * - Handles Firebase-specific errors
 * - Is completely replaceable without affecting business logic
 *
 * **Firestore Structure:**
 * projects/{projectId}
 *   - name: string
 *   - slug: string
 *   - status: 'Active' | 'Draft' | 'Archived'
 *   - description: string
 *   - createdBy: string
 *   - created_at: Timestamp
 *   - updated_at: Timestamp
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { IProjectRepository } from '@/domain/repositories'
import type { Project, ProjectMetadata } from '@/domain/entities'
import { ProjectAdapter } from '@/infrastructure/adapters/ProjectAdapter'
import { AuditService } from '@/services'

/**
 * FirebaseProjectRepository
 *
 * Implements the IProjectRepository interface using Firebase Firestore as the data store.
 */
export class FirebaseProjectRepository implements IProjectRepository {
  private readonly collectionName = 'projects'

  /**
   * Get all projects
   *
   * Fetches all project documents from Firestore and converts them to domain entities.
   *
   * @returns Promise<Project[]> - Array of all projects
   * @throws Error if Firestore query fails
   */
  async getProjects(): Promise<Project[]> {
    try {
      console.log('📋 FirebaseProjectRepository: Fetching all projects')

      const projectsRef = collection(db, this.collectionName)
      const querySnapshot = await getDocs(projectsRef)

      const projects: Project[] = []
      querySnapshot.forEach((docSnap) => {
        const project = ProjectAdapter.toEntity(docSnap.id, docSnap.data())
        projects.push(project)
      })

      console.log(`✅ FirebaseProjectRepository: Fetched ${projects.length} projects`)
      return projects
    } catch (error) {
      console.error('❌ FirebaseProjectRepository: Error fetching projects:', error)
      throw new Error(
        `Failed to fetch projects: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get a project by ID
   *
   * @param projectId - The project ID to fetch
   * @returns Promise<Project | null> - The project or null if not found
   * @throws Error if Firestore read fails
   */
  async getProjectById(projectId: string): Promise<Project | null> {
    try {
      console.log(`📋 FirebaseProjectRepository: Fetching project ${projectId}`)

      const projectDocRef = doc(db, this.collectionName, projectId)
      const projectDocSnap = await getDoc(projectDocRef)

      if (!projectDocSnap.exists()) {
        console.log(`⚠️ FirebaseProjectRepository: Project ${projectId} not found`)
        return null
      }

      const project = ProjectAdapter.toEntity(projectDocSnap.id, projectDocSnap.data())
      console.log(`✅ FirebaseProjectRepository: Fetched project ${projectId}`)
      return project
    } catch (error) {
      console.error(`❌ FirebaseProjectRepository: Error fetching project ${projectId}:`, error)
      throw new Error(
        `Failed to fetch project: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Create a new project
   *
   * Creates a new project document in Firestore with optional admin assignment.
   *
   * @param projectName - The project name
   * @param projectSlug - The unique project slug
   * @param initialAdminEmail - Optional email of initial admin user
   * @param userId - The user ID creating the project
   * @returns Promise<string> - The created project ID
   * @throws Error if validation fails or creation fails
   */
  async createProject(
    projectName: string,
    projectSlug: string,
    initialAdminEmail: string | null,
    userId: string
  ): Promise<string> {
    try {
      console.log('🚀 FirebaseProjectRepository: Creating new project')
      console.log(`   Name: ${projectName}`)
      console.log(`   Slug: ${projectSlug}`)
      console.log(`   Creator: ${userId}`)

      // Validate input
      if (!projectName || !projectSlug || !userId) {
        throw new Error('Invalid input: projectName, projectSlug, and userId are required')
      }

      // Validate slug format
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      if (!slugRegex.test(projectSlug)) {
        throw new Error(
          'Invalid project slug format: Must contain only lowercase letters, numbers, and hyphens'
        )
      }

      // Check if project slug already exists
      const projectDocRef = doc(db, this.collectionName, projectSlug)
      const existingProject = await getDoc(projectDocRef)

      if (existingProject.exists()) {
        throw new Error(
          `Project slug "${projectSlug}" already exists. Please choose a different slug.`
        )
      }

      // Prepare project data using adapter
      const projectData = {
        ...ProjectAdapter.toFirestoreCreate(projectName, projectSlug, userId),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }

      // Create project document
      await setDoc(projectDocRef, projectData)
      console.log(`✅ FirebaseProjectRepository: Project created with ID: ${projectSlug}`)

      // Handle admin assignment if provided
      if (initialAdminEmail && initialAdminEmail.trim() !== '') {
        await this.assignInitialAdmin(projectSlug, initialAdminEmail, userId)
      }

      // Audit logging
      try {
        await AuditService.logAction({
          projectId: projectSlug,
          userId,
          action: 'CREATE',
          resourceType: 'PROJECT',
          resourceId: projectSlug,
          details: {
            project_name: projectName,
            project_slug: projectSlug,
            initial_status: 'Active',
            createdBy: userId,
            initial_admin_email: initialAdminEmail || null,
          },
          timestamp: new Date(),
        })
        console.log('✅ FirebaseProjectRepository: Audit log created')
      } catch (auditError) {
        console.error('❌ FirebaseProjectRepository: Audit logging failed:', auditError)
      }

      return projectSlug
    } catch (error) {
      console.error('❌ FirebaseProjectRepository: Error creating project:', error)
      throw new Error(
        `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Assign initial admin to project (private helper)
   */
  private async assignInitialAdmin(
    projectSlug: string,
    adminEmail: string,
    _userId: string
  ): Promise<void> {
    try {
      console.log(`🔍 FirebaseProjectRepository: Looking up admin user: ${adminEmail}`)

      const usersRef = collection(db, 'users')
      const userQuery = query(usersRef, where('email', '==', adminEmail.trim()))
      const userSnapshot = await getDocs(userQuery)

      if (userSnapshot.empty) {
        throw new Error(`User with email "${adminEmail}" not found in the system.`)
      }

      const userDoc = userSnapshot.docs[0]
      const userData = userDoc.data()
      const userRole = userData.role

      if (userRole !== 'Admin') {
        throw new Error(
          `User with email "${adminEmail}" has role '${userRole}'. Only users with role 'Admin' can be assigned to projects.`
        )
      }

      const existingProjects = userData.projects || []
      if (!existingProjects.includes(projectSlug)) {
        const updatedProjects = [...existingProjects, projectSlug]
        await updateDoc(doc(db, 'users', userDoc.id), {
          projects: updatedProjects,
          updated_at: serverTimestamp(),
        })
        console.log(`✅ FirebaseProjectRepository: Admin assigned to project`)
      }
    } catch (error) {
      console.error('❌ FirebaseProjectRepository: Admin assignment failed:', error)
      throw error
    }
  }

  /**
   * Update project metadata
   *
   * @param projectId - The project ID to update
   * @param metadata - The updated metadata
   * @param userId - The user ID performing the update
   * @returns Promise<void>
   * @throws Error if project not found or update fails
   */
  async updateProjectMetadata(
    projectId: string,
    metadata: ProjectMetadata,
    userId: string
  ): Promise<void> {
    try {
      console.log(`📝 FirebaseProjectRepository: Updating project ${projectId}`)

      // Validate input
      if (!projectId || !metadata || !userId) {
        throw new Error('Invalid input: projectId, metadata, and userId are required')
      }

      // Fetch existing project to track changes
      const existingProject = await this.getProjectById(projectId)
      if (!existingProject) {
        throw new Error(`Project not found: ${projectId}`)
      }

      // Track changes for audit
      const changes: string[] = []
      const changeDetails: Record<string, any> = {}

      if (metadata.name !== existingProject.name) {
        changes.push('name')
        changeDetails.name = { old: existingProject.name, new: metadata.name }
      }

      if (metadata.status !== existingProject.status) {
        changes.push('status')
        changeDetails.status = { old: existingProject.status, new: metadata.status }
      }

      if (changes.length === 0) {
        console.log('⚠️ FirebaseProjectRepository: No changes detected')
        return
      }

      // Prepare update data using adapter
      const updateData = {
        ...ProjectAdapter.toFirestoreUpdate(metadata),
        updated_at: serverTimestamp(),
      }

      // Update Firestore
      const projectDocRef = doc(db, this.collectionName, projectId)
      await updateDoc(projectDocRef, updateData)
      console.log(`✅ FirebaseProjectRepository: Project ${projectId} updated`)

      // Audit logging
      try {
        await AuditService.logAction({
          projectId,
          userId,
          action: 'UPDATE',
          resourceType: 'PROJECT',
          resourceId: projectId,
          details: {
            field_changes: changes,
            changes: changeDetails,
            new_name: metadata.name,
            new_status: metadata.status,
          },
          timestamp: new Date(),
        })
        console.log('✅ FirebaseProjectRepository: Audit log created')
      } catch (auditError) {
        console.error('❌ FirebaseProjectRepository: Audit logging failed:', auditError)
      }
    } catch (error) {
      console.error(`❌ FirebaseProjectRepository: Error updating project ${projectId}:`, error)
      throw new Error(
        `Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Delete a project
   *
   * @param projectId - The project ID to delete
   * @param userId - The user ID performing the deletion
   * @returns Promise<void>
   * @throws Error if project not found or deletion fails
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    try {
      console.log(`🗑️ FirebaseProjectRepository: Deleting project ${projectId}`)

      // Verify project exists
      const project = await this.getProjectById(projectId)
      if (!project) {
        throw new Error(`Project not found: ${projectId}`)
      }

      // Delete from Firestore
      const projectDocRef = doc(db, this.collectionName, projectId)
      await deleteDoc(projectDocRef)
      console.log(`✅ FirebaseProjectRepository: Project ${projectId} deleted`)

      // Audit logging
      try {
        await AuditService.logAction({
          projectId,
          userId,
          action: 'DELETE',
          resourceType: 'PROJECT',
          resourceId: projectId,
          details: {
            project_name: project.name,
            project_slug: project.slug,
          },
          timestamp: new Date(),
        })
        console.log('✅ FirebaseProjectRepository: Audit log created')
      } catch (auditError) {
        console.error('❌ FirebaseProjectRepository: Audit logging failed:', auditError)
      }
    } catch (error) {
      console.error(`❌ FirebaseProjectRepository: Error deleting project ${projectId}:`, error)
      throw new Error(
        `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Check if a project exists
   *
   * @param projectId - The project ID to check
   * @returns Promise<boolean> - True if project exists
   */
  async projectExists(projectId: string): Promise<boolean> {
    try {
      const projectDocRef = doc(db, this.collectionName, projectId)
      const projectDocSnap = await getDoc(projectDocRef)
      return projectDocSnap.exists()
    } catch (error) {
      console.error(`❌ FirebaseProjectRepository: Error checking project existence:`, error)
      return false
    }
  }
}
