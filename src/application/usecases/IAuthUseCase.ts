/**
 * Authentication Use Case Interface
 *
 * Defines the contract for authentication business logic operations.
 * This interface separates authentication concerns from the UI layer.
 *
 * **Framework Independence:**
 * - Methods accept and return only domain entities or primitives
 * - NO Firebase types (User from firebase/auth is converted to domain User)
 * - Completely UI-agnostic
 *
 * **Purpose:**
 * Handles user authentication, session initialization, role validation,
 * and audit logging for authentication events.
 */

import type { User, UserRole } from '@/domain/entities/User'

/**
 * Firebase User Info
 *
 * Minimal user info from Firebase Auth (not the full Firebase User object)
 */
export interface FirebaseUserInfo {
  uid: string
  email: string
  displayName?: string | null
  photoURL?: string | null
}

/**
 * Authentication Session Result
 *
 * Result of initializing a user session
 */
export interface AuthSessionResult {
  /**
   * The authenticated user from Firestore (domain entity)
   */
  user: User

  /**
   * Whether the user has CMS access (Super or Admin role)
   */
  hasCMSAccess: boolean

  /**
   * Whether this is a new user (first time sign-in)
   */
  isNewUser: boolean
}

/**
 * Sign-in Result
 *
 * Result of a sign-in operation with role validation
 */
export interface SignInResult {
  /**
   * Whether sign-in was successful
   */
  success: boolean

  /**
   * The authenticated user (if successful)
   */
  user: User | null

  /**
   * Whether the user has CMS access
   */
  hasCMSAccess: boolean

  /**
   * Error message (if failed)
   */
  error?: string

  /**
   * Error code for programmatic handling
   */
  errorCode?: 'ACCESS_DENIED' | 'USER_NOT_FOUND' | 'UNKNOWN_ERROR'
}

/**
 * IAuthUseCase
 *
 * Use case interface for authentication operations
 */
export interface IAuthUseCase {
  /**
   * Initialize user session
   *
   * Called when Firebase Auth state changes (user signs in or page loads with existing session).
   * Handles the complete flow:
   * 1. Check if user exists in Firestore
   * 2. Create user document if new (with default 'User' role)
   * 3. Fetch user data from Firestore
   * 4. Log LOGIN audit action
   * 5. Return user data and access status
   *
   * @param firebaseUser - Firebase user info from onAuthStateChanged
   * @returns Promise<AuthSessionResult | null> - Session data or null if user is signed out
   *
   * @example
   * ```typescript
   * // In AuthContext when Firebase auth state changes
   * onAuthStateChanged(auth, async (firebaseUser) => {
   *   if (firebaseUser) {
   *     const session = await authUseCase.initializeUserSession({
   *       uid: firebaseUser.uid,
   *       email: firebaseUser.email,
   *       displayName: firebaseUser.displayName,
   *       photoURL: firebaseUser.photoURL,
   *     })
   *
   *     if (session.hasCMSAccess) {
   *       // Grant access
   *     } else {
   *       // Deny access
   *     }
   *   }
   * })
   * ```
   */
  initializeUserSession(firebaseUser: FirebaseUserInfo | null): Promise<AuthSessionResult | null>

  /**
   * Handle Google Sign-In
   *
   * Handles the complete sign-in flow with role validation:
   * 1. Ensure user document exists (creates if new)
   * 2. Fetch user role from Firestore
   * 3. Validate CMS access (only Super/Admin allowed)
   * 4. Log LOGIN audit action
   * 5. Return sign-in result with access status
   *
   * This method should be called AFTER Firebase authentication succeeds.
   *
   * @param firebaseUser - Firebase user info from signInWithPopup result
   * @returns Promise<SignInResult> - Sign-in result with access validation
   *
   * @example
   * ```typescript
   * // In AuthContext signInWithGoogle
   * const result = await signInWithPopup(auth, provider)
   * const signInResult = await authUseCase.handleGoogleSignIn({
   *   uid: result.user.uid,
   *   email: result.user.email,
   *   displayName: result.user.displayName,
   *   photoURL: result.user.photoURL,
   * })
   *
   * if (!signInResult.success) {
   *   // Handle error (e.g., access denied)
   *   await firebaseSignOut(auth)
   *   throw new Error(signInResult.error)
   * }
   * ```
   */
  handleGoogleSignIn(firebaseUser: FirebaseUserInfo): Promise<SignInResult>

  /**
   * Handle Sign-Out
   *
   * Logs the LOGOUT audit action.
   * Note: Actual Firebase sign-out should be handled by the UI layer.
   *
   * @param userId - The user ID who is signing out
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * // In AuthContext signOut
   * await authUseCase.handleSignOut(currentUser.uid)
   * await firebaseSignOut(auth)
   * ```
   */
  handleSignOut(userId: string): Promise<void>

  /**
   * Check CMS Access
   *
   * Validates whether a user has CMS access based on their role.
   * Only 'Super' and 'Admin' roles have CMS access.
   *
   * @param userRole - The user's role
   * @returns boolean - True if user has CMS access
   *
   * @example
   * ```typescript
   * const hasAccess = authUseCase.checkCMSAccess(user.role)
   * ```
   */
  checkCMSAccess(userRole: UserRole): boolean

  /**
   * Get user by ID
   *
   * Retrieves a user's data from the repository.
   * Convenience method for UI components.
   *
   * @param userId - The user's UID
   * @returns Promise<User | null> - User data or null if not found
   */
  getUserById(userId: string): Promise<User | null>
}
