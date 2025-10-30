/**
 * Media Repository Interface
 *
 * Defines the contract for media file storage and retrieval operations.
 * Follows Clean Architecture - this is a domain-layer abstraction.
 *
 * **Framework Independence:**
 * All methods use domain entities (MediaFile, UploadMediaInput) - no Firebase types!
 *
 * **Implementation:**
 * Implemented by FirebaseMediaRepository in infrastructure layer using Firebase Storage.
 */

import type {
  MediaFile,
  MediaUploadResult,
  UploadMediaInput,
  DeleteMediaInput,
  MediaType,
} from '../entities/MediaFile'

export interface IMediaRepository {
  /**
   * Upload a single media file
   *
   * @param input - Upload input with file and metadata
   * @returns Promise<MediaUploadResult> - Upload result with file info
   */
  uploadFile(input: UploadMediaInput): Promise<MediaUploadResult>

  /**
   * Upload multiple media files
   *
   * @param inputs - Array of upload inputs
   * @returns Promise<MediaUploadResult[]> - Array of upload results
   */
  uploadMultiple(inputs: UploadMediaInput[]): Promise<MediaUploadResult[]>

  /**
   * Delete a media file
   *
   * @param input - Delete input with media ID and user info
   * @returns Promise<void>
   */
  deleteFile(input: DeleteMediaInput): Promise<void>

  /**
   * Delete multiple media files
   *
   * @param inputs - Array of delete inputs
   * @returns Promise<void>
   */
  deleteMultiple(inputs: DeleteMediaInput[]): Promise<void>

  /**
   * Get media file by ID
   *
   * @param mediaId - Media file ID
   * @param projectId - Project ID for validation
   * @returns Promise<MediaFile | null> - Media file or null
   */
  getMediaById(mediaId: string, projectId: string): Promise<MediaFile | null>

  /**
   * Get all media files for a project
   *
   * @param projectId - Project ID
   * @param type - Optional media type filter
   * @returns Promise<MediaFile[]> - Array of media files
   */
  getMediaByProject(projectId: string, type?: MediaType): Promise<MediaFile[]>

  /**
   * Get media files by user
   *
   * @param projectId - Project ID
   * @param userId - User ID
   * @returns Promise<MediaFile[]> - Array of media files
   */
  getMediaByUser(projectId: string, userId: string): Promise<MediaFile[]>

  /**
   * Get media URL (download URL)
   *
   * @param storagePath - Storage path of the file
   * @returns Promise<string> - Public download URL
   */
  getMediaUrl(storagePath: string): Promise<string>

  /**
   * Update media metadata
   *
   * @param mediaId - Media file ID
   * @param projectId - Project ID for validation
   * @param updates - Partial updates to apply
   * @returns Promise<MediaFile> - Updated media file
   */
  updateMediaMetadata(
    mediaId: string,
    projectId: string,
    updates: Partial<Pick<MediaFile, 'alt' | 'caption' | 'tags'>>
  ): Promise<MediaFile>

  /**
   * Check if media exists
   *
   * @param mediaId - Media file ID
   * @param projectId - Project ID
   * @returns Promise<boolean> - True if exists
   */
  mediaExists(mediaId: string, projectId: string): Promise<boolean>
}
