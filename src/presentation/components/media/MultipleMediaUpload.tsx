/**
 * MultipleMediaUpload Component
 *
 * Multiple file upload component with:
 * - Gallery view with thumbnails
 * - Drag and drop support for multiple files
 * - Individual file removal
 * - Batch upload progress
 * - Image/video previews
 * - Reordering support
 *
 * Usage:
 * ```tsx
 * <MultipleMediaUpload
 *   onUploadComplete={(files) => console.log('Uploaded:', files)}
 *   accept="image/*"
 *   maxFiles={10}
 * />
 * ```
 */

import React, { useState, useRef } from 'react'
import { Upload, X, Image, Video, FileText, Loader2 } from 'lucide-react'
import { useMediaManagement } from '@/presentation/hooks/useCMSServices'
import { useProject } from '@/presentation/context/ProjectContext'
import { useAuth } from '@/presentation/context/AuthContext'
import type { MediaFile } from '@/domain/entities/MediaFile'

interface MultipleMediaUploadProps {
  /**
   * Callback when all uploads complete successfully
   */
  onUploadComplete?: (files: MediaFile[]) => void

  /**
   * Callback when upload fails
   */
  onUploadError?: (error: string) => void

  /**
   * Callback when files change (added/removed)
   */
  onChange?: (files: MediaFile[]) => void

  /**
   * Accepted file types (e.g., "image/*", "video/*", ".pdf")
   */
  accept?: string

  /**
   * Maximum file size in bytes per file (default: 10MB)
   */
  maxSize?: number

  /**
   * Maximum number of files (default: 10)
   */
  maxFiles?: number

  /**
   * Initial files to display
   */
  initialFiles?: MediaFile[]

  /**
   * Custom folder path in Firebase Storage
   */
  folderPath?: string

  /**
   * Custom className for styling
   */
  className?: string

  /**
   * Layout mode
   */
  layout?: 'grid' | 'list'
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
  preview?: string
}

export function MultipleMediaUpload({
  onUploadComplete,
  onUploadError,
  onChange,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  initialFiles = [],
  folderPath,
  className = '',
  layout = 'grid',
}: MultipleMediaUploadProps) {
  const mediaManagement = useMediaManagement()
  const { selectedProject } = useProject()
  const { currentUser, userRole } = useAuth()

  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>(initialFiles)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Handle file selection
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    await uploadFiles(files)
  }

  /**
   * Upload multiple files
   */
  const uploadFiles = async (files: File[]) => {
    setError(null)

    // Check max files limit
    const remainingSlots = maxFiles - uploadedFiles.length - uploadingFiles.length
    if (files.length > remainingSlots) {
      setError(`Maximum ${maxFiles} files allowed. ${remainingSlots} slots remaining.`)
      if (onUploadError) {
        onUploadError(`Maximum ${maxFiles} files allowed`)
      }
      return
    }

    try {
      // Validate project and user
      if (!selectedProject) {
        throw new Error('No project selected')
      }

      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      // Validate file sizes
      const oversizedFiles = files.filter((file) => file.size > maxSize)
      if (oversizedFiles.length > 0) {
        throw new Error(
          `${oversizedFiles.length} file(s) exceed ${maxSize / (1024 * 1024)}MB limit`
        )
      }

      // Create uploading entries with previews
      const newUploadingFiles: UploadingFile[] = files.map((file) => {
        const preview =
          file.type.startsWith('image/') || file.type.startsWith('video/')
            ? URL.createObjectURL(file)
            : undefined

        return {
          file,
          progress: 0,
          preview,
        }
      })

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles])

      // Upload files in parallel
      const uploadPromises = files.map(async (file) => {
        try {
          const result = await mediaManagement.uploadMedia({
            file,
            projectId: selectedProject.projectId,
            userId: currentUser.uid,
            userRole: userRole || 'User',
            folderPath,
          })

          if (!result.success) {
            throw new Error(result.error || 'Upload failed')
          }

          // Update progress
          setUploadingFiles((prev) =>
            prev.map((uf) =>
              uf.file === file ? { ...uf, progress: 100 } : uf
            )
          )

          return result.file
        } catch (err) {
          // Mark file as error
          setUploadingFiles((prev) =>
            prev.map((uf) =>
              uf.file === file
                ? {
                    ...uf,
                    error: err instanceof Error ? err.message : 'Upload failed',
                  }
                : uf
            )
          )
          throw err
        }
      })

      // Wait for all uploads
      const results = await Promise.allSettled(uploadPromises)

      // Extract successful uploads
      const successfulUploads = results
        .filter((result): result is PromiseFulfilledResult<MediaFile> => result.status === 'fulfilled')
        .map((result) => result.value)

      // Extract errors
      const errors = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => result.reason)

      if (errors.length > 0) {
        console.error('Some uploads failed:', errors)
        if (onUploadError) {
          onUploadError(`${errors.length} file(s) failed to upload`)
        }
      }

      // Update uploaded files
      const newUploadedFiles = [...uploadedFiles, ...successfulUploads]
      setUploadedFiles(newUploadedFiles)

      // Clean up uploading files
      setTimeout(() => {
        setUploadingFiles((prev) =>
          prev.filter((uf) => !files.includes(uf.file))
        )

        // Clean up preview URLs
        newUploadingFiles.forEach((uf) => {
          if (uf.preview) {
            URL.revokeObjectURL(uf.preview)
          }
        })
      }, 500)

      // Call callbacks
      if (onChange) {
        onChange(newUploadedFiles)
      }

      if (successfulUploads.length > 0 && onUploadComplete) {
        onUploadComplete(successfulUploads)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)

      if (onUploadError) {
        onUploadError(errorMessage)
      }
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

    const files = Array.from(event.dataTransfer.files)
    if (files.length === 0) return

    await uploadFiles(files)
  }

  /**
   * Remove uploaded file
   */
  const handleRemove = async (mediaFile: MediaFile) => {
    if (!selectedProject) return

    try {
      await mediaManagement.deleteMedia({
        mediaId: mediaFile.id,
        projectId: selectedProject.projectId,
        userId: currentUser?.uid || '',
        userRole: userRole || 'User',
      })

      const newFiles = uploadedFiles.filter((f) => f.id !== mediaFile.id)
      setUploadedFiles(newFiles)

      if (onChange) {
        onChange(newFiles)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
    }
  }

  /**
   * Get icon based on media type
   */
  const getMediaIcon = (type: string) => {
    if (type === 'image') return <Image className="w-6 h-6" />
    if (type === 'video') return <Video className="w-6 h-6" />
    return <FileText className="w-6 h-6" />
  }

  const canAddMore = uploadedFiles.length + uploadingFiles.length < maxFiles

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
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
            multiple
          />

          <div className="space-y-3">
            <Upload className="w-10 h-10 mx-auto text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Maximum {maxFiles} files, {maxSize / (1024 * 1024)}MB per file
              </p>
              <p className="text-xs text-gray-500">
                {uploadedFiles.length} / {maxFiles} files uploaded
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {uploadedFiles.length > 0 && (
        <div
          className={
            layout === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'
              : 'space-y-2'
          }
        >
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="relative group border rounded-lg overflow-hidden bg-gray-50 hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => handleRemove(file)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Image Preview */}
              {file.type === 'image' && (
                <img
                  src={file.url}
                  alt={file.alt || file.metadata.originalName}
                  className="w-full h-32 object-cover"
                />
              )}

              {/* Video Preview */}
              {file.type === 'video' && (
                <video
                  src={file.url}
                  className="w-full h-32 object-cover"
                />
              )}

              {/* Document Preview */}
              {file.type === 'document' && (
                <div className="flex items-center justify-center h-32 bg-gray-100">
                  {getMediaIcon(file.type)}
                </div>
              )}

              {/* File Info */}
              <div className="p-2 bg-white border-t">
                <p className="text-xs text-gray-900 truncate font-medium">
                  {file.metadata.originalName}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.metadata.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Uploading...</p>
          <div className="space-y-2">
            {uploadingFiles.map((uf, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
              >
                {uf.preview ? (
                  <img
                    src={uf.preview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded">
                    <FileText className="w-6 h-6 text-gray-500" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{uf.file.name}</p>
                  {uf.error ? (
                    <p className="text-xs text-red-600">{uf.error}</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${uf.progress}%` }}
                        />
                      </div>
                      {uf.progress < 100 && (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {uploadedFiles.length === 0 && uploadingFiles.length === 0 && !canAddMore && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No files uploaded yet</p>
        </div>
      )}
    </div>
  )
}
