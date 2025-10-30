/**
 * Firebase User Repository Implementation
 *
 * Concrete implementation of IUserRepository using Firebase Firestore.
 * This is the ONLY place where Firebase SDK calls for user operations should exist.
 *
 * **Clean Architecture - Infrastructure Layer:**
 * - Implements IUserRepository interface from core layer
 * - Contains ALL Firebase SDK logic for user operations
 * - Uses UserAdapter to convert Firebase types to domain entities
 * - Maintains framework independence by keeping Firebase isolated
 *
 * **Firestore Collection Structure:**
 * ```
 * users/{userId}
 * ```
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  or,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { IUserRepository } from '@/domain/repositories'
import type { User, UserRole, CreateUserInput, UpdateUserInput } from '@/domain/entities/User'
import { UserAdapter } from '../adapters/UserAdapter'

/**
 * FirebaseUserRepository
 *
 * Handles all user management operations with Firestore
 */
export class FirebaseUserRepository implements IUserRepository {
  /**
   * Create a new user
   *
   * Creates a new user document in the database.
   * This method directly creates a user with the specified role and properties.
   *
   * @param userData - Complete user data including uid, email, role, etc.
   * @returns Promise<string> - The created user's UID
   */
  async createUser(userData: CreateUserInput): Promise<string> {
    try {
      console.log(`📝 FirebaseUserRepository: Creating user for ${userData.email}...`)

      const userDocRef = doc(db, 'users', userData.uid)

      // Check if user already exists
      const userDocSnap = await getDoc(userDocRef)
      if (userDocSnap.exists()) {
        throw new Error(`User with UID ${userData.uid} already exists`)
      }

      // Prepare user document
      const newUserData = {
        email: userData.email,
        name: userData.name || userData.displayName || '',
        display_name: userData.displayName || userData.name || '',
        photo_url: userData.photoUrl || '',
        role: userData.role || 'User',
        projects: userData.projects || [],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        last_login: serverTimestamp(),
      }

      await setDoc(userDocRef, newUserData)

      console.log(`✅ FirebaseUserRepository: User created with UID: ${userData.uid}`)
      return userData.uid
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error creating user:', error)
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Ensure user document exists
   *
   * Creates a new user document if it doesn't exist, or returns the existing role.
   * This is called after Google Sign-In to ensure every authenticated user has a Firestore document.
   *
   * @param input - User data from Firebase Auth
   * @returns Promise<UserRole> - The user's role
   */
  async ensureUserDocument(input: CreateUserInput): Promise<UserRole> {
    try {
      console.log(`📋 FirebaseUserRepository: Ensuring user document for ${input.email}...`)

      const userDocRef = doc(db, 'users', input.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        // User document EXISTS - return stored role
        const data = userDocSnap.data()
        const role = (data.role as UserRole) || 'User'

        console.log(`✅ FirebaseUserRepository: Existing user document found - Role: ${role}`)

        // Update last_login timestamp
        await setDoc(
          userDocRef,
          {
            last_login: serverTimestamp(),
            updated_at: serverTimestamp(),
          },
          { merge: true }
        )

        // Validate role
        const validRoles: UserRole[] = ['Super', 'Admin', 'User']
        if (!validRoles.includes(role)) {
          console.warn(`⚠️ FirebaseUserRepository: Invalid role "${role}" detected, defaulting to "User"`)
          return 'User'
        }

        return role
      } else {
        // User document DOES NOT EXIST - create new document
        console.log('📝 FirebaseUserRepository: User document not found, creating new document...')

        const newUserData = {
          email: input.email,
          name: input.name || input.displayName || '',
          display_name: input.displayName || input.name || '',
          photo_url: input.photoUrl || '',
          role: input.role || 'User', // Default to 'User' role
          projects: input.projects || [],
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          last_login: serverTimestamp(),
        }

        await setDoc(userDocRef, newUserData)

        console.log('✅ FirebaseUserRepository: New user document created with role: "User"')
        console.log('⚠️ FirebaseUserRepository: New user has "User" role - CMS access DENIED')

        return input.role || 'User'
      }
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error ensuring user document:', error)
      // On error, default to least privileged role for security
      return 'User'
    }
  }

  /**
   * Get user by ID
   *
   * @param userId - The user's UID
   * @returns Promise<User | null> - User data or null if not found
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      console.log(`📋 FirebaseUserRepository: Fetching user data for userId: ${userId}`)

      const userDocRef = doc(db, 'users', userId)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const user = UserAdapter.toEntity(userDocSnap.id, userDocSnap.data())
        console.log(`✅ FirebaseUserRepository: User data retrieved - Role: ${user.role}`)
        return user
      } else {
        console.warn(`⚠️ FirebaseUserRepository: User document not found for userId: ${userId}`)
        return null
      }
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error fetching user data:', error)
      return null
    }
  }

  /**
   * Get user by email
   *
   * @param email - The user's email address
   * @returns Promise<User | null> - User data or null if not found
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      console.log(`📋 FirebaseUserRepository: Fetching user by email: ${email}`)

      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        console.warn(`⚠️ FirebaseUserRepository: No user found with email: ${email}`)
        return null
      }

      const doc = querySnapshot.docs[0]
      const user = UserAdapter.toEntity(doc.id, doc.data())
      console.log(`✅ FirebaseUserRepository: User found - UID: ${user.uid}`)
      return user
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error fetching user by email:', error)
      return null
    }
  }

  /**
   * Get all users
   *
   * @returns Promise<User[]> - Array of all users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      console.log('📋 FirebaseUserRepository: Fetching all users...')

      const usersRef = collection(db, 'users')
      const querySnapshot = await getDocs(usersRef)

      const users: User[] = []
      querySnapshot.forEach((doc) => {
        const user = UserAdapter.toEntity(doc.id, doc.data())
        users.push(user)
      })

      console.log(`✅ FirebaseUserRepository: Fetched ${users.length} users`)
      return users
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error fetching all users:', error)
      throw new Error(`Failed to fetch all users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get admins and super users
   *
   * @returns Promise<User[]> - Array of Admin and Super users
   */
  async getAdminsAndSuperUsers(): Promise<User[]> {
    try {
      console.log('📋 FirebaseUserRepository: Fetching Admin and Super users...')

      const usersRef = collection(db, 'users')
      const usersQuery = query(
        usersRef,
        or(where('role', '==', 'Super'), where('role', '==', 'Admin'))
      )

      const querySnapshot = await getDocs(usersQuery)

      const users: User[] = []
      querySnapshot.forEach((doc) => {
        const user = UserAdapter.toEntity(doc.id, doc.data())
        users.push(user)
      })

      console.log(`✅ FirebaseUserRepository: Fetched ${users.length} Admin/Super users`)
      return users
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error fetching Admin/Super users:', error)
      throw new Error(
        `Failed to fetch Admin/Super users: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Update user role
   *
   * @param userId - The user ID whose role is being updated
   * @param newRole - The new role to assign
   * @param actingUserId - The Super user ID performing the role change
   * @returns Promise<void>
   */
  async updateUserRole(userId: string, newRole: UserRole, actingUserId: string): Promise<void> {
    try {
      // Validate inputs
      if (!userId || !newRole || !actingUserId) {
        throw new Error('Invalid parameters: userId, newRole, and actingUserId are required')
      }

      if (!['Super', 'Admin', 'User'].includes(newRole)) {
        throw new Error('Invalid role: Role must be "Super", "Admin", or "User"')
      }

      console.log('👤 FirebaseUserRepository: Updating user role')
      console.log(`   Target User: ${userId}`)
      console.log(`   New Role: ${newRole}`)
      console.log(`   Acting User: ${actingUserId}`)

      // Fetch existing user data
      const userDocRef = doc(db, 'users', userId)
      const userDocSnap = await getDoc(userDocRef)

      if (!userDocSnap.exists()) {
        throw new Error(`User not found: ${userId}`)
      }

      const existingData = userDocSnap.data()
      const oldRole = existingData.role || 'User'
      const oldProjects = existingData.projects || []

      // If no change in role, skip update
      if (oldRole === newRole) {
        console.log('⚠️ FirebaseUserRepository: Role unchanged, skipping update')
        return
      }

      console.log(`   Old Role: ${oldRole}`)
      console.log(`   Old Projects: ${oldProjects.length} assigned`)

      // Determine project assignment impact
      let updatedProjects: string[]

      if (newRole === 'Super') {
        updatedProjects = []
        console.log('   → Super role: Clearing projects (implicit all-access)')
      } else if (newRole === 'User') {
        updatedProjects = []
        console.log('   → User role: Clearing projects (no CMS access)')
      } else if (newRole === 'Admin') {
        updatedProjects = oldProjects
        console.log(`   → Admin role: Preserving projects (${updatedProjects.length} projects)`)
      } else {
        updatedProjects = oldProjects
      }

      // Update Firestore document
      await setDoc(
        userDocRef,
        {
          role: newRole,
          projects: updatedProjects,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      )

      console.log(`✅ FirebaseUserRepository: User role updated to "${newRole}"`)
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error updating user role:', error)
      throw new Error(`Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update user profile
   *
   * @param userId - The user ID
   * @param updates - Profile updates
   * @returns Promise<void>
   */
  async updateUserProfile(userId: string, updates: UpdateUserInput): Promise<void> {
    try {
      console.log(`📝 FirebaseUserRepository: Updating user profile for userId: ${userId}`)

      const userDocRef = doc(db, 'users', userId)

      // Build update object
      const updateData: any = {
        updated_at: serverTimestamp(),
      }

      if (updates.name !== undefined) {
        updateData.name = updates.name
      }
      if (updates.displayName !== undefined) {
        updateData.display_name = updates.displayName
      }
      if (updates.photoUrl !== undefined) {
        updateData.photo_url = updates.photoUrl
      }
      if (updates.role !== undefined) {
        updateData.role = updates.role
      }
      if (updates.projects !== undefined) {
        updateData.projects = updates.projects
      }
      if (updates.lastLogin !== undefined) {
        updateData.last_login = updates.lastLogin
      }

      await setDoc(userDocRef, updateData, { merge: true })

      console.log('✅ FirebaseUserRepository: User profile updated successfully')
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error updating user profile:', error)
      throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update user project assignments
   *
   * @param userId - The user ID whose projects are being updated
   * @param projectIds - Array of project IDs to assign
   * @param actingUserId - The Super admin user ID making the change
   * @returns Promise<void>
   */
  async updateUserProjectAssignments(
    userId: string,
    projectIds: string[],
    actingUserId: string
  ): Promise<void> {
    try {
      console.log(`📝 FirebaseUserRepository: Updating project assignments for user ${userId}`)
      console.log(`   New project IDs: ${projectIds.join(', ')}`)
      console.log(`   Acting user: ${actingUserId}`)

      // Validate inputs
      if (!userId || !Array.isArray(projectIds) || !actingUserId) {
        throw new Error('Invalid parameters')
      }

      const userDocRef = doc(db, 'users', userId)
      const userDocSnap = await getDoc(userDocRef)

      if (!userDocSnap.exists()) {
        throw new Error(`User document not found for user ID: ${userId}`)
      }

      // Update Firestore document
      await setDoc(
        userDocRef,
        {
          projects: projectIds,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      )

      console.log('✅ FirebaseUserRepository: Project assignments updated successfully')
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error updating user project assignments:', error)
      throw new Error(
        `Failed to update user project assignments: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Assign user to project
   *
   * @param userId - The user's UID
   * @param projectId - The project ID to assign
   * @returns Promise<boolean> - True if successful
   */
  async assignUserToProject(userId: string, projectId: string): Promise<boolean> {
    try {
      console.log(`📝 FirebaseUserRepository: Assigning user ${userId} to project ${projectId}`)

      const userDocRef = doc(db, 'users', userId)
      const userDocSnap = await getDoc(userDocRef)

      if (!userDocSnap.exists()) {
        console.error(`❌ FirebaseUserRepository: User document not found for userId: ${userId}`)
        return false
      }

      const userData = userDocSnap.data()
      const currentProjects = userData.projects || []

      // Check if already assigned
      if (currentProjects.includes(projectId)) {
        console.log(`⚠️ FirebaseUserRepository: User already assigned to project ${projectId}`)
        return true
      }

      // Add project to user's projects array
      await setDoc(
        userDocRef,
        {
          projects: [...currentProjects, projectId],
          updated_at: serverTimestamp(),
        },
        { merge: true }
      )

      console.log(`✅ FirebaseUserRepository: User assigned to project ${projectId}`)
      return true
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error assigning user to project:', error)
      return false
    }
  }

  /**
   * Remove user from project
   *
   * @param userId - The user's UID
   * @param projectId - The project ID to remove
   * @returns Promise<boolean> - True if successful
   */
  async removeUserFromProject(userId: string, projectId: string): Promise<boolean> {
    try {
      console.log(`📝 FirebaseUserRepository: Removing user ${userId} from project ${projectId}`)

      const userDocRef = doc(db, 'users', userId)
      const userDocSnap = await getDoc(userDocRef)

      if (!userDocSnap.exists()) {
        console.error(`❌ FirebaseUserRepository: User document not found for userId: ${userId}`)
        return false
      }

      const userData = userDocSnap.data()
      const currentProjects = userData.projects || []

      // Filter out the project ID
      const updatedProjects = currentProjects.filter((id: string) => id !== projectId)

      await setDoc(
        userDocRef,
        {
          projects: updatedProjects,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      )

      console.log(`✅ FirebaseUserRepository: User removed from project ${projectId}`)
      return true
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error removing user from project:', error)
      return false
    }
  }

  /**
   * Update last login timestamp
   *
   * @param userId - The user's UID
   * @returns Promise<void>
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId)
      await setDoc(
        userDocRef,
        {
          last_login: serverTimestamp(),
          updated_at: serverTimestamp(),
        },
        { merge: true }
      )
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error updating last login:', error)
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Delete user
   *
   * @param userId - The user ID to delete
   * @returns Promise<void>
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      console.log(`🗑️ FirebaseUserRepository: Deleting user ${userId}`)

      const userDocRef = doc(db, 'users', userId)
      await deleteDoc(userDocRef)

      console.log(`✅ FirebaseUserRepository: User deleted successfully`)
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error deleting user:', error)
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if user has project access
   *
   * @param userId - The user's UID
   * @param projectId - The project ID to check
   * @returns Promise<boolean> - True if user has access
   */
  async hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId)

      if (!user) {
        return false
      }

      // Super users have access to all projects
      if (user.role === 'Super') {
        return true
      }

      // Admin users need explicit project assignment
      if (user.role === 'Admin') {
        return user.projects.includes(projectId)
      }

      // User role has no CMS access
      return false
    } catch (error) {
      console.error('❌ FirebaseUserRepository: Error checking project access:', error)
      return false
    }
  }
}
