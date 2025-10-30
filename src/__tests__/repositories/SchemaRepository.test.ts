/**
 * Schema Repository Tests
 *
 * Example unit tests for schema repository operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DIContainer, DI_TYPES } from '@/domain/di'
import { MockSchemaRepository } from '@/infrastructure/repositories/__mocks__'
import type { ISchemaRepository } from '@/domain/repositories'
import type { SchemaDefinition, CreateSchemaInput } from '@/domain/entities'

describe('SchemaRepository Tests', () => {
  let mockRepo: MockSchemaRepository

  beforeEach(() => {
    DIContainer.clear()

    const testSchemas: Array<{ projectId: string; schema: SchemaDefinition }> = [
      {
        projectId: 'project-1',
        schema: {
          id: 'articles',
          projectId: 'project-1',
          name: 'Articles',
          description: 'Blog articles',
          fields: [
            { name: 'title', type: 'text', label: 'Title', required: true },
            { name: 'content', type: 'richtext', label: 'Content' },
          ],
          displayField: 'title',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-123',
        },
      },
    ]

    mockRepo = new MockSchemaRepository(testSchemas)
    DIContainer.register<ISchemaRepository>(DI_TYPES.SchemaRepository, mockRepo)
  })

  afterEach(() => {
    DIContainer.clear()
  })

  describe('getSchemasForProject', () => {
    it('should return schemas for a project', async () => {
      const repo = DIContainer.resolve<ISchemaRepository>(DI_TYPES.SchemaRepository)
      const schemas = await repo.getSchemasForProject('project-1')

      expect(schemas).toHaveLength(1)
      expect(schemas[0].name).toBe('Articles')
    })

    it('should return empty array for project with no schemas', async () => {
      const repo = DIContainer.resolve<ISchemaRepository>(DI_TYPES.SchemaRepository)
      const schemas = await repo.getSchemasForProject('project-2')

      expect(schemas).toHaveLength(0)
    })
  })

  describe('createSchema', () => {
    it('should create a new schema', async () => {
      const repo = DIContainer.resolve<ISchemaRepository>(DI_TYPES.SchemaRepository)

      const schemaInput: CreateSchemaInput = {
        id: 'products',
        name: 'Products',
        description: 'Product catalog',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true },
          { name: 'price', type: 'number', label: 'Price', required: true },
        ],
        displayField: 'name',
      }

      const schemaId = await repo.createSchema('project-1', schemaInput, 'user-123')

      expect(schemaId).toBe('products')

      const schema = await repo.getSchemaById('project-1', 'products')
      expect(schema).not.toBeNull()
      expect(schema!.name).toBe('Products')
      expect(schema!.fields).toHaveLength(2)
    })

    it('should throw error if schema ID already exists', async () => {
      const repo = DIContainer.resolve<ISchemaRepository>(DI_TYPES.SchemaRepository)

      const schemaInput: CreateSchemaInput = {
        id: 'articles',
        name: 'Duplicate',
        fields: [],
      }

      await expect(
        repo.createSchema('project-1', schemaInput, 'user-123')
      ).rejects.toThrow('already exists')
    })
  })

  describe('updateSchema', () => {
    it('should update schema fields', async () => {
      const repo = DIContainer.resolve<ISchemaRepository>(DI_TYPES.SchemaRepository)

      await repo.updateSchema(
        'project-1',
        'articles',
        {
          name: 'Updated Articles',
          fields: [
            { name: 'title', type: 'text', label: 'Title', required: true },
            { name: 'subtitle', type: 'text', label: 'Subtitle' },
          ],
        },
        'user-123'
      )

      const schema = await repo.getSchemaById('project-1', 'articles')
      expect(schema!.name).toBe('Updated Articles')
      expect(schema!.fields).toHaveLength(2)
    })
  })

  describe('deleteSchema', () => {
    it('should delete a schema', async () => {
      const repo = DIContainer.resolve<ISchemaRepository>(DI_TYPES.SchemaRepository)

      await repo.deleteSchema('project-1', 'articles', 'articles', 'user-123')

      const schema = await repo.getSchemaById('project-1', 'articles')
      expect(schema).toBeNull()
    })
  })
})
