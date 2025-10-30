/**
 * Delete Schema Confirmation Dialog
 *
 * Enhanced confirmation dialog that requires typing the schema name
 * to prevent accidental deletions.
 */

import React, { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { AlertCircle } from 'lucide-react'
import type { SchemaDefinition } from '@/domain/entities/SchemaDefinition'

interface DeleteSchemaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schema: SchemaDefinition | null
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export const DeleteSchemaDialog: React.FC<DeleteSchemaDialogProps> = ({
  open,
  onOpenChange,
  schema,
  onConfirm,
  isDeleting,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (!schema) return

    // Check if the entered name matches the schema name
    if (confirmationInput !== schema.name) {
      setError(`Please type "${schema.name}" exactly to confirm deletion`)
      return
    }

    // Clear error and call confirm handler
    setError('')
    await onConfirm()

    // Reset input after confirmation
    setConfirmationInput('')
  }

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationInput('')
      setError('')
      onOpenChange(false)
    }
  }

  const isConfirmDisabled = !confirmationInput || isDeleting || confirmationInput !== schema?.name

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Delete Table "{schema?.name}"
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-4 pt-4">
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                  ⚠️ Warning: This action cannot be undone
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Deleting this table will permanently remove:
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 mt-2 ml-2 space-y-1">
                  <li>The table schema and all its field definitions</li>
                  <li>Access to any associated records (if they exist)</li>
                  <li>All configuration and metadata</li>
                </ul>
              </div>

              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <span className="font-medium">Table ID:</span>{' '}
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
                    {schema?.id}
                  </code>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {schema?.fields?.length || 0} field{schema?.fields?.length !== 1 ? 's' : ''} defined
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-name" className="text-sm font-medium">
                  Type <span className="font-bold text-red-600">"{schema?.name}"</span> to confirm deletion:
                </Label>
                <Input
                  id="confirm-name"
                  value={confirmationInput}
                  onChange={(e) => {
                    setConfirmationInput(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder={`Type ${schema?.name} here`}
                  disabled={isDeleting}
                  className={error ? 'border-red-500 focus:ring-red-500' : ''}
                  autoComplete="off"
                />
                {error && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                  </p>
                )}
              </div>

              {schema?.fields && schema.fields.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
                    Fields that will be lost:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {schema.fields.slice(0, 5).map((field) => (
                      <code
                        key={field.name}
                        className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded"
                      >
                        {field.label || field.name}
                      </code>
                    ))}
                    {schema.fields.length > 5 && (
                      <span className="text-xs text-gray-500 self-center">
                        +{schema.fields.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? 'Deleting...' : 'Delete Table'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
