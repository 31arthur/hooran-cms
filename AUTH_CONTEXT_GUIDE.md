# AuthContext - Authentication State Management

## Overview

The **AuthContext** provides centralized authentication state management for Hooran CMS with **role-based access control (RBAC)**.

**Key Feature:** Only users with `'Super'` or `'Admin'` roles can access the CMS UI.

---

## Table of Contents

1. [Setup](#setup)
2. [Features](#features)
3. [API Reference](#api-reference)
4. [Role-Based Access Control](#role-based-access-control)
5. [Usage Examples](#usage-examples)
6. [Firestore Structure](#firestore-structure)
7. [Security](#security)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Setup

### 1. Wrap Your App with AuthProvider

**File:** `src/main.tsx`

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from '@/context/AuthContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
```

### 2. Use the useAuth Hook

```tsx
import { useAuth } from '@/context/AuthContext'

function MyComponent() {
  const { currentUser, userRole, isLoading, hasCMSAccess } = useAuth()

  // Your component logic
}
```

---

## Features

### ✅ What's Included

1. **Firebase Authentication Integration**
   - Automatic auth state listener with `onAuthStateChanged`
   - Real-time authentication updates
   - Proper cleanup on unmount

2. **User Role Management**
   - Fetches user role from Firestore `users/{userId}` collection
   - Validates roles: `'Super' | 'Admin' | 'User'`
   - Defaults to `'User'` role if invalid or missing

3. **CMS Access Control**
   - `hasCMSAccess` property for easy access checking
   - Only `'Super'` and `'Admin'` roles have CMS access
   - Automatic access denial for `'User'` role

4. **Loading State Management**
   - `isLoading` state during initial auth check
   - Prevents flash of wrong content
   - Graceful loading states

5. **Error Handling**
   - Catches Firestore fetch errors
   - Provides error messages
   - Defaults to safe state on errors

6. **Complete User Data**
   - Fetches full user document from Firestore
   - Includes projects, display name, photo, etc.
   - Type-safe TypeScript interfaces

---

## API Reference

### `useAuth()` Hook

Returns an object with authentication state.

```typescript
const {
  currentUser,
  userRole,
  userData,
  isLoading,
  hasCMSAccess,
  error
} = useAuth()
```

### Properties

#### `currentUser: User | null`

The Firebase User object from Firebase Authentication.

**Type:** `firebase.User | null`

**Usage:**
```typescript
const { currentUser } = useAuth()

if (currentUser) {
  console.log('User ID:', currentUser.uid)
  console.log('Email:', currentUser.email)
  console.log('Display Name:', currentUser.displayName)
  console.log('Photo URL:', currentUser.photoURL)
  console.log('Email Verified:', currentUser.emailVerified)
}
```

---

#### `userRole: UserRole`

The user's role from the Firestore `users` collection.

**Type:** `'Super' | 'Admin' | 'User' | null`

**CMS Access:**
- ✅ `'Super'` - Full CMS access
- ✅ `'Admin'` - Full CMS access
- ❌ `'User'` - No CMS access
- ❌ `null` - No CMS access (not authenticated)

**Usage:**
```typescript
const { userRole } = useAuth()

if (userRole === 'Super') {
  // Show super admin features
} else if (userRole === 'Admin') {
  // Show admin features
} else {
  // Limited or no access
}
```

---

#### `userData: UserData | null`

Complete user data from Firestore.

**Type:** `UserData | null`

**Interface:**
```typescript
interface UserData {
  id: string                // User ID
  email: string             // Email address
  display_name?: string     // Display name
  photo_url?: string        // Profile photo URL
  role: UserRole            // User role
  projects: string[]        // Project IDs user can access
  created_at: Timestamp     // Account creation time
  updated_at: Timestamp     // Last update time
  last_login?: Timestamp    // Last login time
}
```

**Usage:**
```typescript
const { userData } = useAuth()

if (userData) {
  console.log('Projects:', userData.projects)
  console.log('Display Name:', userData.display_name)
  console.log('Role:', userData.role)
}
```

---

#### `isLoading: boolean`

Loading state during initial authentication check.

**Usage:**
```typescript
const { isLoading } = useAuth()

if (isLoading) {
  return <LoadingSpinner />
}

return <YourComponent />
```

**Important:** Always check `isLoading` before rendering protected content to prevent flashing wrong UI.

---

#### `hasCMSAccess: boolean`

Whether the user can access the CMS UI.

**Value:** `true` only if `userRole === 'Super' || userRole === 'Admin'`

**Usage:**
```typescript
const { hasCMSAccess } = useAuth()

if (!hasCMSAccess) {
  return <AccessDenied />
}

return <CMSContent />
```

**Recommended:** Use this instead of manually checking `userRole`.

---

#### `error: string | null`

Error message if user role fetch fails.

**Usage:**
```typescript
const { error } = useAuth()

if (error) {
  return (
    <div className="error">
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  )
}
```

---

## Role-Based Access Control

### User Roles

| Role | CMS Access | Description |
|------|------------|-------------|
| **Super** | ✅ Full Access | Super Administrator - Can manage everything |
| **Admin** | ✅ Full Access | Administrator - Can manage assigned projects |
| **User** | ❌ No Access | Regular user - Read-only, no CMS access |
| **null** | ❌ No Access | Not authenticated |

### Access Control Pattern

```tsx
import { useAuth } from '@/context/AuthContext'

function ProtectedPage() {
  const { currentUser, hasCMSAccess, isLoading } = useAuth()

  // 1. Loading state
  if (isLoading) {
    return <LoadingScreen />
  }

  // 2. Check authentication
  if (!currentUser) {
    return <LoginPage />
  }

  // 3. Check CMS access
  if (!hasCMSAccess) {
    return <AccessDenied />
  }

  // 4. User has access
  return <CMSContent />
}
```

---

## Usage Examples

### Example 1: Basic Usage

```tsx
import { useAuth } from '@/context/AuthContext'

function Dashboard() {
  const { currentUser, userRole, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!currentUser) {
    return <div>Please sign in</div>
  }

  return (
    <div>
      <h1>Welcome, {currentUser.email}</h1>
      <p>Your role: {userRole}</p>
    </div>
  )
}
```

### Example 2: Protected Component

```tsx
import { useAuth } from '@/context/AuthContext'

function ContentManagement() {
  const { hasCMSAccess, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!hasCMSAccess) {
    return (
      <div>
        <h2>Access Denied</h2>
        <p>You need Admin or Super Admin privileges.</p>
      </div>
    )
  }

  return <ContentEditor />
}
```

### Example 3: Conditional Rendering by Role

```tsx
import { useAuth } from '@/context/AuthContext'

function Navigation() {
  const { userRole } = useAuth()

  return (
    <nav>
      <a href="/dashboard">Dashboard</a>

      {/* Only admins and super admins see content */}
      {(userRole === 'Admin' || userRole === 'Super') && (
        <a href="/content">Content</a>
      )}

      {/* Only super admins see settings */}
      {userRole === 'Super' && (
        <a href="/settings">Settings</a>
      )}
    </nav>
  )
}
```

### Example 4: Display User Info

```tsx
import { useAuth } from '@/context/AuthContext'

function UserProfile() {
  const { currentUser, userData, userRole } = useAuth()

  if (!userData) return null

  return (
    <div className="profile">
      <img src={userData.photo_url || '/avatar.png'} alt="Avatar" />
      <h3>{userData.display_name || currentUser?.email}</h3>
      <p>Role: {userRole}</p>
      <p>Projects: {userData.projects.length}</p>
    </div>
  )
}
```

### Example 5: Reusable Access Wrapper

```tsx
import { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'

interface RequireCMSAccessProps {
  children: ReactNode
}

function RequireCMSAccess({ children }: RequireCMSAccessProps) {
  const { hasCMSAccess, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!hasCMSAccess) return <AccessDenied />

  return <>{children}</>
}

// Usage
<RequireCMSAccess>
  <ContentEditor />
</RequireCMSAccess>
```

### Example 6: Error Handling

```tsx
import { useAuth } from '@/context/AuthContext'

function MyComponent() {
  const { error, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return <YourContent />
}
```

---

## Firestore Structure

The AuthContext expects user documents in Firestore with this structure:

### Collection Path
```
users/{userId}
```

### Document Structure

```typescript
{
  email: string
  display_name?: string
  photo_url?: string
  role: 'Super' | 'Admin' | 'User'
  projects: string[]
  created_at: Timestamp
  updated_at: Timestamp
  last_login?: Timestamp
}
```

### Example User Document

```json
{
  "email": "admin@example.com",
  "display_name": "John Admin",
  "photo_url": "https://example.com/photo.jpg",
  "role": "Admin",
  "projects": ["project-1", "project-2"],
  "created_at": {"seconds": 1704067200},
  "updated_at": {"seconds": 1704153600},
  "last_login": {"seconds": 1704153600}
}
```

---

## Security

### 1. Firestore Security Rules

Protect user documents with security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Users can only read their own document
      allow read: if request.auth != null && request.auth.uid == userId;

      // Only Super/Admin can modify user documents
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['Super', 'Admin'];
    }
  }
}
```

### 2. Role Validation

The AuthContext validates roles:

```typescript
const validRoles: UserRole[] = ['Super', 'Admin', 'User']
const role = validRoles.includes(data.role) ? data.role : 'User'
```

Invalid roles default to `'User'` (least privileged).

### 3. Always Use hasCMSAccess

```tsx
// ✅ Good - Simple and safe
const { hasCMSAccess } = useAuth()
if (!hasCMSAccess) return <AccessDenied />

// ❌ Avoid - More complex, error-prone
const { userRole } = useAuth()
if (userRole !== 'Super' && userRole !== 'Admin') return <AccessDenied />
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
const { hasCMSAccess } = useAuth()

if (!hasCMSAccess) {
  return <AccessDenied />
}
```

### 3. Handle Errors Gracefully

```tsx
const { error } = useAuth()

if (error) {
  return <ErrorDisplay error={error} />
}
```

### 4. Create Reusable Components

```tsx
// Create once, use everywhere
function ProtectedRoute({ children }) {
  const { hasCMSAccess, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!hasCMSAccess) return <AccessDenied />

  return children
}
```

### 5. Centralize Access Logic

```tsx
// hooks/useRequireCMSAccess.ts
export function useRequireCMSAccess() {
  const { hasCMSAccess, isLoading } = useAuth()

  if (isLoading) throw new Promise(() => {}) // Suspense
  if (!hasCMSAccess) throw new Error('Access denied')

  return true
}
```

---

## Troubleshooting

### Issue: "useAuth must be used within an AuthProvider"

**Cause:** Component is not wrapped in `<AuthProvider>`

**Solution:**
```tsx
// src/main.tsx
<AuthProvider>
  <App />
</AuthProvider>
```

---

### Issue: User role is always `null`

**Causes:**
1. User document doesn't exist in Firestore
2. Document missing `role` field
3. Invalid role value

**Solution:**
1. Ensure user document exists at `users/{userId}`
2. Add `role` field with value `'Super' | 'Admin' | 'User'`
3. Check Firestore security rules allow read access

---

### Issue: `isLoading` never becomes `false`

**Causes:**
1. Firebase not initialized
2. Network issues
3. Firestore permissions denied

**Solution:**
1. Check Firebase config in `.env`
2. Check browser console for errors
3. Verify Firestore security rules
4. Check network tab in DevTools

---

### Issue: `hasCMSAccess` is `false` for Admin users

**Cause:** Role field might have wrong capitalization

**Solution:**
Ensure role is exactly `'Admin'` (capital A), not `'admin'`

---

### Issue: Firebase errors in console

**Solution:**
1. Verify `.env` has all Firebase credentials
2. Check Firebase project is active
3. Ensure Authentication is enabled
4. Verify Firestore database exists

---

## File Structure

```
src/context/
├── AuthContext.tsx        # Main context implementation
├── examples.tsx           # Usage examples (11 examples)
└── README.md              # Quick reference guide
```

---

## Integration Example

Complete app structure:

```tsx
// src/main.tsx
import { AuthProvider } from '@/context/AuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)

// src/App.tsx
import { useAuth } from '@/context/AuthContext'

function App() {
  const { isLoading, currentUser, hasCMSAccess } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!currentUser) {
    return <LoginPage />
  }

  if (!hasCMSAccess) {
    return <AccessDenied />
  }

  return <CMSDashboard />
}
```

---

## TypeScript Types

```typescript
// User Role
type UserRole = 'Super' | 'Admin' | 'User' | null

// User Data
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

// Auth Context
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

## Summary

### ✅ Features Implemented

- ✅ Firebase `onAuthStateChanged` listener
- ✅ Automatic user role fetching from Firestore
- ✅ Role validation and defaults
- ✅ `hasCMSAccess` computed property
- ✅ Loading state management
- ✅ Error handling
- ✅ TypeScript types
- ✅ Custom `useAuth()` hook
- ✅ Complete documentation
- ✅ 11 usage examples

### 🎯 CMS Access Rule

**Only users with `'Super'` or `'Admin'` roles can access the CMS UI.**

This is enforced via the `hasCMSAccess` property:
```typescript
hasCMSAccess = userRole === 'Super' || userRole === 'Admin'
```

---

**Status:** ✅ Production Ready

**Last Updated:** 2025-10-27
