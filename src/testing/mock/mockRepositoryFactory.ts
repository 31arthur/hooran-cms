/**
 * Mock Repository Factory
 *
 * Provides factory functions to create mock implementations of all core repository interfaces.
 * These mocks are designed for unit testing Use Cases in isolation.
 *
 * **Architecture Pattern:**
 * - Each factory function returns a fully mocked repository interface
 * - All methods return jest.fn() with sensible default return values
 * - Mocks can be overridden in individual tests for specific scenarios
 * - Predictable data structures for consistent testing
 *
 * **Usage:**
 * ```typescript
 * import { createMockContentRepository, createMockAuditRepository } from '@/testing/mock/mockRepositoryFactory'
 *
 * describe('ContentManagementUseCase', () => {
 *   it('should create content entry with audit log', async () => {
 *     const mockContentRepo = createMockContentRepository()
 *     const mockAuditRepo = createMockAuditRepository()
 *
 *     const useCase = new ContentManagementUseCase(mockContentRepo, mockAuditRepo, ...)
 *
 *     await useCase.createContentEntry(...)
 *
 *     expect(mockContentRepo.createContentEntry).toHaveBeenCalled()
 *     expect(mockAuditRepo.logAction).toHaveBeenCalled()
 *   })
 * })
 * ```
 */

import type {
  IContentRepository,
  IAuditRepository,
  IUserRepository,
  IProjectRepository,
  ISchemaRepository,
} from '@/domain/repositories'
import type { ContentEntry, ContentStatus } from '@/domain/entities/ContentEntry'
import type { AuditLogEntry } from '@/domain/entities/AuditLog'
import type { User } from '@/domain/entities/User'
import type { Project } from '@/domain/entities/Project'
import type { SchemaDefinition } from '@/domain/entities/SchemaDefinition'

/**
 * Test Data Factory
 *
 * Provides predictable test data for common entities
 */
export const testData = {
  /**
   * Create a test ContentEntry
   */
  createContentEntry: (overrides?: Partial<ContentEntry>): ContentEntry => ({
    id: 'content-123',
    projectId: 'project-abc',
    collectionId: 'articles',
    data: {
      title: 'Test Article',
      body: 'Test content body',
    },
    status: 'draft' as ContentStatus,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdBy: 'user-123',
    ...overrides,
  }),

  /**
   * Create a test User
   */
  createUser: (overrides?: Partial<User>): User => ({
    uid: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    displayName: 'Test User',
    role: 'Admin',
    projects: ['project-abc'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }),

  /**
   * Create a test Project
   */
  createProject: (overrides?: Partial<Project>): Project => ({
    projectId: 'project-abc',
    name: 'Test Project',
    description: 'A test project',
    status: 'Active',
    ownerId: 'user-123',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }),

  /**
   * Create a test SchemaDefinition
   */
  createSchema: (overrides?: Partial<SchemaDefinition>): SchemaDefinition => ({
    id: 'schema-123',
    projectId: 'project-abc',
    collectionId: 'articles',
    collectionName: 'Articles',
    fields: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        validation: {},
      },
      {
        name: 'body',
        label: 'Body',
        type: 'richtext',
        required: false,
        validation: {},
      },
    ],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdBy: 'user-123',
    ...overrides,
  }),

  /**
   * Create a test AuditLogEntry
   */
  createAuditLog: (overrides?: Partial<AuditLogEntry>): AuditLogEntry => ({
    id: 'audit-123',
    projectId: 'project-abc',
    userId: 'user-123',
    action: 'CREATE',
    resourceType: 'CONTENT',
    resourceId: 'content-123',
    timestamp: new Date('2025-01-01'),
    details: {
      collection_id: 'articles',
    },
    ...overrides,
  }),
}

/**
 * Create Mock Content Repository
 *
 * Returns a fully mocked IContentRepository with jest.fn() for all methods.
 * Default implementations return predictable test data.
 */
export function createMockContentRepository(): jest.Mocked<IContentRepository> {
  return {
    createContentEntry: jest.fn().mockResolvedValue(testData.createContentEntry()),
    getContentEntries: jest.fn().mockResolvedValue([testData.createContentEntry()]),
    getContentEntryById: jest.fn().mockResolvedValue(testData.createContentEntry()),
    updateContentEntry: jest.fn().mockResolvedValue(testData.createContentEntry()),
    deleteContentEntry: jest.fn().mockResolvedValue(undefined),
    publishContentEntry: jest.fn().mockResolvedValue(testData.createContentEntry({ status: 'published' })),
    unpublishContentEntry: jest.fn().mockResolvedValue(testData.createContentEntry({ status: 'draft' })),
    getPublishedContent: jest.fn().mockResolvedValue([testData.createContentEntry({ status: 'published' })]),
    validateContentData: jest.fn().mockResolvedValue({ isValid: true, errors: [] }),
  } as jest.Mocked<IContentRepository>
}

/**
 * Create Mock Audit Repository
 *
 * Returns a fully mocked IAuditRepository with jest.fn() for all methods.
 * Default implementations return predictable test data.
 */
export function createMockAuditRepository(): jest.Mocked<IAuditRepository> {
  return {
    logAction: jest.fn().mockResolvedValue(testData.createAuditLog()),
    getAuditLogs: jest.fn().mockResolvedValue([testData.createAuditLog()]),
    getAuditLogById: jest.fn().mockResolvedValue(testData.createAuditLog()),
    getAuditLogsByProject: jest.fn().mockResolvedValue([testData.createAuditLog()]),
    getAuditLogsByResource: jest.fn().mockResolvedValue([testData.createAuditLog()]),
    getAuditLogsByUser: jest.fn().mockResolvedValue([testData.createAuditLog()]),
  } as jest.Mocked<IAuditRepository>
}

/**
 * Create Mock User Repository
 *
 * Returns a fully mocked IUserRepository with jest.fn() for all methods.
 * Default implementations return predictable test data.
 */
export function createMockUserRepository(): jest.Mocked<IUserRepository> {
  return {
    getUserById: jest.fn().mockResolvedValue(testData.createUser()),
    getUserByEmail: jest.fn().mockResolvedValue(testData.createUser()),
    getAllUsers: jest.fn().mockResolvedValue([testData.createUser()]),
    getAdminsAndSuperUsers: jest.fn().mockResolvedValue([testData.createUser()]),
    createUser: jest.fn().mockResolvedValue(testData.createUser()),
    updateUser: jest.fn().mockResolvedValue(testData.createUser()),
    updateUserRole: jest.fn().mockResolvedValue(undefined),
    updateUserProjectAssignments: jest.fn().mockResolvedValue(undefined),
    assignUserToProject: jest.fn().mockResolvedValue(undefined),
    removeUserFromProject: jest.fn().mockResolvedValue(undefined),
    hasProjectAccess: jest.fn().mockResolvedValue(true),
    updateLastLogin: jest.fn().mockResolvedValue(undefined),
  } as jest.Mocked<IUserRepository>
}

/**
 * Create Mock Project Repository
 *
 * Returns a fully mocked IProjectRepository with jest.fn() for all methods.
 * Default implementations return predictable test data.
 */
export function createMockProjectRepository(): jest.Mocked<IProjectRepository> {
  return {
    getProjectById: jest.fn().mockResolvedValue(testData.createProject()),
    getAllProjects: jest.fn().mockResolvedValue([testData.createProject()]),
    getProjectsByUser: jest.fn().mockResolvedValue([testData.createProject()]),
    createProject: jest.fn().mockResolvedValue(testData.createProject()),
    updateProject: jest.fn().mockResolvedValue(testData.createProject()),
    updateProjectMetadata: jest.fn().mockResolvedValue(undefined),
    deleteProject: jest.fn().mockResolvedValue(undefined),
  } as jest.Mocked<IProjectRepository>
}

/**
 * Create Mock Schema Repository
 *
 * Returns a fully mocked ISchemaRepository with jest.fn() for all methods.
 * Default implementations return predictable test data.
 */
export function createMockSchemaRepository(): jest.Mocked<ISchemaRepository> {
  return {
    getSchemasForProject: jest.fn().mockResolvedValue([testData.createSchema()]),
    getSchemaById: jest.fn().mockResolvedValue(testData.createSchema()),
    getSchemaDefinition: jest.fn().mockResolvedValue(testData.createSchema()),
    createSchema: jest.fn().mockResolvedValue(testData.createSchema()),
    updateSchema: jest.fn().mockResolvedValue(testData.createSchema()),
    deleteSchema: jest.fn().mockResolvedValue(undefined),
    validateSchemaDefinition: jest.fn().mockResolvedValue({ isValid: true, errors: [] }),
  } as jest.Mocked<ISchemaRepository>
}

/**
 * Mock Repository Bundle
 *
 * Creates all mock repositories at once for convenience.
 * Useful when testing Use Cases that depend on multiple repositories.
 */
export interface MockRepositoryBundle {
  contentRepository: jest.Mocked<IContentRepository>
  auditRepository: jest.Mocked<IAuditRepository>
  userRepository: jest.Mocked<IUserRepository>
  projectRepository: jest.Mocked<IProjectRepository>
  schemaRepository: jest.Mocked<ISchemaRepository>
}

/**
 * Create all mock repositories at once
 */
export function createMockRepositories(): MockRepositoryBundle {
  return {
    contentRepository: createMockContentRepository(),
    auditRepository: createMockAuditRepository(),
    userRepository: createMockUserRepository(),
    projectRepository: createMockProjectRepository(),
    schemaRepository: createMockSchemaRepository(),
  }
}

/**
 * Helper: Reset all mocks in a bundle
 *
 * Useful in beforeEach() to ensure clean state between tests
 */
export function resetMockRepositories(bundle: MockRepositoryBundle): void {
  Object.values(bundle).forEach((repo) => {
    Object.values(repo).forEach((method) => {
      if (jest.isMockFunction(method)) {
        method.mockClear()
      }
    })
  })
}
