### Infrastructure Layer

The infrastructure layer contains all concrete implementations of repository interfaces and handles all direct communication with external dependencies like Firebase.

## Overview

This layer implements the **Repository Pattern** to achieve **Framework Independence**. All Firebase SDK calls are confined to this layer, preventing framework-specific code from leaking into business logic.

## Architecture

```
┌─────────────────────────────────────────┐
│   Application/Business Logic Layer     │
│   - Uses repository interfaces          │
│   - Framework-agnostic                  │
└───────────────┬─────────────────────────┘
                │ depends on
                ▼
┌─────────────────────────────────────────┐
│   Core Domain Layer                     │
│   - Domain entities (Project, Schema)   │
│   - Repository interfaces               │
│   - NO framework dependencies           │
└───────────────▲─────────────────────────┘
                │ implements
                │
┌───────────────┴─────────────────────────┐
│   Infrastructure Layer (THIS LAYER)     │
│   - Firebase repository implementations │
│   - Data type adapters                  │
│   - ALL Firebase SDK calls              │
└─────────────────────────────────────────┘
```

## Directory Structure

```
src/infrastructure/
├── adapters/                      # Type conversion adapters
│   ├── ProjectAdapter.ts         # Firebase ↔ Project entity
│   ├── SchemaAdapter.ts          # Firebase ↔ SchemaDefinition entity
│   ├── ContentAdapter.ts         # Firebase ↔ ContentEntry entity
│   └── index.ts                  # Adapter exports
├── repositories/                  # Repository implementations
│   ├── FirebaseProjectRepository.ts   # IProjectRepository implementation
│   ├── FirebaseSchemaRepository.ts    # ISchemaRepository implementation
│   ├── FirebaseContentRepository.ts   # IContentRepository implementation
│   └── index.ts                       # Repository exports
└── index.ts                       # Main infrastructure exports
```

## Components

### 1. Data Adapters

Adapters handle the conversion between Firebase Firestore types and clean domain entities.

**Purpose:**
- Convert Firebase `Timestamp` to JavaScript `Date`
- Convert Firebase `DocumentData` to domain entities
- Convert domain entities to Firestore document data
- Isolate all type conversion logic in one place

**Example:**

```typescript
import { ProjectAdapter } from '@/infrastructure/adapters'
import type { Project } from '@/core/entities'

// Convert Firestore document to domain entity
const project: Project = ProjectAdapter.toEntity(docId, firestoreData)

// No Firebase types in the result - just clean domain entities!
console.log(project.createdAt) // Date, not Timestamp
```

### 2. Repository Implementations

Concrete classes that implement repository interfaces using Firebase Firestore.

**Responsibilities:**
- Implement ALL methods from repository interfaces
- Execute Firestore SDK calls (getDoc, setDoc, updateDoc, etc.)
- Convert between Firebase types and domain entities using adapters
- Handle Firebase-specific errors
- Perform audit logging

**Key Principles:**
- ✅ Contains ALL Firebase code for a domain entity
- ✅ Implements repository interface from @/core/repositories
- ✅ Uses adapters for type conversion
- ✅ Returns clean domain entities
- ✅ Completely replaceable (can swap Firebase for PostgreSQL)

## Repository Implementations

### FirebaseProjectRepository

Implements `IProjectRepository` for managing projects in Firebase Firestore.

**Firestore Path:** `projects/{projectId}`

**Key Methods:**
- `getProjects()` - Fetch all projects
- `getProjectById(id)` - Fetch single project
- `createProject(...)` - Create new project
- `updateProjectMetadata(...)` - Update project
- `deleteProject(...)` - Delete project
- `projectExists(id)` - Check existence

**Example:**

```typescript
import { FirebaseProjectRepository } from '@/infrastructure/repositories'
import type { Project } from '@/core/entities'

const repo = new FirebaseProjectRepository()

// All methods return clean domain entities
const projects: Project[] = await repo.getProjects()

// No Firebase types exposed!
projects.forEach(p => {
  console.log(p.createdAt) // Date, not Timestamp
})
```

### FirebaseSchemaRepository

Implements `ISchemaRepository` for managing schemas in Firebase Firestore.

**Firestore Path:** `projects/{projectId}/schemas/{schemaId}`

**Key Methods:**
- `getSchemasForProject(projectId)` - Fetch all schemas
- `getSchemaById(projectId, schemaId)` - Fetch single schema
- `createSchema(...)` - Create new schema
- `updateSchema(...)` - Update schema
- `deleteSchema(...)` - Delete schema (with content check)
- `schemaExists(...)` - Check existence

**Features:**
- Multi-tenancy enforcement (project-scoped subcollections)
- Content existence validation before deletion
- Field change tracking for audit logs

### FirebaseContentRepository

Implements `IContentRepository` for managing content entries in Firebase Firestore.

**Firestore Path:** `projects/{projectId}/data/{collectionId}/{entryId}`

**Key Methods:**
- `getContentEntries(...)` - Fetch entries with filtering/search
- `getContentEntryById(...)` - Fetch single entry
- `createContentEntry(...)` - Create new entry
- `updateContentEntry(...)` - Update entry
- `deleteContentEntry(...)` - Delete entry
- `batchUpdateContentStatus(...)` - Bulk status updates

**Features:**
- Multi-tenancy enforcement
- Search and filtering support
- Batch operations
- Field-level change tracking

## Data Adapters

### ProjectAdapter

Converts between Firebase documents and `Project` entities.

**Methods:**
- `toEntity(docId, data)` - Firestore → Project entity
- `toEntityList(documents)` - Multiple docs → Project[]
- `toFirestoreCreate(...)` - Create data → Firestore format
- `toFirestoreUpdate(...)` - Update data → Firestore format

### SchemaAdapter

Converts between Firebase documents and `SchemaDefinition` entities.

**Methods:**
- `toEntity(docId, data)` - Firestore → SchemaDefinition
- `toEntityList(documents)` - Multiple docs → SchemaDefinition[]
- `toFirestoreCreate(...)` - CreateSchemaInput → Firestore format
- `toFirestoreUpdate(...)` - UpdateSchemaInput → Firestore format

### ContentAdapter

Converts between Firebase documents and `ContentEntry` entities.

**Methods:**
- `toEntity(docId, data, projectId, collectionId)` - Firestore → ContentEntry
- `toEntityList(...)` - Multiple docs → ContentEntry[]
- `toFirestoreCreate(...)` - CreateContentEntryInput → Firestore format
- `toFirestoreUpdate(...)` - UpdateContentEntryInput → Firestore format

## Usage with DI Container

The recommended way to use repositories is through the DI container:

### 1. Register Repositories at App Startup

```typescript
// src/main.tsx
import { DIContainer, DI_TYPES } from '@/core/di'
import {
  FirebaseProjectRepository,
  FirebaseSchemaRepository,
  FirebaseContentRepository,
} from '@/infrastructure/repositories'

// Register implementations
DIContainer.register(DI_TYPES.ProjectRepository, new FirebaseProjectRepository())
DIContainer.register(DI_TYPES.SchemaRepository, new FirebaseSchemaRepository())
DIContainer.register(DI_TYPES.ContentRepository, new FirebaseContentRepository())
```

### 2. Resolve Repositories in Application Code

```typescript
// In your component or service
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'

const projectRepo = DIContainer.resolve<IProjectRepository>(
  DI_TYPES.ProjectRepository
)

const projects = await projectRepo.getProjects()
```

### 3. Mock Repositories in Tests

```typescript
// In test file
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'

beforeEach(() => {
  DIContainer.clear()

  const mockRepo: IProjectRepository = {
    getProjects: vi.fn().mockResolvedValue([]),
    getProjectById: vi.fn().mockResolvedValue(null),
    // ... other methods
  }

  DIContainer.register(DI_TYPES.ProjectRepository, mockRepo)
})
```

## Framework Independence Benefits

### Before (Hard-coded Firebase)

```typescript
// ❌ Business logic coupled to Firebase
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

async function getProject(id: string) {
  const docRef = doc(db, 'projects', id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null

  const data = docSnap.data()
  return {
    id: docSnap.id,
    name: data.name,
    createdAt: data.created_at.toDate(), // Firebase Timestamp!
  }
}

// Cannot test without Firebase
// Cannot switch databases
// Firebase types leak into business logic
```

### After (Repository Pattern)

```typescript
// ✅ Business logic depends on interface
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'

async function getProject(id: string) {
  const repo = DIContainer.resolve<IProjectRepository>(
    DI_TYPES.ProjectRepository
  )

  return repo.getProjectById(id)
}

// Easy to test with mocks
// Easy to switch databases
// No Firebase types in business logic
```

## Migration Guide

### Migrating from Direct Firebase Calls

**Step 1:** Identify direct Firebase usage

```typescript
// OLD CODE
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'

const querySnapshot = await getDocs(collection(db, 'projects'))
const projects = querySnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}))
```

**Step 2:** Use repository instead

```typescript
// NEW CODE
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'

const projectRepo = DIContainer.resolve<IProjectRepository>(
  DI_TYPES.ProjectRepository
)
const projects = await projectRepo.getProjects()
```

**Step 3:** Update tests to use mocks

```typescript
// TEST CODE
beforeEach(() => {
  DIContainer.clear()
  DIContainer.register(DI_TYPES.ProjectRepository, mockProjectRepo)
})

test('should load projects', async () => {
  const projects = await getProjects()
  expect(projects).toHaveLength(2)
})
```

## Error Handling

All repository methods include proper error handling:

```typescript
try {
  const project = await projectRepo.getProjectById(id)
  if (!project) {
    console.log('Project not found')
  }
} catch (error) {
  // Firebase errors are caught and wrapped
  console.error('Failed to fetch project:', error.message)
}
```

## Audit Logging

All mutation operations (create, update, delete) include automatic audit logging:

```typescript
// Audit logging happens automatically inside repositories
await projectRepo.createProject(name, slug, null, userId)
// → Audit log created with action 'CREATE'

await projectRepo.updateProjectMetadata(id, metadata, userId)
// → Audit log created with action 'UPDATE', includes field changes

await projectRepo.deleteProject(id, userId)
// → Audit log created with action 'DELETE'
```

## Best Practices

### ✅ DO

- Use repositories through DI container
- Depend on repository interfaces, not implementations
- Mock repositories in tests
- Handle errors appropriately
- Trust adapter type conversions

### ❌ DON'T

- Import Firebase SDK directly in business logic
- Create repository instances with `new` (use DI container)
- Mix Firebase types with domain entities
- Skip error handling
- Bypass repositories for "simple" queries

## Switching Databases

To switch from Firebase to another database (e.g., PostgreSQL):

1. Create new repository implementations:
   - `PostgresProjectRepository implements IProjectRepository`
   - `PostgresSchemaRepository implements ISchemaRepository`
   - `PostgresContentRepository implements IContentRepository`

2. Create new adapters:
   - `PostgresProjectAdapter`
   - `PostgresSchemaAdapter`
   - `PostgresContentAdapter`

3. Update DI registration:
   ```typescript
   DIContainer.register(
     DI_TYPES.ProjectRepository,
     new PostgresProjectRepository() // Changed!
   )
   ```

4. **No changes to business logic required!** 🎉

## Summary

The infrastructure layer successfully implements the Repository Pattern to achieve:

✅ **Framework Independence** - Firebase is isolated to this layer
✅ **Testability** - Easy mocking through interfaces
✅ **Maintainability** - Clear separation of concerns
✅ **Flexibility** - Easy database migration
✅ **Type Safety** - Clean domain entities throughout
✅ **Audit Trail** - Automatic logging of all mutations

All Firebase SDK calls are now confined to this layer, completely resolving the Framework Independence violation! 🎯
