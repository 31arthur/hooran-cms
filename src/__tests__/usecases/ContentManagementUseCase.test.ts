/**
 * ContentManagementUseCase Unit Tests
 *
 * Demonstrates unit testing Clean Architecture Use Cases with mocked repositories.
 *
 * **Testing Strategy:**
 * 1. Use mock repositories from mockRepositoryFactory
 * 2. Test business logic in isolation (no real database)
 * 3. Verify repository methods called with correct parameters
 * 4. Verify mandatory audit logging
 * 5. Test error handling and edge cases
 *
 * **Key Principles:**
 * - Fast: No I/O, runs in milliseconds
 * - Isolated: No dependencies on external systems
 * - Repeatable: Same results every time
 * - Self-checking: Automated assertions
 */

import { ContentManagementUseCase } from '@/application/usecases/ContentManagementUseCase'
import {
  createMockContentRepository,
  createMockAuditRepository,
  createMockSchemaRepository,
  createMockProjectRepository,
  testData,
} from '@/testing/mock/mockRepositoryFactory'
import type { IContentRepository, IAuditRepository, ISchemaRepository, IProjectRepository } from '@/domain/repositories'

describe('ContentManagementUseCase', () => {
  // Mock repositories
  let mockContentRepo: jest.Mocked<IContentRepository>
  let mockAuditRepo: jest.Mocked<IAuditRepository>
  let mockSchemaRepo: jest.Mocked<ISchemaRepository>
  let mockProjectRepo: jest.Mocked<IProjectRepository>

  // System under test
  let useCase: ContentManagementUseCase

  /**
   * Setup: Run before each test
   * Creates fresh mocks and use case instance
   */
  beforeEach(() => {
    // Create mock repositories with default implementations
    mockContentRepo = createMockContentRepository()
    mockAuditRepo = createMockAuditRepository()
    mockSchemaRepo = createMockSchemaRepository()
    mockProjectRepo = createMockProjectRepository()

    // Instantiate use case with mocked dependencies
    useCase = new ContentManagementUseCase(
      mockContentRepo,
      mockAuditRepo,
      mockSchemaRepo,
      mockProjectRepo
    )
  })

  /**
   * Cleanup: Run after each test
   * Ensures no test pollution
   */
  afterEach(() => {
    jest.clearAllMocks()
  })

  /**
   * TEST GROUP: createContentEntry
   *
   * Tests the content creation workflow including:
   * - Repository interaction
   * - Mandatory audit logging
   * - Data validation
   * - Error handling
   */
  describe('createContentEntry', () => {
    /**
     * TEST: Should create content entry and log audit action
     *
     * This is the CANONICAL example of testing a Use Case method.
     *
     * **What we're testing:**
     * 1. Use Case orchestrates repository calls correctly
     * 2. Content repository receives correct data
     * 3. Audit repository logs the CREATE action (mandatory)
     * 4. Audit log contains required fields
     */
    it('should create content entry and log mandatory CREATE audit action', async () => {
      // ==========================================
      // ARRANGE: Setup test data and expectations
      // ==========================================

      const projectId = 'project-abc'
      const collectionId = 'articles'
      const contentData = {
        title: 'New Article',
        body: 'Article content',
      }
      const userId = 'user-123'

      // Mock schema validation to pass
      mockSchemaRepo.getSchemaById.mockResolvedValue(
        testData.createSchema({
          id: 'schema-123',
          collectionId: 'articles',
          fields: [
            { name: 'title', label: 'Title', type: 'text', required: true, validation: {} },
            { name: 'body', label: 'Body', type: 'richtext', required: false, validation: {} },
          ],
        })
      )

      // Mock content creation to return new entry
      const expectedContentEntry = testData.createContentEntry({
        id: 'content-new-123',
        projectId,
        collectionId,
        data: contentData,
        status: 'draft',
        createdBy: userId,
      })
      mockContentRepo.createContentEntry.mockResolvedValue(expectedContentEntry)

      // ==========================================
      // ACT: Execute the use case method
      // ==========================================

      const result = await useCase.createContentEntry(
        projectId,
        collectionId,
        contentData,
        userId
      )

      // ==========================================
      // ASSERT: Verify behavior
      // ==========================================

      // 1. Verify content repository was called correctly
      expect(mockContentRepo.createContentEntry).toHaveBeenCalledTimes(1)
      expect(mockContentRepo.createContentEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId,
          collectionId,
          data: contentData,
          status: 'draft', // Default status
          createdBy: userId,
        })
      )

      // 2. Verify MANDATORY audit logging
      expect(mockAuditRepo.logAction).toHaveBeenCalledTimes(1)
      expect(mockAuditRepo.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId,
          userId,
          action: 'CREATE',
          resourceType: 'CONTENT',
          resourceId: expectedContentEntry.id,
          details: expect.objectContaining({
            collection_id: collectionId,
            content_data: contentData,
          }),
        })
      )

      // 3. Verify return value
      expect(result).toEqual(expectedContentEntry)
    })

    /**
     * TEST: Should validate content against schema before creation
     */
    it('should validate content data against schema definition', async () => {
      // Setup: Schema with required field
      mockSchemaRepo.getSchemaById.mockResolvedValue(
        testData.createSchema({
          fields: [
            { name: 'title', label: 'Title', type: 'text', required: true, validation: {} },
          ],
        })
      )

      // Mock validation to fail
      mockContentRepo.validateContentData.mockResolvedValue({
        isValid: false,
        errors: [{ field: 'title', message: 'Title is required' }],
      })

      // Act & Assert: Should throw validation error
      await expect(
        useCase.createContentEntry(
          'project-abc',
          'articles',
          { body: 'Content without title' }, // Missing required 'title'
          'user-123'
        )
      ).rejects.toThrow('Validation failed')

      // Verify content was NOT created
      expect(mockContentRepo.createContentEntry).not.toHaveBeenCalled()

      // Verify audit log was NOT created (failed before creation)
      expect(mockAuditRepo.logAction).not.toHaveBeenCalled()
    })

    /**
     * TEST: Should handle repository errors gracefully
     */
    it('should throw error if content repository fails', async () => {
      // Setup: Mock repository to fail
      const repositoryError = new Error('Database connection failed')
      mockContentRepo.createContentEntry.mockRejectedValue(repositoryError)

      // Act & Assert: Should propagate error
      await expect(
        useCase.createContentEntry(
          'project-abc',
          'articles',
          { title: 'Test' },
          'user-123'
        )
      ).rejects.toThrow('Database connection failed')

      // Verify audit log was NOT created (operation failed)
      expect(mockAuditRepo.logAction).not.toHaveBeenCalled()
    })

    /**
     * TEST: Should create content with custom status if provided
     */
    it('should create content with custom status when specified', async () => {
      // Arrange: Content with 'published' status
      const contentData = { title: 'Published Article' }

      mockContentRepo.createContentEntry.mockResolvedValue(
        testData.createContentEntry({
          status: 'published',
          data: contentData,
        })
      )

      // Act: Create with published status
      await useCase.createContentEntry(
        'project-abc',
        'articles',
        contentData,
        'user-123',
        'published' // Custom status
      )

      // Assert: Repository received published status
      expect(mockContentRepo.createContentEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
        })
      )

      // Assert: Audit log records published status
      expect(mockAuditRepo.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            status: 'published',
          }),
        })
      )
    })
  })

  /**
   * TEST GROUP: updateContentEntry
   *
   * Tests content update workflow
   */
  describe('updateContentEntry', () => {
    /**
     * TEST: Should update content entry and log UPDATE audit action
     */
    it('should update content entry and log mandatory UPDATE audit action', async () => {
      // Arrange
      const projectId = 'project-abc'
      const collectionId = 'articles'
      const contentId = 'content-123'
      const updatedData = {
        title: 'Updated Title',
        body: 'Updated body',
      }
      const userId = 'user-123'

      // Mock existing content
      mockContentRepo.getContentEntryById.mockResolvedValue(
        testData.createContentEntry({
          id: contentId,
          data: { title: 'Original Title', body: 'Original body' },
        })
      )

      // Mock update result
      const updatedEntry = testData.createContentEntry({
        id: contentId,
        data: updatedData,
        updatedAt: new Date(),
      })
      mockContentRepo.updateContentEntry.mockResolvedValue(updatedEntry)

      // Act
      const result = await useCase.updateContentEntry(
        projectId,
        collectionId,
        contentId,
        updatedData,
        userId
      )

      // Assert: Update repository called
      expect(mockContentRepo.updateContentEntry).toHaveBeenCalledTimes(1)
      expect(mockContentRepo.updateContentEntry).toHaveBeenCalledWith(
        contentId,
        expect.objectContaining({
          data: updatedData,
        })
      )

      // Assert: MANDATORY audit logging
      expect(mockAuditRepo.logAction).toHaveBeenCalledTimes(1)
      expect(mockAuditRepo.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId,
          userId,
          action: 'UPDATE',
          resourceType: 'CONTENT',
          resourceId: contentId,
        })
      )

      // Assert: Return value
      expect(result).toEqual(updatedEntry)
    })
  })

  /**
   * TEST GROUP: deleteContentEntry
   *
   * Tests content deletion workflow
   */
  describe('deleteContentEntry', () => {
    /**
     * TEST: Should delete content entry and log DELETE audit action
     */
    it('should delete content entry and log mandatory DELETE audit action', async () => {
      // Arrange
      const projectId = 'project-abc'
      const collectionId = 'articles'
      const contentId = 'content-123'
      const userId = 'user-123'

      // Mock existing content
      mockContentRepo.getContentEntryById.mockResolvedValue(
        testData.createContentEntry({ id: contentId })
      )

      // Mock successful deletion
      mockContentRepo.deleteContentEntry.mockResolvedValue(undefined)

      // Act
      await useCase.deleteContentEntry(projectId, collectionId, contentId, userId)

      // Assert: Delete repository called
      expect(mockContentRepo.deleteContentEntry).toHaveBeenCalledTimes(1)
      expect(mockContentRepo.deleteContentEntry).toHaveBeenCalledWith(contentId)

      // Assert: MANDATORY audit logging with DELETE action
      expect(mockAuditRepo.logAction).toHaveBeenCalledTimes(1)
      expect(mockAuditRepo.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId,
          userId,
          action: 'DELETE',
          resourceType: 'CONTENT',
          resourceId: contentId,
        })
      )
    })

    /**
     * TEST: Should prevent deletion of non-existent content
     */
    it('should throw error if content does not exist', async () => {
      // Setup: Mock content not found
      mockContentRepo.getContentEntryById.mockResolvedValue(null)

      // Act & Assert: Should throw error
      await expect(
        useCase.deleteContentEntry('project-abc', 'articles', 'nonexistent-id', 'user-123')
      ).rejects.toThrow('Content entry not found')

      // Verify deletion was NOT attempted
      expect(mockContentRepo.deleteContentEntry).not.toHaveBeenCalled()

      // Verify audit log was NOT created
      expect(mockAuditRepo.logAction).not.toHaveBeenCalled()
    })
  })

  /**
   * TEST GROUP: publishContentEntry
   *
   * Tests content publishing workflow
   */
  describe('publishContentEntry', () => {
    /**
     * TEST: Should publish content and log PUBLISH audit action
     */
    it('should publish content entry and log PUBLISH audit action', async () => {
      // Arrange
      const projectId = 'project-abc'
      const collectionId = 'articles'
      const contentId = 'content-123'
      const userId = 'user-123'

      // Mock draft content
      mockContentRepo.getContentEntryById.mockResolvedValue(
        testData.createContentEntry({
          id: contentId,
          status: 'draft',
        })
      )

      // Mock publish result
      const publishedEntry = testData.createContentEntry({
        id: contentId,
        status: 'published',
      })
      mockContentRepo.publishContentEntry.mockResolvedValue(publishedEntry)

      // Act
      const result = await useCase.publishContentEntry(
        projectId,
        collectionId,
        contentId,
        userId
      )

      // Assert: Publish repository called
      expect(mockContentRepo.publishContentEntry).toHaveBeenCalledTimes(1)
      expect(mockContentRepo.publishContentEntry).toHaveBeenCalledWith(contentId)

      // Assert: Audit log records status change
      expect(mockAuditRepo.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          resourceType: 'CONTENT',
          details: expect.objectContaining({
            old_status: 'draft',
            new_status: 'published',
          }),
        })
      )

      // Assert: Return value has published status
      expect(result.status).toBe('published')
    })
  })
})
