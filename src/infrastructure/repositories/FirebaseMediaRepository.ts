/**
 * Firebase Media Repository Implementation
 *
 * Implements IMediaRepository using Firebase Storage and Firestore.
 *
 * **Storage Structure:**
 * Firebase Storage:
 *   projects/{projectId}/media/{type}/{timestamp}_{filename}
 *
 * Firestore Collection:
 *   media/
 *     {mediaId}/
 *       - id, projectId, type, url, storagePath, metadata, uploadedBy, uploadedAt, alt, caption, tags
 *
 * **Design:**
 * - Files stored in Firebase Storage
 * - Metadata stored in Firestore for querying
 * - Automatic thumbnail generation for images (optional)
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp,
  orderBy,
} from 'firebase/firestore'
import { storage, db } from '@/firebase/config'
import type { IMediaRepository } from '@/domain/repositories/IMediaRepository'
import type {
  MediaFile,
  MediaUploadResult,
  UploadMediaInput,
  DeleteMediaInput,
  MediaType,
  MediaMetadata,
} from '@/domain/entities/MediaFile'

export class FirebaseMediaRepository implements IMediaRepository {
  private readonly collectionName = 'media'

  /**
   * Upload a single media file
   */
  async uploadFile(input: UploadMediaInput): Promise<MediaUploadResult> {
    try {
      console.log(`📤 FirebaseMediaRepository: Uploading file ${input.file.name}`)

      // Generate unique ID
      const mediaId = doc(collection(db, this.collectionName)).id

      // Determine media type
      const mediaType = this.getMediaType(input.file.type)

      // Generate storage path
      const timestamp = Date.now()
      const sanitizedFileName = this.sanitizeFileName(input.file.name)
      const folderPath = input.folderPath || mediaType
      const storagePath = `projects/${input.projectId}/media/${folderPath}/${timestamp}_${sanitizedFileName}`

      // Create storage reference
      const storageRef = ref(storage, storagePath)

      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, input.file, {
        contentType: input.file.type,
        customMetadata: {
          uploadedBy: input.userId,
          projectId: input.projectId,
          mediaId: mediaId,
        },
      })

      // Wait for upload to complete
      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            console.log(`Upload progress: ${progress.toFixed(2)}%`)
          },
          (error) => reject(error),
          () => resolve(uploadTask.snapshot)
        )
      })

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Get file metadata for dimensions (if image)
      const metadata: MediaMetadata = {
        originalName: input.file.name,
        size: input.file.size,
        mimeType: input.file.type,
      }

      // For images, try to get dimensions
      if (mediaType === 'image') {
        try {
          const dimensions = await this.getImageDimensions(input.file)
          metadata.width = dimensions.width
          metadata.height = dimensions.height
        } catch (err) {
          console.warn('Could not get image dimensions:', err)
        }
      }

      // Create media file entity
      const now = new Date()
      const mediaFile: MediaFile = {
        id: mediaId,
        projectId: input.projectId,
        type: mediaType,
        url: downloadURL,
        storagePath: storagePath,
        metadata: metadata,
        uploadedBy: input.userId,
        uploadedAt: now,
        alt: input.alt,
        caption: input.caption,
        tags: input.tags || [],
      }

      // Save metadata to Firestore
      await setDoc(doc(db, this.collectionName, mediaId), {
        ...mediaFile,
        uploadedAt: Timestamp.fromDate(now),
      })

      console.log(`✅ FirebaseMediaRepository: File uploaded successfully - ${mediaId}`)

      return {
        file: mediaFile,
        success: true,
      }
    } catch (error: any) {
      console.error('❌ FirebaseMediaRepository: Upload failed', error)
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
  async uploadMultiple(inputs: UploadMediaInput[]): Promise<MediaUploadResult[]> {
    console.log(`📤 FirebaseMediaRepository: Uploading ${inputs.length} files`)

    // Upload all files in parallel
    const uploadPromises = inputs.map((input) => this.uploadFile(input))
    const results = await Promise.all(uploadPromises)

    const successCount = results.filter((r) => r.success).length
    console.log(`✅ FirebaseMediaRepository: ${successCount}/${inputs.length} files uploaded successfully`)

    return results
  }

  /**
   * Delete a media file
   */
  async deleteFile(input: DeleteMediaInput): Promise<void> {
    try {
      console.log(`🗑️ FirebaseMediaRepository: Deleting media ${input.mediaId}`)

      // Get media metadata
      const mediaDoc = await getDoc(doc(db, this.collectionName, input.mediaId))

      if (!mediaDoc.exists()) {
        throw new Error('Media file not found')
      }

      const mediaData = mediaDoc.data()

      // Validate project ownership
      if (mediaData.projectId !== input.projectId) {
        throw new Error('Media does not belong to this project')
      }

      // Delete from Storage
      const storageRef = ref(storage, mediaData.storagePath)
      await deleteObject(storageRef)

      // Delete from Firestore
      await deleteDoc(doc(db, this.collectionName, input.mediaId))

      console.log(`✅ FirebaseMediaRepository: Media deleted successfully`)
    } catch (error: any) {
      console.error('❌ FirebaseMediaRepository: Delete failed', error)
      throw new Error(`Failed to delete media: ${error.message}`)
    }
  }

  /**
   * Delete multiple media files
   */
  async deleteMultiple(inputs: DeleteMediaInput[]): Promise<void> {
    console.log(`🗑️ FirebaseMediaRepository: Deleting ${inputs.length} files`)

    const deletePromises = inputs.map((input) => this.deleteFile(input))
    await Promise.all(deletePromises)

    console.log(`✅ FirebaseMediaRepository: All files deleted successfully`)
  }

  /**
   * Get media file by ID
   */
  async getMediaById(mediaId: string, projectId: string): Promise<MediaFile | null> {
    try {
      const mediaDoc = await getDoc(doc(db, this.collectionName, mediaId))

      if (!mediaDoc.exists()) {
        return null
      }

      const data = mediaDoc.data()

      // Validate project ownership
      if (data.projectId !== projectId) {
        return null
      }

      return this.convertToMediaFile(data)
    } catch (error: any) {
      console.error('❌ FirebaseMediaRepository: Failed to get media', error)
      throw new Error(`Failed to get media: ${error.message}`)
    }
  }

  /**
   * Get all media files for a project
   */
  async getMediaByProject(projectId: string, type?: MediaType): Promise<MediaFile[]> {
    try {
      const constraints: any[] = [
        where('projectId', '==', projectId),
        orderBy('uploadedAt', 'desc'),
      ]

      if (type) {
        constraints.push(where('type', '==', type))
      }

      const q = query(collection(db, this.collectionName), ...constraints)
      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => this.convertToMediaFile(doc.data()))
    } catch (error: any) {
      console.error('❌ FirebaseMediaRepository: Failed to get media by project', error)
      throw new Error(`Failed to get media: ${error.message}`)
    }
  }

  /**
   * Get media files by user
   */
  async getMediaByUser(projectId: string, userId: string): Promise<MediaFile[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('projectId', '==', projectId),
        where('uploadedBy', '==', userId),
        orderBy('uploadedAt', 'desc')
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => this.convertToMediaFile(doc.data()))
    } catch (error: any) {
      console.error('❌ FirebaseMediaRepository: Failed to get media by user', error)
      throw new Error(`Failed to get media: ${error.message}`)
    }
  }

  /**
   * Get media URL
   */
  async getMediaUrl(storagePath: string): Promise<string> {
    try {
      const storageRef = ref(storage, storagePath)
      return await getDownloadURL(storageRef)
    } catch (error: any) {
      console.error('❌ FirebaseMediaRepository: Failed to get media URL', error)
      throw new Error(`Failed to get media URL: ${error.message}`)
    }
  }

  /**
   * Update media metadata
   */
  async updateMediaMetadata(
    mediaId: string,
    projectId: string,
    updates: Partial<Pick<MediaFile, 'alt' | 'caption' | 'tags'>>
  ): Promise<MediaFile> {
    try {
      const mediaRef = doc(db, this.collectionName, mediaId)
      const mediaDoc = await getDoc(mediaRef)

      if (!mediaDoc.exists()) {
        throw new Error('Media file not found')
      }

      const data = mediaDoc.data()

      if (data.projectId !== projectId) {
        throw new Error('Media does not belong to this project')
      }

      await updateDoc(mediaRef, updates)

      const updatedDoc = await getDoc(mediaRef)
      return this.convertToMediaFile(updatedDoc.data()!)
    } catch (error: any) {
      console.error('❌ FirebaseMediaRepository: Failed to update media metadata', error)
      throw new Error(`Failed to update metadata: ${error.message}`)
    }
  }

  /**
   * Check if media exists
   */
  async mediaExists(mediaId: string, projectId: string): Promise<boolean> {
    try {
      const media = await this.getMediaById(mediaId, projectId)
      return media !== null
    } catch (error) {
      return false
    }
  }

  /**
   * Helper: Get media type from MIME type
   */
  private getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text') ||
      mimeType.includes('msword') ||
      mimeType.includes('spreadsheet')
    ) {
      return 'document'
    }
    return 'other'
  }

  /**
   * Helper: Sanitize file name
   */
  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  }

  /**
   * Helper: Get image dimensions
   */
  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: img.width, height: img.height })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Helper: Convert Firestore data to MediaFile entity
   */
  private convertToMediaFile(data: any): MediaFile {
    return {
      id: data.id,
      projectId: data.projectId,
      type: data.type,
      url: data.url,
      storagePath: data.storagePath,
      metadata: data.metadata,
      uploadedBy: data.uploadedBy,
      uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(data.uploadedAt),
      alt: data.alt,
      caption: data.caption,
      tags: data.tags || [],
    }
  }
}
