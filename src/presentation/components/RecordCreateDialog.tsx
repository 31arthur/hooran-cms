import React, { useState, useRef, useContext } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/presentation/components/ui/dialog'
import { Button } from '@/presentation/components/ui/button'
import { DynamicForm, type DynamicFormRef } from '@/presentation/components/DynamicForm'
import type { SchemaDefinition } from '@/domain/entities/SchemaDefinition'
import { useCMSServices } from '@/presentation/hooks/useCMSServices'
import { AuthContext } from '@/presentation/context/AuthContext'
import { ProjectContext } from '@/presentation/context/ProjectContext'
import { useToast } from '@/presentation/context/ToastContext'
import { Loader2, Upload } from 'lucide-react'
import type { StagedFile } from '@/presentation/components/media'

interface RecordCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schema: SchemaDefinition
  onRecordCreated?: (recordId: string) => void
}

export const RecordCreateDialog: React.FC<RecordCreateDialogProps> = ({
  open,
  onOpenChange,
  schema,
  onRecordCreated,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [stagedMediaFiles, setStagedMediaFiles] = useState<Record<string, StagedFile | StagedFile[]>>({})
  const formRef = useRef<DynamicFormRef>(null)

  const { contentManagement, mediaManagement } = useCMSServices()
  const authContext = useContext(AuthContext)
  const projectContext = useContext(ProjectContext)
  const { showToast } = useToast()

  // Type guards for context values
  const currentUser = authContext?.currentUser || null
  const userRole = authContext?.userRole || null
  const selectedProject = projectContext?.selectedProject || null

  const handleFormChange = (_data: Record<string, any>, stagedMedia?: Record<string, StagedFile | StagedFile[]>) => {
    if (stagedMedia) {
      setStagedMediaFiles(stagedMedia)
    }
  }

  /**
   * Remove undefined values from data object (Firestore doesn't support undefined)
   */
  const cleanData = (data: Record<string, any>): Record<string, any> => {
    const cleaned: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = value
      }
    }
    return cleaned
  }

  /**
   * Update progress for a specific staged file
   */
  const updateFileProgress = (fileId: string, progress: number, status: 'uploading' | 'uploaded' | 'error', error?: string) => {
    setStagedMediaFiles(prev => {
      const updated = { ...prev }
      for (const [fieldName, value] of Object.entries(updated)) {
        if (Array.isArray(value)) {
          updated[fieldName] = value.map(file =>
            file.id === fileId
              ? { ...file, uploadProgress: progress, uploadStatus: status, error }
              : file
          )
        } else if (value && value.id === fileId) {
          updated[fieldName] = { ...value, uploadProgress: progress, uploadStatus: status, error }
        }
      }
      return updated
    })
  }

  /**
   * Upload staged media files and return their IDs
   */
  const uploadStagedMedia = async (): Promise<Record<string, any>> => {
    const uploadedMediaIds: Record<string, any> = {}

    for (const [fieldName, stagedValue] of Object.entries(stagedMediaFiles)) {
      try {
        // Skip if no value
        if (!stagedValue) continue

        if (Array.isArray(stagedValue)) {
          // Multiple files
          setUploadProgress(`Uploading ${fieldName} (${stagedValue.length} files)...`)
          const mediaIds: string[] = []

          for (let i = 0; i < stagedValue.length; i++) {
            const staged = stagedValue[i]
            // Skip if staged object doesn't have file
            if (!staged || !staged.file) {
              console.warn(`Skipping invalid staged file in ${fieldName}`)
              continue
            }

            try {
              // Update status to uploading
              updateFileProgress(staged.id, 0, 'uploading')

              // Simulate progress (Firebase doesn't provide real-time progress)
              // Start at 10% and increment to 90% during upload
              updateFileProgress(staged.id, 10, 'uploading')

              const result = await mediaManagement.uploadMedia({
                file: staged.file,
                projectId: selectedProject!.projectId,
                userId: currentUser!.uid,
                userRole: userRole || 'User',
                alt: staged.name,
                caption: `Uploaded from ${schema.name}`,
                tags: [schema.name],
              })

              if (result.success && result.file) {
                mediaIds.push(result.file.id)
                // Mark as uploaded
                updateFileProgress(staged.id, 100, 'uploaded')
              } else {
                updateFileProgress(staged.id, 0, 'error', result.error || 'Upload failed')
                throw new Error(result.error || 'Upload failed')
              }
            } catch (error) {
              updateFileProgress(staged.id, 0, 'error', error instanceof Error ? error.message : 'Upload failed')
              throw error
            }
          }

          if (mediaIds.length > 0) {
            uploadedMediaIds[fieldName] = mediaIds
          }
        } else {
          // Single file
          // Verify stagedValue has file property
          if (!stagedValue.file) {
            console.warn(`Skipping invalid staged file in ${fieldName}`)
            continue
          }

          try {
            setUploadProgress(`Uploading ${fieldName}...`)
            updateFileProgress(stagedValue.id, 0, 'uploading')
            updateFileProgress(stagedValue.id, 10, 'uploading')

            const result = await mediaManagement.uploadMedia({
              file: stagedValue.file,
              projectId: selectedProject!.projectId,
              userId: currentUser!.uid,
              userRole: userRole || 'User',
              alt: stagedValue.name,
              caption: `Uploaded from ${schema.name}`,
              tags: [schema.name],
            })

            if (result.success && result.file) {
              uploadedMediaIds[fieldName] = result.file.id
              updateFileProgress(stagedValue.id, 100, 'uploaded')
            } else {
              updateFileProgress(stagedValue.id, 0, 'error', result.error || 'Upload failed')
              throw new Error(result.error || 'Upload failed')
            }
          } catch (error) {
            updateFileProgress(stagedValue.id, 0, 'error', error instanceof Error ? error.message : 'Upload failed')
            throw error
          }
        }
      } catch (error) {
        console.error(`Failed to upload media for field ${fieldName}:`, error)
        throw new Error(`Failed to upload ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return uploadedMediaIds
  }

  const handleSubmit = async () => {
    if (!formRef.current) return
    if (!currentUser) {
      showToast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'You must be logged in to create records',
      })
      return
    }

    if (!selectedProject) {
      showToast({
        variant: 'destructive',
        title: 'No Project Selected',
        description: 'Please select a project first',
      })
      return
    }

    // Validate form
    const validation = formRef.current.validateForm()
    if (!validation.isValid) {
      showToast({
        variant: 'destructive',
        title: 'Validation Failed',
        description: validation.errors.join(', '),
      })
      return
    }

    setIsSubmitting(true)
    setUploadProgress(null)

    try {
      // Get form data
      let data = formRef.current.getFormData()

      // Upload staged media files first
      if (Object.keys(stagedMediaFiles).length > 0) {
        setUploadProgress('Uploading media files...')
        const uploadedMediaIds = await uploadStagedMedia()

        // Merge uploaded media IDs into form data
        data = {
          ...data,
          ...uploadedMediaIds,
        }
      }

      // Clean data to remove undefined values (Firestore doesn't support undefined)
      const cleanedData = cleanData(data)

      // Create content entry
      setUploadProgress('Creating record...')
      const entryId = await contentManagement.createContentEntry(
        selectedProject.projectId,
        schema.id,
        {
          data: cleanedData,
          status: 'draft', // Default to draft
        },
        currentUser.uid,
        userRole || 'User'
      )

      showToast({
        variant: 'default',
        title: 'Record Created',
        description: `Record created successfully`,
      })

      // Reset form and close dialog
      formRef.current.resetForm()
      setStagedMediaFiles({})
      setUploadProgress(null)
      onOpenChange(false)

      // Notify parent component
      if (onRecordCreated) {
        onRecordCreated(entryId)
      }
    } catch (error) {
      console.error('Failed to create record:', error)
      showToast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'Failed to create record',
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(null)
    }
  }

  const handleCancel = () => {
    if (formRef.current) {
      formRef.current.resetForm()
    }
    setStagedMediaFiles({})
    setUploadProgress(null)
    onOpenChange(false)
  }

  // Check if form has any media fields
  const hasMediaFields = schema.fields.some((field) =>
    ['photo', 'video', 'multiplePhotos', 'multipleVideos', 'media', 'multipleMedia', 'svg'].includes(
      field.type
    )
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Record - {schema.name}</DialogTitle>
          {hasMediaFields && (
            <p className="text-sm text-muted-foreground mt-2">
              Note: Media files will only be saved when you click "Create Record"
            </p>
          )}
        </DialogHeader>

        <div className="py-4">
          <DynamicForm
            ref={formRef}
            schema={schema.fields}
            initialData={{}}
            onChange={handleFormChange}
            disabled={isSubmitting}
            useStagedMediaUpload={true}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-[#20B2AA] to-[#1a9488] hover:from-[#1a9488] hover:to-[#148078] text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadProgress || 'Creating...'}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Create Record
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
