#!/usr/bin/env node

/**
 * Fix shadcn component paths on Windows
 *
 * On Windows, shadcn CLI creates components in @\components\ui instead of src/components/ui
 * This script moves them to the correct location
 */

const fs = require('fs');
const path = require('path');

const wrongPath = path.join(process.cwd(), '@', 'components', 'ui');
const correctPath = path.join(process.cwd(), 'src', 'components', 'ui');

// Check if wrong path exists
if (fs.existsSync(wrongPath)) {
  console.log('🔧 Found components in @\\components\\ui, moving to src/components/ui...');

  // Ensure correct path exists
  if (!fs.existsSync(correctPath)) {
    fs.mkdirSync(correctPath, { recursive: true });
  }

  // Get all files from wrong path
  const files = fs.readdirSync(wrongPath);

  files.forEach(file => {
    const wrongFile = path.join(wrongPath, file);
    const correctFile = path.join(correctPath, file);

    // Copy file
    fs.copyFileSync(wrongFile, correctFile);
    console.log(`  ✅ Moved ${file}`);
  });

  // Remove the @ directory
  fs.rmSync(path.join(process.cwd(), '@'), { recursive: true, force: true });
  console.log('🧹 Cleaned up @\\ directory');
  console.log('✅ All components moved successfully!');
} else {
  console.log('✅ Components are already in the correct location (src/components/ui)');
}
