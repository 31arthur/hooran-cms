/**
 * MediaPreview Component
 *
 * Displays uploaded media files with appropriate preview based on type:
 * - Images: Full image with zoom support
 * - Videos: Video player with controls
 * - Documents: Icon with download link
 *
 * Usage:
 * ```tsx
 * <MediaPreview
 *   file={mediaFile}
 *   size="medium"
 *   showMetadata={true}
 * />
 * ```
 */

import { useState } from 'react'
import {
  Image,
  Video,
  FileText,
  Download,
  ExternalLink,
  ZoomIn,
  X,
} from 'lucide-react'
import type { MediaFile } from '@/domain/entities/MediaFile'

interface MediaPreviewProps {
  /**
   * Media file to preview
   */
  file: MediaFile

  /**
   * Preview size
   */
  size?: 'small' | 'medium' | 'large' | 'full'

  /**
   * Show file metadata (filename, size, upload date)
   */
  showMetadata?: boolean

  /**
   * Allow opening in new tab
   */
  allowOpenInNewTab?: boolean

  /**
   * Allow download
   */
  allowDownload?: boolean

  /**
   * Show zoom for images
   */
  allowZoom?: boolean

  /**
   * Custom className
   */
  className?: string

  /**
   * Click handler
   */
  onClick?: () => void
}

export function MediaPreview({
  file,
  size = 'medium',
  showMetadata = true,
  allowOpenInNewTab = true,
  allowDownload = true,
  allowZoom = true,
  className = '',
  onClick,
}: MediaPreviewProps) {
  const [isZoomed, setIsZoomed] = useState(false)

  /**
   * Get size classes
   */
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'h-24'
      case 'medium':
        return 'h-48'
      case 'large':
        return 'h-64'
      case 'full':
        return 'h-96'
      default:
        return 'h-48'
    }
  }

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  /**
   * Format date
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  /**
   * Get icon based on media type
   */
  const getMediaIcon = () => {
    switch (file.type) {
      case 'image':
        return <Image className="w-12 h-12 text-blue-500" />
      case 'video':
        return <Video className="w-12 h-12 text-purple-500" />
      case 'document':
        return <FileText className="w-12 h-12 text-green-500" />
      default:
        return <FileText className="w-12 h-12 text-gray-500" />
    }
  }

  /**
   * Download file
   */
  const handleDownload = async () => {
    try {
      const response = await fetch(file.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.metadata.originalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <>
      <div
        className={`relative rounded-lg overflow-hidden border bg-gray-50 ${className}`}
        onClick={onClick}
      >
        {/* Preview Content */}
        <div className={`relative ${getSizeClasses()}`}>
          {/* Image Preview */}
          {file.type === 'image' && (
            <div className="relative w-full h-full group">
              <img
                src={file.url}
                alt={file.alt || file.metadata.originalName}
                className="w-full h-full object-cover"
              />

              {/* Image Actions Overlay */}
              {allowZoom && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsZoomed(true)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-full hover:bg-gray-100"
                    title="Zoom"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Video Preview */}
          {file.type === 'video' && (
            <video
              src={file.url}
              controls
              className="w-full h-full object-cover"
            >
              Your browser does not support the video tag.
            </video>
          )}

          {/* Document Preview */}
          {file.type === 'document' && (
            <div className="flex flex-col items-center justify-center h-full space-y-3 p-4">
              {getMediaIcon()}
              <p className="text-sm text-gray-600 text-center truncate w-full">
                {file.metadata.originalName}
              </p>
            </div>
          )}

          {/* Audio Preview */}
          {file.type === 'audio' && (
            <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
              {getMediaIcon()}
              <audio src={file.url} controls className="w-full">
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}
        </div>

        {/* Metadata */}
        {showMetadata && (
          <div className="p-3 bg-white border-t space-y-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.metadata.originalName}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatFileSize(file.metadata.size)}</span>
                <span>{formatDate(file.uploadedAt)}</span>
              </div>
            </div>

            {/* Caption */}
            {file.caption && (
              <p className="text-xs text-gray-600 italic">{file.caption}</p>
            )}

            {/* Tags */}
            {file.tags && file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {file.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t">
              {allowOpenInNewTab && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(file.url, '_blank')
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open</span>
                </button>
              )}

              {allowDownload && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload()
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Download"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Zoomed Image Modal */}
      {isZoomed && file.type === 'image' && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={file.url}
            alt={file.alt || file.metadata.originalName}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
