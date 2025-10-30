/**
 * Authentication Use Case Implementation
 *
 * Implements the authentication business logic, separating it from the UI layer.
 *
 * **Clean Architecture - Application Layer:**
 * - Orchestrates authentication workflows
 * - Depends on repository interfaces (not concrete implementations)
 * - Contains business rules for role validation and access control
 * - Framework-independent (no Firebase types in method signatures)
 *
 * **Responsibilities:**
 * 1. User session initialization
 * 2. New user creation with default role
 * 3. Role-based access validation
 * 4. Audit logging for authentication events
 *
 * **Constructor Injection:**
 * ```typescript
 * const authUseCase = new AuthUseCase(userRepository, auditRepository)
 * ```
 */

import type { IUserRepository } from '@/domain/repositories/IUserRepository'
import type { IAuditRepository } from '@/domain/repositories/IAuditRepository'
import type { User } from '@/domain/entities/User'
import type { UserRole } from '@/domain/entities/User'
import type {
  IAuthUseCase,
  FirebaseUserInfo,
  AuthSessionResult,
  SignInResult,
} from './IAuthUseCase'

/**
 * AuthUseCase
 *
 * Concrete implementation of authentication business logic
 */
export class AuthUseCase implements IAuthUseCase {
  private readonly userRepository: IUserRepository
  private readonly auditRepository: IAuditRepository

  /**
   * Constructor with Dependency Injection
   *
   * @param userRepository - User repository for user data operations
   * @param auditRepository - Audit repository for logging authentication events
   */
  constructor(
    userRepository: IUserRepository,
    auditRepository: IAuditRepository
  ) {
    this.userRepository = userRepository
    this.auditRepository = auditRepository
  }

  /**
   * Initialize user session
   *
   * Handles the complete session initialization flow when Firebase auth state changes.
   *
   * **Flow:**
   * 1. Return null if no Firebase user (signed out)
   * 2. Ensure user document exists in Firestore (creates if new)
   * 3. Fetch complete user data from Firestore
   * 4. Check CMS access (Super/Admin only)
   * 5. Log LOGIN audit action
   * 6. Return session result
   *
   * @param firebaseUser - Firebase user info from onAuthStateChanged
   * @returns Promise<AuthSessionResult | null>
   */
  async initializeUserSession(
    firebaseUser: FirebaseUserInfo | null
  ): Promise<AuthSessionResult | null> {
    // Step 1: Handle signed-out state
    if (!firebaseUser) {
      console.log('🔓 AuthUseCase: No Firebase user, session is null')
      return null
    }

    try {
      console.log(`🔐 AuthUseCase: Initializing session for ${firebaseUser.email}`)

      // Step 2: Ensure user document exists (creates if new with default 'User' role)
      const role = await this.userRepository.ensureUserDocument({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || undefined,
        photoUrl: firebaseUser.photoURL || undefined,
      })

      console.log(`📋 AuthUseCase: User role: ${role}`)

      // Step 3: Fetch complete user data
      const user = await this.userRepository.getUserById(firebaseUser.uid)

      if (!user) {
        console.error(`❌ AuthUseCase: User document not found after ensureUserDocument`)
        throw new Error('Failed to retrieve user data')
      }

      // Determine if this is a new user (created_at is very recent)
      const isNewUser = this.isRecentlyCreated(user.createdAt)

      // Step 4: Check CMS access
      const hasCMSAccess = this.checkCMSAccess(user.role)

      console.log(`✅ AuthUseCase: CMS access: ${hasCMSAccess ? 'GRANTED' : 'DENIED'}`)

      if (!hasCMSAccess) {
        console.warn(
          `⚠️ AuthUseCase: User "${user.email}" has role "${user.role}" - CMS access denied`
        )
      }

      // Step 5: Log LOGIN audit action
      try {
        await this.auditRepository.logAction({
          projectId: 'system', // System-level action (no specific project)
          userId: user.uid,
          action: 'LOGIN',
          resourceType: 'AUTH',
          resourceId: user.uid,
          details: {
            email: user.email,
            role: user.role,
            has_cms_access: hasCMSAccess,
            is_new_user: isNewUser,
          },
          timestamp: new Date(),
        })

        console.log('✅ AuthUseCase: LOGIN audit log created')
      } catch (auditError) {
        // Don't fail session initialization if audit logging fails
        console.error('❌ AuthUseCase: Failed to log LOGIN audit:', auditError)
      }

      // Step 6: Return session result
      return {
        user,
        hasCMSAccess,
        isNewUser,
      }
    } catch (error) {
      console.error('❌ AuthUseCase: Error initializing user session:', error)
      throw new Error(
        `Failed to initialize user session: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Handle Google Sign-In
   *
   * Handles the sign-in flow with role validation.
   * Should be called AFTER Firebase authentication succeeds.
   *
   * **Flow:**
   * 1. Ensure user document exists (creates if new)
   * 2. Fetch user data
   * 3. Validate CMS access
   * 4. Log LOGIN audit action
   * 5. Return result with access status
   *
   * @param firebaseUser - Firebase user info from signInWithPopup
   * @returns Promise<SignInResult>
   */
  async handleGoogleSignIn(firebaseUser: FirebaseUserInfo): Promise<SignInResult> {
    try {
      console.log(`🔐 AuthUseCase: Handling Google sign-in for ${firebaseUser.email}`)

      // Step 1: Ensure user document exists
      const role = await this.userRepository.ensureUserDocument({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || undefined,
        photoUrl: firebaseUser.photoURL || undefined,
      })

      console.log(`📋 AuthUseCase: User role from repository: ${role}`)

      // Step 2: Fetch complete user data
      const user = await this.userRepository.getUserById(firebaseUser.uid)

      if (!user) {
        console.error(`❌ AuthUseCase: User document not found for ${firebaseUser.uid}`)
        return {
          success: false,
          user: null,
          hasCMSAccess: false,
          error: 'User profile not found. Please contact an administrator.',
          errorCode: 'USER_NOT_FOUND',
        }
      }

      // Step 3: Validate CMS access
      const hasCMSAccess = this.checkCMSAccess(user.role)

      console.log(`✅ AuthUseCase: CMS access check: ${hasCMSAccess ? 'GRANTED' : 'DENIED'}`)

      // Step 4: Log LOGIN audit action
      try {
        await this.auditRepository.logAction({
          projectId: 'system',
          userId: user.uid,
          action: 'LOGIN',
          resourceType: 'AUTH',
          resourceId: user.uid,
          details: {
            email: user.email,
            role: user.role,
            has_cms_access: hasCMSAccess,
            sign_in_method: 'google',
          },
          timestamp: new Date(),
        })

        console.log('✅ AuthUseCase: LOGIN audit log created')
      } catch (auditError) {
        console.error('❌ AuthUseCase: Failed to log LOGIN audit:', auditError)
        // Don't fail sign-in if audit logging fails
      }

      // Step 5: Return result based on access validation
      if (!hasCMSAccess) {
        console.error(
          `🚫 AuthUseCase: Access denied for user "${user.email}" with role "${user.role}"`
        )

        return {
          success: false,
          user: null,
          hasCMSAccess: false,
          error: `Access denied. Only administrators can access this CMS. Your account has "${user.role}" privileges. Please contact your system administrator for access.`,
          errorCode: 'ACCESS_DENIED',
        }
      }

      console.log(`✅ AuthUseCase: Google sign-in successful for role: ${user.role}`)

      return {
        success: true,
        user,
        hasCMSAccess: true,
      }
    } catch (error) {
      console.error('❌ AuthUseCase: Error handling Google sign-in:', error)

      return {
        success: false,
        user: null,
        hasCMSAccess: false,
        error: 'Failed to sign in. Please try again.',
        errorCode: 'UNKNOWN_ERROR',
      }
    }
  }

  /**
   * Handle Sign-Out
   *
   * Logs the LOGOUT audit action.
   * The actual Firebase sign-out is handled by the UI layer.
   *
   * @param userId - The user ID who is signing out
   * @returns Promise<void>
   */
  async handleSignOut(userId: string): Promise<void> {
    try {
      console.log(`🔓 AuthUseCase: Handling sign-out for user ${userId}`)

      // Get user data for audit log
      const user = await this.userRepository.getUserById(userId)

      // Log LOGOUT audit action
      await this.auditRepository.logAction({
        projectId: 'system',
        userId,
        action: 'LOGOUT',
        resourceType: 'AUTH',
        resourceId: userId,
        details: {
          email: user?.email || 'unknown',
          role: user?.role || 'unknown',
        },
        timestamp: new Date(),
      })

      console.log('✅ AuthUseCase: LOGOUT audit log created')
    } catch (error) {
      // Don't fail sign-out if audit logging fails
      console.error('❌ AuthUseCase: Failed to log LOGOUT audit:', error)
    }
  }

  /**
   * Check CMS Access
   *
   * Validates whether a user has CMS access based on their role.
   * Only 'Super' and 'Admin' roles have CMS access.
   *
   * **Business Rule:**
   * - Super: Full CMS access
   * - Admin: Full CMS access (scoped to assigned projects)
   * - User: No CMS access
   *
   * @param userRole - The user's role
   * @returns boolean - True if user has CMS access
   */
  checkCMSAccess(userRole: UserRole): boolean {
    return userRole === 'Super' || userRole === 'Admin'
  }

  /**
   * Get user by ID
   *
   * Convenience method to fetch user data.
   *
   * @param userId - The user's UID
   * @returns Promise<User | null>
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.getUserById(userId)
  }

  /**
   * Check if user was recently created
   *
   * Determines if a user is new (created within the last 5 minutes).
   * Used to differentiate new users from returning users.
   *
   * @param createdAt - User creation timestamp
   * @returns boolean - True if user is new
   */
  private isRecentlyCreated(createdAt: Date): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return createdAt > fiveMinutesAgo
  }
}
