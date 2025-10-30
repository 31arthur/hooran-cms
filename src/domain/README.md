# Core Domain Layer

This directory contains the **core domain layer** of the Hooran CMS application, implementing the **Framework Independence** principle from Clean Architecture.

## Purpose

The core domain layer establishes a clean separation between business logic and infrastructure concerns by:

1. **Defining database-agnostic domain entities** - Pure TypeScript interfaces with no framework dependencies
2. **Defining repository contracts** - Interfaces that specify data operations without implementation details
3. **Shielding business logic from Firebase** - Preventing Firebase types from leaking into application logic

## Directory Structure

```
src/core/
├── entities/                  # Domain entities (data models)
│   ├── Project.ts            # Project entity
│   ├── SchemaDefinition.ts   # Schema/collection definition entity
│   ├── ContentEntry.ts       # Content entry entity
│   └── index.ts              # Entity exports
├── repositories/              # Repository interfaces (data access contracts)
│   ├── IProjectRepository.ts # Project repository interface
│   ├── ISchemaRepository.ts  # Schema repository interface
│   ├── IContentRepository.ts # Content repository interface
│   └── index.ts              # Repository exports
└── index.ts                   # Main exports
```

## Domain Entities

Domain entities are **pure TypeScript interfaces** that represent the core business objects of the application. They are:

- **Database-agnostic** - No Firebase `Timestamp`, `DocumentReference`, or other framework-specific types
- **Framework-independent** - No imports from Firebase, Firestore, or any other external library
- **Type-safe** - Using TypeScript's type system for compile-time safety
- **Clean** - Using native JavaScript types like `Date`, `string`, `number`, `boolean`

### Available Entities

- **`Project`** - Represents a project in the CMS
- **`SchemaDefinition`** - Represents a collection schema (content type definition)
- **`ContentEntry`** - Represents a content entry within a collection

## Repository Interfaces

Repository interfaces define **contracts for data operations** without specifying how the data is stored or retrieved. They:

- **Define the API** - Specify what operations are available (CRUD, queries, etc.)
- **Use domain entities** - All parameters and return types use domain entities
- **Hide implementation** - No database-specific logic or types
- **Enable dependency inversion** - Business logic depends on interfaces, not concrete implementations

### Available Repositories

- **`IProjectRepository`** - Contract for project data operations
- **`ISchemaRepository`** - Contract for schema data operations
- **`IContentRepository`** - Contract for content data operations

## Usage

### Importing Entities

```typescript
import type { Project, SchemaDefinition, ContentEntry } from '@/core/entities'

// Use in your application code
const project: Project = {
  projectId: 'my-project',
  name: 'My Project',
  status: 'Active',
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

### Importing Repository Interfaces

```typescript
import type { IProjectRepository, ISchemaRepository } from '@/core/repositories'

// Use to define dependencies
class ProjectService {
  constructor(private projectRepo: IProjectRepository) {}

  async getProject(id: string): Promise<Project | null> {
    return this.projectRepo.getProjectById(id)
  }
}
```

### Importing Everything

```typescript
import type {
  Project,
  SchemaDefinition,
  ContentEntry,
  IProjectRepository,
  ISchemaRepository,
  IContentRepository,
} from '@/core'
```

## Benefits

### 1. **Framework Independence**

The application's business logic is completely decoupled from Firebase. This means:
- You can switch databases without changing business logic
- You can test business logic without Firebase
- You can use multiple data sources simultaneously

### 2. **Testability**

Repository interfaces enable easy mocking for unit tests:

```typescript
// Mock implementation for testing
const mockProjectRepo: IProjectRepository = {
  getProjectById: jest.fn().mockResolvedValue(mockProject),
  createProject: jest.fn().mockResolvedValue('project-id'),
  // ... other methods
}

// Test your service with the mock
const service = new ProjectService(mockProjectRepo)
```

### 3. **Type Safety**

All data operations are strongly typed, catching errors at compile time:

```typescript
// TypeScript will enforce correct types
const project: Project = await projectRepo.getProjectById('id')

// This will cause a type error if status is invalid
project.status = 'InvalidStatus' // ❌ Type error
project.status = 'Active' // ✅ Valid
```

### 4. **Clear Contracts**

Repository interfaces serve as documentation for what operations are available:

```typescript
interface IProjectRepository {
  getProjects(): Promise<Project[]>
  getProjectById(projectId: string): Promise<Project | null>
  createProject(...): Promise<string>
  updateProjectMetadata(...): Promise<void>
  deleteProject(...): Promise<void>
}
```

## Next Steps

To complete the Framework Independence implementation:

1. **Create concrete implementations** - Implement the repository interfaces with Firebase-specific logic
   - `src/infrastructure/repositories/FirebaseProjectRepository.ts`
   - `src/infrastructure/repositories/FirebaseSchemaRepository.ts`
   - `src/infrastructure/repositories/FirebaseContentRepository.ts`

2. **Create adapter layer** - Convert between domain entities and Firebase types
   - `src/infrastructure/adapters/ProjectAdapter.ts`
   - `src/infrastructure/adapters/SchemaAdapter.ts`
   - `src/infrastructure/adapters/ContentAdapter.ts`

3. **Update existing services** - Refactor `ProjectService`, `SchemaService`, and `DataService` to use repository interfaces instead of direct Firebase calls

4. **Set up dependency injection** - Configure DI container to inject repository implementations

## Examples

### Example: Using IProjectRepository

```typescript
import type { IProjectRepository } from '@/core/repositories'
import type { Project } from '@/core/entities'

class ProjectManager {
  constructor(private repo: IProjectRepository) {}

  async getAllProjects(): Promise<Project[]> {
    return this.repo.getProjects()
  }

  async createNewProject(name: string, slug: string, userId: string): Promise<string> {
    return this.repo.createProject(name, slug, null, userId)
  }
}
```

### Example: Domain Entity with No Firebase Types

```typescript
// ❌ BAD - Firebase types leak into domain
interface BadProject {
  id: string
  name: string
  createdAt: Timestamp // Firebase type!
  owner: DocumentReference // Firebase type!
}

// ✅ GOOD - Clean domain entity
interface GoodProject {
  id: string
  name: string
  createdAt: Date // Native JavaScript type
  ownerId: string // Just an ID, not a reference
}
```

## Architecture Principle

This implementation follows the **Dependency Inversion Principle** from SOLID:

> High-level modules should not depend on low-level modules. Both should depend on abstractions.

In this case:
- **High-level**: Business logic, UI components, application services
- **Low-level**: Firebase, database implementations, external APIs
- **Abstractions**: Repository interfaces, domain entities

```
┌─────────────────────────────────────┐
│   Application Layer (React, UI)    │
│                                     │
│  Depends on: Repository Interfaces  │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│      Core Layer (This directory)    │
│                                     │
│  • Domain Entities                  │
│  • Repository Interfaces            │
│                                     │
│  No external dependencies!          │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│   Infrastructure Layer (Firebase)   │
│                                     │
│  • Repository Implementations       │
│  • Database Adapters                │
│  • Type Conversions                 │
└─────────────────────────────────────┘
```

## References

- Clean Architecture by Robert C. Martin
- Domain-Driven Design by Eric Evans
- SOLID Principles
