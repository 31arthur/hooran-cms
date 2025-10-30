/**
 * Collections Management Page
 *
 * Page for creating and managing collections based on various data types.
 * Super users only.
 *
 * **Access Control:**
 * - Super users only
 *
 * **Features:**
 * - Create new collections with different field types
 * - View existing collections
 * - Edit collection schemas
 * - Based on SchemaDefinition entity
 *
 * @route /app/super/collections
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useProject } from '@/presentation/context/ProjectContext'
import { useCMSServices } from '@/presentation/hooks/useCMSServices'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import { Badge } from '@/presentation/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import {
  Database,
  Plus,
  Edit,
  Trash2,
  FileText,
  AlertCircle,
} from 'lucide-react'

interface Collection {
  id: string
  name: string
  description?: string
  projectId: string
  fields: any[]
  createdAt: Date
  updatedAt: Date
}

export function CollectionsPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { selectedProject } = useProject()
  const cmsServices = useCMSServices()

  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all collections for the selected project
   */
  useEffect(() => {
    const fetchCollections = async () => {
      if (!selectedProject || !currentUser) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('📦 CollectionsPage: Fetching collections for project', selectedProject.projectId)

        // Fetch schemas (collections) from Firestore
        const schemas = await cmsServices.schemaManagement.getSchemasForProject(
          selectedProject.projectId,
          currentUser.uid,
          'Super' // Collections page is Super only
        )

        setCollections(schemas as any[])
        console.log(`✅ CollectionsPage: Loaded ${schemas.length} collections`)
      } catch (err: any) {
        console.error('❌ CollectionsPage: Failed to fetch collections', err)
        setError(err.message || 'Failed to load collections')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCollections()
  }, [selectedProject, currentUser, cmsServices])

  /**
   * Handle create new collection
   */
  const handleCreateCollection = () => {
    navigate('/app/super/collections/new')
  }

  /**
   * Handle edit collection
   */
  const handleEditCollection = (collectionId: string) => {
    navigate(`/app/super/collections/${collectionId}/edit`)
  }

  /**
   * Handle delete collection
   */
  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      return
    }

    try {
      // TODO: Implement delete functionality
      console.log('Deleting collection:', collectionId)
      // await cmsServices.schemaManagement.deleteSchema(collectionId, currentUser!.uid)
      // Refresh collections
      // fetchCollections()
    } catch (err: any) {
      console.error('Failed to delete collection:', err)
      alert('Failed to delete collection: ' + err.message)
    }
  }

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  /**
   * Error state
   */
  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Failed to load collections</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  /**
   * Main UI
   */
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                  Collections
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {selectedProject ? `${selectedProject.name} • ` : ''}
                  {collections.length} collection{collections.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <Button
              onClick={handleCreateCollection}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          </div>
        </div>

        {/* Collections Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              All Collections
            </CardTitle>
            <CardDescription>
              Manage collections and their schemas for {selectedProject?.name || 'the selected project'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {collections.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No Collections Yet
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Create your first collection to start managing content
                </p>
                <Button onClick={handleCreateCollection} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Collection
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collection Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="hidden md:table-cell">Fields</TableHead>
                      <TableHead className="hidden lg:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collections.map((collection) => (
                      <TableRow key={collection.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {collection.name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {collection.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {collection.description || 'No description'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">
                            {collection.fields?.length || 0} fields
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(collection.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCollection(collection.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCollection(collection.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Notice */}
        <div className="mt-6">
          <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-lg">
            <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                Collections Information
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                Collections define the structure of your content. Each collection has fields with
                specific data types (text, number, date, reference, etc.). Create a collection to
                start managing structured content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
