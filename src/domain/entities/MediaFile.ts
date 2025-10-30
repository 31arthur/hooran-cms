/**
 * Media File Entity
 *
 * Domain entity representing a media file (image, video, document) in the CMS.
 * This is a clean, database-agnostic representation.
 *
 * **Framework Independence:**
 * Contains NO Firebase-specific types. All fields use native JavaScript types.
 */

/**
 * Media file type
 */
export type MediaType = 'image' | 'video' | 'document' | 'audio' | 'other'

/**
 * Media file metadata
 */
export interface MediaMetadata {
  /**
   * Original filename
   */
  originalName: string

  /**
   * File size in bytes
   */
  size: number

  /**
   * MIME type (e.g., 'image/jpeg', 'video/mp4')
   */
  mimeType: string

  /**
   * Image/video dimensions (optional)
   */
  width?: number
  height?: number

  /**
   * Video duration in seconds (optional)
   */
  duration?: number

  /**
   * Additional custom metadata
   */
  custom?: Record<string, any>
}

/**
 * Media file entity
 */
export interface MediaFile {
  /**
   * Unique identifier
   */
  id: string

  /**
   * Project this media belongs to
   */
  projectId: string

  /**
   * Media type
   */
  type: MediaType

  /**
   * Public URL to access the file
   */
  url: string

  /**
   * Storage path (internal reference)
   */
  storagePath: string

  /**
   * File metadata
   */
  metadata: MediaMetadata

  /**
   * User who uploaded the file
   */
  uploadedBy: string

  /**
   * Upload timestamp
   */
  uploadedAt: Date

  /**
   * Alternative text for accessibility (images)
   */
  alt?: string

  /**
   * Caption or description
   */
  caption?: string

  /**
   * Tags for organization
   */
  tags?: string[]
}

/**
 * Media upload result
 */
export interface MediaUploadResult {
  /**
   * Uploaded media file information
   */
  file: MediaFile

  /**
   * Upload success status
   */
  success: boolean

  /**
   * Error message if upload failed
   */
  error?: string
}

/**
 * Input for uploading media
 */
export interface UploadMediaInput {
  /**
   * File to upload
   */
  file: File

  /**
   * Project ID
   */
  projectId: string

  /**
   * User uploading the file
   */
  userId: string

  /**
   * Optional alternative text
   */
  alt?: string

  /**
   * Optional caption
   */
  caption?: string

  /**
   * Optional tags
   */
  tags?: string[]

  /**
   * Custom folder path (optional)
   */
  folderPath?: string
}

/**
 * Input for deleting media
 */
export interface DeleteMediaInput {
  /**
   * Media file ID
   */
  mediaId: string

  /**
   * User deleting the file
   */
  userId: string

  /**
   * Project ID for validation
   */
  projectId: string
}
