/**
 * DynamicForm Component
 *
 * A reusable form component that dynamically generates form fields based on a schema definition.
 * Supports multiple field types with proper validation and state management.
 *
 * **Features:**
 * - Dynamic field rendering based on schema
 * - Type-safe form state management
 * - Field validation (required fields, field types)
 * - Hooran CMS theme integration
 * - Export form values via callback
 *
 * **Supported Field Types:**
 * - text: Single-line text input
 * - textarea: Multi-line text input
 * - number: Numeric input
 * - boolean: Toggle switch
 * - date: Date picker
 * - email: Email input with validation
 * - url: URL input with validation
 * - richtext: Rich text editor
 * - photo: Single image upload
 * - video: Single video upload
 * - multiplePhotos: Multiple image uploads (gallery)
 * - multipleVideos: Multiple video uploads
 * - multipleMedia: Multiple file uploads (any type)
 *
 * @example
 * ```tsx
 * <DynamicForm
 *   schema={schema.fields}
 *   initialData={contentEntry.data}
 *   onChange={(updatedData) => setFormData(updatedData)}
 * />
 * ```
 */

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import type { SchemaField } from '@/domain/entities/SchemaDefinition'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Switch } from '@/presentation/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { AlertCircle } from 'lucide-react'
import {
  MediaUpload,
  MultipleMediaUpload,
  StagedMediaUpload,
  StagedMultipleMediaUpload,
  type StagedFile
} from '@/presentation/components/media'
import type { MediaFile } from '@/domain/entities/MediaFile'

/**
 * Props for DynamicForm component
 */
export interface DynamicFormProps {
  /**
   * Schema definition - array of field configurations
   */
  schema: SchemaField[]

  /**
   * Initial data to populate the form
   */
  initialData: Record<string, any>

  /**
   * Callback fired when form data changes
   * Provides the complete updated form data object
   * Also provides staged media files if useStagedMediaUpload is true
   */
  onChange?: (data: Record<string, any>, stagedMedia?: Record<string, any>) => void

  /**
   * Optional CSS class name for the form container
   */
  className?: string

  /**
   * Whether to show field descriptions (if available in schema)
   */
  showDescriptions?: boolean

  /**
   * Whether to disable all form fields
   */
  disabled?: boolean

  /**
   * Use staged media upload (files not uploaded until form is submitted)
   * Default: false (immediate upload)
   */
  useStagedMediaUpload?: boolean
}

/**
 * Methods exposed via ref
 */
export interface DynamicFormRef {
  /**
   * Get current form values
   */
  getFormData: () => Record<string, any>

  /**
   * Reset form to initial values
   */
  resetForm: () => void

  /**
   * Validate all required fields
   */
  validateForm: () => { isValid: boolean; errors: string[] }

  /**
   * Set form data programmatically
   */
  setFormData: (data: Record<string, any>) => void
}

/**
 * DynamicForm Component
 *
 * Renders a dynamic form based on schema definition with full state management.
 */
export const DynamicForm = forwardRef<DynamicFormRef, DynamicFormProps>(
  (
    {
      schema,
      initialData,
      onChange,
      className = '',
      showDescriptions = true,
      disabled = false,
      useStagedMediaUpload = false,
    },
    ref
  ) => {
    // Form state management
    const [formData, setFormData] = useState<Record<string, any>>(initialData || {})
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [stagedMediaFiles, setStagedMediaFiles] = useState<Record<string, StagedFile | StagedFile[]>>({})

    /**
     * Initialize form data when initialData changes
     */
    useEffect(() => {
      setFormData(initialData || {})
    }, [initialData])

    /**
     * Generic change handler for all field types
     * Updates form state and triggers onChange callback
     */
    const handleFieldChange = (fieldName: string, value: any) => {
      const updatedData = {
        ...formData,
        [fieldName]: value,
      }

      setFormData(updatedData)

      // Clear error for this field if it exists
      if (errors[fieldName]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[fieldName]
          return newErrors
        })
      }

      // Trigger onChange callback
      if (onChange) {
        onChange(updatedData, useStagedMediaUpload ? stagedMediaFiles : undefined)
      }
    }

    /**
     * Handle staged media file selection
     */
    const handleStagedMediaChange = (fieldName: string, stagedFile: StagedFile | StagedFile[] | null) => {
      const updatedStaged = { ...stagedMediaFiles }

      if (stagedFile === null) {
        delete updatedStaged[fieldName]
      } else {
        updatedStaged[fieldName] = stagedFile
      }

      setStagedMediaFiles(updatedStaged)

      // Also update form data with placeholder
      handleFieldChange(fieldName, '__STAGED__')

      // Trigger onChange with staged files
      if (onChange) {
        onChange(formData, updatedStaged)
      }
    }

    /**
     * Validate required fields
     */
    const validateForm = (): { isValid: boolean; errors: string[] } => {
      const newErrors: Record<string, string> = {}
      const errorMessages: string[] = []

      schema.forEach((field) => {
        if (field.required) {
          const value = formData[field.name]
          if (value === undefined || value === null || value === '') {
            const errorMsg = `${field.label} is required`
            newErrors[field.name] = errorMsg
            errorMessages.push(errorMsg)
          }
        }
      })

      setErrors(newErrors)
      return {
        isValid: errorMessages.length === 0,
        errors: errorMessages,
      }
    }

    /**
     * Reset form to initial values
     */
    const resetForm = () => {
      setFormData(initialData || {})
      setErrors({})
      setStagedMediaFiles({})
    }

    /**
     * Set form data programmatically
     */
    const setFormDataProgrammatically = (data: Record<string, any>) => {
      setFormData(data)
      if (onChange) {
        onChange(data)
      }
    }

    /**
     * Expose methods via ref
     */
    useImperativeHandle(ref, () => ({
      getFormData: () => formData,
      resetForm,
      validateForm,
      setFormData: setFormDataProgrammatically,
    }))

    /**
     * Render field based on type
     */
    const renderField = (field: SchemaField) => {
      const fieldValue = formData[field.name]
      const hasError = !!errors[field.name]

      switch (field.type) {
        case 'text':
        case 'email':
        case 'url':
          return (
            <Input
              id={field.name}
              type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              required={field.required}
              disabled={disabled}
              className={hasError ? 'border-red-500 focus:ring-red-500' : ''}
            />
          )

        case 'number':
          return (
            <Input
              id={field.name}
              type="number"
              value={fieldValue ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? null : parseFloat(e.target.value)
                handleFieldChange(field.name, value)
              }}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              required={field.required}
              disabled={disabled}
              className={hasError ? 'border-red-500 focus:ring-red-500' : ''}
              min={field.validation?.min}
              max={field.validation?.max}
            />
          )

        case 'textarea':
          return (
            <textarea
              id={field.name}
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              required={field.required}
              disabled={disabled}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                hasError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-[#20B2AA]'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          )

        case 'boolean':
          return (
            <div className="flex items-center space-x-3">
              <Switch
                id={field.name}
                checked={fieldValue === true}
                onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
                disabled={disabled}
                className="data-[state=checked]:bg-[#20B2AA]"
              />
              <Label
                htmlFor={field.name}
                className="text-sm text-gray-700 cursor-pointer select-none"
              >
                {fieldValue ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
          )

        case 'date':
          return (
            <Input
              id={field.name}
              type="date"
              value={
                fieldValue
                  ? fieldValue instanceof Date
                    ? fieldValue.toISOString().split('T')[0]
                    : String(fieldValue).split('T')[0]
                  : ''
              }
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              required={field.required}
              disabled={disabled}
              className={hasError ? 'border-red-500 focus:ring-red-500' : ''}
            />
          )

        case 'datetime':
          return (
            <Input
              id={field.name}
              type="datetime-local"
              value={
                fieldValue
                  ? fieldValue instanceof Date
                    ? fieldValue.toISOString().slice(0, 16)
                    : String(fieldValue).slice(0, 16)
                  : ''
              }
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              required={field.required}
              disabled={disabled}
              className={hasError ? 'border-red-500 focus:ring-red-500' : ''}
            />
          )

        case 'select':
        case 'enum':
          return (
            <Select
              value={fieldValue ? String(fieldValue) : undefined}
              onValueChange={(value) => handleFieldChange(field.name, value)}
              disabled={disabled}
            >
              <SelectTrigger
                className={hasError ? 'border-red-500 focus:ring-red-500' : ''}
              >
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.choices?.map((choice: { value: string; label: string }) => (
                  <SelectItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )

        case 'richtext':
          return (
            <div className="space-y-2">
              <textarea
                id={field.name}
                value={fieldValue || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                required={field.required}
                disabled={disabled}
                rows={8}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent font-mono text-sm ${
                  hasError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-[#20B2AA]'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              <p className="text-xs text-gray-500">Rich text editor placeholder (HTML supported)</p>
            </div>
          )

        case 'photo':
        case 'video':
          return useStagedMediaUpload ? (
            <StagedMediaUpload
              accept={field.type === 'photo' ? 'image/*' : 'video/*'}
              maxSize={field.type === 'photo' ? 10 * 1024 * 1024 : 50 * 1024 * 1024}
              onFileSelected={(stagedFile) => {
                handleStagedMediaChange(field.name, stagedFile)
              }}
              onClear={() => {
                handleStagedMediaChange(field.name, null)
              }}
              showPreview={true}
              disabled={disabled}
              className="mt-2"
            />
          ) : (
            <MediaUpload
              accept={field.type === 'photo' ? 'image/*' : 'video/*'}
              maxSize={field.type === 'photo' ? 10 * 1024 * 1024 : 50 * 1024 * 1024}
              onUploadComplete={(file: MediaFile) => {
                // Store the media file ID in form data
                handleFieldChange(field.name, file.id)
              }}
              onUploadError={(error: string) => {
                setErrors((prev) => ({
                  ...prev,
                  [field.name]: error,
                }))
              }}
              showPreview={true}
              className="mt-2"
            />
          )

        case 'multiplePhotos':
        case 'multipleVideos':
        case 'multipleMedia':
          return useStagedMediaUpload ? (
            <StagedMultipleMediaUpload
              accept={
                field.type === 'multiplePhotos'
                  ? 'image/*'
                  : field.type === 'multipleVideos'
                  ? 'video/*'
                  : undefined
              }
              maxSize={
                field.type === 'multiplePhotos'
                  ? 10 * 1024 * 1024
                  : field.type === 'multipleVideos'
                  ? 50 * 1024 * 1024
                  : 100 * 1024 * 1024
              }
              maxFiles={field.validation?.maxItems || 10}
              onFilesChanged={(stagedFiles) => {
                handleStagedMediaChange(field.name, stagedFiles)
              }}
              disabled={disabled}
              layout="grid"
              className="mt-2"
            />
          ) : (
            <MultipleMediaUpload
              accept={
                field.type === 'multiplePhotos'
                  ? 'image/*'
                  : field.type === 'multipleVideos'
                  ? 'video/*'
                  : undefined
              }
              maxSize={
                field.type === 'multiplePhotos'
                  ? 10 * 1024 * 1024
                  : field.type === 'multipleVideos'
                  ? 50 * 1024 * 1024
                  : 100 * 1024 * 1024
              }
              maxFiles={field.validation?.maxItems || 10}
              initialFiles={[]}
              onUploadComplete={(files: MediaFile[]) => {
                // Store array of media file IDs
                const fileIds = files.map((f) => f.id)
                handleFieldChange(field.name, fileIds)
              }}
              onChange={(files: MediaFile[]) => {
                // Update form data when files are added/removed
                const fileIds = files.map((f) => f.id)
                handleFieldChange(field.name, fileIds)
              }}
              onUploadError={(error: string) => {
                setErrors((prev) => ({
                  ...prev,
                  [field.name]: error,
                }))
              }}
              layout="grid"
              className="mt-2"
            />
          )

        case 'svg':
          return (
            <div className="space-y-2">
              <textarea
                id={field.name}
                value={fieldValue || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder="Paste SVG code here..."
                required={field.required}
                disabled={disabled}
                rows={8}
                className={`w-full px-3 py-2 border rounded-md shadow-sm font-mono text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                  hasError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-[#20B2AA]'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {fieldValue && (
                <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                  <p className="text-xs text-gray-600 mb-2">Preview:</p>
                  <div
                    className="flex items-center justify-center p-4 bg-white rounded border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: fieldValue }}
                  />
                </div>
              )}
            </div>
          )

        default:
          return (
            <Input
              id={field.name}
              type="text"
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              required={field.required}
              disabled={disabled}
              className={hasError ? 'border-red-500 focus:ring-red-500' : ''}
            />
          )
      }
    }

    /**
     * Render form
     */
    return (
      <div className={`space-y-6 ${className}`}>
        {schema.map((field) => (
          <div key={field.name} className="space-y-2">
            {/* Field Label */}
            <Label htmlFor={field.name} className="text-sm font-semibold text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
              {field.unique && (
                <span className="ml-2 text-xs font-normal text-gray-500">(Unique)</span>
              )}
            </Label>

            {/* Field Input */}
            {renderField(field)}

            {/* Field Error */}
            {errors[field.name] && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{errors[field.name]}</span>
              </div>
            )}

            {/* Field Description */}
            {showDescriptions && field.validation && (
              <p className="text-xs text-gray-500">
                {field.validation.min !== undefined && `Min: ${field.validation.min}`}
                {field.validation.min !== undefined && field.validation.max !== undefined && ' • '}
                {field.validation.max !== undefined && `Max: ${field.validation.max}`}
              </p>
            )}
          </div>
        ))}

        {/* No fields message */}
        {schema.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No fields defined for this schema.</p>
                <p className="text-xs mt-2 text-gray-400">
                  Add fields to the schema to start collecting content.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }
)

// Display name for React DevTools
DynamicForm.displayName = 'DynamicForm'
