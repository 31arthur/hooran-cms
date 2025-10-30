import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Router } from './Router.tsx'
import { ToastProvider } from '@/presentation/context/ToastContext'
import { initializeDependencies } from '@/infrastructure/di/setup'

/**
 * Bootstrap Application
 *
 * Initializes the database and DI container before rendering the React app.
 * This ensures proper initialization order and testability.
 */
async function bootstrap() {
  try {
    console.log('🚀 Starting Hooran CMS...')

    // Step 1: Initialize DI Container
    initializeDependencies()
    console.log('✅ DI Container initialized')

    // Step 2: Firebase is already initialized in @/firebase/config
    // No need to call dbInitializer.initialize() again
    console.log('✅ Firebase already initialized from config')

    // Step 3: Render React App
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ToastProvider>
          <Router />
        </ToastProvider>
      </StrictMode>,
    )

    console.log('✅ Application started successfully')
  } catch (error) {
    console.error('❌ Application startup failed:', error)

    // Show user-friendly error message
    const rootElement = document.getElementById('root')
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, -apple-system, sans-serif;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">Application Startup Failed</h1>
          <p style="color: #64748b; max-width: 600px; text-align: center; margin-bottom: 2rem;">
            ${error instanceof Error ? error.message : 'Unknown error occurred during initialization'}
          </p>
          <button
            onclick="window.location.reload()"
            style="padding: 0.75rem 1.5rem; background: #20B2AA; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem;"
          >
            Retry
          </button>
        </div>
      `
    }
  }
}

// Start the application
bootstrap()
