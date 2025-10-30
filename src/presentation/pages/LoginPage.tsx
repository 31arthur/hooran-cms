/**
 * Login Page Component
 *
 * Provides authentication for Hooran CMS with role-based access control.
 *
 * **CMS Access Rule:**
 * Only users with 'Super' or 'Admin' roles can access the CMS.
 * Users with 'User' role will be denied access.
 *
 * @example
 * ```tsx
 * import { LoginPage } from '@/presentation/pages/LoginPage'
 *
 * <Route path="/login" element={<LoginPage />} />
 * ```
 */

import React, { useState } from 'react'
import type { FormEvent } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { useAuth } from '@/presentation/context/AuthContext'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'

export function LoginPage() {
  const { currentUser, hasCMSAccess, isLoading: authLoading } = useAuth()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  /**
   * Handle form submission
   * 1. Sign in with Firebase Auth
   * 2. Fetch user role from Firestore
   * 3. Check if user has CMS access (Super or Admin)
   * 4. Redirect or show error
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Step 1: Sign in with Firebase Authentication
      console.log('🔐 Attempting to sign in...', email)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      console.log('✅ Authentication successful:', user.uid)

      // Step 2: Fetch user role from Firestore
      console.log('📋 Fetching user role from Firestore...')
      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (!userDocSnap.exists()) {
        // User document doesn't exist
        console.error('❌ User document not found in Firestore')
        await auth.signOut() // Sign out the user
        setError(
          'Your account is not set up correctly. Please contact an administrator.'
        )
        setIsLoading(false)
        return
      }

      const userData = userDocSnap.data()
      const userRole = userData.role

      console.log('📋 User role:', userRole)

      // Step 3: Check CMS Access Rule - Only 'Super' and 'Admin' allowed
      if (userRole !== 'Super' && userRole !== 'Admin') {
        console.warn('⚠️ Access denied - User role is not Super or Admin:', userRole)
        await auth.signOut() // Sign out the user

        setError(
          `Access Denied: Your role is "${userRole}". Only users with "Super" or "Admin" roles can access the CMS.`
        )
        setIsLoading(false)
        return
      }

      // Step 4: Success - User has CMS access
      console.log('✅ CMS access granted - Role:', userRole)
      setSuccess(true)

      // Wait a moment to show success message, then redirect
      setTimeout(() => {
        // Redirect to main app
        window.location.href = '/app'
      }, 1000)
    } catch (err: any) {
      console.error('❌ Login error:', err)

      // Handle specific Firebase Auth errors
      let errorMessage = 'An error occurred during sign in. Please try again.'

      if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.'
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.'
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.'
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.'
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact an administrator.'
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      setIsLoading(false)
    }
  }

  // If user is already authenticated and has CMS access, redirect
  React.useEffect(() => {
    if (!authLoading && currentUser && hasCMSAccess) {
      console.log('✅ User already authenticated with CMS access, redirecting...')
      window.location.href = '/app'
    }
  }, [authLoading, currentUser, hasCMSAccess])

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Hooran CMS</CardTitle>
          <CardDescription className="text-center">
            Sign in to access the Content Management System
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Success Message */}
            {success && (
              <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-md">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="font-semibold">Login successful! Redirecting...</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && !success && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
                <div className="flex gap-2">
                  <svg
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold mb-1">Sign in failed</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading || success}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading || success}
              />
            </div>

            {/* Info Message */}
            <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
              <div className="flex gap-2">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>
                  Only users with <strong>Admin</strong> or <strong>Super Admin</strong>{' '}
                  roles can access the CMS.
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading || success}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                  <span>Signing in...</span>
                </div>
              ) : success ? (
                'Redirecting...'
              ) : (
                'Sign In'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Need help?{' '}
              <a href="mailto:support@hooران.com" className="text-primary hover:underline">
                Contact support
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default LoginPage
