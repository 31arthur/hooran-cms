/**
 * Content Data Transfer Objects (DTOs)
 *
 * These DTOs provide simplified views of content data for specific UI needs.
 * They follow the Interface Segregation Principle (ISP) by exposing only
 * the data required for each specific use case.
 *
 * **Why DTOs?**
 * - Simplified data structures for UI components
 * - Reduces payload size for list views
 * - Clear separation between domain and presentation
 * - Easier to cache and optimize
 */

import type { ContentEntry, ContentStatus } from '@/domain/entities/ContentEntry'

/**
 * ContentListDTO
 *
 * Simplified content entry information for list views and tables.
 * Contains only essential fields for displaying content in lists.
 *
 * **Usage:**
 * - Content Manager list view
 * - Content tables and grids
 * - Search results
 * - Any UI component showing content overviews
 *
 * @example
 * ```typescript
 * const contentList: ContentListDTO[] = [
 *   {
 *     id: 'content-1',
 *     title: 'My Article',
 *     status: 'published',
 *     updatedAt: new Date('2025-01-15')
 *   }
 * ]
 * ```
 */
export interface ContentListDTO {
  /**
   * Unique content entry identifier
   */
  id: string

  /**
   * Content title (from title field or first text field)
   */
  title: string

  /**
   * Current publication status
   */
  status: ContentStatus

  /**
   * Last update timestamp
   */
  updatedAt: Date

  /**
   * Optional: Collection/schema ID this content belongs to
   */
  collectionId?: string

  /**
   * Optional: Short preview text (first 100 chars)
   */
  preview?: string
}

/**
 * ContentDetailDTO
 *
 * Complete content entry information for detail/edit views.
 * Includes all fields and metadata needed for editing.
 *
 * **Usage:**
 * - Content detail page
 * - Content editor
 * - Content preview
 */
export interface ContentDetailDTO {
  /**
   * Unique content entry identifier
   */
  id: string

  /**
   * Project ID this content belongs to
   */
  projectId: string

  /**
   * Collection/schema ID
   */
  collectionId: string

  /**
   * Content field data (key-value pairs)
   */
  data: Record<string, any>

  /**
   * Current publication status
   */
  status: ContentStatus

  /**
   * User ID who created this content
   */
  createdBy?: string

  /**
   * User ID who last updated this content
   */
  updatedBy?: string

  /**
   * Creation timestamp
   */
  createdAt: Date

  /**
   * Last update timestamp
   */
  updatedAt: Date

  /**
   * Publication timestamp (if published)
   */
  publishedAt?: Date
}

/**
 * ContentSummaryDTO
 *
 * Ultra-minimal content information for dashboards and widgets.
 *
 * **Usage:**
 * - Dashboard statistics
 * - Recent activity widgets
 * - Quick previews
 */
export interface ContentSummaryDTO {
  /**
   * Content ID
   */
  id: string

  /**
   * Content title
   */
  title: string

  /**
   * Publication status
   */
  status: ContentStatus
}

/**
 * ContentMapper
 *
 * Static utility class for mapping ContentEntry domain entities to DTOs.
 * Centralizes the transformation logic to ensure consistency.
 */
export class ContentMapper {
  /**
   * Extract title from content data
   *
   * Tries to find a title field, otherwise uses the first text field.
   *
   * @param data - Content field data
   * @returns Extracted title or fallback
   */
  private static extractTitle(data: Record<string, any>): string {
    // Try common title field names
    if (data.title) return String(data.title)
    if (data.name) return String(data.name)
    if (data.headline) return String(data.headline)

    // Find first string field
    const firstTextField = Object.values(data).find(
      (value) => typeof value === 'string' && value.length > 0
    )

    return firstTextField ? String(firstTextField) : 'Untitled'
  }

  /**
   * Extract preview text from content data
   *
   * @param data - Content field data
   * @param maxLength - Maximum preview length (default: 100)
   * @returns Preview text
   */
  private static extractPreview(data: Record<string, any>, maxLength: number = 100): string {
    // Try common content fields
    const contentFields = ['content', 'body', 'description', 'text', 'summary']

    for (const field of contentFields) {
      if (data[field] && typeof data[field] === 'string') {
        const text = String(data[field])
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
      }
    }

    return ''
  }

  /**
   * Convert ContentEntry entity to ContentListDTO
   *
   * Extracts only the fields needed for list views.
   *
   * @param content - The full content entry entity
   * @returns Simplified list DTO
   */
  static toListDTO(content: ContentEntry): ContentListDTO {
    return {
      id: content.id,
      title: ContentMapper.extractTitle(content.data),
      status: content.status ?? 'draft',
      updatedAt: content.updatedAt,
      collectionId: content.collectionId,
      preview: ContentMapper.extractPreview(content.data),
    }
  }

  /**
   * Convert array of ContentEntry entities to ContentListDTO array
   *
   * @param contents - Array of content entries
   * @returns Array of list DTOs
   */
  static toListDTOList(contents: ContentEntry[]): ContentListDTO[] {
    return contents.map((c) => ContentMapper.toListDTO(c))
  }

  /**
   * Convert ContentEntry entity to ContentDetailDTO
   *
   * Includes all fields for detail/edit views.
   *
   * @param content - The full content entry entity
   * @returns Detailed content DTO
   */
  static toDetailDTO(content: ContentEntry): ContentDetailDTO {
    return {
      id: content.id,
      projectId: content.projectId,
      collectionId: content.collectionId,
      data: content.data,
      status: content.status ?? 'draft',
      createdBy: content.createdBy,
      updatedBy: content.updatedBy,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      publishedAt: content.publishedAt,
    }
  }

  /**
   * Convert ContentEntry entity to ContentSummaryDTO
   *
   * Ultra-minimal data for widgets and dashboards.
   *
   * @param content - The full content entry entity
   * @returns Summary DTO
   */
  static toSummaryDTO(content: ContentEntry): ContentSummaryDTO {
    return {
      id: content.id,
      title: ContentMapper.extractTitle(content.data),
      status: content.status ?? 'draft',
    }
  }

  /**
   * Convert array of ContentEntry entities to ContentSummaryDTO array
   *
   * @param contents - Array of content entries
   * @returns Array of summary DTOs
   */
  static toSummaryDTOList(contents: ContentEntry[]): ContentSummaryDTO[] {
    return contents.map((c) => ContentMapper.toSummaryDTO(c))
  }
}
