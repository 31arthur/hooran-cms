/**
 * Schema Builder Page Component
 *
 * Allows Super admins to create new content type schemas (collections).
 * Accessible only to users with 'Super' role.
 *
 * **Route**: `/app/schemas/new`
 * **Access**: Super only
 *
 * **Features**:
 * - Two-column layout: Form (left) + Schema Preview (right)
 * - Collection metadata: Display Name, Collection ID, Singular Name
 * - Auto-generated slug from display name
 * - Dynamic field addition with Text, Number, Boolean, Date types
 * - Field reordering and removal
 * - Live JSON schema preview
 * - Save button with Seafoam Green theme
 *
 * @example
 * ```tsx
 * // In Router.tsx
 * <Route path="schemas/new" element={<SchemaBuilderPage />} />
 * ```
 */

import { useState } from 'react'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'
import { Button } from '@/presentation/components/ui/button'
import { Label } from '@/presentation/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import {
  ShieldX,
  Save,
  FileType,
  Hash,
  Tag,
  Plus,
  AlertCircle,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/presentation/components/ui/alert'
import { useUseCase } from '@/presentation/hooks/useUseCase'
import { DI_TYPES } from '@/domain/di'
import type { ISchemaManagementUseCase } from '@/application/usecases'
import type { SchemaField } from '@/domain/entities'

/**
 * Collection metadata interface
 */
interface CollectionMetadata {
  displayName: string
  collectionId: string
  singularName: string
}

/**
 * Field type options
 */
type FieldType = 'Text' | 'Number' | 'Boolean' | 'Date'

/**
 * Field definition interface
 */
interface FieldDefinition {
  id: string // Unique ID for React keys
  fieldName: string // Key (e.g., "title")
  fieldLabel: string // UI label (e.g., "Post Title")
  fieldType: FieldType // Type (Text, Number, Boolean, Date)
}

export function SchemaBuilderPage() {
  const { userRole, currentUser } = useAuth()
  const { selectedProject } = useProject()
  const navigate = useNavigate()

  // Use Case (DI Resolution)
  const schemaManagementUseCase = useUseCase<ISchemaManagementUseCase>(
    DI_TYPES.SchemaManagementUseCase
  )

  // Collection metadata state
  const [metadata, setMetadata] = useState<CollectionMetadata>({
    displayName: '',
    collectionId: '',
    singularName: '',
  })

  // Track if collection ID was manually edited
  const [isCollectionIdManuallyEdited, setIsCollectionIdManuallyEdited] = useState(false)

  // Fields array state
  const [fields, setFields] = useState<FieldDefinition[]>([])

  // New field input state
  const [newField, setNewField] = useState<Omit<FieldDefinition, 'id'>>({
    fieldName: '',
    fieldLabel: '',
    fieldType: 'Text',
  })

  // Save operation state
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  /**
   * Generate slug from display name
   * Converts "Blog Posts" → "blog-posts"
   */
  const generateSlug = (displayName: string): string => {
    return displayName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  /**
   * Generate field name slug from label
   * Converts "Post Title" → "post_title"
   */
  const generateFieldName = (label: string): string => {
    return label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s_]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  /**
   * Handle display name change
   * Auto-generates collection ID if not manually edited
   */
  const handleDisplayNameChange = (value: string) => {
    setMetadata((prev) => {
      const newMetadata = { ...prev, displayName: value }

      // Auto-generate collection ID if not manually edited
      if (!isCollectionIdManuallyEdited) {
        newMetadata.collectionId = generateSlug(value)
      }

      return newMetadata
    })
  }

  /**
   * Handle collection ID change
   * Marks as manually edited
   */
  const handleCollectionIdChange = (value: string) => {
    setIsCollectionIdManuallyEdited(true)
    setMetadata((prev) => ({ ...prev, collectionId: value }))
  }

  /**
   * Handle singular name change
   */
  const handleSingularNameChange = (value: string) => {
    setMetadata((prev) => ({ ...prev, singularName: value }))
  }

  /**
   * Handle add new field
   */
  const handleAddField = () => {
    if (!newField.fieldLabel.trim()) {
      alert('Please enter a field label')
      return
    }

    const field: FieldDefinition = {
      id: `field-${Date.now()}`,
      fieldName: newField.fieldName || generateFieldName(newField.fieldLabel),
      fieldLabel: newField.fieldLabel,
      fieldType: newField.fieldType,
    }

    setFields((prev) => [...prev, field])

    // Reset new field form
    setNewField({
      fieldName: '',
      fieldLabel: '',
      fieldType: 'Text',
    })

    console.log('✅ Field added:', field)
  }

  /**
   * Handle remove field
   */
  const handleRemoveField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId))
    console.log('🗑️ Field removed:', fieldId)
  }

  /**
   * Handle move field up
   */
  const handleMoveFieldUp = (index: number) => {
    if (index === 0) return

    setFields((prev) => {
      const newFields = [...prev]
      const temp = newFields[index]
      newFields[index] = newFields[index - 1]
      newFields[index - 1] = temp
      return newFields
    })
  }

  /**
   * Handle move field down
   */
  const handleMoveFieldDown = (index: number) => {
    if (index === fields.length - 1) return

    setFields((prev) => {
      const newFields = [...prev]
      const temp = newFields[index]
      newFields[index] = newFields[index + 1]
      newFields[index + 1] = temp
      return newFields
    })
  }

  /**
   * Map UI field type to SchemaFieldType
   */
  const mapFieldTypeToSchemaFieldType = (fieldType: FieldType): SchemaField['type'] => {
    const typeMap: Record<FieldType, SchemaField['type']> = {
      Text: 'text',
      Number: 'number',
      Boolean: 'boolean',
      Date: 'date',
    }
    return typeMap[fieldType]
  }

  /**
   * Handle save collection definition
   * Saves schema to Firestore using SchemaService
   */
  const handleSave = async () => {
    // Validate required fields
    if (!metadata.displayName || !metadata.collectionId || !metadata.singularName) {
      setSaveError('Please fill in all required metadata fields')
      return
    }

    if (fields.length === 0) {
      setSaveError('Please add at least one field to the schema')
      return
    }

    if (!selectedProject) {
      setSaveError('No project selected. Please select a project first.')
      return
    }

    if (!currentUser) {
      setSaveError('User not authenticated')
      return
    }

    // Reset error and success states
    setSaveError(null)
    setSaveSuccess(false)
    setIsSaving(true)

    try {
      console.log('💾 Saving collection definition...')

      // Convert fields to SchemaField format
      const schemaFields: SchemaField[] = fields.map((f) => ({
        name: f.fieldName,
        type: mapFieldTypeToSchemaFieldType(f.fieldType),
        label: f.fieldLabel,
        required: false, // Default for Phase 1
      }))

      // Call schemaManagementUseCase.createSchema
      const schemaId = await schemaManagementUseCase.createSchema(
        selectedProject.projectId,
        {
          id: metadata.collectionId,
          name: metadata.displayName,
          description: `${metadata.singularName} content type`,
          fields: schemaFields,
          displayField: schemaFields[0]?.name || 'id',
        },
        currentUser.uid,
        userRole || 'User'
      )

      console.log('✅ Schema created successfully with ID:', schemaId)

      // Show success state
      setSaveSuccess(true)
      setIsSaving(false)

      // Wait 2 seconds to show success message, then navigate back
      setTimeout(() => {
        navigate('/app/dashboard')
      }, 2000)
    } catch (error) {
      console.error('❌ Failed to save schema:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save schema')
      setIsSaving(false)
    }
  }

  /**
   * ROLE CHECK: Only Super users can access this page
   */
  if (userRole !== 'Super') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-red-500">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <ShieldX className="w-10 h-10 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl text-gray-900">Access Denied</CardTitle>
            <CardDescription className="text-center text-base mt-2">
              Only <span className="font-bold text-red-600">Super Administrators</span> can access
              the Schema Builder.
              <br />
              <br />
              Current role: <span className="font-semibold">{userRole || 'None'}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              variant="outline"
              onClick={() => navigate('/app/dashboard')}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Main Schema Builder UI (Super only)
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#20B2AA] to-[#1a9088] rounded-lg flex items-center justify-center shadow-md">
                <FileType className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Schema Builder</h1>
                <p className="text-sm text-gray-600">Create a new content type</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-semibold">
                Super Only
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Info Alert */}
          <Alert className="mb-6 border-[#20B2AA] bg-[#20B2AA]/5">
            <AlertCircle className="h-4 w-4 text-[#20B2AA]" />
            <AlertTitle className="text-[#20B2AA]">Schema Builder</AlertTitle>
            <AlertDescription className="text-gray-700">
              Define a new content type (collection) for your CMS. Fill in the metadata below and
              add fields to build your schema.
            </AlertDescription>
          </Alert>

          {/* Success Alert */}
          {saveSuccess && (
            <Alert className="mb-6 border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Schema Created Successfully!</AlertTitle>
              <AlertDescription className="text-green-600">
                Your collection definition has been saved. Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {saveError && (
            <Alert className="mb-6 border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-700">Error Saving Schema</AlertTitle>
              <AlertDescription className="text-red-600">{saveError}</AlertDescription>
            </Alert>
          )}

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: Collection Metadata Form */}
            <div className="space-y-6">
              {/* Collection Metadata Card */}
              <Card className="shadow-lg border-l-4 border-l-[#20B2AA]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Tag className="w-5 h-5 text-[#20B2AA]" />
                    Collection Metadata
                  </CardTitle>
                  <CardDescription>
                    Define the basic information for your new content type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Display Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-gray-900 font-semibold">
                      Display Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="displayName"
                      placeholder="e.g., Blog Posts"
                      value={metadata.displayName}
                      onChange={(e) => handleDisplayNameChange(e.target.value)}
                      className="border-gray-300 focus:border-[#20B2AA] focus:ring-[#20B2AA]"
                    />
                    <p className="text-xs text-gray-500">
                      The human-readable name for this collection (plural)
                    </p>
                  </div>

                  {/* Collection ID (Slug) Field */}
                  <div className="space-y-2">
                    <Label htmlFor="collectionId" className="text-gray-900 font-semibold">
                      Collection ID (Slug) <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <Input
                        id="collectionId"
                        placeholder="e.g., blog-posts"
                        value={metadata.collectionId}
                        onChange={(e) => handleCollectionIdChange(e.target.value)}
                        className="border-gray-300 focus:border-[#20B2AA] focus:ring-[#20B2AA] font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {isCollectionIdManuallyEdited ? (
                        <span className="text-amber-600">
                          ⚠️ Manually edited - will not auto-update
                        </span>
                      ) : (
                        <span>
                          Auto-generated from Display Name (editable). Must be lowercase with hyphens.
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Singular Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="singularName" className="text-gray-900 font-semibold">
                      Singular Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="singularName"
                      placeholder="e.g., Post"
                      value={metadata.singularName}
                      onChange={(e) => handleSingularNameChange(e.target.value)}
                      className="border-gray-300 focus:border-[#20B2AA] focus:ring-[#20B2AA]"
                    />
                    <p className="text-xs text-gray-500">
                      The singular form of this content type (e.g., "Post" for "Blog Posts")
                    </p>
                  </div>

                  {/* Preview Box */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-[#20B2AA]/5 to-[#1a9088]/5 border border-[#20B2AA]/20 rounded-lg">
                    <h4 className="text-sm font-semibold text-[#20B2AA] mb-2">Preview</h4>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Collection:</span>{' '}
                        {metadata.displayName || '(empty)'}
                      </p>
                      <p>
                        <span className="font-medium">ID:</span>{' '}
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                          {metadata.collectionId || '(empty)'}
                        </code>
                      </p>
                      <p>
                        <span className="font-medium">Singular:</span>{' '}
                        {metadata.singularName || '(empty)'}
                      </p>
                      <p>
                        <span className="font-medium">Fields:</span> {fields.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add Field Card */}
              <Card className="shadow-lg border-l-4 border-l-[#20B2AA]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Plus className="w-5 h-5 text-[#20B2AA]" />
                    Add New Field
                  </CardTitle>
                  <CardDescription>Define a new field for this content type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Field Label */}
                  <div className="space-y-2">
                    <Label htmlFor="fieldLabel" className="text-gray-900 font-semibold">
                      Field Label <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fieldLabel"
                      placeholder="e.g., Post Title"
                      value={newField.fieldLabel}
                      onChange={(e) =>
                        setNewField((prev) => ({
                          ...prev,
                          fieldLabel: e.target.value,
                          // Auto-generate field name if empty
                          fieldName: prev.fieldName === '' ? generateFieldName(e.target.value) : prev.fieldName,
                        }))
                      }
                      className="border-gray-300 focus:border-[#20B2AA] focus:ring-[#20B2AA]"
                    />
                    <p className="text-xs text-gray-500">Display name shown in the UI</p>
                  </div>

                  {/* Field Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fieldName" className="text-gray-900 font-semibold">
                      Field Name (Key) <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-gray-400" />
                      <Input
                        id="fieldName"
                        placeholder="e.g., post_title"
                        value={newField.fieldName}
                        onChange={(e) =>
                          setNewField((prev) => ({ ...prev, fieldName: e.target.value }))
                        }
                        className="border-gray-300 focus:border-[#20B2AA] focus:ring-[#20B2AA] font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {newField.fieldName === '' && newField.fieldLabel ? (
                        <span className="text-[#20B2AA]">
                          Auto-generated: {generateFieldName(newField.fieldLabel)}
                        </span>
                      ) : (
                        <span>Database field name (lowercase with underscores)</span>
                      )}
                    </p>
                  </div>

                  {/* Field Type */}
                  <div className="space-y-2">
                    <Label htmlFor="fieldType" className="text-gray-900 font-semibold">
                      Field Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={newField.fieldType}
                      onValueChange={(value: FieldType) =>
                        setNewField((prev) => ({ ...prev, fieldType: value }))
                      }
                    >
                      <SelectTrigger className="border-gray-300 focus:border-[#20B2AA] focus:ring-[#20B2AA]">
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Text">Text (String)</SelectItem>
                        <SelectItem value="Number">Number (Integer/Float)</SelectItem>
                        <SelectItem value="Boolean">Boolean (True/False)</SelectItem>
                        <SelectItem value="Date">Date (Timestamp)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Data type for this field</p>
                  </div>

                  {/* Add Field Button */}
                  <Button
                    onClick={handleAddField}
                    className="w-full bg-gradient-to-r from-[#20B2AA] to-[#1a9088] hover:from-[#1a9088] hover:to-[#158f87] text-white"
                    disabled={!newField.fieldLabel.trim()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field to Schema
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Schema Preview */}
            <Card className="shadow-lg border-l-4 border-l-[#20B2AA]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <FileType className="w-5 h-5 text-[#20B2AA]" />
                  Schema Preview
                </CardTitle>
                <CardDescription>
                  Live preview of your content type schema ({fields.length} field{fields.length !== 1 ? 's' : ''})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Fields List */}
                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-[#20B2AA]/10 rounded-full flex items-center justify-center mb-4">
                      <Plus className="w-8 h-8 text-[#20B2AA]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fields Yet</h3>
                    <p className="text-sm text-gray-600 max-w-sm">
                      Use the form on the left to add fields to your schema. They will appear here
                      in real-time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <Card
                        key={field.id}
                        className="bg-white border-[#20B2AA]/20 hover:border-[#20B2AA]/50 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-sm font-mono text-[#20B2AA] font-semibold">
                                  {field.fieldName}
                                </code>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  {field.fieldType}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{field.fieldLabel}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Move Up */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMoveFieldUp(index)}
                                disabled={index === 0}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              {/* Move Down */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMoveFieldDown(index)}
                                disabled={index === fields.length - 1}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              {/* Remove */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveField(field.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* JSON Schema Preview */}
                {fields.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        JSON Schema
                      </h4>
                    </div>
                    <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                      {JSON.stringify(
                        {
                          collection: metadata.collectionId || 'collection-id',
                          fields: fields.map((f) => ({
                            [f.fieldName]: {
                              label: f.fieldLabel,
                              type: f.fieldType,
                            },
                          })),
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Save Button (Footer) */}
          <div className="mt-8 flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 shadow-md">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Ready to save?'}
              </p>
              <p className="text-xs text-gray-500">
                {isSaving
                  ? 'Creating collection definition in Firestore...'
                  : saveSuccess
                    ? 'Schema created successfully'
                    : 'This will create the collection definition in Firestore'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate(-1)} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-[#20B2AA] to-[#1a9088] hover:from-[#1a9088] hover:to-[#158f87] text-white shadow-md"
                disabled={
                  isSaving ||
                  saveSuccess ||
                  !metadata.displayName ||
                  !metadata.collectionId ||
                  !metadata.singularName ||
                  fields.length === 0
                }
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Collection Definition
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
