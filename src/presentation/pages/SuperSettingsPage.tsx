/**
 * Super Settings Page
 *
 * Global application configuration page (Super users only).
 * This is a placeholder page for future super-level settings.
 *
 * **Access Control:**
 * - Super users only
 *
 * **Features:**
 * - Placeholder UI for future implementation
 * - Clean architecture compliant
 *
 * @route /app/super/settings
 */

import { Shield, Settings, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'

export function SuperSettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                Super Settings
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Global application configuration and super powers
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="grid gap-6">
          {/* Coming Soon Card */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
                <Zap className="h-5 w-5" />
                Coming Soon
              </CardTitle>
              <CardDescription className="text-purple-700 dark:text-purple-400">
                This page is under construction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="w-20 h-20 mx-auto text-purple-300 dark:text-purple-700 mb-4 animate-spin" style={{ animationDuration: '3s' }} />
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-2">
                  Super Settings Coming Soon
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-400 max-w-md mx-auto">
                  This page will allow you to configure global application settings, manage default
                  configurations, and control super-level features.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Planned Features */}
          <Card>
            <CardHeader>
              <CardTitle>Planned Features</CardTitle>
              <CardDescription>
                Features that will be available in this section
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: 'Default User Roles',
                    description: 'Configure default role assignments for new users',
                    icon: Shield,
                  },
                  {
                    title: 'System Configuration',
                    description: 'Manage global system settings and preferences',
                    icon: Settings,
                  },
                  {
                    title: 'Advanced Features',
                    description: 'Enable or disable advanced CMS features',
                    icon: Zap,
                  },
                ].map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
