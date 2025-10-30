/**
 * useRoleCheck Hook
 *
 * Reusable utility hook for enforcing role-based visibility and access within components.
 * Provides convenient boolean flags for common role-based conditionals.
 *
 * **Use Cases:**
 * - Conditionally rendering UI elements based on user role
 * - Showing/hiding admin-only or super-only features
 * - Simplifying role-based access control logic
 *
 * **Benefits:**
 * - Reduces repetitive role checking code
 * - Centralizes role-based logic
 * - Type-safe role comparisons
 * - Easy to test and maintain
 *
 * @example
 * ```tsx
 * import { useRoleCheck } from '@/presentation/hooks/useRoleCheck'
 *
 * function MyComponent() {
 *   const { isSuper, isAdmin, isCMSUser } = useRoleCheck()
 *
 *   return (
 *     <div>
 *       {isCMSUser && <p>Welcome to the CMS!</p>}
 *       {isAdmin && <button>Admin Action</button>}
 *       {isSuper && <button>Super Admin Action</button>}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Conditionally render a "Create" button only for Super users
 * function SchemaListPage() {
 *   const { isSuper } = useRoleCheck()
 *
 *   return (
 *     <div>
 *       <h1>Schemas</h1>
 *       {isSuper && (
 *         <Button onClick={handleCreate}>
 *           Create New Collection
 *         </Button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */

import { useMemo } from 'react'
import { useAuth } from '@/presentation/context/AuthContext'
import type { UserRole } from '@/presentation/context/AuthContext'

/**
 * Role Check Result Interface
 *
 * Contains boolean flags for common role-based checks.
 */
export interface RoleCheckResult {
  /**
   * True if the current user's role is 'Super'.
   *
   * Super users have the highest level of access:
   * - Can manage all projects (no assignment needed)
   * - Can create new projects
   * - Can manage system settings
   * - Can assign users to projects
   * - Can create and manage schemas
   */
  isSuper: boolean

  /**
   * True if the current user's role is 'Admin'.
   *
   * Admin users have project-level access:
   * - Can manage content in assigned projects
   * - Can create and edit content entries
   * - Can view audit logs for their projects
   * - Cannot create projects or manage system settings
   * - Require explicit project assignments
   */
  isAdmin: boolean

  /**
   * True if the current user has CMS access (role is 'Super' OR 'Admin').
   *
   * CMS users can access the main application:
   * - Can access the /app routes
   * - Can view and manage content (based on role)
   * - Have authenticated access to the CMS
   *
   * Users with role 'User' will have isCMSUser = false and should not
   * access CMS features.
   */
  isCMSUser: boolean

  /**
   * The current user's role string.
   * Useful for displaying role badges or debugging.
   */
  userRole: UserRole | null
}

/**
 * useRoleCheck Hook
 *
 * Provides boolean flags for role-based conditionals in components.
 * Uses the AuthContext to access the current user's role.
 *
 * **Performance:**
 * - Uses `useMemo` to prevent unnecessary recalculations
 * - Only recalculates when userRole changes
 *
 * **Safety:**
 * - Returns false for all checks if user is not authenticated
 * - Handles null/undefined userRole gracefully
 *
 * @returns {RoleCheckResult} Object containing role check boolean flags
 *
 * @example
 * ```tsx
 * function ProtectedComponent() {
 *   const { isSuper, isAdmin, isCMSUser } = useRoleCheck()
 *
 *   if (!isCMSUser) {
 *     return <AccessDenied />
 *   }
 *
 *   return (
 *     <div>
 *       <h1>CMS Dashboard</h1>
 *       {isAdmin && <AdminPanel />}
 *       {isSuper && <SuperAdminPanel />}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Simple visibility toggle
 * function ActionButton() {
 *   const { isSuper } = useRoleCheck()
 *
 *   if (!isSuper) return null
 *
 *   return <Button>Super Admin Action</Button>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Multiple role checks
 * function NavigationMenu() {
 *   const { isSuper, isAdmin } = useRoleCheck()
 *
 *   return (
 *     <nav>
 *       <Link to="/dashboard">Dashboard</Link>
 *       {isAdmin && <Link to="/content">Content</Link>}
 *       {isSuper && (
 *         <>
 *           <Link to="/projects">Projects</Link>
 *           <Link to="/system-settings">System Settings</Link>
 *         </>
 *       )}
 *     </nav>
 *   )
 * }
 * ```
 */
export function useRoleCheck(): RoleCheckResult {
  const { userRole } = useAuth()

  // Use useMemo to prevent unnecessary recalculations
  // Only recalculate when userRole changes
  const roleCheck = useMemo(() => {
    // Check if user has Super role
    const isSuper = userRole === 'Super'

    // Check if user has Admin role
    const isAdmin = userRole === 'Admin'

    // Check if user has CMS access (Super OR Admin)
    const isCMSUser = isSuper || isAdmin

    return {
      isSuper,
      isAdmin,
      isCMSUser,
      userRole,
    }
  }, [userRole])

  return roleCheck
}

/**
 * Example Usage in Components
 *
 * @example
 * ```tsx
 * // Example 1: Simple conditional rendering
 * function CreateButton() {
 *   const { isSuper } = useRoleCheck()
 *
 *   return isSuper ? (
 *     <Button onClick={handleCreate}>Create New</Button>
 *   ) : null
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Example 2: Multiple conditions
 * function Dashboard() {
 *   const { isSuper, isAdmin, isCMSUser } = useRoleCheck()
 *
 *   if (!isCMSUser) {
 *     return <AccessDeniedPage />
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Dashboard</h1>
 *       {isAdmin && <ContentStats />}
 *       {isSuper && <SystemStats />}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Example 3: Disabling features
 * function SettingsPanel() {
 *   const { isSuper, isAdmin } = useRoleCheck()
 *
 *   return (
 *     <div>
 *       <Input label="Project Name" />
 *       <Input
 *         label="Project Owner"
 *         disabled={!isSuper}
 *         helperText={!isSuper ? "Only Super admins can change owner" : ""}
 *       />
 *       <Button disabled={!isCMSUser}>Save Changes</Button>
 *     </div>
 *   )
 * }
 * ```
 */
