/**
 * Authentication Context
 *
 * Manages the authentication state for Hooran CMS.
 * Provides current user, loading state, and user role information.
 *
 * **CRITICAL:** Only users with 'Super' or 'Admin' roles can access the CMS UI.
 *
 * @example
 * ```tsx
 * import { useAuth } from '@/context/AuthContext'
 *
 * function MyComponent() {
 *   const { currentUser, userRole, isLoading } = useAuth()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!currentUser) return <div>Please login</div>
 *   if (userRole !== 'Super' && userRole !== 'Admin') {
 *     return <div>Access denied. Admin privileges required.</div>
 *   }
 *
 *   return <div>Welcome to CMS, {currentUser.email}</div>
 * }
 * ```
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'

/**
 * User Role Type
 * Only 'Super' and 'Admin' roles can access the CMS UI
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
 * import { AuthProvider } from '@/context/AuthContext'
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

  /**
   * Fetch user role from Firestore
   * User document is at: users/{userId}
   */
  const fetchUserRole = async (userId: string): Promise<void> => {
    try {
      setError(null)
      const userDocRef = doc(db, 'users', userId)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserData

        // Validate role
        const validRoles: UserRole[] = ['Super', 'Admin', 'User']
        const role = validRoles.includes(data.role) ? data.role : 'User'

        setUserRole(role)
        setUserData({ id: userDocSnap.id, ...data })

        console.log(`✅ User role fetched: ${role}`)

        // Log warning if user doesn't have CMS access
        if (role !== 'Super' && role !== 'Admin') {
          console.warn(
            `⚠️ User "${data.email}" has role "${role}" - CMS access denied. Only 'Super' and 'Admin' roles can access the CMS UI.`
          )
        }
      } else {
        console.error(`❌ User document not found for userId: ${userId}`)
        setError('User profile not found. Please contact an administrator.')
        setUserRole('User') // Default to least privileged role
        setUserData(null)
      }
    } catch (err) {
      console.error('❌ Error fetching user role:', err)
      setError('Failed to fetch user permissions. Please try again.')
      setUserRole('User') // Default to least privileged role on error
      setUserData(null)
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
