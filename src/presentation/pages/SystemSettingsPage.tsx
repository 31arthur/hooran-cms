/**
 * System Settings Page Component
 *
 * EXCLUSIVE to Super role users for managing application-wide configuration.
 *
 * **Access Control:**
 * - Only Super users can access this page
 * - Displays "Access Denied" message for non-Super users
 *
 * **Functionality:**
 * - Manage global system settings stored in Firestore `system_settings/global`
 * - Default New User Role: Set default role for new Google Sign-In users
 * - System Maintenance Mode: Enable/disable CMS access for all users
 * - Audit logging for all system setting changes
 *
 * @route /app/system-settings
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { DIContainer, DI_TYPES } from '@/domain/di'
import type { ISettingsManagementUseCase, SystemSettings } from '@/application/usecases'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Switch } from '@/presentation/components/ui/switch'
import { Label } from '@/presentation/components/ui/label'
import {
  ShieldOff,
  Settings,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  UserCog,
  AlertTriangle,
} from 'lucide-react'

export function SystemSettingsPage() {
  const { userRole, currentUser } = useAuth()
  const navigate = useNavigate()

  // Form state
  const [defaultRole, setDefaultRole] = useState<'User' | 'Admin'>('User')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // UI state
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Original settings for change detection
  const [originalSettings, setOriginalSettings] = useState<SystemSettings | null>(null)

  /**
   * Load current system settings on mount
   */
  useEffect(() => {
    const loadSettings = async () => {
      if (userRole !== 'Super') {
        return
      }

      setIsLoading(true)
      try {
        console.log('⚙️ SystemSettingsPage: Loading current system settings')

        // Use SettingsManagementUseCase to fetch settings
        const settingsUseCase = DIContainer.resolve<ISettingsManagementUseCase>(
          DI_TYPES.SettingsManagementUseCase
        )

        const settings = await settingsUseCase.getSystemSettings()

        setDefaultRole(settings.defaultRole)
        setMaintenanceMode(settings.maintenanceMode)
        setOriginalSettings(settings)

        console.log('✅ SystemSettingsPage: Settings loaded', settings)
      } catch (error) {
        console.error('❌ SystemSettingsPage: Failed to load settings', error)
        setErrorMessage('Failed to load system settings. Using defaults.')
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [userRole])

  /**
   * Track changes for unsaved changes indicator
   */
  useEffect(() => {
    if (!originalSettings) {
      setHasChanges(false)
      return
    }

    const roleChanged = defaultRole !== originalSettings.defaultRole
    const maintenanceChanged = maintenanceMode !== originalSettings.maintenanceMode

    setHasChanges(roleChanged || maintenanceChanged)
  }, [defaultRole, maintenanceMode, originalSettings])

  /**
   * Handle save system settings
   */
  const handleSave = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!hasChanges) {
      setErrorMessage('No changes to save')
      return
    }

    setIsSaving(true)

    try {
      console.log('💾 SystemSettingsPage: Saving system settings', {
        defaultRole,
        maintenanceMode,
      })

      // Use SettingsManagementUseCase instead of direct service call
      // The Use Case handles settings update and audit logging internally
      const settingsUseCase = DIContainer.resolve<ISettingsManagementUseCase>(
        DI_TYPES.SettingsManagementUseCase
      )

      await settingsUseCase.updateSystemSettings(
        {
          defaultRole,
          maintenanceMode,
        },
        currentUser!.uid
      )

      console.log('✅ SystemSettingsPage: Settings saved successfully')

      // Update original settings to reflect saved state
      setOriginalSettings({
        defaultRole,
        maintenanceMode,
      })

      setSuccessMessage('System settings saved successfully!')
      setHasChanges(false)
    } catch (error: any) {
      console.error('❌ SystemSettingsPage: Failed to save settings', error)
      setErrorMessage(error.message || 'Failed to save system settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handle cancel - reset to original values
   */
  const handleCancel = () => {
    if (originalSettings) {
      setDefaultRole(originalSettings.defaultRole)
      setMaintenanceMode(originalSettings.maintenanceMode)
    }
    setErrorMessage('')
    setSuccessMessage('')
    setHasChanges(false)
  }

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigate('/app/dashboard')
  }

  // Access Control: Only Super users can access this page
  if (userRole !== 'Super') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-200 dark:border-red-900/50">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30">
                <ShieldOff className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl text-red-700 dark:text-red-400">
                Access Denied
              </CardTitle>
            </div>
            <CardDescription>
              You do not have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-sm text-red-800 dark:text-red-300">
                This page is restricted to <strong>Super</strong> role users only. System settings
                require system-level privileges.
              </AlertDescription>
            </Alert>

            <div className="mt-6">
              <Button onClick={handleBack} variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main UI for Super users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
              <Settings className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                System Settings
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Configure global application settings for all users
              </p>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <Alert className="border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-sm text-green-800 dark:text-green-300">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {errorMessage && (
            <Alert className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-sm text-red-800 dark:text-red-300">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Unsaved Changes Indicator */}
          {hasChanges && (
            <Alert className="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-300">
                You have unsaved changes. Click "Save Settings" to apply them.
              </AlertDescription>
            </Alert>
          )}

          {/* Default New User Role Setting */}
          <Card className="border-blue-200 dark:border-blue-900/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <UserCog className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Default New User Role</CardTitle>
                  <CardDescription>
                    Set the default role assigned to new users who sign in with Google
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Loading settings...
                  </span>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="defaultRole" className="text-sm font-medium">
                      Default Role
                    </Label>
                    <Select
                      value={defaultRole}
                      onValueChange={(value) => setDefaultRole(value as 'User' | 'Admin')}
                      disabled={isSaving}
                    >
                      <SelectTrigger id="defaultRole" className="w-full">
                        <SelectValue placeholder="Select default role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="User">User (No CMS Access)</SelectItem>
                        <SelectItem value="Admin">Admin (Project Access)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      <strong>User:</strong> No CMS access by default. Must be promoted by Super.
                      <br />
                      <strong>Admin:</strong> Can access assigned projects. Requires project
                      assignment.
                    </p>
                  </div>

                  {/* Current Value Display */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Current Setting
                    </p>
                    <p className="text-sm text-slate-900 dark:text-white">
                      New users will be assigned the{' '}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {defaultRole}
                      </span>{' '}
                      role
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Maintenance Mode Setting */}
          <Card className="border-red-200 dark:border-red-900/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">System Maintenance Mode</CardTitle>
                  <CardDescription>
                    Enable to restrict CMS access for all Admin and Super users
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 text-red-600 dark:text-red-400 animate-spin" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Loading settings...
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex-1">
                      <Label
                        htmlFor="maintenanceMode"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Enable Maintenance Mode
                      </Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        When enabled, the CMS will be inaccessible to all users
                      </p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={maintenanceMode}
                      onCheckedChange={setMaintenanceMode}
                      disabled={isSaving}
                    />
                  </div>

                  {/* Status Display */}
                  <div
                    className={`p-3 rounded-lg border ${
                      maintenanceMode
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                        : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50'
                    }`}
                  >
                    <p className="text-xs font-medium mb-1">
                      <span
                        className={
                          maintenanceMode
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-green-700 dark:text-green-300'
                        }
                      >
                        System Status
                      </span>
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        maintenanceMode
                          ? 'text-red-900 dark:text-red-200'
                          : 'text-green-900 dark:text-green-200'
                      }`}
                    >
                      {maintenanceMode ? '🔴 Maintenance Mode Active' : '🟢 System Operational'}
                    </p>
                  </div>

                  {/* Warning */}
                  {maintenanceMode && (
                    <Alert className="border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-950/30">
                      <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-400" />
                      <AlertDescription className="text-sm text-red-900 dark:text-red-200">
                        <strong>Warning:</strong> Enabling maintenance mode will lock out all
                        users from the CMS. Only Super users can disable it.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges || isLoading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Settings...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleCancel}
                  disabled={isSaving || !hasChanges || isLoading}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Notice */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Super Administrator Action
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                These settings affect the entire CMS application across all projects. All changes
                are logged in the audit trail for compliance and security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
