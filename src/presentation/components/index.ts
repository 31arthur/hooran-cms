/**
 * Components Index
 *
 * Central export point for all reusable components in the CMS.
 */

// Authentication & Authorization
export { ProtectedRoute, AccessDenied } from './ProtectedRoute'

// Navigation & Layout
export { Sidebar } from './Sidebar'
export { TopBar } from './TopBar'

// Project Management
export { ProjectSelector } from './ProjectSelector'

// Content Management
export { ContentManager } from './ContentManager'
export { DynamicForm } from './DynamicForm'
export type { DynamicFormProps, DynamicFormRef } from './DynamicForm'

// User Management
export { UserAssignmentPage } from './UserAssignmentPage'
