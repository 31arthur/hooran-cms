import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { useRoleCheck } from '@/presentation/hooks/useRoleCheck'
import { useUseCase } from '@/presentation/hooks/useUseCase'
import { DI_TYPES } from '@/domain/di'
import type { ISchemaManagementUseCase } from '@/application/usecases'
import type { SchemaDefinition } from '@/domain/entities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import { DeleteSchemaDialog } from '@/presentation/components/DeleteSchemaDialog'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function SchemaListPage() {
  const navigate = useNavigate()
  const { currentUser, userRole } = useAuth()
  const { selectedProject } = useProject()
  const { isSuper } = useRoleCheck()

  // Use Case (DI Resolution)
  const schemaManagementUseCase = useUseCase<ISchemaManagementUseCase>(
    DI_TYPES.SchemaManagementUseCase
  )

  const [schemas, setSchemas] = useState<SchemaDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [schemaToDelete, setSchemaToDelete] = useState<SchemaDefinition | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Access Check: Enforce Super role only
  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    if (!isSuper) {
      // Access Denied - redirect to dashboard
      navigate('/app/dashboard')
      toast.error('Access Denied', {
        description: 'Only Super users can access schema management.',
      })
    }
  }, [currentUser, userRole, navigate])

  // Fetch schemas for the selected project
  useEffect(() => {
    if (!selectedProject?.projectId || !isSuper) {
      return
    }

    const fetchSchemas = async () => {
      try {
        setLoading(true)
        const projectSchemas = await schemaManagementUseCase.getSchemasForProject(
          selectedProject.projectId,
          currentUser!.uid,
          userRole || 'User'
        )
        setSchemas(projectSchemas)
      } catch (error: any) {
        console.error('Error fetching schemas:', error)
        toast.error('Failed to load schemas', {
          description: error.message || 'An error occurred while loading schemas.',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSchemas()
  }, [selectedProject?.projectId, userRole])

  // Handle delete button click
  const handleDeleteClick = (schema: SchemaDefinition) => {
    setSchemaToDelete(schema)
    setDeleteDialogOpen(true)
  }

  // Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!schemaToDelete || !selectedProject?.projectId || !currentUser) {
      return
    }

    try {
      setIsDeleting(true)

      // Call the deleteSchema use case
      await schemaManagementUseCase.deleteSchema(
        selectedProject.projectId,
        schemaToDelete.id,
        currentUser.uid
      )

      // Show success toast
      toast.success('Schema deleted', {
        description: `"${schemaToDelete.name}" has been deleted successfully.`,
      })

      // Refresh the schema list
      const updatedSchemas = await schemaManagementUseCase.getSchemasForProject(
        selectedProject.projectId,
        currentUser.uid,
        userRole || 'User'
      )
      setSchemas(updatedSchemas)

      // Close dialog
      setDeleteDialogOpen(false)
      setSchemaToDelete(null)
    } catch (error: any) {
      console.error('Error deleting schema:', error)
      toast.error('Failed to delete schema', {
        description: error.message || 'An error occurred while deleting the schema.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle dialog close
  const handleDialogClose = () => {
    if (!isDeleting) {
      setDeleteDialogOpen(false)
      setSchemaToDelete(null)
    }
  }

  // Handle navigation to create new schema
  const handleCreateNew = () => {
    navigate('/app/schemas/new')
  }

  // Handle navigation to edit schema
  const handleEdit = (schemaId: string) => {
    navigate(`/app/schemas/${schemaId}`)
  }

  // Access check - Don't render anything if not Super
  if (!isSuper) {
    return null
  }

  // No project selected
  if (!selectedProject?.projectId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Content Type Schemas</CardTitle>
            <CardDescription>
              Please select a project to view and manage content type schemas.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Type Schemas</CardTitle>
              <CardDescription>
                Manage content types for{' '}
                <span className="font-medium">{selectedProject.name}</span>
              </CardDescription>
            </div>
            {isSuper && (
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Collection
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : schemas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No content type schemas found for this project.
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Collection
              </Button>
            </div>
          ) : (
            <Table>
              <TableCaption>
                {schemas.length} content type schema{schemas.length !== 1 ? 's' : ''} in this
                project
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Collection ID (Slug)</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schemas.map((schema) => (
                  <TableRow key={schema.id}>
                    <TableCell className="font-medium">{schema.name}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {schema.id}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {schema.createdBy || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(schema.id)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(schema)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteSchemaDialog
        open={deleteDialogOpen}
        onOpenChange={handleDialogClose}
        schema={schemaToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
