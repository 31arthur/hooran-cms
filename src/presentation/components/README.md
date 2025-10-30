# Components Module

React components for Hooran CMS.

## Available Components

### ProjectSelector

Mandatory gateway for project selection after login.

**File:** [ProjectSelector.tsx](ProjectSelector.tsx)

---

## ProjectSelector

### Overview

The `ProjectSelector` component is a **mandatory gateway** that appears immediately after Super/Admin users log in. It displays a full-screen page for selecting which project to work with.

**Key Features:**
- Full-screen standalone page
- Shows all available projects based on user role
- Clean, modern card-based design
- Seafoam Green theme
- Loading and error states
- Responsive grid layout

**CRITICAL:** This component MUST be shown when `selectedProject` is `null`. Without a selected project, no data operations can be performed (multi-tenancy requirement).

---

## Usage

### Basic Integration

```tsx
import { ProjectSelector } from '@/components/ProjectSelector'
import { useProject } from '@/context/ProjectContext'

function App() {
  const { selectedProject } = useProject()

  // Show ProjectSelector if no project is selected
  if (!selectedProject) {
    return <ProjectSelector />
  }

  // Project is selected, show main app
  return <Dashboard />
}
```

### With Router

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProjectSelector } from '@/components/ProjectSelector'
import { useProject } from '@/context/ProjectContext'

function AppRouter() {
  const { selectedProject } = useProject()

  return (
    <BrowserRouter>
      <Routes>
        {!selectedProject ? (
          <Route path="*" element={<ProjectSelector />} />
        ) : (
          <>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/content" element={<ContentManager />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}
```

---

## Features

### ✅ Full-Screen Layout

Displays as a standalone full-screen page with:
- Header with logo and user info
- Main content area with project grid
- Footer with helpful information

### ✅ Role-Based Project Lists

**Super Users:**
- See ALL projects in the system
- Message: "You have access to X projects"

**Admin Users:**
- See ONLY assigned projects
- Message: "You have been assigned X projects"

### ✅ Project Cards

Each project card displays:
- Project icon with hover effect
- Project name
- Description (if available)
- Status badge (active/suspended/archived)
- Project ID (truncated)
- Select button

### ✅ Interactive Selection

- Click anywhere on card to select
- Hover effects with scale and border
- Seafoam Green highlighting
- Smooth animations

### ✅ Loading State

Shows while fetching projects:
- Animated spinner
- Loading message
- Centered layout

### ✅ Error State

Displays when project fetch fails:
- Error icon
- Error message
- Retry button

### ✅ Empty State

Shown when no projects are available:
- Different messages for Super vs Admin
- Create project button (Super only)
- Contact admin message (Admin only)

---

## User Logic

### Super Users

**Projects Shown:** ALL projects in the system

**Source:** Top-level `projects` collection in Firestore

**Message:** "You have access to X projects"

**Empty State:** Shows "Create Project" button

---

### Admin Users

**Projects Shown:** ONLY assigned projects

**Source:** `user.projects` array from Firestore user document

**Message:** "You have been assigned X projects"

**Empty State:** Shows "Contact your administrator" message

---

## Styling

### Seafoam Green Theme

**Applied to:**
- Logo background: `bg-primary` (#20B2AA)
- Role badge: `text-primary`
- Hover effects: `border-primary`, `ring-primary`
- Selected card: `border-primary`, `ring-primary/20`
- Select button: `bg-primary`, `hover:bg-primary/90`
- Project count: `text-primary`
- Info banner: `bg-primary/10`, `text-primary`

### Responsive Design

**Grid Layout:**
- Mobile (sm): 1 column
- Tablet (md): 2 columns
- Desktop (lg): 3 columns

**Spacing:**
- Gap between cards: `gap-6`
- Container max-width: `max-w-5xl`
- Padding: `px-4 py-12`

---

## States

### Loading State

```tsx
if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin border-primary" />
      <p>Loading Projects...</p>
    </div>
  )
}
```

### Error State

```tsx
if (error) {
  return (
    <Card>
      <CardHeader>
        <div className="text-destructive">Error Loading Projects</div>
        <p>{error}</p>
      </CardHeader>
      <CardContent>
        <Button onClick={reload}>Retry</Button>
      </CardContent>
    </Card>
  )
}
```

### Empty State

```tsx
if (projectsList.length === 0) {
  return (
    <Card>
      <CardHeader>
        <div>No Projects Available</div>
        <p>
          {userRole === 'Admin'
            ? "Contact your administrator"
            : "Create your first project"}
        </p>
      </CardHeader>
    </Card>
  )
}
```

### Main UI State

Shows project grid with interactive cards.

---

## Component API

### Props

**None** - Uses context hooks internally

### Hooks Used

```typescript
const { projectsList, setSelectedProject, isLoading, error } = useProject()
const { userRole, userData } = useAuth()
```

### Internal State

```typescript
const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
```

---

## Project Card Details

### Card Structure

```tsx
<Card onClick={handleSelectProject}>
  <CardHeader>
    {/* Icon */}
    <div className="bg-primary/10">
      <FolderIcon />
    </div>

    {/* Status Badge */}
    <span className="bg-green-100">active</span>

    {/* Title */}
    <CardTitle>{project.name}</CardTitle>

    {/* Description */}
    <CardDescription>{project.description}</CardDescription>
  </CardHeader>

  <CardContent>
    {/* Project ID */}
    <p className="font-mono">{project.projectId}</p>

    {/* Select Button */}
    <Button>Select →</Button>
  </CardContent>
</Card>
```

### Hover Effects

```css
hover:shadow-lg
hover:scale-105
hover:border-primary/50
border-primary (when hovered)
ring-2 ring-primary/20 (when hovered)
```

### Status Badges

| Status | Color | Classes |
|--------|-------|---------|
| `active` | Green | `bg-green-100 text-green-800` |
| `suspended` | Yellow | `bg-yellow-100 text-yellow-800` |
| `archived` | Gray | `bg-gray-100 text-gray-800` |

---

## Examples

### Example 1: Simple Integration

```tsx
import { ProjectSelector } from '@/components/ProjectSelector'
import { useProject } from '@/context/ProjectContext'

function App() {
  const { selectedProject } = useProject()

  if (!selectedProject) {
    return <ProjectSelector />
  }

  return <div>Welcome to {selectedProject.name}!</div>
}
```

### Example 2: With Loading Guard

```tsx
import { ProjectSelector } from '@/components/ProjectSelector'
import { useProject } from '@/context/ProjectContext'

function App() {
  const { selectedProject, isLoading } = useProject()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!selectedProject) {
    return <ProjectSelector />
  }

  return <Dashboard />
}
```

### Example 3: With Auth Check

```tsx
import { ProjectSelector } from '@/components/ProjectSelector'
import { useProject } from '@/context/ProjectContext'
import { useAuth } from '@/context/AuthContext'

function App() {
  const { currentUser, hasCMSAccess } = useAuth()
  const { selectedProject } = useProject()

  if (!currentUser) return <LoginPage />
  if (!hasCMSAccess) return <AccessDenied />
  if (!selectedProject) return <ProjectSelector />

  return <Dashboard />
}
```

### Example 4: Custom Layout

```tsx
function App() {
  const { selectedProject } = useProject()

  return (
    <div className="app">
      {!selectedProject ? (
        <ProjectSelector />
      ) : (
        <>
          <Header project={selectedProject} />
          <MainContent />
        </>
      )}
    </div>
  )
}
```

---

## Best Practices

### 1. Always Show When No Project Selected

```tsx
// ✅ Good
if (!selectedProject) {
  return <ProjectSelector />
}

// ❌ Bad - Missing project selector
if (!selectedProject) {
  return <div>Please select a project</div>  // Not helpful!
}
```

### 2. Check Before Main App

```tsx
// ✅ Correct order
if (!currentUser) return <LoginPage />
if (!hasCMSAccess) return <AccessDenied />
if (!selectedProject) return <ProjectSelector />  // ← Third check
return <MainApp />
```

### 3. Use Context Directly

```tsx
// ✅ Good - Uses context
import { useProject } from '@/context/ProjectContext'
const { selectedProject } = useProject()

// ❌ Bad - Prop drilling
<ProjectSelector projects={projectsList} />
```

### 4. Handle All States

```tsx
const { selectedProject, isLoading, error } = useProject()

if (isLoading) return <LoadingScreen />
if (error) return <ErrorScreen />
if (!selectedProject) return <ProjectSelector />
return <MainApp />
```

---

## Customization

### Change Grid Columns

```tsx
// Default: 1-2-3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Change to 1-2-4 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
```

### Add Search/Filter

```tsx
const [searchTerm, setSearchTerm] = useState('')

const filteredProjects = projectsList.filter(p =>
  p.name.toLowerCase().includes(searchTerm.toLowerCase())
)

return (
  <>
    <Input
      placeholder="Search projects..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    <div className="grid">
      {filteredProjects.map(project => <Card />)}
    </div>
  </>
)
```

### Add Sort Options

```tsx
const [sortBy, setSortBy] = useState<'name' | 'date'>('name')

const sortedProjects = [...projectsList].sort((a, b) =>
  sortBy === 'name'
    ? a.name.localeCompare(b.name)
    : (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0)
)
```

---

## Accessibility

### Keyboard Navigation

- Cards are focusable (click event)
- Button has proper focus states
- Tab navigation works

### Screen Readers

- Semantic HTML (header, main)
- Alt text for icons
- Proper heading hierarchy (h1, h2)
- Descriptive button text

### Visual

- High contrast ratios
- Clear hover states
- Focus indicators
- Readable font sizes

---

## Performance

### Optimizations

1. **Hover state** - Only tracks one hovered project ID
2. **Grid rendering** - Uses CSS Grid for performance
3. **Click handlers** - Memoized with useCallback potential
4. **Minimal re-renders** - Context value memoization

### Large Project Lists

For 100+ projects, consider:
- Pagination
- Virtual scrolling
- Search/filter
- Lazy loading

---

## Troubleshooting

### Issue: Component not showing

**Cause:** `selectedProject` is not null

**Solution:** Check if project is already selected in sessionStorage

---

### Issue: Empty project list

**Cause:** No projects fetched

**Solution:**
- **Super:** Create projects in Firestore
- **Admin:** Add project IDs to user's `projects` array

---

### Issue: Can't click cards

**Cause:** Z-index or pointer-events issue

**Solution:** Check for overlaying elements, ensure `cursor-pointer`

---

## Related Components

- [AuthContext](../context/AuthContext.tsx) - Authentication
- [ProjectContext](../context/ProjectContext.tsx) - Project management
- [Card](./ui/card.tsx) - Card component
- [Button](./ui/button.tsx) - Button component

---

## TypeScript Types

```typescript
// From ProjectContext
interface Project {
  projectId: string
  name: string
  description?: string
  created_at?: Timestamp
  owner_id?: string
  status?: 'active' | 'suspended' | 'archived'
}

// From AuthContext
type UserRole = 'Super' | 'Admin' | 'User' | null

interface UserData {
  email: string
  role: UserRole
  projects: string[]
}
```

---

## Summary

### ✅ Features

- ✅ Full-screen layout
- ✅ Role-based project lists
- ✅ Interactive project cards
- ✅ Seafoam Green theme
- ✅ Loading state
- ✅ Error state
- ✅ Empty state
- ✅ Responsive grid
- ✅ Hover effects
- ✅ Status badges

### 🎯 User Logic

- ✅ Super: See ALL projects
- ✅ Admin: See ONLY assigned projects
- ✅ Different empty state messages

### 🎨 Theme

- ✅ Seafoam Green (#20B2AA) throughout
- ✅ Consistent with CMS design
- ✅ Modern card-based layout

---

**Status:** ✅ Production Ready

**Last Updated:** 2025-10-27
