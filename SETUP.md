# Hooran CMS - Setup Guide

## Overview
Hooran CMS is a modern Content Management System built with React, TypeScript, Tailwind CSS, and shadcn/ui. The project features a custom **Seafoam Green (#20B2AA)** theme inspired by Strapi CMS.

## Technology Stack
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS v4 with @tailwindcss/vite plugin
- **UI Components:** shadcn/ui
- **Backend (Phase 1):** Firebase (Authentication & Firestore)

## Project Structure
```
Hooran CMS/
├── src/
│   ├── components/
│   │   └── ui/          # shadcn/ui components
│   ├── lib/
│   │   └── utils.ts     # Utility functions
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles with Tailwind & theme
├── public/              # Static assets
├── components.json      # shadcn/ui configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies
```

## Setup Instructions

### 1. Installation
All dependencies are already installed. If you need to reinstall:
```bash
npm install
```

### 2. Development Server
Start the development server:
```bash
npm run dev
```
The application will be available at: http://localhost:5173/

### 3. Build for Production
Create a production build:
```bash
npm run build
```

### 4. Preview Production Build
Preview the production build locally:
```bash
npm run preview
```

## Theme Configuration

### Primary Color - Seafoam Green
The project uses **#20B2AA** (Seafoam Green) as its primary color throughout the interface.

#### Tailwind Configuration
The color is defined in [tailwind.config.js](tailwind.config.js) with a full color scale:
```javascript
colors: {
  primary: {
    DEFAULT: '#20B2AA',
    50: '#E5F8F7',
    100: '#CCF1EE',
    // ... full scale from 50 to 950
  }
}
```

#### CSS Variables
The theme uses CSS variables defined in [src/index.css](src/index.css:13) (line 13):
```css
--primary: 177 69% 41%;  /* HSL values for #20B2AA */
```

### Using the Primary Color
You can use the primary color in multiple ways:

1. **Tailwind Classes:**
   ```tsx
   <div className="bg-primary text-primary-foreground">
     Content with Seafoam Green background
   </div>
   ```

2. **shadcn/ui Components:**
   ```tsx
   <Button variant="default">
     This button uses the primary color
   </Button>
   ```

3. **Direct Color Scale:**
   ```tsx
   <div className="bg-primary-500 text-primary-50">
     Using specific shade
   </div>
   ```

## shadcn/ui Components

### Adding New Components
To add more shadcn/ui components:
```bash
npx shadcn@latest add [component-name]
```

Examples:
```bash
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add dialog
```

### Available Components
Visit [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components) for the full list of available components.

### Component Configuration
Components are configured in [components.json](components.json) with:
- **Style:** New York
- **TypeScript:** Enabled
- **CSS Variables:** Enabled
- **Path Aliases:** @/components, @/lib, etc.

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

Configuration is in:
- [tsconfig.app.json](tsconfig.app.json:10-13) (TypeScript)
- [vite.config.ts](vite.config.ts:9-13) (Vite)

## Firebase Setup (Phase 1)

### Prerequisites
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication and Firestore Database

### Configuration (Coming Soon)
```bash
npm install firebase
```

Add your Firebase config to a `.env` file:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Key Features

### Current Implementation
- React 18 with TypeScript
- Vite 7 for fast development and builds
- Tailwind CSS v4 with custom Seafoam Green theme
- shadcn/ui component library
- Fully responsive design
- Path aliases for clean imports

### Coming Soon
- Firebase Authentication
- Firestore database integration
- Content management features
- User role management
- Media library
- API endpoints

## Development Notes

### Hot Module Replacement (HMR)
Vite provides instant HMR. Changes to components will reflect immediately without full page reload.

### Type Safety
The project uses strict TypeScript configuration for maximum type safety. All components are fully typed.

### Styling Approach
- Tailwind CSS for utility-first styling
- CSS variables for theme consistency
- shadcn/ui for accessible, customizable components

## Troubleshooting

### Port Already in Use
If port 5173 is already in use:
```bash
npm run dev -- --port 3000
```

### Clear Cache
If you encounter build issues:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Tailwind Not Working
Ensure the Tailwind directives are in [src/index.css](src/index.css):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Firebase Documentation](https://firebase.google.com/docs)

## License
MIT

## Contributing
Contributions are welcome! Please follow the existing code style and add tests for new features.
