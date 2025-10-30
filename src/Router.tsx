/**
 * Router Configuration
 *
 * Primary routing component for Hooran CMS.
 * Uses React Router v7+ with BrowserRouter.
 *
 * **Route Structure:**
 *
 * PUBLIC ROUTES:
 * - `/` - Landing Page (Google Sign-In, public access)
 * - `/404` - Not Found page
 *
 * PROTECTED ROUTES (Super/Admin only):
 * - `/app` - Application root (redirects to /app/dashboard or /app/select-project)
 * - `/app/select-project` - Project Selector (MANDATORY gateway)
 * - `/app/dashboard` - CMS Dashboard (role-based content, requires project)
 * - `/app/content/:slug` - Content Manager for specific collection (placeholder)
 * - `/app/users` - User Assignment page (Super only, placeholder)
 * - `/app/settings` - Settings page (placeholder)
 *
 * SECURITY:
 * - All `/app/*` routes wrapped in <ProtectedRoute />
 * - Four-stage protection:
 *   1. Loading → Authentication → Authorization (ProtectedRoute)
 *   2. Project Context Check (AppLayout)
 * - Only 'Super' and 'Admin' roles can access protected routes
 * - Unauthorized users redirected to Landing Page
 * - Users without selected project redirected to /app/select-project
 *
 * MANDATORY PROJECT CONTEXT:
 * - All /app/* routes (except /app/select-project) require a selected project
 * - Enforced by AppLayout component
 * - Users are funneled to /app/select-project if no project is selected
 *
 * @example
 * ```tsx
 * import { Router } from './Router'
 *
 * function App() {
 *   return <Router />
 * }
 * ```
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/presentation/context/AuthContext'
import { ProjectProvider } from '@/presentation/context/ProjectContext'
import {
  LandingPage,
  DashboardPage,
  NotFoundPage,
  AppLayout,
  SchemaBuilderPage,
  SchemaViewPage,
  SchemaListPage,
  ContentDetailPage,
  AuditLogPage,
  ProjectSettingsPage,
  ProjectCreationPage,
  ProjectUsersPage,
  SystemSettingsPage,
  SuperSettingsPage,
  CollectionsPage,
  SuperUsersPage,
  ProjectAuditLogsPage,
  IntuitiveSchemaBuilderPage,
  TableDataPage,
} from '@/presentation/pages'
import { ProtectedRoute } from '@/presentation/components/ProtectedRoute'
import { ProjectSelector } from '@/presentation/components/ProjectSelector'
import { ContentManager } from '@/presentation/components/ContentManager'
import { UserAssignmentPage } from '@/presentation/components/UserAssignmentPage'

/**
 * Router Component
 *
 * Application-wide routing with context providers and protection.
 *
 * **Provider Hierarchy:**
 * 1. BrowserRouter - Routing functionality
 * 2. AuthProvider - Authentication state (currentUser, userRole, hasCMSAccess)
 * 3. ProjectProvider - Multi-tenancy (selectedProject, projectsList)
 * 4. ProtectedRoute - Role-based access control (Super/Admin only)
 *
 * **Route Protection:**
 * - Public routes: Accessible to everyone (/, /404)
 * - Protected routes: Wrapped in <ProtectedRoute>, requires authentication & authorization
 *
 * **First Rendered Component:**
 * When accessing `/app`, user is redirected to `/app/dashboard` (Dashboard with Sidebar)
 */
export function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <Routes>
            {/* ============================================
                PUBLIC ROUTES
                Accessible without authentication
            ============================================ */}

            {/* Landing Page - Google Sign-In */}
            <Route path="/" element={<LandingPage />} />

            {/* 404 Not Found Page */}
            <Route path="/404" element={<NotFoundPage />} />

            {/* ============================================
                PROTECTED ROUTES
                Requires authentication + Super/Admin role
            ============================================ */}

            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Default /app route - Redirect to Dashboard */}
              <Route index element={<Navigate to="/app/dashboard" replace />} />

              {/* Project Selector - MANDATORY gateway for project selection */}
              {/* Users must select a project before accessing any other /app/* routes */}
              {/* AppLayout redirects here if no project is selected */}
              <Route path="select-project" element={<ProjectSelector />} />

              {/* Dashboard - Main CMS view with role-based widgets */}
              {/* Requires project to be selected (enforced by AppLayout) */}
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="dashboard/:projectId" element={<DashboardPage />} />

              {/* Schema List - View all content type schemas (Super only) */}
              {/* Central management hub for all schemas in project */}
              <Route path="schemas" element={<SchemaListPage />} />

              {/* Schema Builder - Create new content types (Super only) */}
              {/* Internal role check: Only Super users can access */}
              <Route path="schemas/new" element={<SchemaBuilderPage />} />

              {/* Schema View/Edit Page - View and edit existing schema definitions (Super only) */}
              {/* Fetches schema with project context validation */}
              <Route path="schemas/:schemaId" element={<SchemaViewPage />} />

              {/* Content Manager - View/edit content for specific collection */}
              {/* Displays list of content entries for a collection */}
              <Route path="content/:collectionId" element={<ContentManager />} />

              {/* Content Detail Page - View/edit single content entry */}
              {/* Allows editing of individual content entries */}
              <Route path="content/:collectionId/:contentId" element={<ContentDetailPage />} />

              {/* Audit Log Page - View audit history for content entry */}
              {/* Displays complete change history with timestamps and user info */}
              <Route path="audit/:collectionId/:contentId" element={<AuditLogPage />} />

              {/* Project Settings - Manage project metadata and settings */}
              {/* Allows editing of project name and status with audit logging */}
              <Route path="settings" element={<ProjectSettingsPage />} />

              {/* Project Creation - Create new projects (Super only) */}
              {/* Exclusive to Super role users with initial Admin assignment */}
              <Route path="projects/new" element={<ProjectCreationPage />} />

              {/* Project Users - View and manage users assigned to selected project */}
              {/* Admin: View-only, Super: Edit permissions */}
              <Route path="projects/:projectId/users" element={<ProjectUsersPage />} />

              {/* System Settings - Global application configuration (Super only) */}
              {/* Manage default user roles and maintenance mode */}
              <Route path="system-settings" element={<SystemSettingsPage />} />

              {/* Super Powers Section - Super user only routes */}
              {/* Super Settings - Placeholder page for super-level settings */}
              <Route path="super/settings" element={<SuperSettingsPage />} />

              {/* Collections Management - Create and manage collections (Super only) */}
              <Route path="super/collections" element={<CollectionsPage />} />

              {/* Create New Collection - Visual schema builder (Super only) */}
              <Route path="super/collections/new" element={<IntuitiveSchemaBuilderPage />} />

              {/* Edit Collection Schema - Visual schema editor (Super only) */}
              <Route path="super/collections/:schemaId/edit" element={<IntuitiveSchemaBuilderPage />} />

              {/* All Users - View and manage all system users with role assignment (Super only) */}
              <Route path="super/users" element={<SuperUsersPage />} />

              {/* Project Audit Logs - View audit trail for project operations */}
              <Route path="projects/:projectId/audit-logs" element={<ProjectAuditLogsPage />} />

              {/* Table Data - View and manage records for a specific table/collection */}
              {/* Dynamic page that loads schema and displays data with filtering */}
              <Route path="tables/:schemaId" element={<TableDataPage />} />

              {/* User Assignment - Manage users and project assignments (Super only) */}
              {/* Comprehensive user and project assignment management interface */}
              <Route path="users" element={<UserAssignmentPage />} />
            </Route>

            {/* ============================================
                CATCH-ALL ROUTES
                Handle unmatched paths
            ============================================ */}

            {/* Wildcard - Redirect any unmatched path to 404 */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
