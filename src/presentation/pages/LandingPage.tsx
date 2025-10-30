/**
 * Landing Page Component
 *
 * Public-facing landing page with Google Sign-In functionality.
 * This is the entry point for unauthenticated users.
 *
 * **Design Features:**
 * - Seafoam Green (#20B2AA) primary color theme
 * - Centered sign-in card layout
 * - Google Sign-In only authentication method
 *
 * **Security Note:**
 * Only users with 'Super' or 'Admin' roles can access the CMS.
 * New users are created with 'User' role by default and will be denied access.
 *
 * @route /
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { useToast } from '@/presentation/context/ToastContext'
import { Button } from '@/presentation/components/ui/button'
import _HooranLogo from "@/assets/hooran_logo.svg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react'

export function LandingPage() {
  const { currentUser, hasCMSAccess, signInWithGoogle, error, isLoading } = useAuth()
  const { showToast } = useToast()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const navigate = useNavigate()

  // Note: No auto-redirect - show welcome screen for signed-in users

  /**
   * Handle Google Sign-In
   * On success with proper role, show welcome screen
   * On failure (wrong role or error), error message will be displayed
   */
  const handleSignIn = async () => {
    try {
      setIsSigningIn(true)
      console.log('🔐 Initiating Google Sign-In from Landing Page...')

      await signInWithGoogle()

      // Show success toast
      showToast({
        title: 'Sign-in successful',
        description: 'Welcome to Hooran CMS',
        variant: 'default'
      })
      console.log('✅ Sign-in successful, showing welcome screen...')
    } catch (err) {
      console.error('❌ Sign-in failed:', err)
      // Error is already set in AuthContext and will be displayed below
      // Show error toast
      showToast({
        title: 'Sign-in failed',
        description: err instanceof Error ? err.message : 'An error occurred during sign-in',
        variant: 'destructive'
      })
    } finally {
      setIsSigningIn(false)
    }
  }

  /**
   * Handle Continue to Dashboard
   * Navigate signed-in user to the CMS
   */
  const handleContinue = () => {
    console.log('✅ Continuing to dashboard...')
    navigate('/app/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#20B2AA]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#20B2AA]/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative w-full max-w-md px-6 py-12">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg shadow-[#20B2AA]/20 mb-6">
            <img
              src="/hooran_logo.svg"
              alt="Hooran Logo"
              className="w-20 h-20"
            />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Hooran CMS
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Modern Content Management System
          </p>
        </div>

        {/* Sign-In Card or Welcome Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          {currentUser && hasCMSAccess ? (
            // Welcome screen for signed-in users
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-semibold text-center">
                  Welcome {currentUser.displayName || 'User'}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* User Info */}
                <div className="flex items-start gap-3 p-4 bg-[#20B2AA]/5 border border-[#20B2AA]/20 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-[#20B2AA] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                      Signed in as
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 break-words">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                {/* Continue Button */}
                <Button
                  onClick={handleContinue}
                  size="lg"
                  className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  style={{
                    backgroundColor: '#20B2AA',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a9088'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#20B2AA'
                  }}
                >
                  Continue
                </Button>
              </CardContent>
            </>
          ) : (
            // Sign-in screen for unauthenticated users
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-semibold text-center">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-center">
                  Sign in to access the CMS dashboard
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                        Access Denied
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 break-words">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Google Sign-In Button */}
                <Button
                  onClick={handleSignIn}
                  disabled={isSigningIn || isLoading}
                  size="lg"
                  className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  style={{
                    backgroundColor: '#20B2AA',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSigningIn && !isLoading) {
                      e.currentTarget.style.backgroundColor = '#1a9088'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSigningIn && !isLoading) {
                      e.currentTarget.style.backgroundColor = '#20B2AA'
                    }
                  }}
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      {/* Google Logo SVG */}
                      <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </Button>

                {/* Security Notice */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <ShieldCheck className="h-4 w-4 text-[#20B2AA] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100 mb-1">
                        CMS Access Required
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Only administrators with Super or Admin roles can access this system.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Powered by Firebase, React, and shadcn/ui
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-600">
            Version 0.1.0 &copy; 2025 Hooran CMS
          </p>
        </div>
      </div>
    </div>
  )
}
