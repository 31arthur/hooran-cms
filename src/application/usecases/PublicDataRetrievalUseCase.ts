/**
 * Public Data Retrieval Use Case Implementation
 *
 * Implements the public data retrieval business logic for unauthenticated access.
 *
 * **Clean Architecture - Application Layer:**
 * - Handles UNAUTHENTICATED public access to published content
 * - Depends ONLY on IContentRepository (NO user/auth dependencies)
 * - Enforces "published-only" business rule
 * - Framework-independent
 *
 * **Responsibilities:**
 * 1. Retrieve ONLY published content
 * 2. Validate project and collection IDs
 * 3. Enforce reasonable limits for public access
 * 4. Provide statistics about published content
 *
 * **Security Model:**
 * - NO authentication required
 * - Returns ONLY content with status: 'published'
 * - Read-only operations
 * - Project-scoped for multi-tenancy
 *
 * **Constructor Injection:**
 * ```typescript
 * const useCase = new PublicDataRetrievalUseCase(contentRepository)
 * ```
 */

import type { IContentRepository } from '@/domain/repositories/IContentRepository'
import type { ContentEntry } from '@/domain/entities'
import type {
  IPublicDataRetrievalUseCase,
  PublicContentStats,
} from './IPublicDataRetrievalUseCase'

/**
 * Maximum limit for public API queries
 * Prevents excessive data retrieval in public endpoints
 */
const MAX_PUBLIC_QUERY_LIMIT = 100

/**
 * Default limit for public API queries
 */
const DEFAULT_PUBLIC_QUERY_LIMIT = 50

/**
 * PublicDataRetrievalUseCase
 *
 * Concrete implementation of public data retrieval logic
 */
export class PublicDataRetrievalUseCase implements IPublicDataRetrievalUseCase {
  private readonly contentRepository: IContentRepository

  /**
   * Constructor with Dependency Injection
   *
   * **IMPORTANT:** This use case ONLY depends on IContentRepository.
   * NO user repository, NO auth repository - reinforcing its unauthenticated nature.
   *
   * @param contentRepository - Content repository for data access
   */
  constructor(contentRepository: IContentRepository) {
    this.contentRepository = contentRepository
  }

  /**
   * Get published content from a collection
   *
   * Retrieves ONLY published content entries for public/external access.
   *
   * **Business Rules:**
   * 1. Returns ONLY entries with status: 'published'
   * 2. Enforces maximum limit of 100 entries
   * 3. Project-scoped for multi-tenancy
   * 4. NO authentication required
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param limit - Maximum number of entries (default: 50, max: 100)
   * @returns Promise<ContentEntry[]> - Published content entries
   */
  async getPublishedContent(
    projectId: string,
    collectionId: string,
    limit: number = DEFAULT_PUBLIC_QUERY_LIMIT
  ): Promise<ContentEntry[]> {
    // Validate inputs
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      throw new Error('Invalid project ID: Project ID is required')
    }

    if (!collectionId || typeof collectionId !== 'string' || collectionId.trim() === '') {
      throw new Error('Invalid collection ID: Collection ID is required')
    }

    // Enforce maximum limit for public access
    const safeLimit = Math.min(Math.max(1, limit), MAX_PUBLIC_QUERY_LIMIT)

    if (limit > MAX_PUBLIC_QUERY_LIMIT) {
      console.warn(
        `⚠️ PublicDataRetrievalUseCase: Requested limit ${limit} exceeds maximum ${MAX_PUBLIC_QUERY_LIMIT}, capping at maximum`
      )
    }

    try {
      console.log('📊 PublicDataRetrievalUseCase: Fetching published content', {
        projectId,
        collectionId,
        limit: safeLimit,
      })

      // Delegate to repository (repository enforces "published-only" filter)
      const publishedEntries = await this.contentRepository.getPublishedContentByCollection(
        projectId,
        collectionId,
        safeLimit
      )

      console.log(
        `✅ PublicDataRetrievalUseCase: Retrieved ${publishedEntries.length} published entries`
      )

      return publishedEntries
    } catch (error) {
      console.error('❌ PublicDataRetrievalUseCase: Failed to fetch published content', error)
      throw new Error(
        `Failed to retrieve published content: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get published content count
   *
   * Returns the count of published entries in a collection.
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @returns Promise<number> - Count of published entries
   */
  async getPublishedContentCount(projectId: string, collectionId: string): Promise<number> {
    // Validate inputs
    if (!projectId || !collectionId) {
      throw new Error('Invalid parameters: projectId and collectionId are required')
    }

    try {
      console.log('🔢 PublicDataRetrievalUseCase: Counting published content', {
        projectId,
        collectionId,
      })

      // Fetch all published entries (up to a reasonable limit for counting)
      const publishedEntries = await this.contentRepository.getPublishedContentByCollection(
        projectId,
        collectionId,
        1000 // Reasonable limit for counting
      )

      const count = publishedEntries.length

      console.log(`✅ PublicDataRetrievalUseCase: Found ${count} published entries`)

      return count
    } catch (error) {
      console.error('❌ PublicDataRetrievalUseCase: Failed to count published content', error)
      throw new Error(
        `Failed to count published content: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get published content statistics
   *
   * Returns statistics about published content in a collection.
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @returns Promise<PublicContentStats> - Statistics object
   */
  async getPublishedContentStats(
    projectId: string,
    collectionId: string
  ): Promise<PublicContentStats> {
    // Validate inputs
    if (!projectId || !collectionId) {
      throw new Error('Invalid parameters: projectId and collectionId are required')
    }

    try {
      console.log('📈 PublicDataRetrievalUseCase: Generating content statistics', {
        projectId,
        collectionId,
      })

      // Get published count
      const publishedCount = await this.getPublishedContentCount(projectId, collectionId)

      const stats: PublicContentStats = {
        publishedCount,
        collectionId,
        projectId,
        generatedAt: new Date(),
      }

      console.log(`✅ PublicDataRetrievalUseCase: Generated stats`, stats)

      return stats
    } catch (error) {
      console.error('❌ PublicDataRetrievalUseCase: Failed to generate stats', error)
      throw new Error(
        `Failed to generate content statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
