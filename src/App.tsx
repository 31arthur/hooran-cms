import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-6xl font-bold mb-4">Hooran CMS</h1>
          <p className="text-xl text-muted-foreground mb-2">
            A modern Content Management System
          </p>
          <p className="text-sm text-muted-foreground">
            Built with React, TypeScript, Tailwind CSS & shadcn/ui
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button variant="default" size="lg">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>

        <div className="mt-8 p-6 bg-card rounded-lg border shadow-sm max-w-md">
          <h2 className="text-lg font-semibold mb-2 text-primary">
            Seafoam Green Theme
          </h2>
          <p className="text-sm text-muted-foreground">
            The primary color (#20B2AA) is applied throughout the interface,
            as demonstrated by the "Get Started" button and this heading.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
