const fs = require('fs');
const path = require('path');

// Mapping of old paths to new paths
const pathMappings = {
  '@/components/': '@/presentation/components/',
  '@/pages/': '@/presentation/pages/',
  '@/context/': '@/presentation/context/',
  '@/hooks/': '@/presentation/hooks/',
  '@/core/': '@/domain/',
};

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    for (const [oldPath, newPath] of Object.entries(pathMappings)) {
      const regex = new RegExp(oldPath.replace(/\//g, '\\/'), 'g');
      if (content.includes(oldPath)) {
        content = content.replace(regex, newPath);
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Error updating ${filePath}:`, err.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and other unnecessary directories
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        walkDirectory(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      updateImportsInFile(filePath);
    }
  });
}

// Start from src directory
const srcDir = path.join(__dirname, '..', 'src');
console.log('🔄 Updating import paths...\n');
walkDirectory(srcDir);
console.log('\n✅ Import path update complete!');
