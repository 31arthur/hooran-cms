# Firebase Setup Guide - Hooran CMS Phase 1

## Overview

This guide covers the Firebase backend setup for Hooran CMS Phase 1, including Authentication and Firestore with **multi-tenancy support**.

## Technology Stack

- **Firebase SDK:** v12.4.0
- **Services Used:**
  - Firebase Authentication
  - Cloud Firestore
  - Firebase Storage
- **Architecture:** Multi-tenant with project-based data scoping

---

## Table of Contents

1. [Installation](#installation)
2. [Firebase Console Setup](#firebase-console-setup)
3. [Environment Configuration](#environment-configuration)
4. [File Structure](#file-structure)
5. [Multi-Tenancy Architecture](#multi-tenancy-architecture)
6. [Usage Examples](#usage-examples)
7. [API Reference](#api-reference)
8. [Security Rules](#security-rules)
9. [Testing with Emulators](#testing-with-emulators)

---

## Installation

The Firebase SDK is already installed:

```bash
npm install firebase
```

**Version:** firebase@12.4.0 ✅

---

## Firebase Console Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name: **"Hooran CMS"** (or your preferred name)
4. Follow the setup wizard

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Enable **Email/Password** authentication
4. (Optional) Enable other providers:
   - Google
   - GitHub
   - Microsoft
   - etc.

### 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll add security rules later)
4. Select a location (choose closest to your users)

### 4. Enable Firebase Storage

1. Go to **Storage**
2. Click **"Get started"**
3. Use default security rules for now

### 5. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click the **Web** icon `</>`
4. Register your app: **"Hooran CMS Web"**
5. Copy the Firebase configuration object

---

## Environment Configuration

### 1. Copy the Example File

```bash
cp .env.example .env
```

### 2. Fill in Firebase Credentials

Edit `.env` file with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

### 3. Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | ✅ |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | Project ID | ✅ |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket URL | ✅ |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | ✅ |
| `VITE_FIREBASE_APP_ID` | App ID | ✅ |
| `VITE_USE_FIREBASE_EMULATORS` | Use local emulators | ❌ |

### 4. Restart Development Server

After updating `.env`:

```bash
npm run dev
```

---

## File Structure

```
src/firebase/
├── config.ts              # Firebase initialization & configuration
├── utils.ts               # Multi-tenancy utility functions
├── types.ts               # TypeScript type definitions
└── index.ts               # Central export point
```

### File Descriptions

#### [src/firebase/config.ts](src/firebase/config.ts)
- Initializes Firebase app
- Configures Auth, Firestore, and Storage
- Validates environment variables
- Exports Firebase service instances

#### [src/firebase/utils.ts](src/firebase/utils.ts)
- **Core utility:** `getProjectScopedDocRef()` - enforces multi-tenancy
- Query builders with project scoping
- Timestamp utilities
- Audit logging helpers
- Collection name constants

#### [src/firebase/types.ts](src/firebase/types.ts)
- TypeScript interfaces for all data models
- `Project`, `ContentEntry`, `Schema`, `AuditLogEntry`, etc.
- Ensures type safety across the application

#### [src/firebase/index.ts](src/firebase/index.ts)
- Central export point
- Re-exports all Firebase services and utilities

---

## Multi-Tenancy Architecture

### Overview

Hooran CMS uses a **project-based multi-tenancy** architecture where all data is scoped to specific projects.

### Data Structure

```
Firestore Structure:
└── projects/
    ├── {projectId}/
    │   ├── content/
    │   │   └── {contentId}/
    │   ├── schemas/
    │   │   └── {schemaId}/
    │   ├── audit_logs/
    │   │   └── {logId}/
    │   ├── media/
    │   │   └── {mediaId}/
    │   ├── roles/
    │   │   └── {roleId}/
    │   └── settings/
    │       └── {settingId}/
    └── {anotherProjectId}/
        └── ...
```

### Key Principles

1. **All data belongs to a project**
   - Every document must include `project_id`
   - Data is organized under `projects/{projectId}/`

2. **Project isolation**
   - Users can only access data from their authorized projects
   - Security rules enforce project-level access control

3. **Core function: `getProjectScopedDocRef()`**
   - **ALL document operations must use this function**
   - Ensures proper data scoping
   - Prevents cross-project data leaks

---

## Usage Examples

### Import Firebase Services

```typescript
import { auth, db, storage } from '@/firebase'
```

### Import Utility Functions

```typescript
import {
  getProjectScopedDocRef,
  getProjectScopedCollection,
  createProjectScopedQuery,
  COLLECTIONS,
} from '@/firebase'
```

### Example 1: Get a Project-Scoped Document

```typescript
import { getDoc } from 'firebase/firestore'
import { getProjectScopedDocRef } from '@/firebase'

// ✅ CORRECT: Using project scoping
const articleRef = getProjectScopedDocRef('content', 'article-123', 'project-abc')
const articleSnap = await getDoc(articleRef)

if (articleSnap.exists()) {
  const articleData = articleSnap.data()
  console.log('Article:', articleData)
}

// ❌ WRONG: Direct access without project scoping
// const wrongRef = doc(db, 'content', 'article-123') // Don't do this!
```

### Example 2: Query Project-Scoped Data

```typescript
import { getDocs } from 'firebase/firestore'
import {
  createProjectScopedQuery,
  whereConstraint,
  orderByConstraint,
  limitConstraint,
} from '@/firebase'

// Get published articles for a specific project
const projectId = 'project-abc'
const publishedArticles = createProjectScopedQuery(
  'content',
  projectId,
  whereConstraint('status', '==', 'published'),
  orderByConstraint('created_at', 'desc'),
  limitConstraint(10)
)

const snapshot = await getDocs(publishedArticles)
snapshot.forEach((doc) => {
  console.log(doc.id, '=>', doc.data())
})
```

### Example 3: Create a New Content Entry

```typescript
import { setDoc } from 'firebase/firestore'
import { getProjectScopedDocRef, getServerTimestamp } from '@/firebase'

const projectId = 'project-abc'
const contentId = 'new-article-456'

const newArticle = {
  project_id: projectId,
  schema_id: 'article-schema',
  title: 'My New Article',
  slug: 'my-new-article',
  status: 'draft',
  content: {
    body: 'Article content here...',
  },
  author_id: 'user-123',
  created_at: getServerTimestamp(),
  updated_at: getServerTimestamp(),
}

const docRef = getProjectScopedDocRef('content', contentId, projectId)
await setDoc(docRef, newArticle)

console.log('Article created successfully!')
```

### Example 4: Update a Document

```typescript
import { updateDoc } from 'firebase/firestore'
import { getProjectScopedDocRef, getServerTimestamp } from '@/firebase'

const projectId = 'project-abc'
const articleId = 'article-123'

const docRef = getProjectScopedDocRef('content', articleId, projectId)
await updateDoc(docRef, {
  title: 'Updated Title',
  status: 'published',
  published_at: getServerTimestamp(),
  updated_at: getServerTimestamp(),
})

console.log('Article updated!')
```

### Example 5: Delete a Document

```typescript
import { deleteDoc } from 'firebase/firestore'
import { getProjectScopedDocRef } from '@/firebase'

const projectId = 'project-abc'
const articleId = 'article-123'

const docRef = getProjectScopedDocRef('content', articleId, projectId)
await deleteDoc(docRef)

console.log('Article deleted!')
```

### Example 6: Create Audit Log Entry

```typescript
import { addDoc, collection } from 'firebase/firestore'
import { getProjectScopedCollection, createAuditLogEntry } from '@/firebase'

const projectId = 'project-abc'
const userId = 'user-123'

const auditLog = createAuditLogEntry(
  projectId,
  'update',
  'content',
  'article-123',
  userId,
  {
    changed_fields: ['title', 'status'],
    ip_address: '192.168.1.1',
  }
)

const auditLogsCollection = getProjectScopedCollection('audit_logs', projectId)
await addDoc(auditLogsCollection, auditLog)

console.log('Audit log created!')
```

### Example 7: Real-time Listener

```typescript
import { onSnapshot } from 'firebase/firestore'
import { getProjectScopedDocRef } from '@/firebase'

const projectId = 'project-abc'
const articleId = 'article-123'

const docRef = getProjectScopedDocRef('content', articleId, projectId)

// Listen for real-time updates
const unsubscribe = onSnapshot(docRef, (doc) => {
  if (doc.exists()) {
    console.log('Current data:', doc.data())
  } else {
    console.log('Document deleted')
  }
})

// Later: stop listening
// unsubscribe()
```

---

## API Reference

### Core Functions

#### `getProjectScopedDocRef(collectionId, docId, projectId)`

Returns a DocumentReference scoped to a specific project.

**Parameters:**
- `collectionId` (string): Collection name (e.g., 'content', 'schemas')
- `docId` (string): Document ID
- `projectId` (string): Project ID for scoping

**Returns:** `DocumentReference`

**Example:**
```typescript
const ref = getProjectScopedDocRef('content', 'article-123', 'project-abc')
```

---

#### `getProjectScopedCollection(collectionId, projectId)`

Returns a CollectionReference scoped to a specific project.

**Parameters:**
- `collectionId` (string): Collection name
- `projectId` (string): Project ID for scoping

**Returns:** `CollectionReference`

**Example:**
```typescript
const collection = getProjectScopedCollection('content', 'project-abc')
```

---

#### `createProjectScopedQuery(collectionId, projectId, ...constraints)`

Creates a query with automatic project scoping.

**Parameters:**
- `collectionId` (string): Collection name
- `projectId` (string): Project ID
- `constraints` (QueryConstraint[]): Where, orderBy, limit, etc.

**Returns:** `Query`

**Example:**
```typescript
const query = createProjectScopedQuery(
  'content',
  'project-abc',
  where('status', '==', 'published'),
  orderBy('created_at', 'desc')
)
```

---

### Helper Functions

#### `whereConstraint(field, operator, value)`
Type-safe wrapper for Firestore where clauses.

#### `orderByConstraint(field, direction)`
Type-safe wrapper for orderBy clauses.

#### `limitConstraint(count)`
Type-safe wrapper for limit clauses.

#### `getServerTimestamp()`
Returns Firestore server timestamp.

#### `createAuditLogEntry(...)`
Creates standardized audit log entries.

---

### Constants

#### `COLLECTIONS`

Centralized collection names:

```typescript
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

## Security Rules

### Firestore Security Rules

Create these rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function to check if user has access to project
    function hasProjectAccess(projectId) {
      return isAuthenticated() &&
             projectId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.projects;
    }

    // Projects collection
    match /projects/{projectId} {
      allow read: if hasProjectAccess(projectId);
      allow write: if hasProjectAccess(projectId);

      // Project sub-collections
      match /{collection}/{docId} {
        allow read: if hasProjectAccess(projectId);
        allow create: if hasProjectAccess(projectId) &&
                      request.resource.data.project_id == projectId;
        allow update: if hasProjectAccess(projectId) &&
                      resource.data.project_id == projectId;
        allow delete: if hasProjectAccess(projectId);
      }
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
  }
}
```

### Storage Security Rules

Create these rules in Firebase Console > Storage > Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projects/{projectId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Testing with Emulators

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Initialize Emulators

```bash
firebase init emulators
```

Select:
- ✅ Authentication Emulator
- ✅ Firestore Emulator
- ✅ Storage Emulator

### Start Emulators

```bash
firebase emulators:start
```

### Configure App to Use Emulators

Update `.env`:

```env
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
VITE_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
VITE_FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
```

---

## TypeScript Types

All Firebase data models are typed. Import from `@/firebase`:

```typescript
import type {
  Project,
  ContentEntry,
  Schema,
  AuditLogEntry,
  User,
  Media,
} from '@/firebase/types'

const article: ContentEntry = {
  id: 'article-123',
  project_id: 'project-abc',
  schema_id: 'article-schema',
  title: 'My Article',
  slug: 'my-article',
  status: 'published',
  content: {},
  author_id: 'user-123',
  created_at: Timestamp.now(),
  updated_at: Timestamp.now(),
}
```

---

## Best Practices

1. **Always use `getProjectScopedDocRef()`**
   - Never access documents directly without project scoping
   - This enforces multi-tenancy at the code level

2. **Validate project IDs**
   - Use `validateProjectId()` before operations
   - Prevents errors from invalid IDs

3. **Include timestamps**
   - Always use `getServerTimestamp()` for `created_at` and `updated_at`
   - Server timestamps are consistent across all clients

4. **Create audit logs**
   - Log all significant changes
   - Use `createAuditLogEntry()` helper

5. **Type everything**
   - Use TypeScript interfaces from `types.ts`
   - Ensures data consistency

6. **Handle errors**
   - Wrap Firebase calls in try-catch
   - Provide user-friendly error messages

---

## Troubleshooting

### Error: "Missing Firebase configuration"

**Solution:** Ensure all `VITE_FIREBASE_*` variables are set in `.env` file.

### Error: "Permission denied"

**Solution:**
1. Check Firestore security rules
2. Ensure user is authenticated
3. Verify user has access to the project

### Emulators not connecting

**Solution:**
1. Ensure emulators are running: `firebase emulators:start`
2. Check `VITE_USE_FIREBASE_EMULATORS=true` in `.env`
3. Verify emulator ports are correct

---

## Next Steps

1. ✅ Firebase SDK installed
2. ✅ Configuration files created
3. ✅ Multi-tenancy utilities ready
4. ✅ Type definitions complete

**Ready for:**
- Authentication UI components
- Content management features
- Schema builder
- Media library

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Emulators](https://firebase.google.com/docs/emulator-suite)

---

**Status:** ✅ Firebase Phase 1 Backend Setup Complete!
