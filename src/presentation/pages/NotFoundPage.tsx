/**
 * Not Found (404) Page Component
 *
 * Displayed when a user navigates to a non-existent route.
 * Features Hooran CMS branding and Seafoam Green theme.
 *
 * @route /404 or any unmatched path
 */

import { useNavigate } from 'react-router-dom'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Home, ArrowLeft, SearchX } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/')
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="w-full max-w-lg">
        {/* Hooran CMS Logo/Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img
            src="/src/assets/hooran_logo.svg"
            alt="Hooran CMS Logo"
            className="w-12 h-12 shadow-lg"
          />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900">Hooran CMS</h1>
            <p className="text-sm text-gray-500">Content Management System</p>
          </div>
        </div>

        {/* 404 Card */}
        <Card className="shadow-xl border-t-4 border-t-[#20B2AA]">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-6">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#20B2AA]/10 mb-4">
                <SearchX className="w-10 h-10 text-[#20B2AA]" />
              </div>

              {/* 404 Number */}
              <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#20B2AA] to-[#1a9088] mb-2">
                404
              </div>
            </div>

            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              The page you're looking for doesn't exist or has been moved.
              <br />
              Let's get you back on track.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Primary Action - Go to Home */}
            <Button
              size="lg"
              onClick={handleGoHome}
              className="w-full bg-gradient-to-r from-[#20B2AA] to-[#1a9088] hover:from-[#1a9088] hover:to-[#158f87] text-white shadow-md"
            >
              <Home className="mr-2 h-5 w-5" />
              Go to Home
            </Button>

            {/* Secondary Action - Go Back */}
            <Button
              variant="outline"
              size="lg"
              onClick={handleGoBack}
              className="w-full border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA]/5"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-gradient-to-r from-[#20B2AA]/5 to-[#1a9088]/5 border border-[#20B2AA]/20 rounded-lg">
              <p className="text-sm text-gray-700 text-center">
                <span className="font-semibold">Need help?</span> If you believe this is an error, please contact your system administrator.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            © 2025 Hooran CMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
