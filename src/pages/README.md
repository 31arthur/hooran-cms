# Pages Module

React page components for Hooran CMS.

## Available Pages

### LoginPage

Authentication page with role-based access control.

**File:** [LoginPage.tsx](LoginPage.tsx)

---

## LoginPage

### Overview

The `LoginPage` component provides secure authentication for Hooran CMS with automatic role-based access control.

**Key Features:**
- Firebase Authentication integration
- Role-based access verification (Super/Admin only)
- Automatic redirection on success
- User-friendly error messages
- Seafoam Green theme styling
- Loading states and success feedback

---

## Usage

### Basic Setup with React Router

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { App } from './App'

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<App />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### Standalone Usage

```tsx
import { LoginPage } from '@/pages/LoginPage'

function App() {
  return <LoginPage />
}
```

---

## Features

### ✅ Firebase Authentication

Uses `signInWithEmailAndPassword` for secure authentication:

```typescript
const userCredential = await signInWithEmailAndPassword(auth, email, password)
```

### ✅ Role-Based Access Control

**CMS Access Rule:** Only `'Super'` and `'Admin'` roles allowed.

```typescript
// Fetch user role from Firestore
const userDocRef = doc(db, 'users', user.uid)
const userDocSnap = await getDoc(userDocRef)
const userRole = userData.role

// Check CMS access
if (userRole !== 'Super' && userRole !== 'Admin') {
  await auth.signOut() // Deny access
  setError('Access Denied: Only Super or Admin roles can access the CMS.')
  return
}
```

### ✅ Automatic Redirection

On successful login with valid role, redirects to `/app`:

```typescript
setTimeout(() => {
  window.location.href = '/app'
}, 1000)
```

### ✅ Error Handling

Handles all Firebase Auth errors with user-friendly messages:

| Error Code | User Message |
|------------|--------------|
| `auth/invalid-credential` | Invalid email or password |
| `auth/user-not-found` | No account found |
| `auth/wrong-password` | Incorrect password |
| `auth/invalid-email` | Invalid email format |
| `auth/user-disabled` | Account disabled |
| `auth/too-many-requests` | Too many attempts |

### ✅ Access Denial for 'User' Role

Users with `'User'` role see:

```
Access Denied: Your role is "User".
Only users with "Super" or "Admin" roles can access the CMS.
```

---

## UI Components

Uses shadcn/ui components:

- **Card** - Container with header, content, footer
- **Input** - Email and password fields
- **Label** - Form labels
- **Button** - Primary action button with Seafoam Green theme

---

## Styling

### Seafoam Green Theme

```tsx
<Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
  Sign In
</Button>
```

The `primary` color is automatically applied from the Tailwind theme (#20B2AA).

### Logo Icon

Custom document icon in Seafoam Green:

```tsx
<div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
  <svg className="w-10 h-10 text-primary-foreground">
    {/* Document icon */}
  </svg>
</div>
```

---

## States

### Loading State

Shown while authenticating:

```tsx
{isLoading && (
  <div className="flex items-center gap-2">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2" />
    <span>Signing in...</span>
  </div>
)}
```

### Success State

Shown after successful login:

```tsx
{success && (
  <div className="bg-primary/10 border border-primary text-primary">
    <p>Login successful! Redirecting...</p>
  </div>
)}
```

### Error State

Shown on authentication or role check failure:

```tsx
{error && (
  <div className="bg-destructive/10 border border-destructive text-destructive">
    <p className="font-semibold">Sign in failed</p>
    <p className="text-sm">{error}</p>
  </div>
)}
```

---

## Authentication Flow

```
1. User enters email and password
   ↓
2. Submit form
   ↓
3. Firebase Authentication (signInWithEmailAndPassword)
   ↓
4. Fetch user document from Firestore (users/{userId})
   ↓
5. Check user role
   ├─ Role = 'Super' or 'Admin' → Allow access, redirect to /app
   └─ Role = 'User' or invalid → Deny access, sign out, show error
```

---

## Example: Role Check Logic

```typescript
// After successful Firebase authentication
const userDocRef = doc(db, 'users', user.uid)
const userDocSnap = await getDoc(userDocRef)

if (!userDocSnap.exists()) {
  // No user document found
  await auth.signOut()
  setError('Account not set up correctly. Contact administrator.')
  return
}

const userData = userDocSnap.data()
const userRole = userData.role

// CMS Access Rule: Only Super and Admin
if (userRole !== 'Super' && userRole !== 'Admin') {
  await auth.signOut()
  setError(`Access Denied: Your role is "${userRole}". Only Super or Admin can access CMS.`)
  return
}

// Success - user has CMS access
setSuccess(true)
setTimeout(() => {
  window.location.href = '/app'
}, 1000)
```

---

## Security

### 1. Sign Out on Access Denial

Users with `'User'` role are automatically signed out:

```typescript
if (userRole !== 'Super' && userRole !== 'Admin') {
  await auth.signOut() // Sign out immediately
  setError('Access Denied')
}
```

### 2. Redirect if Already Authenticated

If user is already logged in with CMS access:

```typescript
useEffect(() => {
  if (!authLoading && currentUser && hasCMSAccess) {
    window.location.href = '/app'
  }
}, [authLoading, currentUser, hasCMSAccess])
```

### 3. Firestore Document Required

User must have a document in `users/{userId}` collection:

```typescript
if (!userDocSnap.exists()) {
  await auth.signOut()
  setError('Account not set up correctly.')
  return
}
```

---

## Testing

### Test Scenarios

1. **Valid Admin Login**
   - Email: admin@example.com
   - Expected: Success, redirect to /app

2. **Valid Super Admin Login**
   - Email: superadmin@example.com
   - Expected: Success, redirect to /app

3. **User Role Login (External User)**
   - Email: user@example.com
   - Expected: Access denied message

4. **Invalid Credentials**
   - Email: wrong@example.com
   - Expected: "Invalid email or password" error

5. **Missing User Document**
   - User authenticated but no Firestore document
   - Expected: "Account not set up correctly" error

---

## Customization

### Change Redirect Path

```typescript
// Change from /app to /dashboard
window.location.href = '/dashboard'
```

### Add Password Reset Link

```tsx
<CardFooter>
  <Button type="submit">Sign In</Button>
  <a href="/forgot-password" className="text-sm text-primary">
    Forgot password?
  </a>
</CardFooter>
```

### Add Registration Link

```tsx
<p className="text-sm text-center">
  Don't have an account?{' '}
  <a href="/register" className="text-primary hover:underline">
    Contact administrator
  </a>
</p>
```

---

## TypeScript Types

```typescript
// Component props (none - no props needed)
export function LoginPage() {}

// Internal state
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [success, setSuccess] = useState(false)
```

---

## Dependencies

- `firebase/auth` - Firebase Authentication
- `firebase/firestore` - Firestore database
- `@/firebase` - Firebase config
- `@/context/AuthContext` - Auth context
- `@/components/ui/button` - Button component
- `@/components/ui/input` - Input component
- `@/components/ui/label` - Label component
- `@/components/ui/card` - Card components

---

## Complete Example

```tsx
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { LoginPage } from '@/pages/LoginPage'
import { Dashboard } from '@/pages/Dashboard'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

---

## Best Practices

### 1. Always Wrap with AuthProvider

```tsx
<AuthProvider>
  <LoginPage />
</AuthProvider>
```

### 2. Handle All Error Cases

The component handles:
- Invalid credentials
- Missing user document
- Invalid role
- Network errors
- Firebase errors

### 3. Provide User Feedback

- Loading spinner during authentication
- Success message before redirect
- Clear error messages
- Info about role requirements

### 4. Secure Role Checking

Role is checked **after** authentication and user is signed out if access is denied.

---

## Troubleshooting

### Issue: "Account not set up correctly"

**Cause:** User authenticated but no document in `users/{userId}`

**Solution:** Create user document in Firestore:
```json
{
  "email": "user@example.com",
  "role": "Admin",
  "projects": []
}
```

---

### Issue: "Access Denied" for Admin user

**Cause:** Role might be lowercase or incorrect

**Solution:** Ensure role is exactly `'Admin'` or `'Super'` (capital first letter)

---

### Issue: Redirect not working

**Cause:** `/app` route doesn't exist

**Solution:** Create the route or change redirect path in LoginPage.tsx

---

### Issue: Infinite loading

**Cause:** Firebase not configured or AuthProvider missing

**Solution:**
1. Check `.env` has Firebase credentials
2. Wrap app with `<AuthProvider>`

---

## Related Components

- [AuthContext](../context/AuthContext.tsx) - Authentication state
- [Button](../components/ui/button.tsx) - Primary button
- [Card](../components/ui/card.tsx) - Container
- [Input](../components/ui/input.tsx) - Form inputs
- [Label](../components/ui/label.tsx) - Form labels

---

**Status:** ✅ Production Ready

**Last Updated:** 2025-10-27
