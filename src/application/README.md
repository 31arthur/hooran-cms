## Application Layer - Use Cases

The application layer contains use case interfaces that define high-level business operations. This layer implements the **Use Case/Interactor** pattern from Clean Architecture, correcting the architectural violation of missing business logic orchestration.

## Overview

Use cases (also called interactors) represent the application-specific business rules. They orchestrate the flow of data to and from entities, and direct those entities to use their enterprise-wide business rules to achieve the goals of the use case.

### Clean Architecture Position

```
┌─────────────────────────────────────────────┐
│   Presentation Layer (UI/Controllers)       │
│   - React Components                        │
│   - View Models                             │
│   - Event Handlers                          │
└────────────────┬────────────────────────────┘
                 │ calls use cases
                 ▼
┌─────────────────────────────────────────────┐
│   Application Layer ← YOU ARE HERE          │
│   - Use Case Interfaces                     │
│   - Business Workflows                      │
│   - Authorization Logic                     │
│   - Validation Rules                        │
└────────────────┬────────────────────────────┘
                 │ uses
                 ▼
┌─────────────────────────────────────────────┐
│   Domain Layer                              │
│   - Entities (Project, Content, Schema)     │
│   - Repository Interfaces                   │
│   - Domain Business Rules                   │
└────────────────▲────────────────────────────┘
                 │ implements
                 │
┌────────────────┴────────────────────────────┐
│   Infrastructure Layer                      │
│   - Firebase Repositories                   │
│   - External Services                       │
│   - Database Adapters                       │
└─────────────────────────────────────────────┘
```

## Use Case Interfaces

### 1. IProjectSelectionUseCase

**Purpose:** Manages project selection, access control, and project lifecycle operations.

**File:** [IProjectSelectionUseCase.ts](./usecases/IProjectSelectionUseCase.ts)

**Key Operations:**
- `getAccessibleProjects()` - Get projects user can access based on role
- `getAllProjects()` - Get all projects (Super only)
- `getProjectById()` - Get specific project with permissions
- `createProject()` - Create new project (Super only)
- `updateProjectMetadata()` - Update project info
- `archiveProject()` - Archive a project
- `deleteProject()` - Delete a project (Super only)
- `hasProjectAccess()` - Check user access
- `getUserAssignedProjects()` - Get user's projects
- `isProjectSlugAvailable()` - Validate slug uniqueness

**Business Rules:**
- Super users see all projects
- Admin users see only assigned projects
- Project slugs must be unique and valid format
- Archived projects hidden from regular listings
- Only Super users can delete projects

**Example:**
```typescript
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectSelectionUseCase } from '@/application/usecases'

const useCase = DIContainer.resolve<IProjectSelectionUseCase>(
  DI_TYPES.ProjectSelectionUseCase
)

// Get accessible projects
const projects = await useCase.getAccessibleProjects(userId, userRole)

// Create new project
const projectId = await useCase.createProject(
  'My Project',
  'my-project',
  'admin@example.com',
  userId
)
```

### 2. IContentManagementUseCase

**Purpose:** Manages content CRUD operations, publishing workflows, and validation.

**File:** [IContentManagementUseCase.ts](./usecases/IContentManagementUseCase.ts)

**Key Operations:**
- `getContentEntries()` - List content with filtering
- `getPublishedContent()` - Get published content only
- `getDraftContent()` - Get draft content only
- `getContentEntryById()` - Get single entry with schema
- `createContentEntry()` - Create new content
- `updateContentEntry()` - Update existing content
- `deleteContentEntry()` - Delete content
- `publishContentEntry()` - Publish content (draft → published)
- `unpublishContentEntry()` - Unpublish content (published → draft)
- `batchPublishEntries()` - Bulk publish operation
- `batchUnpublishEntries()` - Bulk unpublish operation
- `batchDeleteEntries()` - Bulk delete (Super only)
- `validateContentEntry()` - Validate against schema
- `getContentCount()` - Get entry count
- `searchContent()` - Search across fields

**Business Rules:**
- Admin/Super can create/edit content
- Content must validate against schema
- Required fields enforced
- Status workflow: draft → published → archived
- Batch operations continue on error
- Search respects user permissions

**Example:**
```typescript
const useCase = DIContainer.resolve<IContentManagementUseCase>(
  DI_TYPES.ContentManagementUseCase
)

// Create content
const entryId = await useCase.createContentEntry(
  'project-1',
  'articles',
  {
    data: { title: 'Hello World', content: '...' },
    status: 'draft'
  },
  userId,
  userRole
)

// Publish content
await useCase.publishContentEntry(
  'project-1',
  'articles',
  entryId,
  userId,
  userRole
)

// Get published content
const published = await useCase.getPublishedContent('project-1', 'articles')
```

### 3. ISchemaManagementUseCase

**Purpose:** Manages schema/collection definitions and structure.

**File:** [ISchemaManagementUseCase.ts](./usecases/ISchemaManagementUseCase.ts)

**Key Operations:**
- `getSchemasForProject()` - List all schemas
- `getSchemasWithStats()` - Schemas with content counts
- `getSchemaById()` - Get specific schema
- `createSchema()` - Create new schema
- `updateSchema()` - Update schema structure
- `deleteSchema()` - Delete schema (Super only)
- `validateSchemaDeletion()` - Check if can delete
- `validateSchemaStructure()` - Validate field definitions
- `isSchemaIdAvailable()` - Check ID uniqueness
- `getFieldSuggestions()` - Get field configuration suggestions

**Business Rules:**
- Admin/Super can create schemas
- Schema IDs must be unique within project
- Cannot delete schema with content
- Cannot delete system schemas
- Field names must be unique within schema
- Field type changes require migration

**Example:**
```typescript
const useCase = DIContainer.resolve<ISchemaManagementUseCase>(
  DI_TYPES.SchemaManagementUseCase
)

// Create schema
const schemaId = await useCase.createSchema(
  'project-1',
  {
    id: 'articles',
    name: 'Articles',
    fields: [
      { name: 'title', type: 'text', label: 'Title', required: true },
      { name: 'content', type: 'richtext', label: 'Content' }
    ]
  },
  userId,
  userRole
)

// Get schemas with stats
const schemas = await useCase.getSchemasWithStats('project-1', userId, userRole)
console.log(`Schema "${schemas[0].schema.name}" has ${schemas[0].contentCount} entries`)
```

### 4. IUserManagementUseCase

**Purpose:** Manages users, roles, and project assignments.

**File:** [IUserManagementUseCase.ts](./usecases/IUserManagementUseCase.ts)

**Key Operations:**
- `getAllUsers()` - Get all users (Super only)
- `getUserById()` - Get user by ID
- `getUserByEmail()` - Get user by email
- `getUsersAssignedToProject()` - Get project's users
- `assignUserToProject()` - Assign user to project
- `removeUserFromProject()` - Remove user assignment
- `batchAssignUserToProjects()` - Bulk assign
- `updateUserProjectAssignments()` - Update assignments
- `updateUserRole()` - Change user role
- `hasProjectAccess()` - Check user access
- `validateUserForProjectAssignment()` - Validate before assign

**Business Rules:**
- Only Super users manage users
- Only Admin role can be assigned to projects
- User role cannot be assigned to projects
- Super users have access to all projects
- Cannot change own role

**Example:**
```typescript
const useCase = DIContainer.resolve<IUserManagementUseCase>(
  DI_TYPES.UserManagementUseCase
)

// Find user by email
const user = await useCase.getUserByEmail('admin@example.com', superUserId)

if (user && user.role === 'Admin') {
  // Assign to project
  await useCase.assignUserToProject(user.uid, 'project-1', superUserId)
}

// Get all users assigned to project
const users = await useCase.getUsersAssignedToProject(
  'project-1',
  userId,
  userRole
)
```

## Key Principles

### 1. Framework Independence

✅ **NO Firebase types**
```typescript
// ❌ BAD
async getProject(projectId: string): Promise<DocumentSnapshot>

// ✅ GOOD
async getProject(projectId: string): Promise<Project>
```

✅ **NO UI types**
```typescript
// ❌ BAD
async handleSubmit(event: React.FormEvent): Promise<void>

// ✅ GOOD
async createProject(name: string, slug: string): Promise<string>
```

### 2. Pure Business Logic

Use cases contain only business rules:
```typescript
async createProject(
  projectName: string,
  projectSlug: string,
  initialAdminEmail: string | null,
  userId: string
): Promise<string> {
  // ✅ Business validation
  if (!projectSlug.match(/^[a-z0-9-]+$/)) {
    throw new Error('Invalid slug format')
  }

  // ✅ Business rule
  const exists = await this.projectRepo.projectExists(projectSlug)
  if (exists) {
    throw new Error('Slug already exists')
  }

  // ✅ Business operation
  return this.projectRepo.createProject(projectName, projectSlug, initialAdminEmail, userId)
}
```

### 3. Dependency Inversion

Use cases depend on repository interfaces, not implementations:
```typescript
class ProjectSelectionUseCase implements IProjectSelectionUseCase {
  constructor(
    private projectRepo: IProjectRepository,  // ✅ Interface
    private userRepo: IUserRepository          // ✅ Interface
  ) {}
}
```

### 4. Single Responsibility

Each use case handles one business concept:
- `IProjectSelectionUseCase` - Project operations only
- `IContentManagementUseCase` - Content operations only
- `ISchemaManagementUseCase` - Schema operations only
- `IUserManagementUseCase` - User operations only

## Testing Use Cases

Use cases are easy to test with mock repositories:

```typescript
// In test file
import { describe, it, expect, beforeEach } from 'vitest'
import { MockProjectRepository } from '@/infrastructure/repositories/__mocks__'
import { ProjectSelectionUseCase } from '@/application/usecases/impl/ProjectSelectionUseCase'

describe('ProjectSelectionUseCase', () => {
  let useCase: ProjectSelectionUseCase
  let mockRepo: MockProjectRepository

  beforeEach(() => {
    mockRepo = new MockProjectRepository([])
    useCase = new ProjectSelectionUseCase(mockRepo)
  })

  it('should create project with valid slug', async () => {
    const projectId = await useCase.createProject(
      'Test Project',
      'test-project',
      null,
      'user-123'
    )

    expect(projectId).toBe('test-project')
  })

  it('should reject invalid slug format', async () => {
    await expect(
      useCase.createProject('Test', 'Invalid Slug!', null, 'user-123')
    ).rejects.toThrow('Invalid slug format')
  })
})
```

## Benefits of Use Case Layer

### Before (Without Use Cases)

```typescript
// ❌ Business logic mixed with UI
function ProjectCreationForm() {
  const handleSubmit = async (e) => {
    // Validation in UI
    if (!slug.match(/^[a-z0-9-]+$/)) {
      setError('Invalid slug')
      return
    }

    // Direct Firebase call
    const docRef = doc(db, 'projects', slug)
    await setDoc(docRef, { name, slug })

    // Business logic in UI
    if (adminEmail) {
      const userQuery = query(collection(db, 'users'), where('email', '==', adminEmail))
      // ... more Firebase code
    }
  }
}
```

### After (With Use Cases)

```typescript
// ✅ Clean separation
function ProjectCreationForm() {
  const useCase = DIContainer.resolve<IProjectSelectionUseCase>(
    DI_TYPES.ProjectSelectionUseCase
  )

  const handleSubmit = async () => {
    try {
      await useCase.createProject(name, slug, adminEmail, userId)
      // Success
    } catch (error) {
      setError(error.message)
    }
  }
}
```

Benefits:
- ✅ Business logic testable without UI
- ✅ Business logic reusable (web, mobile, API)
- ✅ UI simpler and focused on presentation
- ✅ Easy to change UI without affecting business logic

## Implementation Status

| Use Case | Interface | Implementation | Status |
|----------|-----------|----------------|--------|
| ProjectSelectionUseCase | ✅ Created | ⏳ Pending | Ready for implementation |
| ContentManagementUseCase | ✅ Created | ⏳ Pending | Ready for implementation |
| SchemaManagementUseCase | ✅ Created | ⏳ Pending | Ready for implementation |
| UserManagementUseCase | ✅ Created | ⏳ Pending | Ready for implementation |

## Next Steps

1. **Create Implementations** - Implement each use case interface
2. **Register in DI** - Add use case implementations to DI container
3. **Update UI** - Refactor components to use use cases
4. **Write Tests** - Create comprehensive unit tests
5. **Documentation** - Add JSDoc comments to implementations

## Summary

The application layer successfully implements the Use Case/Interactor pattern, correcting the Clean Architecture violation. All use case interfaces:

✅ Accept and return ONLY domain entities or primitives
✅ NO Firebase types
✅ NO UI types
✅ Pure business logic
✅ Framework independent
✅ Easy to test
✅ Ready for implementation

This layer provides a clear contract for business operations, enabling proper separation of concerns and maintainable architecture.
