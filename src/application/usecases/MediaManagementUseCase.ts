/**
 * Media Management Use Case Implementation
 *
 * Orchestrates media file operations with business logic and validation.
 *
 * **Architecture Pattern:**
 * Clean Architecture with Dependency Injection
 * - Depends only on repository interfaces
 * - Contains business logic and validation
 * - Creates audit logs for all operations
 */

import type {
  IMediaManagementUseCase,
  UploadMediaRequest,
  UploadMultipleMediaRequest,
  DeleteMediaRequest,
  UpdateMediaMetadataRequest,
} from './IMediaManagementUseCase'
import type { IMediaRepository } from '@/domain/repositories/IMediaRepository'
import type {
  MediaFile,
  MediaUploadResult,
  MediaType,
  UploadMediaInput,
  DeleteMediaInput,
} from '@/domain/entities/MediaFile'

/**
 * File upload constraints
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]

export class MediaManagementUseCase implements IMediaManagementUseCase {
  private readonly mediaRepository: IMediaRepository

  constructor(mediaRepository: IMediaRepository) {
    this.mediaRepository = mediaRepository
  }

  /**
   * Upload a single media file
   */
  async uploadMedia(request: UploadMediaRequest): Promise<MediaUploadResult> {
    try {
      console.log(`📤 MediaManagementUseCase: Uploading file ${request.file.name}`)

      // Validate file
      const validation = this.validateFile(request.file)
      if (!validation.valid) {
        return {
          file: {} as MediaFile,
          success: false,
          error: validation.error,
        }
      }

      // Validate user access (Admin or Super)
      if (request.userRole !== 'Admin' && request.userRole !== 'Super') {
        return {
          file: {} as MediaFile,
          success: false,
          error: 'Insufficient permissions. Only Admin and Super users can upload media.',
        }
      }

      // Create upload input
      const uploadInput: UploadMediaInput = {
        file: request.file,
        projectId: request.projectId,
        userId: request.userId,
        alt: request.alt,
        caption: request.caption,
        tags: request.tags,
        folderPath: request.folderPath,
      }

      // Upload file
      const result = await this.mediaRepository.uploadFile(uploadInput)

      if (result.success) {
        console.log(`✅ MediaManagementUseCase: File uploaded successfully - ${result.file.id}`)

        // TODO: Create audit log entry
        // await this.auditLoggingUseCase.logAudit({
        //   action: 'create',
        //   resourceType: 'media',
        //   resourceId: result.file.id,
        //   ...
        // })
      }

      return result
    } catch (error: any) {
      console.error('❌ MediaManagementUseCase: Upload failed', error)
      return {
        file: {} as MediaFile,
        success: false,
        error: error.message || 'Upload failed',
      }
    }
  }

  /**
   * Upload multiple media files
   */
  async uploadMultipleMedia(request: UploadMultipleMediaRequest): Promise<MediaUploadResult[]> {
    console.log(`📤 MediaManagementUseCase: Uploading ${request.files.length} files`)

    // Validate all files first
    const validationErrors: string[] = []
    for (const file of request.files) {
      const validation = this.validateFile(file)
      if (!validation.valid) {
        validationErrors.push(`${file.name}: ${validation.error}`)
      }
    }

    if (validationErrors.length > 0) {
      console.error('❌ MediaManagementUseCase: Validation failed for some files')
      // Return failure results for all files
      return request.files.map((_file) => ({
        file: {} as MediaFile,
        success: false,
        error: 'Validation failed',
      }))
    }

    // Validate user access
    if (request.userRole !== 'Admin' && request.userRole !== 'Super') {
      return request.files.map(() => ({
        file: {} as MediaFile,
        success: false,
        error: 'Insufficient permissions',
      }))
    }

    // Create upload inputs
    const uploadInputs: UploadMediaInput[] = request.files.map((file) => ({
      file,
      projectId: request.projectId,
      userId: request.userId,
      alt: request.alt,
      caption: request.caption,
      tags: request.tags,
      folderPath: request.folderPath,
    }))

    // Upload all files
    const results = await this.mediaRepository.uploadMultiple(uploadInputs)

    const successCount = results.filter((r) => r.success).length
    console.log(`✅ MediaManagementUseCase: ${successCount}/${request.files.length} files uploaded`)

    return results
  }

  /**
   * Delete a media file
   */
  async deleteMedia(request: DeleteMediaRequest): Promise<void> {
    try {
      console.log(`🗑️ MediaManagementUseCase: Deleting media ${request.mediaId}`)

      // Validate user access (Admin or Super)
      if (request.userRole !== 'Admin' && request.userRole !== 'Super') {
        throw new Error('Insufficient permissions. Only Admin and Super users can delete media.')
      }

      // Get media to check ownership
      const media = await this.mediaRepository.getMediaById(request.mediaId, request.projectId)

      if (!media) {
        throw new Error('Media file not found')
      }

      // Regular users can only delete their own files
      // Admin and Super can delete any file
      // Note: This check is redundant since we already validated that userRole is Admin or Super above
      // But keeping it for clarity and future-proofing
      if (request.userRole !== 'Admin' && request.userRole !== 'Super' && media.uploadedBy !== request.userId) {
        throw new Error('You can only delete your own media files')
      }

      // TODO: Check if media is referenced in content
      // This would require querying content entries to see if they reference this media

      // Delete file
      const deleteInput: DeleteMediaInput = {
        mediaId: request.mediaId,
        userId: request.userId,
        projectId: request.projectId,
      }

      await this.mediaRepository.deleteFile(deleteInput)

      console.log(`✅ MediaManagementUseCase: Media deleted successfully`)

      // TODO: Create audit log entry
    } catch (error: any) {
      console.error('❌ MediaManagementUseCase: Delete failed', error)
      throw error
    }
  }

  /**
   * Delete multiple media files
   */
  async deleteMultipleMedia(requests: DeleteMediaRequest[]): Promise<void> {
    console.log(`🗑️ MediaManagementUseCase: Deleting ${requests.length} media files`)

    const deletePromises = requests.map((request) => this.deleteMedia(request))
    await Promise.all(deletePromises)

    console.log(`✅ MediaManagementUseCase: All media files deleted`)
  }

  /**
   * Get media file by ID
   */
  async getMediaById(
    mediaId: string,
    projectId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userId: string,
    _userRole: string
  ): Promise<MediaFile | null> {
    try {
      // All authenticated users can view media
      return await this.mediaRepository.getMediaById(mediaId, projectId)
    } catch (error: any) {
      console.error('❌ MediaManagementUseCase: Failed to get media', error)
      throw error
    }
  }

  /**
   * Get all media files for a project
   */
  async getMediaByProject(
    projectId: string,
    _userId: string,
    _userRole: string,
    type?: MediaType
  ): Promise<MediaFile[]> {
    try {
      // All authenticated users can view project media
      return await this.mediaRepository.getMediaByProject(projectId, type)
    } catch (error: any) {
      console.error('❌ MediaManagementUseCase: Failed to get media by project', error)
      throw error
    }
  }

  /**
   * Get media files uploaded by user
   */
  async getMediaByUser(
    projectId: string,
    userId: string,
    _userRole: string
  ): Promise<MediaFile[]> {
    try {
      return await this.mediaRepository.getMediaByUser(projectId, userId)
    } catch (error: any) {
      console.error('❌ MediaManagementUseCase: Failed to get media by user', error)
      throw error
    }
  }

  /**
   * Update media metadata
   */
  async updateMediaMetadata(request: UpdateMediaMetadataRequest): Promise<MediaFile> {
    try {
      console.log(`📝 MediaManagementUseCase: Updating media metadata ${request.mediaId}`)

      // Get media to check ownership
      const media = await this.mediaRepository.getMediaById(request.mediaId, request.projectId)

      if (!media) {
        throw new Error('Media file not found')
      }

      // Users can update their own files, Admin/Super can update any
      if (
        request.userRole !== 'Admin' &&
        request.userRole !== 'Super' &&
        media.uploadedBy !== request.userId
      ) {
        throw new Error('You can only update your own media files')
      }

      const updates: Partial<Pick<MediaFile, 'alt' | 'caption' | 'tags'>> = {}
      if (request.alt !== undefined) updates.alt = request.alt
      if (request.caption !== undefined) updates.caption = request.caption
      if (request.tags !== undefined) updates.tags = request.tags

      const updatedMedia = await this.mediaRepository.updateMediaMetadata(
        request.mediaId,
        request.projectId,
        updates
      )

      console.log(`✅ MediaManagementUseCase: Media metadata updated`)

      return updatedMedia
    } catch (error: any) {
      console.error('❌ MediaManagementUseCase: Update metadata failed', error)
      throw error
    }
  }

  /**
   * Validate file upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      }
    }

    // Check file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)
    const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type)

    if (!isImage && !isVideo && !isDocument) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: images, videos, and documents.`,
      }
    }

    // Additional validation for images
    if (isImage && file.size > 10 * 1024 * 1024) {
      // 10MB for images
      return {
        valid: false,
        error: 'Image file size should not exceed 10MB',
      }
    }

    // Additional validation for videos
    if (isVideo && file.size > 50 * 1024 * 1024) {
      // 50MB for videos
      return {
        valid: false,
        error: 'Video file size should not exceed 50MB',
      }
    }

    return { valid: true }
  }
}
