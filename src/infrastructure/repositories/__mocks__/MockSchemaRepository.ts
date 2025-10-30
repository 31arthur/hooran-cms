/**
 * Mock Schema Repository
 *
 * In-memory implementation of ISchemaRepository for testing purposes.
 * This mock allows unit tests to run without Firebase dependencies.
 */

import type { ISchemaRepository } from '@/domain/repositories'
import type {
  SchemaDefinition,
  CreateSchemaInput,
  UpdateSchemaInput,
} from '@/domain/entities'

/**
 * MockSchemaRepository
 *
 * In-memory implementation for testing
 */
export class MockSchemaRepository implements ISchemaRepository {
  private schemas: Map<string, Map<string, SchemaDefinition>> = new Map()

  constructor(initialSchemas: Array<{ projectId: string; schema: SchemaDefinition }> = []) {
    initialSchemas.forEach(({ projectId, schema }) => {
      if (!this.schemas.has(projectId)) {
        this.schemas.set(projectId, new Map())
      }
      this.schemas.get(projectId)!.set(schema.id, schema)
    })
  }

  async getSchemasForProject(projectId: string): Promise<SchemaDefinition[]> {
    const projectSchemas = this.schemas.get(projectId)
    if (!projectSchemas) {
      return []
    }
    return Array.from(projectSchemas.values())
  }

  async getSchemas(projectId: string): Promise<SchemaDefinition[]> {
    return this.getSchemasForProject(projectId)
  }

  async getSchemaById(projectId: string, schemaId: string): Promise<SchemaDefinition | null> {
    const projectSchemas = this.schemas.get(projectId)
    if (!projectSchemas) {
      return null
    }
    return projectSchemas.get(schemaId) || null
  }

  async getSchemaDefinition(projectId: string, schemaId: string): Promise<SchemaDefinition> {
    const schema = await this.getSchemaById(projectId, schemaId)
    if (!schema) {
      throw new Error(`Schema not found: "${schemaId}" in project "${projectId}"`)
    }
    if (schema.projectId !== projectId) {
      throw new Error('Schema does not belong to the selected project')
    }
    return schema
  }

  async createSchema(
    projectId: string,
    schemaData: CreateSchemaInput,
    userId: string
  ): Promise<string> {
    // Check if schema already exists
    const existing = await this.getSchemaById(projectId, schemaData.id)
    if (existing) {
      throw new Error(`Schema with ID "${schemaData.id}" already exists in this project`)
    }

    const newSchema: SchemaDefinition = {
      id: schemaData.id,
      projectId,
      name: schemaData.name,
      description: schemaData.description || '',
      fields: schemaData.fields,
      displayField: schemaData.displayField || schemaData.fields[0]?.name || 'id',
      isSystem: schemaData.isSystem || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    }

    if (!this.schemas.has(projectId)) {
      this.schemas.set(projectId, new Map())
    }
    this.schemas.get(projectId)!.set(schemaData.id, newSchema)

    return schemaData.id
  }

  async updateSchema(
    projectId: string,
    schemaId: string,
    updates: UpdateSchemaInput,
    userId: string
  ): Promise<void> {
    const schema = await this.getSchemaById(projectId, schemaId)
    if (!schema) {
      throw new Error(`Schema "${schemaId}" not found in project "${projectId}"`)
    }

    const updatedSchema: SchemaDefinition = {
      ...schema,
      ...(updates.name && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.fields && { fields: updates.fields }),
      ...(updates.displayField && { displayField: updates.displayField }),
      ...(updates.isSystem !== undefined && { isSystem: updates.isSystem }),
      updatedAt: new Date(),
      updatedBy: userId,
    }

    this.schemas.get(projectId)!.set(schemaId, updatedSchema)
  }

  async deleteSchema(
    projectId: string,
    schemaId: string,
    _collectionId: string,
    _userId: string
  ): Promise<void> {
    const schema = await this.getSchemaById(projectId, schemaId)
    if (!schema) {
      throw new Error(`Schema "${schemaId}" not found in project "${projectId}"`)
    }

    const projectSchemas = this.schemas.get(projectId)
    if (projectSchemas) {
      projectSchemas.delete(schemaId)
    }
  }

  async schemaExists(projectId: string, schemaId: string): Promise<boolean> {
    const schema = await this.getSchemaById(projectId, schemaId)
    return schema !== null
  }

  // Test helper methods
  clear(): void {
    this.schemas.clear()
  }

  addSchema(projectId: string, schema: SchemaDefinition): void {
    if (!this.schemas.has(projectId)) {
      this.schemas.set(projectId, new Map())
    }
    this.schemas.get(projectId)!.set(schema.id, schema)
  }

  getSchemaCount(projectId: string): number {
    const projectSchemas = this.schemas.get(projectId)
    return projectSchemas ? projectSchemas.size : 0
  }
}
