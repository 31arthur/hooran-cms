# ProjectContext - Multi-Tenancy Management

## Overview

The **ProjectContext** manages multi-tenancy scope for Hooran CMS by providing project selection and access control based on user roles.

**CRITICAL:** The `selectedProject.projectId` MUST be included in ALL Firestore requests to enforce proper data scoping.

---

## Table of Contents

1. [Setup](#setup)
2. [Features](#features)
3. [API Reference](#api-reference)
4. [Role-Based Project Access](#role-based-project-access)
5. [Usage Examples](#usage-examples)
6. [Session Persistence](#session-persistence)
7. [Integration with Firebase](#integration-with-firebase)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Setup

### 1. Wrap Your App with ProjectProvider

**IMPORTANT:** ProjectProvider must be wrapped INSIDE AuthProvider.

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from '@/context/AuthContext'
import { ProjectProvider } from '@/context/ProjectContext'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ProjectProvider>
        <App />
      </ProjectProvider>
    </AuthProvider>
  </React.StrictMode>
)
```

### 2. Use the useProject Hook

```tsx
import { useProject } from '@/context/ProjectContext'

function MyComponent() {
  const { selectedProject, projectsList, setSelectedProject } = useProject()

  // Use selectedProject.projectId in all queries
  const projectId = selectedProject?.projectId
}
```

---

## Features

### ✅ Role-Based Project Fetching

- **Super Admin:** Fetches ALL projects from `projects` collection
- **Admin:** Fetches ONLY assigned projects from `user.projects` array

### ✅ Automatic Project Selection

- Auto-selects first project on load
- Restores last selected project from sessionStorage
- Validates restored project is still accessible

### ✅ Session Persistence

- Selected project persists across page refreshes
- Uses sessionStorage (cleared when browser closes)
- Validates permissions on restore

### ✅ Multi-Tenancy Enforcement

- Provides `selectedProject.projectId` for all queries
- Ensures data scoping for Firestore operations
- Required for proper multi-tenant architecture

### ✅ Loading & Error States

- Loading state while fetching projects
- Error handling with user-friendly messages
- Graceful handling of no projects

---

## API Reference

### `useProject()` Hook

Returns the project context with the following properties:

#### `selectedProject: Project | null`

Currently selected project. NULL if no project is selected.

**Type:**
```typescript
interface Project {
  projectId: string        // Unique project ID
  name: string             // Project name
  description?: string     // Optional description
  created_at?: Timestamp   // Creation timestamp
  owner_id?: string        // Owner user ID
  status?: 'active' | 'suspended' | 'archived'
}
```

**Usage:**
```tsx
const { selectedProject } = useProject()

if (selectedProject) {
  console.log('Project ID:', selectedProject.projectId)
  console.log('Project Name:', selectedProject.name)
}
```

**CRITICAL:** Always use `selectedProject.projectId` in Firestore queries:
```tsx
const docRef = getProjectScopedDocRef('content', docId, selectedProject.projectId)
```

---

#### `setSelectedProject: (project: Project | null) => void`

Set the currently selected project. Persists to sessionStorage.

**Usage:**
```tsx
const { setSelectedProject, projectsList } = useProject()

// Select a project
setSelectedProject(projectsList[0])

// Clear selection
setSelectedProject(null)
```

---

#### `projectsList: Project[]`

List of projects the user can access.

- **Super Admin:** All projects
- **Admin:** Only assigned projects

**Usage:**
```tsx
const { projectsList } = useProject()

return (
  <select>
    {projectsList.map((project) => (
      <option key={project.projectId} value={project.projectId}>
        {project.name}
      </option>
    ))}
  </select>
)
```

---

#### `isLoading: boolean`

Loading state while fetching projects.

**Usage:**
```tsx
const { isLoading } = useProject()

if (isLoading) {
  return <LoadingSpinner />
}
```

---

#### `error: string | null`

Error message if project fetching fails.

**Usage:**
```tsx
const { error } = useProject()

if (error) {
  return <div className="error">{error}</div>
}
```

---

## Role-Based Project Access

### Super Admin

**Fetches:** ALL projects from top-level `projects` collection

```typescript
// Firestore query
const projectsRef = collection(db, 'projects')
const querySnapshot = await getDocs(projectsRef)
```

**Access:** Can see and manage all projects in the system.

---

### Admin

**Fetches:** Only assigned projects based on `user.projects` array

```typescript
// Get assigned project IDs from user document
const assignedProjectIds = userData.projects // ['project-1', 'project-2']

// Fetch only those projects
const projectsRef = collection(db, 'projects')
const q = query(projectsRef, where(documentId(), 'in', assignedProjectIds))
const querySnapshot = await getDocs(q)
```

**Access:** Can only see and manage assigned projects.

**User Document Structure:**
```json
{
  "email": "admin@example.com",
  "role": "Admin",
  "projects": ["project-abc", "project-xyz"]  // ← Assigned projects
}
```

---

## Usage Examples

### Example 1: Basic Usage

```tsx
import { useProject } from '@/context/ProjectContext'

function Dashboard() {
  const { selectedProject, isLoading } = useProject()

  if (isLoading) {
    return <div>Loading projects...</div>
  }

  if (!selectedProject) {
    return <div>No project selected</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Current Project: {selectedProject.name}</p>
    </div>
  )
}
```

---

### Example 2: Project Selector

```tsx
import { useProject } from '@/context/ProjectContext'

function ProjectSelector() {
  const { selectedProject, projectsList, setSelectedProject } = useProject()

  return (
    <div>
      <label>Select Project:</label>
      <select
        value={selectedProject?.projectId || ''}
        onChange={(e) => {
          const project = projectsList.find((p) => p.projectId === e.target.value)
          setSelectedProject(project || null)
        }}
      >
        <option value="">Select a project...</option>
        {projectsList.map((project) => (
          <option key={project.projectId} value={project.projectId}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  )
}
```

---

### Example 3: Using with Firestore Queries

```tsx
import { useProject } from '@/context/ProjectContext'
import { getProjectScopedDocRef } from '@/firebase'
import { getDoc } from 'firebase/firestore'

function ContentViewer({ contentId }: { contentId: string }) {
  const { selectedProject } = useProject()
  const [content, setContent] = useState(null)

  useEffect(() => {
    if (!selectedProject) return

    const fetchContent = async () => {
      // CRITICAL: Use selectedProject.projectId in query
      const docRef = getProjectScopedDocRef(
        'content',
        contentId,
        selectedProject.projectId  // ← Multi-tenancy scoping
      )

      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setContent(docSnap.data())
      }
    }

    fetchContent()
  }, [selectedProject, contentId])

  return <div>{content?.title}</div>
}
```

---

### Example 4: Conditional Rendering by Role

```tsx
import { useProject } from '@/context/ProjectContext'
import { useAuth } from '@/context/AuthContext'

function ProjectManagement() {
  const { userRole } = useAuth()
  const { projectsList } = useProject()

  return (
    <div>
      <h2>Your Projects</h2>
      {userRole === 'Super' && (
        <p>You have access to all {projectsList.length} projects</p>
      )}
      {userRole === 'Admin' && (
        <p>You have access to {projectsList.length} assigned projects</p>
      )}
    </div>
  )
}
```

---

### Example 5: Loading State

```tsx
import { useProject } from '@/context/ProjectContext'

function App() {
  const { isLoading, error } = useProject()

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading projects...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error Loading Projects</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return <MainApp />
}
```

---

### Example 6: No Projects Available

```tsx
import { useProject } from '@/context/ProjectContext'

function ContentList() {
  const { selectedProject, projectsList } = useProject()

  if (projectsList.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Projects Available</h2>
        <p>You don't have access to any projects yet.</p>
        <p>Please contact your administrator.</p>
      </div>
    )
  }

  if (!selectedProject) {
    return <div>Please select a project from the dropdown</div>
  }

  return <div>Content for {selectedProject.name}</div>
}
```

---

## Session Persistence

### How It Works

The selected project is persisted to `sessionStorage` and restored on page reload.

**Storage Key:** `hooran_cms_selected_project`

**Stored Data:**
```json
{
  "projectId": "project-abc",
  "name": "My Project",
  "description": "Project description",
  "status": "active"
}
```

### Persistence Behavior

1. **On Project Selection:**
   ```tsx
   setSelectedProject(project)
   // → Saves to sessionStorage
   ```

2. **On Page Reload:**
   ```tsx
   // Attempts to restore from sessionStorage
   const saved = sessionStorage.getItem('hooran_cms_selected_project')

   // Validates project is still accessible
   const found = projectsList.find(p => p.projectId === saved.projectId)

   if (found) {
     setSelectedProject(found)  // Restore
   } else {
     setSelectedProject(projectsList[0])  // Fall back to first
   }
   ```

3. **On Browser Close:**
   - sessionStorage is cleared
   - Project selection resets on next visit

### Manual Clear

```tsx
const { setSelectedProject } = useProject()

// Clear selection
setSelectedProject(null)
// → Removes from sessionStorage
```

---

## Integration with Firebase

### CRITICAL: Multi-Tenancy Scoping

**ALL Firestore requests MUST include `selectedProject.projectId`**

### Correct Usage ✅

```tsx
import { useProject } from '@/context/ProjectContext'
import { getProjectScopedDocRef } from '@/firebase'

function MyComponent() {
  const { selectedProject } = useProject()

  // ✅ CORRECT: Include projectId in query
  const docRef = getProjectScopedDocRef(
    'content',
    'article-123',
    selectedProject.projectId  // ← Required!
  )
}
```

### Incorrect Usage ❌

```tsx
// ❌ WRONG: Missing projectId scoping
const docRef = doc(db, 'content', 'article-123')
// This bypasses multi-tenancy and could access wrong data!
```

### Integration Pattern

```tsx
import { useProject } from '@/context/ProjectContext'
import { createProjectScopedQuery, whereConstraint } from '@/firebase'

function ContentList() {
  const { selectedProject } = useProject()
  const [content, setContent] = useState([])

  useEffect(() => {
    if (!selectedProject) return

    const fetchContent = async () => {
      // Create project-scoped query
      const q = createProjectScopedQuery(
        'content',
        selectedProject.projectId,  // ← Multi-tenancy
        whereConstraint('status', '==', 'published')
      )

      const snapshot = await getDocs(q)
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setContent(items)
    }

    fetchContent()
  }, [selectedProject])

  return <div>{/* Render content */}</div>
}
```

---

## Best Practices

### 1. Always Check selectedProject

```tsx
const { selectedProject } = useProject()

if (!selectedProject) {
  return <div>Please select a project</div>
}

// Safe to use selectedProject.projectId
```

### 2. Use with Firebase Utils

```tsx
import { useProject } from '@/context/ProjectContext'
import { getProjectScopedDocRef } from '@/firebase'

const { selectedProject } = useProject()

// Always use Firebase utils with projectId
const ref = getProjectScopedDocRef('content', docId, selectedProject.projectId)
```

### 3. Handle Loading States

```tsx
const { isLoading, selectedProject } = useProject()

if (isLoading) return <LoadingSpinner />
if (!selectedProject) return <NoProjectSelected />

return <YourComponent />
```

### 4. Provide Project Selector

```tsx
// Always show project selector in your app header
<Header>
  <ProjectSelector />
</Header>
```

### 5. Validate on Key Operations

```tsx
const { selectedProject } = useProject()

const handleSave = async () => {
  if (!selectedProject) {
    alert('Please select a project first')
    return
  }

  // Proceed with save
  await saveContent(selectedProject.projectId, data)
}
```

---

## Troubleshooting

### Issue: "useProject must be used within a ProjectProvider"

**Cause:** Component not wrapped in ProjectProvider

**Solution:**
```tsx
<AuthProvider>
  <ProjectProvider>
    <App />
  </ProjectProvider>
</AuthProvider>
```

---

### Issue: projectsList is empty

**Causes:**
1. Super admin: No projects in Firestore
2. Admin: No assigned projects in user document

**Solution for Super:**
Create projects in Firestore at `projects/{projectId}`

**Solution for Admin:**
Add project IDs to user document:
```json
{
  "email": "admin@example.com",
  "role": "Admin",
  "projects": ["project-1", "project-2"]  // Add this
}
```

---

### Issue: selectedProject is null

**Causes:**
1. No projects available
2. Project selection was cleared

**Solution:**
```tsx
const { selectedProject, projectsList, setSelectedProject } = useProject()

if (!selectedProject && projectsList.length > 0) {
  setSelectedProject(projectsList[0])
}
```

---

### Issue: Admin can't see projects

**Cause:** Missing or empty `projects` array in user document

**Solution:**
Update user document in Firestore:
```json
{
  "role": "Admin",
  "projects": ["project-abc"]  // ← Must have this array
}
```

---

## TypeScript Types

```typescript
// Project
interface Project {
  projectId: string
  name: string
  description?: string
  created_at?: Timestamp
  owner_id?: string
  status?: 'active' | 'suspended' | 'archived'
}

// Context Type
interface ProjectContextType {
  selectedProject: Project | null
  setSelectedProject: (project: Project | null) => void
  projectsList: Project[]
  isLoading: boolean
  error: string | null
}
```

---

## Complete Integration Example

```tsx
// main.tsx
import { AuthProvider } from '@/context/AuthContext'
import { ProjectProvider } from '@/context/ProjectContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <ProjectProvider>
      <App />
    </ProjectProvider>
  </AuthProvider>
)

// App.tsx
import { useAuth } from '@/context/AuthContext'
import { useProject } from '@/context/ProjectContext'

function App() {
  const { hasCMSAccess, isLoading: authLoading } = useAuth()
  const { selectedProject, isLoading: projectLoading } = useProject()

  if (authLoading || projectLoading) {
    return <LoadingScreen />
  }

  if (!hasCMSAccess) {
    return <AccessDenied />
  }

  if (!selectedProject) {
    return <ProjectSelector />
  }

  return <Dashboard />
}
```

---

## Summary

### ✅ Features Implemented

- ✅ Role-based project fetching (Super = all, Admin = assigned)
- ✅ Auto-select first project
- ✅ Session persistence with validation
- ✅ Loading and error states
- ✅ TypeScript types
- ✅ Custom `useProject()` hook

### 🎯 Critical Rule

**ALWAYS include `selectedProject.projectId` in Firestore queries**

This is not optional. It enforces multi-tenancy data scoping.

---

**Status:** ✅ Production Ready

**Last Updated:** 2025-10-27
