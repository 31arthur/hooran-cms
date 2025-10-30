# DI Container - Quick Start Guide

Get started with dependency injection in 5 minutes!

## 1. Import the DI System

```typescript
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'
```

## 2. Register Dependencies (Once at Startup)

```typescript
// In src/main.tsx or app initialization
import { DIContainer, DI_TYPES } from '@/core/di'
import { FirebaseProjectRepository } from '@/infrastructure/repositories/FirebaseProjectRepository'

// Register all dependencies
DIContainer.register(
  DI_TYPES.ProjectRepository,
  new FirebaseProjectRepository()
)
```

## 3. Use Dependencies Anywhere

```typescript
// In your component or service
const projectRepo = DIContainer.resolve<IProjectRepository>(
  DI_TYPES.ProjectRepository
)

const projects = await projectRepo.getProjects()
```

## 4. Test with Mocks

```typescript
// In your test file
import { DIContainer, DI_TYPES } from '@/core/di'

beforeEach(() => {
  DIContainer.clear()
  DIContainer.register(DI_TYPES.ProjectRepository, mockRepository)
})
```

## Available DI Tokens

```typescript
DI_TYPES.ProjectRepository    // IProjectRepository
DI_TYPES.SchemaRepository     // ISchemaRepository
DI_TYPES.ContentRepository    // IContentRepository
```

## Common Patterns

### Pattern 1: Use in React Component

```typescript
function MyComponent() {
  const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

  const loadData = async () => {
    const data = await repo.getProjects()
    console.log(data)
  }

  return <button onClick={loadData}>Load</button>
}
```

### Pattern 2: Use in Service Class

```typescript
class ProjectManager {
  private repo: IProjectRepository

  constructor() {
    this.repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)
  }

  async getAll() {
    return this.repo.getProjects()
  }
}
```

### Pattern 3: Use in Custom Hook

```typescript
function useProjects() {
  const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

  const [projects, setProjects] = useState([])

  useEffect(() => {
    repo.getProjects().then(setProjects)
  }, [])

  return projects
}
```

## That's It!

You're now using dependency injection. Your code is testable, flexible, and follows best practices.

For more details, see:
- [README.md](./README.md) - Complete documentation
- [EXAMPLES.md](./EXAMPLES.md) - Detailed examples
