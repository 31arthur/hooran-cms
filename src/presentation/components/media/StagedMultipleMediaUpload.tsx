/**
 * StagedMultipleMediaUpload Component
 *
 * Handles multiple media file selection and preview WITHOUT immediate upload.
 * Files are staged locally and only uploaded when explicitly committed.
 * This is used in forms where media should only be uploaded on form save.
 *
 * Usage:
 * ```tsx
 * <StagedMultipleMediaUpload
 *   onFilesChanged={(files) => console.log('Files staged:', files)}
 *   accept="image/*"
 *   maxFiles={5}
 * />
 * ```
 */

import React, { useState, useRef } from 'react'
import { Upload, X, Image, Video, FileText } from 'lucide-react'

export interface StagedFile {
  file: File
  preview: string | null
  name: string
  size: number
  type: string
  id: string // Unique ID for tracking
}

interface StagedMultipleMediaUploadProps {
  /**
   * Callback when files change (added or removed)
   */
  onFilesChanged?: (stagedFiles: StagedFile[]) => void

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
   * Custom className for styling
   */
  className?: string

  /**
   * Layout style
   */
  layout?: 'grid' | 'list'

  /**
   * Initial files if editing
   */
  initialFiles?: StagedFile[]

  /**
   * Disabled state
   */
  disabled?: boolean
}

export function StagedMultipleMediaUpload({
  onFilesChanged,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  className = '',
  layout = 'grid',
  initialFiles = [],
  disabled = false,
}: StagedMultipleMediaUploadProps) {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>(initialFiles)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Validate file before staging
   */
  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File "${file.name}" exceeds ${(maxSize / (1024 * 1024)).toFixed(1)}MB limit`
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map((t) => t.trim())
      const matchesType = acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', ''))
        }
        return file.type === type
      })

      if (!matchesType) {
        return `File "${file.name}" type not accepted. Accepted: ${accept}`
      }
    }

    return null
  }

  /**
   * Handle file selection
   */
  const handleFileSelect = async (files: FileList) => {
    setError(null)

    // Check if adding files would exceed maxFiles
    if (stagedFiles.length + files.length > maxFiles) {
      setError(`Cannot add more than ${maxFiles} files`)
      return
    }

    const newStagedFiles: StagedFile[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate file
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        continue
      }

      // Create preview for images
      let preview: string | null = null
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      const staged: StagedFile = {
        file,
        preview,
        name: file.name,
        size: file.size,
        type: file.type,
        id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      }

      newStagedFiles.push(staged)
    }

    const updated = [...stagedFiles, ...newStagedFiles]
    setStagedFiles(updated)

    if (onFilesChanged) {
      onFilesChanged(updated)
    }
  }

  /**
   * Handle file input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  /**
   * Handle drag events
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  /**
   * Remove a file
   */
  const handleRemove = (id: string) => {
    const fileToRemove = stagedFiles.find((f) => f.id === id)

    // Revoke object URL to free memory
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }

    const updated = stagedFiles.filter((f) => f.id !== id)
    setStagedFiles(updated)

    if (onFilesChanged) {
      onFilesChanged(updated)
    }
  }

  /**
   * Clear all files
   */
  const handleClearAll = () => {
    // Revoke all object URLs
    stagedFiles.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })

    setStagedFiles([])
    setError(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (onFilesChanged) {
      onFilesChanged([])
    }
  }

  /**
   * Render file type icon
   */
  const renderIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-[#20B2AA]" />
    }
    if (type.startsWith('video/')) {
      return <Video className="w-5 h-5 text-[#20B2AA]" />
    }
    return <FileText className="w-5 h-5 text-[#20B2AA]" />
  }

  /**
   * Format file size
   */
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const canAddMore = stagedFiles.length < maxFiles

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
        multiple
      />

      {/* Upload Zone */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-4 ${
            isDragging
              ? 'border-[#20B2AA] bg-[#20B2AA]/5'
              : 'border-gray-300 hover:border-[#20B2AA] hover:bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Upload className="w-10 h-10 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-[#20B2AA]">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {accept || 'Any file type'} • Max {(maxSize / (1024 * 1024)).toFixed(0)}MB per file
          </p>
          <p className="text-xs text-gray-500">
            {stagedFiles.length} / {maxFiles} files selected
          </p>
          <p className="mt-2 text-xs text-amber-600 font-medium">
            ⚠ Files will be uploaded when you save the record
          </p>
        </div>
      )}

      {/* Files List */}
      {stagedFiles.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              Staged Files ({stagedFiles.length})
            </p>
            <button
              onClick={handleClearAll}
              disabled={disabled}
              className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>

          <div
            className={
              layout === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 gap-3'
                : 'space-y-2'
            }
          >
            {stagedFiles.map((stagedFile) => (
              <div
                key={stagedFile.id}
                className="border border-gray-300 rounded-lg p-3 group relative"
              >
                {/* Preview for images */}
                {stagedFile.preview && layout === 'grid' && (
                  <div className="mb-2">
                    <img
                      src={stagedFile.preview}
                      alt={stagedFile.name}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}

                {/* File Info */}
                <div className="flex items-start gap-2">
                  {layout === 'list' && stagedFile.preview && (
                    <img
                      src={stagedFile.preview}
                      alt={stagedFile.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  {(!stagedFile.preview || layout === 'grid') && (
                    <div className="flex-shrink-0">{renderIcon(stagedFile.type)}</div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {stagedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatSize(stagedFile.size)}</p>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 mt-1">
                      Staged
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(stagedFile.id)
                    }}
                    disabled={disabled}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                    title="Remove file"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
