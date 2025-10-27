# Hooran CMS - Complete Setup Commands

This document contains all the commands used to initialize the Hooran CMS project from scratch.

## Step 1: Create Vite Project with React & TypeScript

```bash
# Create a new Vite project with React and TypeScript
npm create vite@latest hooran-cms -- --template react-ts

# Navigate to project directory
cd hooran-cms

# Install dependencies
npm install
```

## Step 2: Install and Configure Tailwind CSS

```bash
# Install Tailwind CSS and Vite plugin
npm install -D tailwindcss @tailwindcss/vite

# Install Node types for path resolution
npm install -D @types/node
```

### Create tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#20B2AA',
          50: '#E5F8F7',
          100: '#CCF1EE',
          200: '#99E3DD',
          300: '#66D5CC',
          400: '#33C7BB',
          500: '#20B2AA',
          600: '#1A8E88',
          700: '#136B66',
          800: '#0D4744',
          900: '#062422',
          950: '#031211',
        },
      },
    },
  },
  plugins: [],
}
```

### Create postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
  },
}
```

### Update vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Update src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 177 69% 41%;
    --primary-foreground: 0 0% 100%;
    /* ... other CSS variables ... */
  }
}
```

## Step 3: Configure TypeScript Path Aliases

### Update tsconfig.app.json
Add to `compilerOptions`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Step 4: Initialize shadcn/ui

```bash
# Install shadcn/ui dependencies
npm install clsx tailwind-merge class-variance-authority lucide-react @radix-ui/react-slot
```

### Create components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Create src/lib/utils.ts
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Add shadcn/ui Button Component
```bash
npx shadcn@latest add button
```

## Step 5: Run the Development Server

```bash
npm run dev
```

Your application will be available at: http://localhost:5173/

## Quick Start (If Already Set Up)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Adding More shadcn/ui Components

```bash
# Examples of adding components
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
```

## Firebase Setup (Coming in Phase 1)

```bash
# Install Firebase
npm install firebase

# Create .env file with your Firebase config
# See SETUP.md for environment variables
```

## Verification

After setup, verify everything works:

1. Development server starts without errors
2. The page displays "Hooran CMS" heading
3. "Get Started" button has Seafoam Green background (#20B2AA)
4. No console errors in browser
5. Hot Module Replacement (HMR) works when editing files

## Troubleshooting

### If npm create vite fails:
```bash
# Try with explicit npx
npx create-vite@latest hooran-cms --template react-ts
```

### If Tailwind styles don't apply:
```bash
# Check that Tailwind directives are in src/index.css
# Restart the dev server
npm run dev
```

### If path aliases don't work:
```bash
# Ensure both tsconfig.app.json and vite.config.ts have the alias configuration
# Restart your IDE/editor
```

### If shadcn components have wrong path:
```bash
# Move components to correct location if needed
mkdir -p src/components/ui
mv @/components/ui/* src/components/ui/
rm -rf @
```

## Project Status

✅ **Completed:**
- Vite + React + TypeScript setup
- Tailwind CSS v4 with Vite plugin
- Custom Seafoam Green (#20B2AA) theme
- shadcn/ui configuration
- Button component demo
- Path aliases
- Development server running

🚧 **Next Steps:**
- Firebase Authentication
- Firestore database setup
- Content management features
- Dashboard layout
- User authentication UI
