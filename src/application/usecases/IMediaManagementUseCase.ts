/**
 * Media Management Use Case Interface
 *
 * Defines the application-layer contract for media file operations.
 * Orchestrates media upload, retrieval, and deletion with business logic.
 *
 * **Clean Architecture - Application Layer:**
 * - Enforces business rules
 * - Validates user permissions
 * - Coordinates between repository and domain logic
 * - Logs all operations for audit trail
 */

import type {
  MediaFile,
  MediaUploadResult,
  MediaType,
} from '@/domain/entities/MediaFile'

/**
 * Input for uploading single media
 */
export interface UploadMediaRequest {
  file: File
  projectId: string
  userId: string
  userRole: string
  alt?: string
  caption?: string
  tags?: string[]
  folderPath?: string
}

/**
 * Input for uploading multiple media files
 */
export interface UploadMultipleMediaRequest {
  files: File[]
  projectId: string
  userId: string
  userRole: string
  alt?: string
  caption?: string
  tags?: string[]
  folderPath?: string
}

/**
 * Input for deleting media
 */
export interface DeleteMediaRequest {
  mediaId: string
  projectId: string
  userId: string
  userRole: string
}

/**
 * Input for updating media metadata
 */
export interface UpdateMediaMetadataRequest {
  mediaId: string
  projectId: string
  userId: string
  userRole: string
  alt?: string
  caption?: string
  tags?: string[]
}

/**
 * IMediaManagementUseCase
 *
 * Application-layer interface for media management operations.
 */
export interface IMediaManagementUseCase {
  /**
   * Upload a single media file
   *
   * Business Rules:
   * - User must have access to the project
   * - File size must be within limits
   * - File type must be allowed
   * - Creates audit log entry
   *
   * @param request - Upload request with file and metadata
   * @returns Promise<MediaUploadResult> - Upload result
   * @throws Error if validation fails or user lacks permission
   */
  uploadMedia(request: UploadMediaRequest): Promise<MediaUploadResult>

  /**
   * Upload multiple media files
   *
   * Business Rules:
   * - Same as single upload
   * - All files validated before upload
   * - Partial success possible
   *
   * @param request - Upload request with multiple files
   * @returns Promise<MediaUploadResult[]> - Array of upload results
   */
  uploadMultipleMedia(request: UploadMultipleMediaRequest): Promise<MediaUploadResult[]>

  /**
   * Delete a media file
   *
   * Business Rules:
   * - Only Admin or Super can delete
   * - User must own the file or be Admin/Super
   * - Creates audit log entry
   * - Checks if file is referenced in content
   *
   * @param request - Delete request with media ID and user info
   * @returns Promise<void>
   * @throws Error if user lacks permission
   */
  deleteMedia(request: DeleteMediaRequest): Promise<void>

  /**
   * Delete multiple media files
   *
   * @param requests - Array of delete requests
   * @returns Promise<void>
   */
  deleteMultipleMedia(requests: DeleteMediaRequest[]): Promise<void>

  /**
   * Get media file by ID
   *
   * @param mediaId - Media file ID
   * @param projectId - Project ID
   * @param userId - User ID
   * @param userRole - User role
   * @returns Promise<MediaFile | null> - Media file or null
   */
  getMediaById(
    mediaId: string,
    projectId: string,
    userId: string,
    userRole: string
  ): Promise<MediaFile | null>

  /**
   * Get all media files for a project
   *
   * @param projectId - Project ID
   * @param userId - User ID
   * @param userRole - User role
   * @param type - Optional media type filter
   * @returns Promise<MediaFile[]> - Array of media files
   */
  getMediaByProject(
    projectId: string,
    userId: string,
    userRole: string,
    type?: MediaType
  ): Promise<MediaFile[]>

  /**
   * Get media files uploaded by user
   *
   * @param projectId - Project ID
   * @param userId - User ID
   * @param userRole - User role
   * @returns Promise<MediaFile[]> - Array of media files
   */
  getMediaByUser(
    projectId: string,
    userId: string,
    userRole: string
  ): Promise<MediaFile[]>

  /**
   * Update media metadata
   *
   * @param request - Update request
   * @returns Promise<MediaFile> - Updated media file
   */
  updateMediaMetadata(request: UpdateMediaMetadataRequest): Promise<MediaFile>

  /**
   * Validate file upload
   *
   * @param file - File to validate
   * @returns { valid: boolean, error?: string }
   */
  validateFile(file: File): { valid: boolean; error?: string }
}
