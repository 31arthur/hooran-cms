/**
 * Authentication Context
 *
 * Manages the authentication state for Hooran CMS using Firebase Google Sign-In.
 * Provides current user, loading state, user role information, and authentication functions.
 *
 * **CRITICAL SECURITY RULE:** Only users with 'Super' or 'Admin' roles can access the CMS UI.
 * - New users are created with a default 'User' role and will be denied access
 * - Existing users must have 'Super' or 'Admin' role to proceed
 * - Access is enforced during sign-in; unauthorized users are automatically signed out
 *
 * @example
 * ```tsx
 * import { useAuth } from '@/presentation/context/AuthContext'
 *
 * function LoginComponent() {
 *   const { signInWithGoogle, error } = useAuth()
 *
 *   return (
 *     <div>
 *       <button onClick={signInWithGoogle}>Sign in with Google</button>
 *       {error && <p>{error}</p>}
 *     </div>
 *   )
 * }
 *
 * function ProtectedComponent() {
 *   const { currentUser, userRole, isLoading, hasCMSAccess, signOut } = useAuth()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!currentUser) return <div>Please login</div>
 *   if (!hasCMSAccess) {
 *     return <div>Access denied. Admin privileges required.</div>
 *   }
 *
 *   return (
 *     <div>
 *       <p>Welcome to CMS, {currentUser.email}</p>
 *       <button onClick={signOut}>Sign out</button>
 *     </div>
 *   )
 * }
 * ```
 */

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  type User,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { DIContainer, DI_TYPES } from '@/domain/di'
import { auth } from '@/firebase'
import type { IUserManagementUseCase } from '@/application/usecases'
import type { IAuditLoggingUseCase } from '@/application/usecases/AuditLoggingUseCase'

/**
 * Service User Role Type (for compatibility)
 */
export type UserRole = 'Super' | 'Admin' | 'User' | null


/**
 * User data from Firestore users collection
 */
interface UserData {
  id: string
  email: string
  display_name?: string
  photo_url?: string
  role: UserRole
  projects: string[] // Array of project IDs the user has access to
  created_at: any
  updated_at: any
  last_login?: any
}

/**
 * Authentication Context Type
 */
interface AuthContextType {
  /**
   * The currently authenticated Firebase user
   * Null if not authenticated
   */
  currentUser: User | null

  /**
   * User's role from Firestore
   * Only 'Super' and 'Admin' can access CMS UI
   */
  userRole: UserRole

  /**
   * User's data from Firestore users collection
   */
  userData: UserData | null

  /**
   * Loading state during initial auth check
   * True while fetching auth state and user role
   */
  isLoading: boolean

  /**
   * Whether the user has CMS access
   * Only true for 'Super' and 'Admin' roles
   */
  hasCMSAccess: boolean

  /**
   * Error message if role fetch fails
   */
  error: string | null

  /**
   * Sign in with Google
   * Creates user document if doesn't exist
   * Only allows Super and Admin roles to access CMS
   */
  signInWithGoogle: () => Promise<void>

  /**
   * Sign out the current user
   */
  signOut: () => Promise<void>
}

/**
 * Authentication Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Authentication Provider Props
 */
interface AuthProviderProps {
  children: ReactNode
}

/**
 * Authentication Provider Component
 *
 * Wraps the application and provides authentication state.
 * Listens to Firebase auth state changes and fetches user role from Firestore.
 *
 * @example
 * ```tsx
 * // In main.tsx or App.tsx
 * import { AuthProvider } from '@/presentation/context/AuthContext'
 *
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Get UserManagementUseCase from DI container
  const userManagementUseCase = DIContainer.resolve<IUserManagementUseCase>(DI_TYPES.UserManagementUseCase)

  /**
   * Fetch user role from Firestore
   * Uses UserManagementUseCase to get user data
   */
  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    try {
      setError(null)
      console.log(`📋 AuthContext: Fetching user role for userId: ${userId}`)

      // Use UserManagementUseCase to get user data
      const user = await userManagementUseCase.getUserData(userId)

      if (user) {
        const role = user.role

        setUserRole(role)
        setUserData({
          id: userId,
          email: user.email,
          display_name: user.displayName,
          role: user.role,
          projects: user.projects,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
        } as UserData)

        console.log(`✅ AuthContext: User role fetched: ${role}`)

        // Log warning if user doesn't have CMS access
        if (role !== 'Super' && role !== 'Admin') {
          console.warn(
            `⚠️ AuthContext: User "${user.email}" has role "${role}" - CMS access denied. Only 'Super' and 'Admin' roles can access the CMS UI.`
          )
        }

        return role
      } else {
        console.error(`❌ AuthContext: User document not found for userId: ${userId}`)
        setError('User profile not found. Please contact an administrator.')
        setUserRole(null)
        setUserData(null)
        return null
      }
    } catch (err) {
      console.error('❌ AuthContext: Error fetching user role:', err)
      setError('Failed to fetch user permissions. Please try again.')
      setUserRole(null)
      setUserData(null)
      return null
    }
  }

  /**
   * Sign in with Google
   * Uses UserManagementUseCase to ensure user document exists and get role
   * Only allows access to users with 'Super' or 'Admin' roles
   */
  const signInWithGoogle = async (): Promise<void> => {
    try {
      setError(null)
      console.log('🔐 AuthContext: Starting Google Sign-In...')

      // Initialize Google Auth Provider
      const provider = new GoogleAuthProvider()

      // Sign in with popup
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      console.log(`✅ AuthContext: Google Sign-In successful: ${user.email}`)

      // CRITICAL: Ensure user document exists and get role
      // This calls UserManagementUseCase which creates the document if it doesn't exist
      // Check if this is a new user signup (before calling ensureUserDocument)
      const existingUserCheck = await userManagementUseCase.getUserData(user.uid)
      const isNewUser = !existingUserCheck

      const userRole = await userManagementUseCase.ensureUserDocument(
        user.uid,
        user.email || '',
        user.displayName || undefined,
        user.photoURL
      )

      console.log(`📋 AuthContext: User role from UserManagementUseCase: ${userRole}`)

      // Log signup for new users
      if (isNewUser) {
        try {
          const auditLoggingUseCase = DIContainer.resolve<IAuditLoggingUseCase>(
            DI_TYPES.AuditLoggingUseCase
          )
          await auditLoggingUseCase.logAudit({
            action: 'create',
            resourceType: 'user',
            resourceId: user.uid,
            resourceName: user.displayName || user.email || 'New User',
            projectId: undefined,
            userId: user.uid,
            userEmail: user.email || '',
            userName: user.displayName || user.email || 'New User',
            userRole: userRole as any,
            metadata: {
              signupMethod: 'Google',
              initialRole: userRole,
            },
            status: 'success',
          })
          console.log('📝 AuthContext: Signup audit log created for new user')
        } catch (auditError) {
          console.error('⚠️ AuthContext: Failed to create signup audit log', auditError)
          // Don't throw - audit logging should not break signup
        }
      }

      // Fetch complete user data
      const userDataResult = await userManagementUseCase.getUserData(user.uid)
      if (userDataResult) {
        setUserRole(userRole)
        setUserData({
          id: user.uid,
          email: userDataResult.email,
          display_name: userDataResult.displayName,
          role: userDataResult.role,
          projects: userDataResult.projects,
          created_at: userDataResult.createdAt,
          updated_at: userDataResult.updatedAt,
        } as UserData)
      }

      // Enforce CMS access control: Only 'Super' and 'Admin' can access
      if (userRole !== 'Super' && userRole !== 'Admin') {
        console.error(
          `🚫 AuthContext: Access denied: User "${user.email}" has role "${userRole}". Only 'Super' and 'Admin' roles can access the CMS.`
        )

        // Sign out the user
        await firebaseSignOut(auth)

        // Clear state
        setCurrentUser(null)
        setUserRole(null)
        setUserData(null)

        // Set error message
        setError(
          `Access denied. Only administrators can access this CMS. Your account has "${userRole}" privileges. Please contact your system administrator for access.`
        )

        throw new Error(
          `Access denied: Only 'Super' and 'Admin' roles can access the CMS. Your role: ${userRole}`
        )
      }

      console.log(`✅ CMS access granted for role: ${userRole}`)

      // Log successful login to audit trail
      try {
        const auditLoggingUseCase = DIContainer.resolve<IAuditLoggingUseCase>(
          DI_TYPES.AuditLoggingUseCase
        )
        await auditLoggingUseCase.logLogin(
          user.uid,
          user.email || '',
          user.displayName || user.email || 'Unknown User',
          userRole
        )
        console.log('📝 AuthContext: Login audit log created')
      } catch (auditError) {
        console.error('⚠️ AuthContext: Failed to create login audit log', auditError)
        // Don't throw - audit logging should not break login
      }
    } catch (err: any) {
      console.error('❌ Google Sign-In error:', err)

      // Don't overwrite access denied error
      if (!err.message?.includes('Access denied')) {
        if (err.code === 'auth/popup-closed-by-user') {
          setError('Sign-in cancelled. Please try again.')
        } else if (err.code === 'auth/popup-blocked') {
          setError('Pop-up blocked. Please allow pop-ups for this site.')
        } else {
          setError('Failed to sign in with Google. Please try again.')
        }
      }

      throw err
    }
  }

  /**
   * Sign out the current user
   */
  const signOut = async (): Promise<void> => {
    try {
      console.log('🔓 Signing out...')

      // Log logout before signing out (we need user data)
      if (currentUser && userRole) {
        try {
          const auditLoggingUseCase = DIContainer.resolve<IAuditLoggingUseCase>(
            DI_TYPES.AuditLoggingUseCase
          )
          await auditLoggingUseCase.logLogout(
            currentUser.uid,
            currentUser.email || '',
            currentUser.displayName || currentUser.email || 'Unknown User',
            userRole
          )
          console.log('📝 AuthContext: Logout audit log created')
        } catch (auditError) {
          console.error('⚠️ AuthContext: Failed to create logout audit log', auditError)
          // Don't throw - audit logging should not break logout
        }
      }

      await firebaseSignOut(auth)
      console.log('✅ Sign out successful')
    } catch (err) {
      console.error('❌ Sign out error:', err)
      setError('Failed to sign out. Please try again.')
      throw err
    }
  }

  /**
   * Initialize auth listener
   * Listens for Firebase auth state changes
   */
  useEffect(() => {
    console.log('🔐 Initializing AuthContext...')

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', user ? `User: ${user.email}` : 'No user')

      setCurrentUser(user)

      if (user) {
        // User is signed in - fetch their role from Firestore
        await fetchUserRole(user.uid)
      } else {
        // User is signed out - clear state
        setUserRole(null)
        setUserData(null)
        setError(null)
      }

      setIsLoading(false)
    })

    // Cleanup subscription on unmount
    return () => {
      console.log('🔓 Cleaning up AuthContext...')
      unsubscribe()
    }
  }, [])

  /**
   * Compute whether user has CMS access
   * Only 'Super' and 'Admin' roles can access CMS
   */
  const hasCMSAccess = userRole === 'Super' || userRole === 'Admin'

  const value: AuthContextType = {
    currentUser,
    userRole,
    userData,
    isLoading,
    hasCMSAccess,
    error,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook to use the Auth Context
 *
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentUser, userRole, isLoading, hasCMSAccess } = useAuth()
 *
 *   if (isLoading) {
 *     return <div>Loading...</div>
 *   }
 *
 *   if (!currentUser) {
 *     return <div>Please sign in</div>
 *   }
 *
 *   if (!hasCMSAccess) {
 *     return <div>Access denied. Admin privileges required.</div>
 *   }
 *
 *   return <div>Welcome, {currentUser.email}</div>
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

/**
 * Export the context for advanced use cases
 */
export { AuthContext }

/**
 * Export types for external use
 */
export type { AuthContextType, UserData }
