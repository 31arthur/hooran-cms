/**
 * ExistingMediaDisplay Component
 *
 * Displays already-uploaded media files with the ability to remove them.
 * Used in edit mode to show what media is already attached to a record.
 *
 * Features:
 * - Shows thumbnails/previews of existing media
 * - X button in top-right corner to remove media
 * - Supports both single and multiple media display
 * - Works with grid or list layout
 */

import React from 'react'
import type { MediaFile } from '@/domain/entities/MediaFile'
import { X } from 'lucide-react'

interface ExistingMediaDisplayProps {
  /**
   * Array of existing media files to display
   */
  media: MediaFile[]

  /**
   * Callback when user clicks to remove a media file
   */
  onRemove: (mediaId: string) => void

  /**
   * Layout style
   */
  layout?: 'grid' | 'list'

  /**
   * Maximum number of items to show (for previews)
   */
  maxDisplay?: number

  /**
   * Whether to allow removal (shows X button)
   */
  allowRemove?: boolean
}

/**
 * Display a single media item with remove button
 */
const MediaItem: React.FC<{
  mediaFile: MediaFile
  onRemove: (mediaId: string) => void
  layout: 'grid' | 'list'
  allowRemove: boolean
}> = ({ mediaFile, onRemove, layout, allowRemove }) => {
  const isImage = mediaFile.type === 'image' || mediaFile.metadata.mimeType.startsWith('image/')
  const isVideo = mediaFile.type === 'video' || mediaFile.metadata.mimeType.startsWith('video/')

  if (layout === 'grid') {
    return (
      <div className="relative border border-gray-300 rounded-lg p-2 bg-white hover:border-primary-500 transition-colors">
        {/* Remove button */}
        {allowRemove && (
          <button
            type="button"
            onClick={() => onRemove(mediaFile.id)}
            className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
            aria-label="Remove media"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Preview */}
        <div className="mb-2">
          {isImage && (
            <img
              src={mediaFile.url}
              alt={mediaFile.alt || mediaFile.metadata.originalName}
              className="w-full h-32 object-cover rounded"
            />
          )}
          {isVideo && (
            <video
              src={mediaFile.url}
              className="w-full h-32 object-cover rounded"
              controls={false}
            />
          )}
          {!isImage && !isVideo && (
            <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-400 text-sm">
                {mediaFile.metadata.originalName.split('.').pop()?.toUpperCase() || 'FILE'}
              </span>
            </div>
          )}
        </div>

        {/* File info */}
        <div className="text-xs text-gray-600 truncate">
          {mediaFile.metadata.originalName}
        </div>
        <div className="text-xs text-gray-400">
          {(mediaFile.metadata.size / 1024 / 1024).toFixed(2)} MB
        </div>
      </div>
    )
  }

  // List layout
  return (
    <div className="relative flex items-center gap-3 border border-gray-300 rounded-lg p-2 bg-white hover:border-primary-500 transition-colors">
      {/* Remove button */}
      {allowRemove && (
        <button
          type="button"
          onClick={() => onRemove(mediaFile.id)}
          className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
          aria-label="Remove media"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Thumbnail */}
      <div className="flex-shrink-0">
        {isImage && (
          <img
            src={mediaFile.url}
            alt={mediaFile.alt || mediaFile.metadata.originalName}
            className="w-16 h-16 object-cover rounded"
          />
        )}
        {isVideo && (
          <video
            src={mediaFile.url}
            className="w-16 h-16 object-cover rounded"
            controls={false}
          />
        )}
        {!isImage && !isVideo && (
          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-400 text-xs">
              {mediaFile.metadata.originalName.split('.').pop()?.toUpperCase() || 'FILE'}
            </span>
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700 truncate">
          {mediaFile.metadata.originalName}
        </div>
        <div className="text-xs text-gray-500">
          {(mediaFile.metadata.size / 1024 / 1024).toFixed(2)} MB
        </div>
      </div>
    </div>
  )
}

/**
 * Main component to display existing media files
 */
export const ExistingMediaDisplay: React.FC<ExistingMediaDisplayProps> = ({
  media,
  onRemove,
  layout = 'grid',
  maxDisplay,
  allowRemove = true,
}) => {
  if (!media || media.length === 0) {
    return null
  }

  const displayMedia = maxDisplay ? media.slice(0, maxDisplay) : media
  const remainingCount = maxDisplay && media.length > maxDisplay ? media.length - maxDisplay : 0

  return (
    <div className="mb-4">
      <div className="text-sm font-medium text-gray-700 mb-2">
        Existing Media ({media.length})
      </div>

      {/* Media grid/list */}
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'
            : 'space-y-2'
        }
      >
        {displayMedia.map((mediaFile) => (
          <MediaItem
            key={mediaFile.id}
            mediaFile={mediaFile}
            onRemove={onRemove}
            layout={layout}
            allowRemove={allowRemove}
          />
        ))}
      </div>

      {/* Show "X more" if there are more items */}
      {remainingCount > 0 && (
        <div className="mt-2 text-sm text-gray-500">
          + {remainingCount} more file{remainingCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

export default ExistingMediaDisplay
