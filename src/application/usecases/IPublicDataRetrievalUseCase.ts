/**
 * Public Data Retrieval Use Case Interface
 *
 * Defines the contract for public-facing data retrieval operations.
 * This use case handles UNAUTHENTICATED access to published content.
 *
 * **Framework Independence:**
 * - Methods accept and return only domain entities or primitives
 * - NO Firebase types
 * - NO authentication/user dependencies
 * - Completely UI-agnostic
 *
 * **Purpose:**
 * Provides read-only access to published content for external/public consumption.
 * This is the interface for public APIs, websites, and unauthenticated clients.
 *
 * **Security Model:**
 * - NO authentication required
 * - Returns ONLY published content (status: 'published')
 * - Project-scoped for multi-tenancy
 * - Read-only operations only
 */

import type { ContentEntry } from '@/domain/entities'

/**
 * Public Content Statistics
 *
 * Statistics about published content in a collection
 */
export interface PublicContentStats {
  /**
   * Total count of published entries
   */
  publishedCount: number

  /**
   * Collection ID
   */
  collectionId: string

  /**
   * Project ID
   */
  projectId: string

  /**
   * Timestamp when stats were generated
   */
  generatedAt: Date
}

/**
 * IPublicDataRetrievalUseCase
 *
 * Use case interface for public data retrieval operations
 */
export interface IPublicDataRetrievalUseCase {
  /**
   * Get published content from a collection
   *
   * Retrieves ONLY published content entries. This is the primary method
   * for public/external access to content data.
   *
   * **Security:**
   * - NO authentication required
   * - Returns ONLY entries with status: 'published'
   * - Project-scoped for multi-tenancy
   *
   * **Use Cases:**
   * - Public website content fetching
   * - External API access
   * - Content delivery to third-party applications
   *
   * @param projectId - The project ID (required for multi-tenancy)
   * @param collectionId - The collection ID to query
   * @param limit - Maximum number of entries to return (default: 50, max: 100)
   * @returns Promise<ContentEntry[]> - Array of published content entries
   *
   * @throws Error if projectId or collectionId is invalid
   *
   * @example
   * ```typescript
   * // In a public API endpoint
   * const publicDataUseCase = DIContainer.resolve<IPublicDataRetrievalUseCase>(
   *   DI_TYPES.PublicDataRetrievalUseCase
   * )
   *
   * const publishedArticles = await publicDataUseCase.getPublishedContent(
   *   'my-project',
   *   'articles',
   *   20
   * )
   *
   * // publishedArticles contains only published entries
   * publishedArticles.forEach(article => {
   *   console.log(article.data.title)
   * })
   * ```
   */
  getPublishedContent(
    projectId: string,
    collectionId: string,
    limit?: number
  ): Promise<ContentEntry[]>

  /**
   * Get published content count
   *
   * Returns the count of published entries in a collection.
   * Useful for pagination and analytics.
   *
   * **Security:**
   * - NO authentication required
   * - Counts ONLY published entries
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @returns Promise<number> - Count of published entries
   *
   * @example
   * ```typescript
   * const count = await publicDataUseCase.getPublishedContentCount(
   *   'my-project',
   *   'articles'
   * )
   * console.log(`${count} published articles`)
   * ```
   */
  getPublishedContentCount(projectId: string, collectionId: string): Promise<number>

  /**
   * Get published content statistics
   *
   * Returns statistics about published content in a collection.
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @returns Promise<PublicContentStats> - Statistics object
   *
   * @example
   * ```typescript
   * const stats = await publicDataUseCase.getPublishedContentStats(
   *   'my-project',
   *   'articles'
   * )
   * console.log(`Collection: ${stats.collectionId}`)
   * console.log(`Published: ${stats.publishedCount}`)
   * ```
   */
  getPublishedContentStats(
    projectId: string,
    collectionId: string
  ): Promise<PublicContentStats>
}
