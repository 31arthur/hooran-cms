# Firebase Module

This directory contains all Firebase-related functionality for Hooran CMS, including configuration, utilities, and type definitions for multi-tenant data management.

## Files

### [config.ts](config.ts)
Firebase initialization and service configuration.

**Exports:**
- `app` - Firebase app instance
- `auth` - Firebase Authentication service
- `db` / `firestore` - Cloud Firestore service
- `storage` - Firebase Storage service

**Features:**
- Environment variable validation
- Emulator support for local development
- Error handling

---

### [utils.ts](utils.ts)
Core utility functions for multi-tenant Firestore operations.

**Key Functions:**

#### `getProjectScopedDocRef(collectionId, docId, projectId)`
**⚠️ CRITICAL: Use this for ALL document operations**

Returns a document reference scoped to a specific project.

```typescript
const ref = getProjectScopedDocRef('content', 'article-123', 'project-abc')
```

#### `getProjectScopedCollection(collectionId, projectId)`
Returns a collection reference scoped to a project.

```typescript
const collection = getProjectScopedCollection('content', 'project-abc')
```

#### `createProjectScopedQuery(collectionId, projectId, ...constraints)`
Creates queries with automatic project scoping.

```typescript
const query = createProjectScopedQuery(
  'content',
  'project-abc',
  where('status', '==', 'published'),
  orderBy('created_at', 'desc')
)
```

**Other utilities:**
- `whereConstraint()` - Type-safe where clauses
- `orderByConstraint()` - Type-safe orderBy clauses
- `limitConstraint()` - Type-safe limit clauses
- `getServerTimestamp()` - Firestore server timestamp
- `createAuditLogEntry()` - Standardized audit logging
- `COLLECTIONS` - Collection name constants

---

### [types.ts](types.ts)
TypeScript type definitions for all Firestore data models.

**Interfaces:**
- `Project` - Project/tenant document
- `ContentEntry` - Content item document
- `Schema` - Content type schema
- `AuditLogEntry` - Audit log document
- `User` - User profile
- `Media` - Media file metadata
- `Role` - Custom role definition

**Base Interface:**
```typescript
interface ProjectScopedDocument {
  project_id: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

All documents extend this to ensure multi-tenancy.

---

### [index.ts](index.ts)
Central export point for the Firebase module.

**Usage:**
```typescript
import { auth, db, getProjectScopedDocRef } from '@/firebase'
```

---

### [examples.ts](examples.ts)
Practical examples demonstrating common operations.

**Includes:**
- CRUD operations
- Querying data
- Real-time listeners
- Batch operations
- Publishing workflows
- Audit logging

---

## Multi-Tenancy Architecture

### Data Structure

```
Firestore:
└── projects/
    ├── {projectId}/
    │   ├── content/
    │   ├── schemas/
    │   ├── audit_logs/
    │   ├── media/
    │   └── ...
    └── {anotherProjectId}/
        └── ...
```

### Key Principles

1. **All data belongs to a project**
   - Every document includes `project_id`
   - Data is organized under `projects/{projectId}/`

2. **Use scoped functions**
   - Always use `getProjectScopedDocRef()`
   - Never access collections directly

3. **Enforce at multiple levels**
   - Code: Utility functions
   - Database: Security rules
   - UI: Access control

---

## Quick Start

### 1. Import Services

```typescript
import { auth, db, storage } from '@/firebase'
```

### 2. Import Utilities

```typescript
import {
  getProjectScopedDocRef,
  createProjectScopedQuery,
  COLLECTIONS,
} from '@/firebase'
```

### 3. Import Types

```typescript
import type { ContentEntry, Schema } from '@/firebase/types'
```

---

## Common Patterns

### Fetch a Document

```typescript
import { getDoc } from 'firebase/firestore'
import { getProjectScopedDocRef } from '@/firebase'

const docRef = getProjectScopedDocRef('content', contentId, projectId)
const docSnap = await getDoc(docRef)

if (docSnap.exists()) {
  const data = docSnap.data()
}
```

### Query Documents

```typescript
import { getDocs } from 'firebase/firestore'
import { createProjectScopedQuery, whereConstraint } from '@/firebase'

const q = createProjectScopedQuery(
  'content',
  projectId,
  whereConstraint('status', '==', 'published')
)

const snapshot = await getDocs(q)
snapshot.forEach((doc) => {
  console.log(doc.data())
})
```

### Create a Document

```typescript
import { setDoc } from 'firebase/firestore'
import { getProjectScopedDocRef, getServerTimestamp } from '@/firebase'

const docRef = getProjectScopedDocRef('content', newId, projectId)

await setDoc(docRef, {
  project_id: projectId,
  title: 'New Article',
  status: 'draft',
  created_at: getServerTimestamp(),
  updated_at: getServerTimestamp(),
})
```

### Update a Document

```typescript
import { updateDoc } from 'firebase/firestore'
import { getProjectScopedDocRef, getServerTimestamp } from '@/firebase'

const docRef = getProjectScopedDocRef('content', contentId, projectId)

await updateDoc(docRef, {
  title: 'Updated Title',
  updated_at: getServerTimestamp(),
})
```

### Delete a Document

```typescript
import { deleteDoc } from 'firebase/firestore'
import { getProjectScopedDocRef } from '@/firebase'

const docRef = getProjectScopedDocRef('content', contentId, projectId)
await deleteDoc(docRef)
```

### Real-time Listener

```typescript
import { onSnapshot } from 'firebase/firestore'
import { getProjectScopedDocRef } from '@/firebase'

const docRef = getProjectScopedDocRef('content', contentId, projectId)

const unsubscribe = onSnapshot(docRef, (doc) => {
  if (doc.exists()) {
    console.log('Current data:', doc.data())
  }
})

// Later: cleanup
unsubscribe()
```

---

## Collection Names

Use the `COLLECTIONS` constant for consistency:

```typescript
import { COLLECTIONS } from '@/firebase'

COLLECTIONS.PROJECTS     // 'projects'
COLLECTIONS.CONTENT      // 'content'
COLLECTIONS.SCHEMAS      // 'schemas'
COLLECTIONS.AUDIT_LOGS   // 'audit_logs'
COLLECTIONS.USERS        // 'users'
COLLECTIONS.MEDIA        // 'media'
COLLECTIONS.ROLES        // 'roles'
COLLECTIONS.SETTINGS     // 'settings'
```

---

## Security

### Never Do This ❌

```typescript
// Wrong: Direct access without project scoping
const docRef = doc(db, 'content', 'article-123')

// Wrong: No project_id validation
const collection = collection(db, 'content')
```

### Always Do This ✅

```typescript
// Correct: Using project scoping
const docRef = getProjectScopedDocRef('content', 'article-123', projectId)

// Correct: Project-scoped collection
const collection = getProjectScopedCollection('content', projectId)
```

---

## Environment Variables

Required in `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Testing

### With Emulators

Set in `.env`:

```env
VITE_USE_FIREBASE_EMULATORS=true
```

Start emulators:

```bash
firebase emulators:start
```

---

## Best Practices

1. ✅ Always use `getProjectScopedDocRef()`
2. ✅ Use `getServerTimestamp()` for timestamps
3. ✅ Create audit logs for important changes
4. ✅ Use TypeScript types from `types.ts`
5. ✅ Wrap operations in try-catch blocks
6. ✅ Validate project IDs before operations
7. ✅ Clean up real-time listeners when done

---

## Need Help?

See [FIREBASE_SETUP.md](../../FIREBASE_SETUP.md) for detailed setup instructions and examples.

---

**Last Updated:** 2025-10-27
