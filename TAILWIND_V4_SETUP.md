# Tailwind CSS v4 Setup Guide

## Overview
This project uses **Tailwind CSS v4** with the new `@tailwindcss/vite` plugin. Tailwind v4 has a different configuration approach compared to v3.

## Key Differences from v3

### 1. No More `tailwind.config.js`
Tailwind v4 uses CSS-based configuration instead of JavaScript configuration files.

### 2. No More PostCSS Config
The `postcss.config.js` file is not needed. The Vite plugin handles everything.

### 3. CSS-Based Theme Configuration
Theme customization is done using the `@theme` directive in CSS.

## Installation

```bash
npm install tailwindcss @tailwindcss/vite
```

## Configuration

### 1. Vite Config ([vite.config.ts](vite.config.ts))

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

### 2. CSS File ([src/index.css](src/index.css))

```css
@import "tailwindcss";

@theme {
  /* Custom color definitions */
  --color-primary-50: #E5F8F7;
  --color-primary-100: #CCF1EE;
  --color-primary-200: #99E3DD;
  --color-primary-300: #66D5CC;
  --color-primary-400: #33C7BB;
  --color-primary-500: #20B2AA;
  --color-primary-600: #1A8E88;
  --color-primary-700: #136B66;
  --color-primary-800: #0D4744;
  --color-primary-900: #062422;
  --color-primary-950: #031211;

  /* shadcn/ui theme colors */
  --color-primary: 177 69% 41%;
  --color-primary-foreground: 0 0% 100%;
  /* ... other colors ... */
}
```

## How It Works

### The `@import` Directive
Replace the old Tailwind directives:
```css
/* OLD (v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* NEW (v4) */
@import "tailwindcss";
```

### The `@theme` Directive
Define custom colors and design tokens:
```css
@theme {
  --color-primary-500: #20B2AA;
}
```

This makes `bg-primary-500` available as a utility class.

## Seafoam Green Theme

Our primary color (#20B2AA) is configured in two ways:

### 1. Full Color Scale (for direct use)
```css
@theme {
  --color-primary-50: #E5F8F7;   /* Lightest */
  --color-primary-500: #20B2AA;  /* Main color */
  --color-primary-950: #031211;  /* Darkest */
}
```

**Usage:**
```tsx
<div className="bg-primary-500 text-white">
  Using primary-500
</div>
```

### 2. HSL Variables (for shadcn/ui)
```css
@theme {
  --color-primary: 177 69% 41%;  /* HSL values for #20B2AA */
  --color-primary-foreground: 0 0% 100%;
}
```

**Usage:**
```tsx
<Button variant="default">
  Uses bg-primary from shadcn/ui
</Button>
```

## Using Colors

### Direct Color Classes
```tsx
// Background
<div className="bg-primary-500">Seafoam Green</div>

// Text
<div className="text-primary-500">Colored text</div>

// Border
<div className="border-primary-500">Colored border</div>

// Hover
<div className="hover:bg-primary-600">Hover effect</div>
```

### shadcn/ui Components
```tsx
// Button automatically uses the primary color
<Button variant="default">Primary Button</Button>

// Other components
<Card className="border-primary">Card</Card>
```

## Migration from v3

If you had a `tailwind.config.js` file, convert it to CSS:

### Before (v3)
```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: '#20B2AA',
      },
    },
  },
}
```

### After (v4)
```css
/* src/index.css */
@theme {
  --color-primary: #20B2AA;
}
```

## Common Issues

### Error: "Cannot apply unknown utility class"
This usually means:
1. You're using `@apply` with a class that doesn't exist
2. You forgot to use `@import "tailwindcss"` instead of `@tailwind` directives

**Solution:** Use explicit CSS properties or ensure the utility class is defined in `@theme`.

### PostCSS Errors
If you see PostCSS errors, make sure:
1. `postcss.config.js` is deleted
2. Only `@tailwindcss/vite` plugin is in `vite.config.ts`
3. Using `@import "tailwindcss"` in CSS

### HMR Not Working
Restart the dev server:
```bash
npm run dev
```

## File Structure

```
project/
├── src/
│   └── index.css          # Contains @import and @theme
├── vite.config.ts         # Contains tailwindcss() plugin
└── components.json        # shadcn config (no tailwind.config.js)
```

**Note:** No `tailwind.config.js` or `postcss.config.js` files!

## Benefits of v4

1. **Faster:** Native CSS parsing is faster than PostCSS
2. **Simpler:** No separate config files
3. **Type-safe:** CSS custom properties are easier to debug
4. **Modern:** Uses modern CSS features
5. **Colocation:** Theme config lives with CSS

## Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/v4-beta)
- [Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
- [@tailwindcss/vite Plugin](https://tailwindcss.com/docs/vite)

## Current Setup Summary

✅ Tailwind CSS v4.1.16
✅ @tailwindcss/vite v4.1.16
✅ No `tailwind.config.js`
✅ No `postcss.config.js`
✅ Using `@import "tailwindcss"`
✅ Theme defined with `@theme` directive
✅ Seafoam Green (#20B2AA) as primary color
✅ Full color scale (50-950)
✅ shadcn/ui compatible

**Status:** ✅ Working without errors!
