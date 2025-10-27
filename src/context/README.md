# Context Module

React Context providers for managing global state in Hooran CMS.

## Available Contexts

### AuthContext

Manages authentication state and user role information.

**File:** [AuthContext.tsx](AuthContext.tsx)

### ProjectContext

Manages multi-tenancy project selection and access control.

**File:** [ProjectContext.tsx](ProjectContext.tsx)

---

## AuthContext

### Overview

The `AuthContext` provides authentication state management for Hooran CMS with role-based access control.

**Key Features:**
- Firebase Authentication integration
- Automatic user role fetching from Firestore
- Role-based access control (only 'Super' and 'Admin' can access CMS)
- Loading state management
- Error handling

---

## Setup

### 1. Wrap Your App with AuthProvider

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from '@/context/AuthContext'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
```

---

## Usage

### Basic Usage

```tsx
import { useAuth } from '@/context/AuthContext'

function MyComponent() {
  const { currentUser, userRole, isLoading, hasCMSAccess } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!currentUser) {
    return <div>Please sign in</div>
  }

  if (!hasCMSAccess) {
    return <div>Access denied. Admin privileges required.</div>
  }

  return (
    <div>
      <h1>Welcome, {currentUser.email}</h1>
      <p>Your role: {userRole}</p>
    </div>
  )
}
```

---

## API Reference

### `useAuth()` Hook

Returns the authentication context with the following properties:

#### `currentUser: User | null`
The Firebase User object. `null` if not authenticated.

```tsx
const { currentUser } = useAuth()

if (currentUser) {
  console.log('User ID:', currentUser.uid)
  console.log('Email:', currentUser.email)
  console.log('Display Name:', currentUser.displayName)
}
```

#### `userRole: UserRole`
The user's role from Firestore.

**Type:** `'Super' | 'Admin' | 'User' | null`

```tsx
const { userRole } = useAuth()

if (userRole === 'Super') {
  // Show super admin features
} else if (userRole === 'Admin') {
  // Show admin features
}
```

#### `userData: UserData | null`
Complete user data from Firestore.

```tsx
const { userData } = useAuth()

if (userData) {
  console.log('Projects:', userData.projects)
  console.log('Display Name:', userData.display_name)
}
```

**UserData Interface:**
```typescript
interface UserData {
  id: string
  email: string
  display_name?: string
  photo_url?: string
  role: UserRole
  projects: string[]
  created_at: Timestamp
  updated_at: Timestamp
  last_login?: Timestamp
}
```

#### `isLoading: boolean`
Loading state during initial authentication check.

```tsx
const { isLoading } = useAuth()

if (isLoading) {
  return <LoadingSpinner />
}
```

#### `hasCMSAccess: boolean`
Whether the user can access the CMS UI.

**Only `true` for 'Super' and 'Admin' roles.**

```tsx
const { hasCMSAccess } = useAuth()

if (!hasCMSAccess) {
  return <AccessDenied />
}
```

#### `error: string | null`
Error message if role fetch fails.

```tsx
const { error } = useAuth()

if (error) {
  return <div className="error">{error}</div>
}
```

---

## Role-Based Access Control

### User Roles

| Role | CMS Access | Description |
|------|------------|-------------|
| `Super` | ✅ Yes | Full system access, can manage all projects |
| `Admin` | ✅ Yes | Can manage content within assigned projects |
| `User` | ❌ No | Read-only access, cannot access CMS UI |
| `null` | ❌ No | Not authenticated or role not assigned |

### Access Control Pattern

```tsx
import { useAuth } from '@/context/AuthContext'

function ProtectedComponent() {
  const { currentUser, userRole, isLoading, hasCMSAccess } = useAuth()

  // 1. Show loading state
  if (isLoading) {
    return <div>Loading...</div>
  }

  // 2. Check authentication
  if (!currentUser) {
    return <LoginPrompt />
  }

  // 3. Check CMS access (Super or Admin only)
  if (!hasCMSAccess) {
    return (
      <div>
        <h2>Access Denied</h2>
        <p>You need Admin or Super Admin privileges to access this page.</p>
        <p>Your current role: {userRole || 'Unknown'}</p>
      </div>
    )
  }

  // 4. User has access - show CMS UI
  return <CMSInterface />
}
```

---

## Examples

### Example 1: Protected Route

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, hasCMSAccess, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  if (!hasCMSAccess) {
    return <Navigate to="/access-denied" />
  }

  return <>{children}</>
}

// Usage
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Example 2: Conditional Rendering by Role

```tsx
import { useAuth } from '@/context/AuthContext'

function Navigation() {
  const { userRole } = useAuth()

  return (
    <nav>
      <a href="/dashboard">Dashboard</a>

      {userRole === 'Admin' && (
        <a href="/content">Content Management</a>
      )}

      {userRole === 'Super' && (
        <>
          <a href="/users">User Management</a>
          <a href="/settings">System Settings</a>
        </>
      )}
    </nav>
  )
}
```

### Example 3: Display User Info

```tsx
import { useAuth } from '@/context/AuthContext'

function UserProfile() {
  const { currentUser, userData, userRole } = useAuth()

  if (!currentUser || !userData) {
    return <div>Not logged in</div>
  }

  return (
    <div className="user-profile">
      <img src={userData.photo_url || '/default-avatar.png'} alt="Avatar" />
      <h2>{userData.display_name || currentUser.email}</h2>
      <p>Role: <span className="badge">{userRole}</span></p>
      <p>Email: {currentUser.email}</p>
      <p>Projects: {userData.projects.length}</p>
    </div>
  )
}
```

### Example 4: Loading State

```tsx
import { useAuth } from '@/context/AuthContext'

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading authentication...</p>
      </div>
    )
  }

  return <MainApp />
}
```

### Example 5: Error Handling

```tsx
import { useAuth } from '@/context/AuthContext'

function Dashboard() {
  const { error, currentUser } = useAuth()

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading User Data</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return <div>Dashboard content...</div>
}
```

### Example 6: Project-Based Access

```tsx
import { useAuth } from '@/context/AuthContext'

function ProjectSelector() {
  const { userData } = useAuth()

  if (!userData || userData.projects.length === 0) {
    return <div>No projects available</div>
  }

  return (
    <select>
      {userData.projects.map((projectId) => (
        <option key={projectId} value={projectId}>
          {projectId}
        </option>
      ))}
    </select>
  )
}
```

---

## Firestore Structure

The AuthContext expects user documents in Firestore with this structure:

```
Firestore:
└── users/
    └── {userId}/
        ├── email: string
        ├── display_name?: string
        ├── photo_url?: string
        ├── role: 'Super' | 'Admin' | 'User'
        ├── projects: string[]
        ├── created_at: Timestamp
        ├── updated_at: Timestamp
        └── last_login?: Timestamp
```

### Example User Document

```json
{
  "email": "admin@example.com",
  "display_name": "John Doe",
  "photo_url": "https://example.com/avatar.jpg",
  "role": "Admin",
  "projects": ["project-abc", "project-xyz"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "last_login": "2024-01-15T10:30:00Z"
}
```

---

## TypeScript Types

```typescript
// User Role
type UserRole = 'Super' | 'Admin' | 'User' | null

// User Data from Firestore
interface UserData {
  id: string
  email: string
  display_name?: string
  photo_url?: string
  role: UserRole
  projects: string[]
  created_at: Timestamp
  updated_at: Timestamp
  last_login?: Timestamp
}

// Auth Context Type
interface AuthContextType {
  currentUser: User | null
  userRole: UserRole
  userData: UserData | null
  isLoading: boolean
  hasCMSAccess: boolean
  error: string | null
}
```

---

## Security Considerations

### 1. CMS Access Control

**CRITICAL:** Only users with `'Super'` or `'Admin'` roles can access the CMS UI.

Always check `hasCMSAccess`:

```tsx
const { hasCMSAccess } = useAuth()

if (!hasCMSAccess) {
  return <AccessDenied />
}
```

### 2. Firestore Security Rules

Ensure your Firestore security rules protect user documents:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can only read their own document
      allow read: if request.auth != null && request.auth.uid == userId;

      // Only admins can write user documents
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['Super', 'Admin'];
    }
  }
}
```

### 3. Role Validation

The AuthContext validates roles and defaults to `'User'` if invalid:

```typescript
const validRoles: UserRole[] = ['Super', 'Admin', 'User']
const role = validRoles.includes(data.role) ? data.role : 'User'
```

---

## Best Practices

### 1. Always Check Loading State

```tsx
const { isLoading } = useAuth()

if (isLoading) {
  return <LoadingSpinner />
}
```

### 2. Use hasCMSAccess for Simplicity

```tsx
// ✅ Good
const { hasCMSAccess } = useAuth()
if (!hasCMSAccess) return <AccessDenied />

// ❌ Avoid
const { userRole } = useAuth()
if (userRole !== 'Super' && userRole !== 'Admin') return <AccessDenied />
```

### 3. Handle Errors Gracefully

```tsx
const { error } = useAuth()

if (error) {
  return <ErrorMessage message={error} />
}
```

### 4. Centralize Access Control

Create reusable components for access control:

```tsx
function RequireCMSAccess({ children }: { children: ReactNode }) {
  const { hasCMSAccess, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!hasCMSAccess) return <AccessDenied />

  return <>{children}</>
}
```

---

## Troubleshooting

### Issue: "useAuth must be used within an AuthProvider"

**Solution:** Wrap your app with `<AuthProvider>`:

```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

### Issue: User role is always `null`

**Solution:**
1. Check that the user document exists in Firestore at `users/{userId}`
2. Ensure the document has a `role` field
3. Verify the role is one of: `'Super'`, `'Admin'`, or `'User'`

### Issue: `isLoading` is always `true`

**Solution:**
1. Check Firebase configuration is correct
2. Ensure Firebase is initialized properly
3. Check browser console for errors

---

## Related Documentation

- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [React Context](https://react.dev/reference/react/useContext)

---

**Last Updated:** 2025-10-27

---

## ProjectContext

### Overview

The `ProjectContext` manages multi-tenancy scope for Hooran CMS by providing project selection and access control based on user roles.

**Key Features:**
- Role-based project fetching (Super = all projects, Admin = assigned only)
- Automatic project selection
- Session persistence
- Multi-tenancy enforcement

---

## Setup

### Wrap with ProjectProvider

**IMPORTANT:** Must be inside AuthProvider

```tsx
import { AuthProvider } from '@/context/AuthContext'
import { ProjectProvider } from '@/context/ProjectContext'

<AuthProvider>
  <ProjectProvider>
    <App />
  </ProjectProvider>
</AuthProvider>
```

---

## Usage

### Basic Usage

```tsx
import { useProject } from '@/context/ProjectContext'

function MyComponent() {
  const { selectedProject, projectsList, setSelectedProject } = useProject()

  if (!selectedProject) {
    return <div>Please select a project</div>
  }

  return <div>Current Project: {selectedProject.name}</div>
}
```

---

## API Reference

### `useProject()` Returns:

| Property | Type | Description |
|----------|------|-------------|
| `selectedProject` | `Project \| null` | Currently selected project |
| `setSelectedProject` | `function` | Set selected project |
| `projectsList` | `Project[]` | List of accessible projects |
| `isLoading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message |

### Project Type:

```typescript
interface Project {
  projectId: string
  name: string
  description?: string
  created_at?: Timestamp
  owner_id?: string
  status?: 'active' | 'suspended' | 'archived'
}
```

---

## Role-Based Access

### Super Admin
- Fetches ALL projects from `projects` collection
- Can access and manage any project

### Admin
- Fetches ONLY assigned projects from `user.projects` array
- Limited to assigned projects only

---

## CRITICAL: Multi-Tenancy

**ALWAYS use `selectedProject.projectId` in Firestore queries**

```tsx
import { useProject } from '@/context/ProjectContext'
import { getProjectScopedDocRef } from '@/firebase'

function ContentViewer({ contentId }) {
  const { selectedProject } = useProject()

  // ✅ CORRECT: Include projectId
  const docRef = getProjectScopedDocRef(
    'content',
    contentId,
    selectedProject.projectId  // ← Required!
  )
}
```

---

## Session Persistence

Selected project is saved to `sessionStorage` and restored on page reload.

**Storage Key:** `hooran_cms_selected_project`

**Behavior:**
- Persists across page refreshes
- Cleared when browser closes
- Validates on restore

---

## Examples

### Project Selector

```tsx
import { useProject } from '@/context/ProjectContext'

function ProjectSelector() {
  const { selectedProject, projectsList, setSelectedProject } = useProject()

  return (
    <select
      value={selectedProject?.projectId || ''}
      onChange={(e) => {
        const project = projectsList.find(p => p.projectId === e.target.value)
        setSelectedProject(project || null)
      }}
    >
      {projectsList.map(project => (
        <option key={project.projectId} value={project.projectId}>
          {project.name}
        </option>
      ))}
    </select>
  )
}
```

### With Firestore

```tsx
import { useProject } from '@/context/ProjectContext'
import { createProjectScopedQuery } from '@/firebase'

function ContentList() {
  const { selectedProject } = useProject()

  useEffect(() => {
    if (!selectedProject) return

    const q = createProjectScopedQuery(
      'content',
      selectedProject.projectId,  // ← Multi-tenancy
      where('status', '==', 'published')
    )

    // Fetch data...
  }, [selectedProject])
}
```

---

## Best Practices

1. ✅ Always check `selectedProject` before using
2. ✅ Use `selectedProject.projectId` in ALL queries
3. ✅ Handle loading states
4. ✅ Provide project selector in UI
5. ✅ Validate before critical operations

---

## Troubleshooting

### "useProject must be used within a ProjectProvider"

Wrap app with ProjectProvider inside AuthProvider.

### projectsList is empty

**For Super Admin:** Create projects in Firestore
**For Admin:** Add project IDs to user document's `projects` array

### selectedProject is null

Check if projects are available and select one manually.

---

For complete documentation, see: [PROJECT_CONTEXT_GUIDE.md](../../PROJECT_CONTEXT_GUIDE.md)

