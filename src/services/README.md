# Services Layer

This directory contains service classes that encapsulate business logic and data operations for Hooran CMS.

## Overview

Services provide a clean abstraction layer between UI components and Firebase/Firestore operations. They handle:

- **Data validation** - Ensuring data integrity before operations
- **Multi-tenancy scoping** - Enforcing project-based data isolation
- **Error handling** - Providing meaningful error messages
- **Audit logging** - Tracking changes for compliance
- **Business rules** - Implementing CMS-specific logic

## Available Services

### SchemaService

**Purpose:** Manages project-scoped collection schemas (content type definitions)

**Role Requirement:** Super admin only

**Key Features:**
- Retrieve all schemas for a project
- Create new collection definitions
- Update existing schemas
- Delete schemas (with protection for system schemas)
- Validate schema structure

**File:** [SchemaService.ts](./SchemaService.ts)

**Documentation:** [SCHEMA_SERVICE.md](./SCHEMA_SERVICE.md)

---

## Architecture Pattern

### Service Class Structure

All services follow this pattern:

```typescript
class MyServiceClass {
  // Read operations
  async getItemsForProject(projectId: string): Promise<Item[]> { }
  async getItemById(projectId: string, itemId: string): Promise<Item | null> { }

  // Write operations
  async createItem(projectId: string, data: CreateItemInput, userId: string): Promise<string> { }
  async updateItem(projectId: string, itemId: string, updates: UpdateItemInput, userId: string): Promise<void> { }
  async deleteItem(projectId: string, itemId: string, userId: string): Promise<void> { }

  // Utility operations
  async itemExists(projectId: string, itemId: string): Promise<boolean> { }
}

// Export singleton instance
export const MyService = new MyServiceClass()
```

### Multi-Tenancy Enforcement

**CRITICAL:** All service methods MUST:

1. Accept `projectId` as the first parameter
2. Validate `projectId` using `validateProjectId()`
3. Use project-scoped utilities from `@/firebase/utils`:
   - `getProjectScopedCollection(collectionId, projectId)`
   - `getProjectScopedDocRef(collectionId, docId, projectId)`
   - `createProjectScopedQuery(collectionId, projectId, ...constraints)`

4. Include `project_id` field in all created documents

**Example:**

```typescript
async createItem(projectId: string, data: CreateItemInput, userId: string): Promise<string> {
  // ✅ Step 1: Validate projectId
  validateProjectId(projectId)

  // ✅ Step 2: Use project-scoped utilities
  const itemsCollection = getProjectScopedCollection('items', projectId)

  // ✅ Step 3: Enforce project_id in document
  const document = {
    ...data,
    project_id: projectId,  // MANDATORY
    created_at: getServerTimestamp(),
    created_by: userId,
  }

  // ✅ Step 4: Save to Firestore
  const docRef = await addDoc(itemsCollection, document)
  return docRef.id
}
```

---

## Usage in Components

### 1. Import the Service

```typescript
import { SchemaService } from '@/services/SchemaService'
```

### 2. Get Project Context

```typescript
import { useProject } from '@/context/ProjectContext'

function MyComponent() {
  const { selectedProject } = useProject()

  if (!selectedProject) {
    return <div>No project selected</div>
  }

  // Use selectedProject.projectId in service calls
}
```

### 3. Call Service Methods

```typescript
// Fetch data
const schemas = await SchemaService.getSchemasForProject(selectedProject.projectId)

// Create data
const newSchemaId = await SchemaService.createCollectionSchema(
  selectedProject.projectId,
  schemaData,
  currentUser.uid
)

// Update data
await SchemaService.updateSchema(
  selectedProject.projectId,
  schemaId,
  updates,
  currentUser.uid
)
```

### 4. Error Handling

```typescript
try {
  const schemas = await SchemaService.getSchemasForProject(selectedProject.projectId)
  setSchemas(schemas)
} catch (error) {
  console.error('Failed to fetch schemas:', error)
  setError(error instanceof Error ? error.message : 'Unknown error')
}
```

---

## Complete Component Example

```typescript
import { useState, useEffect } from 'react'
import { useProject } from '@/context/ProjectContext'
import { useAuth } from '@/context/AuthContext'
import { SchemaService } from '@/services/SchemaService'
import type { Schema } from '@/firebase/types'

export function SchemaListPage() {
  const { selectedProject } = useProject()
  const { currentUser, userRole } = useAuth()
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch schemas on mount
  useEffect(() => {
    if (!selectedProject) return

    const fetchSchemas = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await SchemaService.getSchemasForProject(selectedProject.projectId)
        setSchemas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schemas')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchemas()
  }, [selectedProject])

  // Create new schema
  const handleCreateSchema = async (schemaData: CreateSchemaInput) => {
    if (!selectedProject || !currentUser) return

    try {
      const newSchemaId = await SchemaService.createCollectionSchema(
        selectedProject.projectId,
        schemaData,
        currentUser.uid
      )

      console.log('Schema created:', newSchemaId)

      // Refresh the list
      const updatedSchemas = await SchemaService.getSchemasForProject(selectedProject.projectId)
      setSchemas(updatedSchemas)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create schema')
    }
  }

  // Delete schema
  const handleDeleteSchema = async (schemaId: string) => {
    if (!selectedProject || !currentUser) return
    if (!confirm('Are you sure you want to delete this schema?')) return

    try {
      await SchemaService.deleteSchema(
        selectedProject.projectId,
        schemaId,
        currentUser.uid
      )

      // Remove from state
      setSchemas(schemas.filter(s => s.id !== schemaId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete schema')
    }
  }

  // Render UI
  if (isLoading) return <div>Loading schemas...</div>
  if (error) return <div>Error: {error}</div>
  if (!selectedProject) return <div>No project selected</div>

  return (
    <div>
      <h1>Schemas for {selectedProject.name}</h1>

      {userRole === 'Super' && (
        <button onClick={() => handleCreateSchema(/* ... */)}>
          Create Schema
        </button>
      )}

      <ul>
        {schemas.map(schema => (
          <li key={schema.id}>
            <h3>{schema.name}</h3>
            <p>{schema.description}</p>
            <p>Fields: {schema.fields.length}</p>

            {userRole === 'Super' && !schema.is_system && (
              <button onClick={() => handleDeleteSchema(schema.id)}>
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Best Practices

### 1. Always Validate Inputs

```typescript
// ✅ Good
async createItem(projectId: string, data: CreateItemInput, userId: string) {
  validateProjectId(projectId)

  if (!userId) {
    throw new Error('User ID is required')
  }

  if (!data.name) {
    throw new Error('Item name is required')
  }

  // ... proceed with creation
}

// ❌ Bad
async createItem(projectId: string, data: any, userId: string) {
  // No validation - could cause runtime errors
  await addDoc(collection(db, 'items'), data)
}
```

### 2. Use Project-Scoped Utilities

```typescript
// ✅ Good - Uses project-scoped utilities
const schemaRef = getProjectScopedDocRef('schemas', schemaId, projectId)
const schemaSnap = await getDoc(schemaRef)

// ❌ Bad - Bypasses multi-tenancy
const schemaRef = doc(db, 'schemas', schemaId)
const schemaSnap = await getDoc(schemaRef)
```

### 3. Include Audit Fields

```typescript
// ✅ Good - Includes audit fields
const document = {
  ...data,
  project_id: projectId,
  created_at: getServerTimestamp(),
  updated_at: getServerTimestamp(),
  created_by: userId,
}

// ❌ Bad - Missing audit information
const document = {
  ...data,
}
```

### 4. Handle Errors Gracefully

```typescript
// ✅ Good - Provides context
try {
  await SchemaService.deleteSchema(projectId, schemaId, userId)
} catch (error) {
  console.error('❌ Error deleting schema:', schemaId, error)
  throw new Error(`Failed to delete schema: ${error instanceof Error ? error.message : 'Unknown error'}`)
}

// ❌ Bad - Silent failure
try {
  await SchemaService.deleteSchema(projectId, schemaId, userId)
} catch (error) {
  // Swallowed error
}
```

### 5. Use TypeScript Types

```typescript
// ✅ Good - Type-safe
import type { Schema, SchemaField } from '@/firebase/types'

const schema: Schema = await SchemaService.getSchemaById(projectId, schemaId)
const fields: SchemaField[] = schema.fields

// ❌ Bad - No type safety
const schema: any = await SchemaService.getSchemaById(projectId, schemaId)
const fields = schema.fields
```

---

## Testing Services

### Unit Testing Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SchemaService } from './SchemaService'

describe('SchemaService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate projectId', async () => {
    await expect(
      SchemaService.getSchemasForProject('')
    ).rejects.toThrow('Invalid project ID')
  })

  it('should create schema with project_id field', async () => {
    const schemaId = await SchemaService.createCollectionSchema(
      'test-project',
      {
        id: 'articles',
        name: 'Articles',
        fields: [{ name: 'title', type: 'text', label: 'Title' }]
      },
      'user-123'
    )

    expect(schemaId).toBe('articles')

    // Verify the document includes project_id
    const schema = await SchemaService.getSchemaById('test-project', 'articles')
    expect(schema?.project_id).toBe('test-project')
  })
})
```

---

## Common Patterns

### Pagination

```typescript
async getSchemasPaginated(
  projectId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<Schema>> {
  validateProjectId(projectId)

  const schemasCollection = getProjectScopedCollection('schemas', projectId)

  // Count total
  const countSnapshot = await getDocs(schemasCollection)
  const total = countSnapshot.size

  // Fetch page
  const offset = (page - 1) * pageSize
  const schemasQuery = query(
    schemasCollection,
    orderBy('created_at', 'desc'),
    limit(pageSize),
    startAfter(offset)
  )

  const snapshot = await getDocs(schemasQuery)
  const schemas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schema))

  return {
    data: schemas,
    total,
    page,
    page_size: pageSize,
    has_next: (page * pageSize) < total,
    has_previous: page > 1
  }
}
```

### Batch Operations

```typescript
async createMultipleSchemas(
  projectId: string,
  schemas: CreateSchemaInput[],
  userId: string
): Promise<string[]> {
  validateProjectId(projectId)

  const schemaIds: string[] = []

  // Use Firestore batch for atomic operations
  const batch = writeBatch(db)

  for (const schemaData of schemas) {
    const schemaRef = getProjectScopedDocRef('schemas', schemaData.id, projectId)

    batch.set(schemaRef, {
      ...schemaData,
      project_id: projectId,
      created_at: getServerTimestamp(),
      created_by: userId,
    })

    schemaIds.push(schemaData.id)
  }

  await batch.commit()

  return schemaIds
}
```

### Real-time Subscriptions

```typescript
subscribeToSchemas(
  projectId: string,
  callback: (schemas: Schema[]) => void
): () => void {
  validateProjectId(projectId)

  const schemasCollection = getProjectScopedCollection('schemas', projectId)
  const schemasQuery = query(schemasCollection, orderBy('created_at', 'desc'))

  // Subscribe to real-time updates
  const unsubscribe = onSnapshot(
    schemasQuery,
    (snapshot) => {
      const schemas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Schema))

      callback(schemas)
    },
    (error) => {
      console.error('Error in schema subscription:', error)
    }
  )

  // Return unsubscribe function
  return unsubscribe
}
```

---

## Future Services

Planned services for Phase 2+:

- **ContentService** - CRUD operations for content entries
- **MediaService** - File upload and media library management
- **UserService** - User management and permissions
- **RoleService** - Custom role definitions
- **AuditService** - Audit log querying and reporting
- **SettingsService** - Project settings management
- **SearchService** - Full-text search across content
- **ExportService** - Data export in various formats

---

## Related Documentation

- [Firebase Setup Guide](../firebase/README.md)
- [Authentication Context](../context/README.md)
- [Project Context](../context/README.md)
- [TypeScript Types](../firebase/types.ts)
- [Schema Service Guide](./SCHEMA_SERVICE.md)
