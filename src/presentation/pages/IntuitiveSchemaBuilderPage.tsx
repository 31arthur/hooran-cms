/**
 * Intuitive Schema Builder Page
 *
 * Visual, card-based interface for creating collection schemas.
 * Designed to be intuitive and user-friendly.
 *
 * **Features:**
 * - Visual field type selection with cards
 * - Drag-and-drop field reordering
 * - Inline field configuration
 * - Real-time preview
 * - Saves to schemas collection with naming convention: {projectName}_{collectionName}
 *
 * @route /app/super/collections/new
 * @route /app/super/collections/:schemaId/edit
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { useCMSServices } from '@/presentation/hooks/useCMSServices'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Badge } from '@/presentation/components/ui/badge'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  AlertCircle,
  Check,
  X,
  Type,
  FileText,
  Hash,
  ToggleLeft,
  Calendar,
  Clock,
  CalendarClock,
  DollarSign,
  File,
  Image,
  Video,
  Code,
  Key,
  List,
  Link,
  Link2,
  Shapes,
} from 'lucide-react'
import { getFieldTypesByCategory, FIELD_TYPE_METADATA } from '@/domain/entities/FieldTypeMetadata'
import type { SchemaField, SchemaFieldType } from '@/domain/entities/SchemaDefinition'
import { cn } from '@/lib/utils'

// Icon mapping
const ICON_MAP: Record<string, any> = {
  Type,
  FileText,
  Hash,
  ToggleLeft,
  Calendar,
  Clock,
  CalendarClock,
  DollarSign,
  File,
  Image,
  Video,
  Code,
  Key,
  List,
  Link,
  Link2,
  Shapes,
}

interface FieldConfig extends SchemaField {
  id: string
}

export function IntuitiveSchemaBuilderPage() {
  const { schemaId } = useParams<{ schemaId?: string }>()
  const navigate = useNavigate()
  const { currentUser, userRole } = useAuth()
  const { selectedProject } = useProject()
  const cmsServices = useCMSServices()

  // Schema metadata
  const [collectionName, setCollectionName] = useState('')
  const [collectionDescription, setCollectionDescription] = useState('')
  const [collectionIcon, _setCollectionIcon] = useState('Database')

  // Fields
  const [fields, setFields] = useState<FieldConfig[]>([])
  const [showFieldTypePicker, setShowFieldTypePicker] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fieldTypesByCategory = getFieldTypesByCategory()
  const isEditMode = !!schemaId

  /**
   * Load existing schema if editing
   */
  useEffect(() => {
    if (isEditMode && schemaId) {
      loadSchema(schemaId)
    }
  }, [schemaId])

  /**
   * Load schema data
   */
  const loadSchema = async (id: string) => {
    if (!selectedProject || !currentUser) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('Loading schema:', id)
      const schema = await cmsServices.schemaManagement.getSchemaById(
        selectedProject.projectId,
        id,
        currentUser.uid,
        userRole as string
      )

      if (!schema) {
        throw new Error('Schema not found')
      }

      setCollectionName(schema.name)
      setCollectionDescription(schema.description || '')
      // Icon is not part of SchemaDefinition yet, so skip for now
      setFields(schema.fields.map((f, i) => ({ ...f, id: `field-${i}` })))

      console.log('✅ Schema loaded successfully')
    } catch (err: any) {
      console.error('Failed to load schema:', err)
      setError(err.message || 'Failed to load schema')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Add new field
   */
  const addField = (fieldType: SchemaFieldType) => {
    const newField: FieldConfig = {
      id: `field-${Date.now()}`,
      name: '',
      type: fieldType,
      label: '',
      required: false,
      options: {},
    }

    setFields([...fields, newField])
    setEditingFieldId(newField.id)
    setShowFieldTypePicker(false)
  }

  /**
   * Update field
   */
  const updateField = (fieldId: string, updates: Partial<FieldConfig>) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f))
  }

  /**
   * Remove field
   */
  const removeField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId))
    if (editingFieldId === fieldId) {
      setEditingFieldId(null)
    }
  }

  /**
   * Move field up
   */
  const moveFieldUp = (index: number) => {
    if (index === 0) return
    const newFields = [...fields]
    ;[newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]]
    setFields(newFields)
  }

  /**
   * Move field down
   * Currently unused but kept for future drag-and-drop functionality
   */
  // const moveFieldDown = (index: number) => {
  //   if (index === fields.length - 1) return
  //   const newFields = [...fields]
  //   ;[newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]]
  //   setFields(newFields)
  // }

  /**
   * Save schema
   */
  const saveSchema = async () => {
    // Validation
    if (!collectionName.trim()) {
      setError('Collection name is required')
      return
    }

    if (!selectedProject) {
      setError('No project selected')
      return
    }

    if (fields.length === 0) {
      setError('At least one field is required')
      return
    }

    // Validate all fields have names and labels
    const invalidFields = fields.filter(f => !f.name.trim() || !f.label.trim())
    if (invalidFields.length > 0) {
      setError('All fields must have a name and label')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Generate schema ID with naming convention: {projectName}_{collectionName}
      // Schema IDs must be lowercase, alphanumeric, and underscores only (no hyphens)
      const projectSlug = selectedProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
      const collectionSlug = collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '_')
      const generatedSchemaId = `${projectSlug}_${collectionSlug}`

      const schemaData = {
        id: schemaId || generatedSchemaId,
        name: collectionName,
        description: collectionDescription,
        projectId: selectedProject.projectId,
        fields: fields.map(({ id, ...field }) => field),
        icon: collectionIcon,
        createdBy: currentUser!.uid,
        updatedBy: currentUser!.uid,
      }

      console.log('Saving schema:', schemaData)

      // Save to Firebase
      if (isEditMode) {
        await cmsServices.schemaManagement.updateSchema(
          selectedProject.projectId,
          schemaId!,
          {
            name: schemaData.name,
            description: schemaData.description,
            fields: schemaData.fields,
          },
          currentUser!.uid,
          userRole as string
        )
      } else {
        await cmsServices.schemaManagement.createSchema(
          selectedProject.projectId,
          {
            id: generatedSchemaId,
            name: schemaData.name,
            description: schemaData.description,
            fields: schemaData.fields,
          },
          currentUser!.uid,
          userRole as string
        )
      }

      console.log('✅ Schema saved successfully')

      // Add collection reference to project records (only for new schemas)
      if (!isEditMode) {
        try {
          const { DIContainer, DI_TYPES } = await import('@/domain/di')
          const projectRecordsRepo = DIContainer.resolve<any>(DI_TYPES.ProjectRecordsRepository)

          await projectRecordsRepo.addCollectionToProject({
            projectId: selectedProject.projectId,
            schemaId: generatedSchemaId,
            collectionName: schemaData.name,
            collectionSlug,
            description: schemaData.description,
            icon: schemaData.icon,
            addedBy: currentUser!.uid,
          })

          console.log('✅ Collection reference added to project records')
        } catch (recordsError) {
          console.error('Failed to add collection to project records:', recordsError)
          // Don't fail the whole operation if this fails
        }
      }

      // Log audit entry
      try {
        await cmsServices.auditLogging.logAudit({
          action: isEditMode ? 'update' : 'create',
          resourceType: 'schema',
          resourceId: schemaData.id,
          resourceName: collectionName,
          projectId: selectedProject.projectId,
          userId: currentUser!.uid,
          userEmail: currentUser!.email!,
          userName: currentUser!.displayName || currentUser!.email!,
          userRole: userRole as any,
          metadata: {
            fieldsCount: fields.length,
            collectionName,
          },
          status: 'success',
        })
      } catch (auditError) {
        console.error('Failed to log audit entry:', auditError)
      }

      setSuccess(true)

      // Dispatch custom event to refresh tables in Sidebar
      if (!isEditMode) {
        const refreshEvent = new CustomEvent('refreshTables', {
          detail: { projectId: selectedProject.projectId }
        })
        window.dispatchEvent(refreshEvent)
        console.log('🔄 IntuitiveSchemaBuilderPage: Dispatched refreshTables event')
      }

      setTimeout(() => {
        navigate('/app/super/collections')
      }, 1500)
    } catch (err: any) {
      console.error('Failed to save schema:', err)
      setError(err.message || 'Failed to save schema')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Get icon component
   */
  const getIconComponent = (iconName: string) => {
    const Icon = ICON_MAP[iconName]
    return Icon || Type
  }

  /**
   * Get color class
   */
  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      slate: 'bg-slate-100 text-slate-700 border-slate-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      violet: 'bg-violet-100 text-violet-700 border-violet-200',
      cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      teal: 'bg-teal-100 text-teal-700 border-teal-200',
      fuchsia: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    }
    return colorMap[color] || colorMap.blue
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/app/super/collections')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Button>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
            {isEditMode ? 'Edit Collection' : 'Create New Collection'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {isEditMode ? 'Update your collection schema' : 'Design your collection schema visually'}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                Schema saved successfully!
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">
                Redirecting to collections...
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900 dark:text-red-200">Error</p>
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Panel - Collection Info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Collection Info</CardTitle>
                <CardDescription>Basic information about your collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="collectionName">Collection Name *</Label>
                  <Input
                    id="collectionName"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="e.g., Blog Posts, Products, Users"
                    className="mt-1"
                  />
                  {selectedProject && collectionName && (
                    <p className="text-xs text-slate-500 mt-1">
                      Schema ID: {selectedProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_{collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="collectionDescription">Description</Label>
                  <Input
                    id="collectionDescription"
                    value={collectionDescription}
                    onChange={(e) => setCollectionDescription(e.target.value)}
                    placeholder="Describe this collection..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Fields</Label>
                  <div className="mt-2 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {fields.length} field{fields.length !== 1 ? 's' : ''} added
                    </span>
                    <Button size="sm" onClick={() => setShowFieldTypePicker(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Field
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={saveSchema}
                    disabled={isSaving || !collectionName || fields.length === 0}
                    className="w-full"
                  >
                    {isSaving ? (
                      'Saving...'
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Collection
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Fields Builder */}
          <div className="lg:col-span-2 space-y-4">
            {/* Field Type Picker */}
            {showFieldTypePicker && (
              <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Choose Field Type</CardTitle>
                      <CardDescription>Select the type of data this field will store</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowFieldTypePicker(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {Object.entries(fieldTypesByCategory).map(([category, types]) => (
                    types.length > 0 && (
                      <div key={category} className="mb-6 last:mb-0">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                          {category}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {types.map((fieldType) => {
                            const Icon = getIconComponent(fieldType.icon)
                            return (
                              <button
                                key={fieldType.type}
                                onClick={() => addField(fieldType.type)}
                                className={cn(
                                  'flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all hover:scale-105',
                                  getColorClass(fieldType.color)
                                )}
                              >
                                <div className="flex-shrink-0 mt-0.5">
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm">{fieldType.label}</div>
                                  <div className="text-xs opacity-75 mt-0.5">{fieldType.description}</div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Fields List */}
            {fields.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Plus className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      No Fields Yet
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Add fields to define the structure of your collection
                    </p>
                    <Button onClick={() => setShowFieldTypePicker(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Field
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              fields.map((field, index) => {
                const fieldMetadata = FIELD_TYPE_METADATA[field.type]
                const Icon = getIconComponent(fieldMetadata.icon)
                const isEditing = editingFieldId === field.id

                return (
                  <Card key={field.id} className={cn(isEditing && 'border-purple-300 shadow-lg')}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        {/* Drag Handle */}
                        <div className="flex flex-col gap-1 pt-2">
                          <button
                            onClick={() => moveFieldUp(index)}
                            disabled={index === 0}
                            className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Field Icon */}
                        <div className={cn('flex-shrink-0 p-3 rounded-lg', getColorClass(fieldMetadata.color))}>
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Field Content */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Field Name (Key)</Label>
                                  <Input
                                    value={field.name}
                                    onChange={(e) => updateField(field.id, { name: e.target.value.replace(/[^a-z0-9_]/gi, '_') })}
                                    placeholder="field_name"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Label (Display Name)</Label>
                                  <Input
                                    value={field.label}
                                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                                    placeholder="Field Label"
                                    className="mt-1"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs">Help Text</Label>
                                <Input
                                  value={field.helpText || ''}
                                  onChange={(e) => updateField(field.id, { helpText: e.target.value })}
                                  placeholder="Optional help text for users"
                                  className="mt-1"
                                />
                              </div>

                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={field.required || false}
                                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                    className="rounded"
                                  />
                                  Required
                                </label>
                              </div>

                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => setEditingFieldId(null)}>
                                  <Check className="h-4 w-4 mr-1" />
                                  Done
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-slate-900 dark:text-white">
                                    {field.label || field.name || 'Unnamed Field'}
                                  </h3>
                                  {field.name && (
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      Key: {field.name}
                                    </p>
                                  )}
                                  <Badge variant="outline" className="mt-2">
                                    {fieldMetadata.label}
                                  </Badge>
                                  {field.required && (
                                    <Badge variant="outline" className="mt-2 ml-2">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {field.helpText && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                  {field.helpText}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1">
                          {!isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingFieldId(field.id)}
                            >
                              Edit
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(field.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}

            {/* Add Field Button (at bottom) */}
            {fields.length > 0 && !showFieldTypePicker && (
              <Button
                onClick={() => setShowFieldTypePicker(true)}
                variant="outline"
                className="w-full border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Field
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
