/**
 * MediaUpload Component
 *
 * Single file upload component with:
 * - File validation and type checking
 * - Upload progress indicator
 * - Image/video preview
 * - Error handling
 * - Drag and drop support
 *
 * Usage:
 * ```tsx
 * <MediaUpload
 *   onUploadComplete={(mediaFile) => console.log('Uploaded:', mediaFile)}
 *   accept="image/*"
 *   maxSize={10 * 1024 * 1024}
 * />
 * ```
 */

import React, { useState, useRef } from 'react'
import { Upload, X, Image, Video, FileText, Loader2 } from 'lucide-react'
import { useMediaManagement } from '@/presentation/hooks/useCMSServices'
import { useProject } from '@/presentation/context/ProjectContext'
import { useAuth } from '@/presentation/context/AuthContext'
import type { MediaFile } from '@/domain/entities/MediaFile'

interface MediaUploadProps {
  /**
   * Callback when upload completes successfully
   */
  onUploadComplete?: (file: MediaFile) => void

  /**
   * Callback when upload fails
   */
  onUploadError?: (error: string) => void

  /**
   * Accepted file types (e.g., "image/*", "video/*", ".pdf")
   */
  accept?: string

  /**
   * Maximum file size in bytes (default: 10MB)
   */
  maxSize?: number

  /**
   * Alt text for the uploaded file (for images)
   */
  alt?: string

  /**
   * Caption for the uploaded file
   */
  caption?: string

  /**
   * Tags for categorization
   */
  tags?: string[]

  /**
   * Custom folder path in Firebase Storage
   */
  folderPath?: string

  /**
   * Custom className for styling
   */
  className?: string

  /**
   * Show preview after upload
   */
  showPreview?: boolean
}

export function MediaUpload({
  onUploadComplete,
  onUploadError,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  alt,
  caption,
  tags,
  folderPath,
  className = '',
  showPreview = true,
}: MediaUploadProps) {
  const mediaManagement = useMediaManagement()
  const { selectedProject } = useProject()
  const { currentUser, userRole } = useAuth()

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<MediaFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Handle file selection
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await uploadFile(file)
  }

  /**
   * Upload file to Firebase Storage
   */
  const uploadFile = async (file: File) => {
    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Validate project and user
      if (!selectedProject) {
        throw new Error('No project selected')
      }

      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`)
      }

      // Create local preview for images/videos
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const objectUrl = URL.createObjectURL(file)
        setPreviewUrl(objectUrl)
      }

      // Upload using media management use case
      const result = await mediaManagement.uploadMedia({
        file,
        projectId: selectedProject.projectId,
        userId: currentUser.uid,
        userRole: userRole || 'User',
        alt,
        caption,
        tags,
        folderPath,
      })

      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadProgress(100)
      setUploadedFile(result.file)

      // Call success callback
      if (onUploadComplete) {
        onUploadComplete(result.file)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)

      // Call error callback
      if (onUploadError) {
        onUploadError(errorMessage)
      }

      // Clean up preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    } finally {
      setIsUploading(false)
    }
  }

  /**
   * Handle drag and drop events
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]
    if (!file) return

    await uploadFile(file)
  }

  /**
   * Remove uploaded file
   */
  const handleRemove = async () => {
    if (!uploadedFile || !selectedProject) return

    try {
      await mediaManagement.deleteMedia({
        mediaId: uploadedFile.id,
        projectId: selectedProject.projectId,
        userId: currentUser?.uid || '',
        userRole: userRole || 'User',
      })

      setUploadedFile(null)
      setPreviewUrl(null)
      setError(null)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
    }
  }

  /**
   * Get icon based on media type
   */
  const getMediaIcon = (type?: string) => {
    if (!type) return <FileText className="w-8 h-8" />

    if (type.startsWith('image/')) return <Image className="w-8 h-8" />
    if (type.startsWith('video/')) return <Video className="w-8 h-8" />
    return <FileText className="w-8 h-8" />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {!uploadedFile && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 mx-auto text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">
                  Drag and drop a file here, or click to browse
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum file size: {maxSize / (1024 * 1024)}MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {showPreview && uploadedFile && (
        <div className="relative border rounded-lg p-4 bg-gray-50">
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-3">
            {/* Image Preview */}
            {uploadedFile.type === 'image' && (
              <img
                src={uploadedFile.url}
                alt={uploadedFile.alt || 'Uploaded image'}
                className="w-full h-48 object-cover rounded"
              />
            )}

            {/* Video Preview */}
            {uploadedFile.type === 'video' && (
              <video
                src={uploadedFile.url}
                controls
                className="w-full h-48 rounded"
              />
            )}

            {/* Document Preview */}
            {uploadedFile.type === 'document' && (
              <div className="flex items-center justify-center p-8 bg-white rounded">
                {getMediaIcon(uploadedFile.metadata.mimeType)}
              </div>
            )}

            {/* File Info */}
            <div className="space-y-1 text-sm">
              <p className="font-medium text-gray-900 truncate">
                {uploadedFile.metadata.originalName}
              </p>
              <p className="text-gray-600">
                {(uploadedFile.metadata.size / 1024).toFixed(2)} KB
              </p>
              {uploadedFile.caption && (
                <p className="text-gray-600 italic">{uploadedFile.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
