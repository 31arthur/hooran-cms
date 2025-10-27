# SchemaService Documentation

Comprehensive guide for the SchemaService, which manages project-scoped collection schemas (content type definitions) in Hooran CMS.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Requirements & Firestore Structure](#requirements--firestore-structure)
4. [API Reference](#api-reference)
5. [Usage Examples](#usage-examples)
6. [Validation Rules](#validation-rules)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Integration Guide](#integration-guide)

---

## Overview

### Purpose

The **SchemaService** provides a complete API for managing collection schemas (also known as content types or collection definitions) in a multi-tenant CMS environment. It allows Super admins to define the structure of content collections dynamically.

### Key Features

- ✅ **Multi-tenancy scoping** - All operations are project-scoped
- ✅ **CRUD operations** - Create, Read, Update, Delete schemas
- ✅ **Validation** - Comprehensive input validation
- ✅ **Type safety** - Full TypeScript support
- ✅ **Audit tracking** - Automatic created_by/updated_by fields
- ✅ **System schema protection** - Prevents deletion of critical schemas
- ✅ **Error handling** - Meaningful error messages

### Role Requirements

**IMPORTANT:** Schema management is **exclusive to the Super admin role**.

While the service itself doesn't enforce role checks (this is done at the UI/route level), all schema operations should only be accessible to users with `userRole === 'Super'`.

---

## Architecture

### Service Pattern

The SchemaService follows the **singleton service pattern**:

```typescript
class SchemaServiceClass {
  // Methods here...
}

export const SchemaService = new SchemaServiceClass()
```

### Multi-Tenancy Enforcement

Every method:

1. **Accepts `projectId` as first parameter** - Mandatory for scoping
2. **Validates `projectId`** - Using `validateProjectId()` utility
3. **Uses project-scoped utilities** - From `@/firebase/utils`
4. **Includes `project_id` in documents** - For data isolation

### Firestore Path Structure

```
Firestore:
└── projects/
    ├── {projectId}/
    │   ├── schemas/
    │   │   ├── {schemaId}/      ← Schema documents stored here
    │   │   │   ├── project_id: string
    │   │   │   ├── name: string
    │   │   │   ├── fields: SchemaField[]
    │   │   │   ├── created_at: Timestamp
    │   │   │   └── updated_at: Timestamp
```

---

## Requirements & Firestore Structure

### Schema Document Structure

Based on Phase 1 design requirements, each schema document includes:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ Yes | Collection ID (document ID) |
| `project_id` | string | ✅ Yes | Foreign key to projects collection |
| `name` | string | ✅ Yes | Display name for the collection |
| `description` | string | ❌ No | Optional description |
| `fields` | SchemaField[] | ✅ Yes | JSON array defining field structure |
| `display_field` | string | ❌ No | Primary field to display (defaults to first field) |
| `is_system` | boolean | ❌ No | If true, schema cannot be deleted |
| `created_at` | Timestamp | ✅ Yes | Auto-generated creation timestamp |
| `updated_at` | Timestamp | ✅ Yes | Auto-generated update timestamp |
| `created_by` | string | ✅ Yes | User ID of creator |
| `updated_by` | string | ❌ No | User ID of last updater |

### SchemaField Structure

Each field in the `fields` array has:

```typescript
{
  name: string           // Field identifier (e.g., 'title', 'content')
  type: SchemaFieldType  // Field type (text, richtext, number, etc.)
  label: string          // Display label for UI
  required?: boolean     // Is this field mandatory?
  unique?: boolean       // Should values be unique?
  default_value?: any    // Default value for new entries
  validation?: {         // Validation rules
    min?: number
    max?: number
    pattern?: string
    custom?: string
  }
  options?: {            // For select/relation fields
    choices?: Array<{ label: string; value: string }>
    multiple?: boolean
    relation_schema?: string
  }
}
```

### Supported Field Types

- `text` - Short text input
- `textarea` - Multi-line text
- `richtext` - Rich text editor
- `number` - Numeric input
- `boolean` - Checkbox/toggle
- `date` - Date picker
- `datetime` - Date and time picker
- `email` - Email validation
- `url` - URL validation
- `select` - Dropdown selection
- `multiselect` - Multiple selection
- `relation` - Relationship to another collection
- `media` - File/image upload
- `json` - JSON data

---

## API Reference

### getSchemasForProject()

Retrieves all schemas for a specific project.

**Signature:**
```typescript
async getSchemasForProject(projectId: string): Promise<Schema[]>
```

**Parameters:**
- `projectId` (string, required) - The project ID to fetch schemas for

**Returns:**
- `Promise<Schema[]>` - Array of schema documents, ordered by creation date (newest first)

**Throws:**
- Error if `projectId` is invalid
- Error if Firestore query fails

**Example:**
```typescript
const { selectedProject } = useProject()

const schemas = await SchemaService.getSchemasForProject(selectedProject.projectId)
console.log(`Found ${schemas.length} schemas`)

schemas.forEach(schema => {
  console.log(`- ${schema.name} (${schema.fields.length} fields)`)
})
```

**Firestore Query:**
```typescript
projects/{projectId}/schemas
  .orderBy('created_at', 'desc')
```

---

### getSchemaById()

Retrieves a single schema by its ID.

**Signature:**
```typescript
async getSchemaById(projectId: string, schemaId: string): Promise<Schema | null>
```

**Parameters:**
- `projectId` (string, required) - The project ID
- `schemaId` (string, required) - The schema ID (collection ID)

**Returns:**
- `Promise<Schema | null>` - The schema document or null if not found

**Throws:**
- Error if `projectId` or `schemaId` is invalid
- Error if Firestore query fails

**Example:**
```typescript
const schema = await SchemaService.getSchemaById('project-123', 'articles')

if (schema) {
  console.log(`Schema: ${schema.name}`)
  console.log(`Fields: ${schema.fields.map(f => f.name).join(', ')}`)
} else {
  console.log('Schema not found')
}
```

**Firestore Path:**
```typescript
projects/{projectId}/schemas/{schemaId}
```

---

### createCollectionSchema()

Creates a new collection schema scoped to a project.

**Signature:**
```typescript
async createCollectionSchema(
  projectId: string,
  schemaData: CreateSchemaInput,
  userId: string
): Promise<string>
```

**Parameters:**
- `projectId` (string, required) - **MANDATORY** - Project ID for multi-tenancy scoping
- `schemaData` (CreateSchemaInput, required) - Schema definition data
- `userId` (string, required) - User ID for audit tracking

**CreateSchemaInput Interface:**
```typescript
{
  id: string              // Collection ID (will be document ID)
  name: string            // Display name
  description?: string    // Optional description
  fields: SchemaField[]   // Field definitions (min 1 required)
  display_field?: string  // Primary display field
  is_system?: boolean     // System schema flag
}
```

**Returns:**
- `Promise<string>` - The ID of the created schema (same as `schemaData.id`)

**Throws:**
- Error if `projectId` is invalid
- Error if `userId` is invalid
- Error if `schemaData.id` is empty or invalid
- Error if `schemaData.name` is empty or invalid
- Error if `schemaData.fields` is empty or has invalid fields
- Error if a schema with the same ID already exists

**Validation Rules:**
1. `projectId` must be a non-empty string
2. `userId` must be a non-empty string
3. `schemaData.id` must be a non-empty string (will be used as document ID)
4. `schemaData.name` must be a non-empty string
5. `schemaData.fields` must be an array with at least one field
6. Each field must have `name`, `type`, and `label` properties
7. Schema ID must be unique within the project

**Example:**
```typescript
const { selectedProject } = useProject()
const { currentUser } = useAuth()

const schemaId = await SchemaService.createCollectionSchema(
  selectedProject.projectId,
  {
    id: 'articles',
    name: 'Articles',
    description: 'Blog articles and posts',
    fields: [
      {
        name: 'title',
        type: 'text',
        label: 'Title',
        required: true,
        validation: { min: 3, max: 200 }
      },
      {
        name: 'slug',
        type: 'text',
        label: 'URL Slug',
        required: true,
        unique: true
      },
      {
        name: 'content',
        type: 'richtext',
        label: 'Content',
        required: true
      },
      {
        name: 'status',
        type: 'select',
        label: 'Status',
        required: true,
        default_value: 'draft',
        options: {
          choices: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
            { label: 'Archived', value: 'archived' }
          ]
        }
      },
      {
        name: 'featured_image',
        type: 'media',
        label: 'Featured Image'
      },
      {
        name: 'tags',
        type: 'multiselect',
        label: 'Tags',
        options: {
          choices: [
            { label: 'Technology', value: 'tech' },
            { label: 'Business', value: 'business' },
            { label: 'Lifestyle', value: 'lifestyle' }
          ],
          multiple: true
        }
      }
    ],
    display_field: 'title'
  },
  currentUser.uid
)

console.log(`Schema created with ID: ${schemaId}`)
```

**Document Created:**
```typescript
{
  project_id: 'project-123',        // ← ENFORCED by service
  name: 'Articles',
  description: 'Blog articles and posts',
  fields: [ /* ... */ ],
  display_field: 'title',
  is_system: false,
  created_at: Timestamp,            // ← Auto-generated
  updated_at: Timestamp,            // ← Auto-generated
  created_by: 'user-456'            // ← From userId param
}
```

---

### updateSchema()

Updates an existing schema.

**Signature:**
```typescript
async updateSchema(
  projectId: string,
  schemaId: string,
  updates: UpdateSchemaInput,
  userId: string
): Promise<void>
```

**Parameters:**
- `projectId` (string, required) - The project ID
- `schemaId` (string, required) - The schema ID to update
- `updates` (UpdateSchemaInput, required) - Fields to update
- `userId` (string, required) - User ID for audit tracking

**UpdateSchemaInput Interface:**
```typescript
{
  name?: string
  description?: string
  fields?: SchemaField[]
  display_field?: string
  is_system?: boolean
}
```

**Returns:**
- `Promise<void>`

**Throws:**
- Error if schema doesn't exist
- Error if validation fails
- Error if update operation fails

**IMPORTANT:**
- Cannot change `id` (collection ID)
- Cannot change `project_id`
- `updated_at` and `updated_by` are automatically set

**Example:**
```typescript
await SchemaService.updateSchema(
  'project-123',
  'articles',
  {
    description: 'Updated description for articles',
    fields: [
      /* Updated fields array */
    ]
  },
  currentUser.uid
)

console.log('Schema updated successfully')
```

---

### deleteSchema()

Deletes a schema from the project.

**Signature:**
```typescript
async deleteSchema(
  projectId: string,
  schemaId: string,
  userId: string
): Promise<void>
```

**Parameters:**
- `projectId` (string, required) - The project ID
- `schemaId` (string, required) - The schema ID to delete
- `userId` (string, required) - User ID for audit tracking

**Returns:**
- `Promise<void>`

**Throws:**
- Error if schema doesn't exist
- Error if schema is a system schema (`is_system: true`)
- Error if deletion fails

**WARNING:** This is a destructive operation. Consider:
- Checking if any content entries use this schema
- Implementing soft delete instead of hard delete
- Requiring confirmation from the user

**Example:**
```typescript
const confirmed = confirm('Are you sure you want to delete this schema?')

if (confirmed) {
  try {
    await SchemaService.deleteSchema(
      'project-123',
      'articles',
      currentUser.uid
    )
    console.log('Schema deleted successfully')
  } catch (error) {
    if (error.message.includes('system schema')) {
      alert('Cannot delete system schemas')
    } else {
      alert('Failed to delete schema')
    }
  }
}
```

---

### schemaExists()

Checks if a schema exists in the project.

**Signature:**
```typescript
async schemaExists(projectId: string, schemaId: string): Promise<boolean>
```

**Parameters:**
- `projectId` (string, required) - The project ID
- `schemaId` (string, required) - The schema ID to check

**Returns:**
- `Promise<boolean>` - True if schema exists, false otherwise

**Example:**
```typescript
const exists = await SchemaService.schemaExists('project-123', 'articles')

if (exists) {
  console.log('Schema already exists')
} else {
  console.log('Schema does not exist')
}
```

---

## Usage Examples

### Example 1: Fetch and Display Schemas

```typescript
import { useState, useEffect } from 'react'
import { useProject } from '@/context/ProjectContext'
import { SchemaService } from '@/services/SchemaService'
import type { Schema } from '@/firebase/types'

export function SchemaListPage() {
  const { selectedProject } = useProject()
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedProject) return

    const fetchSchemas = async () => {
      try {
        setIsLoading(true)
        const data = await SchemaService.getSchemasForProject(selectedProject.projectId)
        setSchemas(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schemas')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchemas()
  }, [selectedProject])

  if (!selectedProject) return <div>No project selected</div>
  if (isLoading) return <div>Loading schemas...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Schemas for {selectedProject.name}</h1>
      <p>Total schemas: {schemas.length}</p>

      <ul>
        {schemas.map(schema => (
          <li key={schema.id}>
            <h3>{schema.name}</h3>
            <p>{schema.description}</p>
            <p>Fields: {schema.fields.length}</p>
            <p>Created: {schema.created_at.toDate().toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Example 2: Create a New Schema

```typescript
import { useState } from 'react'
import { useProject } from '@/context/ProjectContext'
import { useAuth } from '@/context/AuthContext'
import { SchemaService } from '@/services/SchemaService'
import type { CreateSchemaInput, SchemaField } from '@/services/SchemaService'

export function CreateSchemaForm() {
  const { selectedProject } = useProject()
  const { currentUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !currentUser) return

    const schemaData: CreateSchemaInput = {
      id: 'blog_posts',
      name: 'Blog Posts',
      description: 'Blog articles and news posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Post Title',
          required: true,
          validation: { min: 5, max: 200 }
        },
        {
          name: 'content',
          type: 'richtext',
          label: 'Content',
          required: true
        },
        {
          name: 'published',
          type: 'boolean',
          label: 'Published',
          default_value: false
        }
      ],
      display_field: 'title'
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const schemaId = await SchemaService.createCollectionSchema(
        selectedProject.projectId,
        schemaData,
        currentUser.uid
      )

      alert(`Schema "${schemaId}" created successfully!`)

      // Reset form or redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schema')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Schema</h2>

      {error && <div className="error">{error}</div>}

      {/* Form fields here */}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Schema'}
      </button>
    </form>
  )
}
```

### Example 3: Update Schema

```typescript
import { useState } from 'react'
import { SchemaService } from '@/services/SchemaService'
import type { UpdateSchemaInput } from '@/services/SchemaService'

export function EditSchemaForm({
  projectId,
  schemaId,
  userId
}: {
  projectId: string
  schemaId: string
  userId: string
}) {
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdate = async () => {
    const updates: UpdateSchemaInput = {
      description: description.trim()
    }

    try {
      setIsSubmitting(true)

      await SchemaService.updateSchema(
        projectId,
        schemaId,
        updates,
        userId
      )

      alert('Schema updated successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h3>Update Schema Description</h3>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter new description"
      />
      <button onClick={handleUpdate} disabled={isSubmitting}>
        {isSubmitting ? 'Updating...' : 'Update'}
      </button>
    </div>
  )
}
```

### Example 4: Delete Schema with Confirmation

```typescript
import { SchemaService } from '@/services/SchemaService'
import type { Schema } from '@/firebase/types'

export function SchemaDeleteButton({
  schema,
  projectId,
  userId,
  onDeleted
}: {
  schema: Schema
  projectId: string
  userId: string
  onDeleted: () => void
}) {
  const handleDelete = async () => {
    // System schema protection
    if (schema.is_system) {
      alert('Cannot delete system schemas')
      return
    }

    // Confirmation
    const confirmed = confirm(
      `Are you sure you want to delete "${schema.name}"?\n\n` +
      'This action cannot be undone.'
    )

    if (!confirmed) return

    try {
      await SchemaService.deleteSchema(projectId, schema.id, userId)
      alert('Schema deleted successfully')
      onDeleted()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={schema.is_system}
      className="btn-danger"
    >
      Delete
    </button>
  )
}
```

---

## Validation Rules

### Project ID Validation

```typescript
✅ Valid:   'project-123'
✅ Valid:   'my_project'
❌ Invalid: ''
❌ Invalid: '   '
❌ Invalid: null
❌ Invalid: undefined
```

### Schema ID Validation

```typescript
✅ Valid:   'articles'
✅ Valid:   'blog_posts'
✅ Valid:   'user-profiles'
❌ Invalid: ''
❌ Invalid: '   '
❌ Invalid: 'spaces not allowed'
❌ Invalid: 'UPPERCASE' (prefer lowercase)
```

Recommendations:
- Use lowercase
- Use underscores or hyphens for spaces
- Keep it short and descriptive
- Use plural form (e.g., 'articles', not 'article')

### Schema Name Validation

```typescript
✅ Valid:   'Articles'
✅ Valid:   'Blog Posts'
✅ Valid:   'User Profiles'
❌ Invalid: ''
❌ Invalid: '   '
```

### Fields Validation

Each field must have:
- `name` (string, non-empty, unique within schema)
- `type` (valid SchemaFieldType)
- `label` (string, non-empty)

```typescript
✅ Valid:
{
  name: 'title',
  type: 'text',
  label: 'Title'
}

❌ Invalid:
{
  name: '',        // Empty name
  type: 'text',
  label: 'Title'
}

❌ Invalid:
{
  name: 'title',
  type: 'invalid', // Invalid type
  label: 'Title'
}

❌ Invalid:
{
  name: 'title',
  type: 'text',
  label: ''        // Empty label
}
```

---

## Error Handling

### Common Errors

#### 1. Invalid Project ID

```typescript
try {
  await SchemaService.getSchemasForProject('')
} catch (error) {
  // Error: Invalid project ID: Project ID must be a non-empty string
}
```

#### 2. Schema Already Exists

```typescript
try {
  await SchemaService.createCollectionSchema(
    'project-123',
    { id: 'articles', /* ... */ },
    'user-123'
  )
} catch (error) {
  // Error: Schema with ID "articles" already exists in this project
}
```

#### 3. Schema Not Found

```typescript
const schema = await SchemaService.getSchemaById('project-123', 'nonexistent')
// Returns: null
```

#### 4. Cannot Delete System Schema

```typescript
try {
  await SchemaService.deleteSchema('project-123', 'system-schema', 'user-123')
} catch (error) {
  // Error: Cannot delete system schema: system-schema
}
```

#### 5. Invalid Fields

```typescript
try {
  await SchemaService.createCollectionSchema(
    'project-123',
    { id: 'test', name: 'Test', fields: [] }, // Empty fields
    'user-123'
  )
} catch (error) {
  // Error: Invalid fields: Schema must have at least one field
}
```

### Error Handling Pattern

```typescript
async function safeSchemaOperation() {
  try {
    const schemas = await SchemaService.getSchemasForProject(projectId)
    return { success: true, data: schemas }
  } catch (error) {
    console.error('Schema operation failed:', error)

    const message = error instanceof Error
      ? error.message
      : 'Unknown error occurred'

    return { success: false, error: message }
  }
}

// Usage
const result = await safeSchemaOperation()

if (result.success) {
  console.log('Schemas:', result.data)
} else {
  alert(`Error: ${result.error}`)
}
```

---

## Best Practices

### 1. Always Use Selected Project

```typescript
// ✅ Good
const { selectedProject } = useProject()

if (!selectedProject) {
  return <div>No project selected</div>
}

const schemas = await SchemaService.getSchemasForProject(selectedProject.projectId)

// ❌ Bad - Hardcoded project ID
const schemas = await SchemaService.getSchemasForProject('project-123')
```

### 2. Validate Before Creating

```typescript
// ✅ Good
const schemaData: CreateSchemaInput = {
  id: collectionId.toLowerCase().trim(),
  name: name.trim(),
  fields: fields.filter(f => f.name && f.type && f.label)
}

if (schemaData.fields.length === 0) {
  alert('Please add at least one valid field')
  return
}

await SchemaService.createCollectionSchema(projectId, schemaData, userId)

// ❌ Bad - No validation
await SchemaService.createCollectionSchema(projectId, rawFormData, userId)
```

### 3. Provide User Feedback

```typescript
// ✅ Good
setIsLoading(true)
try {
  await SchemaService.createCollectionSchema(projectId, data, userId)
  alert('Schema created successfully!')
  navigate('/schemas')
} catch (error) {
  alert(`Failed to create schema: ${error.message}`)
} finally {
  setIsLoading(false)
}

// ❌ Bad - Silent operation
await SchemaService.createCollectionSchema(projectId, data, userId)
```

### 4. Handle System Schemas Carefully

```typescript
// ✅ Good
if (schema.is_system) {
  return (
    <div>
      <p>System schema (cannot be deleted)</p>
      <button disabled>Delete</button>
    </div>
  )
}

// ❌ Bad - Allow deletion attempt
<button onClick={() => deleteSchema(schema.id)}>Delete</button>
```

### 5. Use TypeScript Types

```typescript
// ✅ Good
import type { Schema, SchemaField, CreateSchemaInput } from '@/services/SchemaService'

const handleCreate = async (data: CreateSchemaInput) => {
  // Type-safe
}

// ❌ Bad
const handleCreate = async (data: any) => {
  // No type safety
}
```

---

## Integration Guide

### Step 1: Create Schema Management Page

```typescript
// src/pages/SchemaManagementPage.tsx
import { useState, useEffect } from 'react'
import { useProject } from '@/context/ProjectContext'
import { useAuth } from '@/context/AuthContext'
import { SchemaService } from '@/services/SchemaService'
import type { Schema } from '@/firebase/types'

export function SchemaManagementPage() {
  const { selectedProject } = useProject()
  const { currentUser, userRole } = useAuth()
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Protect route - Only Super admins
  if (userRole !== 'Super') {
    return <div>Access Denied: Super admin only</div>
  }

  useEffect(() => {
    if (!selectedProject) return

    const loadSchemas = async () => {
      try {
        const data = await SchemaService.getSchemasForProject(selectedProject.projectId)
        setSchemas(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSchemas()
  }, [selectedProject])

  return (
    <div>
      <h1>Schema Management</h1>
      {/* UI here */}
    </div>
  )
}
```

### Step 2: Add Route Protection

```typescript
// src/App.tsx
import { useAuth } from '@/context/AuthContext'
import { SchemaManagementPage } from '@/pages/SchemaManagementPage'

function App() {
  const { userRole } = useAuth()

  return (
    <Routes>
      {userRole === 'Super' && (
        <Route path="/schemas" element={<SchemaManagementPage />} />
      )}
    </Routes>
  )
}
```

### Step 3: Create Schema Builder UI

Build a form component that allows Super admins to:
1. Define collection ID and name
2. Add/remove/reorder fields
3. Configure field types and validation
4. Preview the schema structure
5. Save to Firestore via SchemaService

---

## Related Documentation

- [Services Overview](./README.md)
- [Firebase Types](../firebase/types.ts)
- [Firebase Utils](../firebase/utils.ts)
- [Project Context](../context/ProjectContext.tsx)
- [Auth Context](../context/AuthContext.tsx)
