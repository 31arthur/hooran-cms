/**
 * StagedMediaUpload Component
 *
 * Handles media file selection and preview WITHOUT immediate upload.
 * Files are staged locally and only uploaded when explicitly committed.
 * This is used in forms where media should only be uploaded on form save.
 *
 * Usage:
 * ```tsx
 * <StagedMediaUpload
 *   onFileSelected={(file) => console.log('File selected:', file)}
 *   accept="image/*"
 *   maxSize={10 * 1024 * 1024}
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
}

interface StagedMediaUploadProps {
  /**
   * Callback when file is selected (but NOT uploaded yet)
   */
  onFileSelected?: (stagedFile: StagedFile) => void

  /**
   * Callback when file selection is cleared
   */
  onClear?: () => void

  /**
   * Accepted file types (e.g., "image/*", "video/*", ".pdf")
   */
  accept?: string

  /**
   * Maximum file size in bytes (default: 10MB)
   */
  maxSize?: number

  /**
   * Custom className for styling
   */
  className?: string

  /**
   * Show preview after selection
   */
  showPreview?: boolean

  /**
   * Initial file if editing
   */
  initialFile?: StagedFile | null

  /**
   * Disabled state
   */
  disabled?: boolean
}

export function StagedMediaUpload({
  onFileSelected,
  onClear,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = '',
  showPreview = true,
  initialFile = null,
  disabled = false,
}: StagedMediaUploadProps) {
  const [stagedFile, setStagedFile] = useState<StagedFile | null>(initialFile)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Validate file before staging
   */
  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${(maxSize / (1024 * 1024)).toFixed(1)}MB limit`
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
        return `File type not accepted. Accepted: ${accept}`
      }
    }

    return null
  }

  /**
   * Handle file selection
   */
  const handleFileSelect = async (file: File) => {
    setError(null)

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
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
    }

    setStagedFile(staged)

    if (onFileSelected) {
      onFileSelected(staged)
    }
  }

  /**
   * Handle file input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
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
      handleFileSelect(files[0])
    }
  }

  /**
   * Clear selected file
   */
  const handleClear = () => {
    // Revoke object URL to free memory
    if (stagedFile?.preview) {
      URL.revokeObjectURL(stagedFile.preview)
    }

    setStagedFile(null)
    setError(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (onClear) {
      onClear()
    }
  }

  /**
   * Render file type icon
   */
  const renderIcon = () => {
    if (!stagedFile) return <Upload className="w-12 h-12 text-gray-400" />

    if (stagedFile.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-[#20B2AA]" />
    }
    if (stagedFile.type.startsWith('video/')) {
      return <Video className="w-8 h-8 text-[#20B2AA]" />
    }
    return <FileText className="w-8 h-8 text-[#20B2AA]" />
  }

  /**
   * Format file size
   */
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      {!stagedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-[#20B2AA] bg-[#20B2AA]/5'
              : 'border-gray-300 hover:border-[#20B2AA] hover:bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {renderIcon()}
          <p className="mt-3 text-sm text-gray-600">
            <span className="font-medium text-[#20B2AA]">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {accept || 'Any file type'} • Max {(maxSize / (1024 * 1024)).toFixed(0)}MB
          </p>
          <p className="mt-2 text-xs text-amber-600 font-medium">
            ⚠ File will be uploaded when you save the record
          </p>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4">
          {showPreview && stagedFile.preview && (
            <div className="mb-3">
              <img
                src={stagedFile.preview}
                alt={stagedFile.name}
                className="w-full h-48 object-cover rounded"
              />
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">{renderIcon()}</div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{stagedFile.name}</p>
              <p className="text-xs text-gray-500">{formatSize(stagedFile.size)}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                  Staged for upload
                </span>
              </div>
            </div>

            <button
              onClick={handleClear}
              disabled={disabled}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Remove file"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
