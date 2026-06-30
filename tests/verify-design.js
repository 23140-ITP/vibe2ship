import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let errors = [];

function checkFileExists(filePath) {
  const fullPath = path.join(rootDir, filePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`File not found: ${filePath}`);
    return null;
  }
  return fs.readFileSync(fullPath, 'utf8');
}

// 1. Verify index.html
const indexHtml = checkFileExists('index.html');
if (indexHtml) {
  if (!indexHtml.includes('fonts.googleapis.com')) {
    errors.push('index.html: Missing googleapis preconnect');
  }
  if (!indexHtml.includes('fonts.gstatic.com')) {
    errors.push('index.html: Missing gstatic preconnect');
  }
  if (!indexHtml.includes('EB+Garamond') || !indexHtml.includes('Inter')) {
    errors.push('index.html: Missing Google Fonts (EB Garamond / Inter)');
  }
}

// 2. Verify package.json
const packageJsonStr = checkFileExists('package.json');
if (packageJsonStr) {
  const pkg = JSON.parse(packageJsonStr);
  const deps = pkg.dependencies || {};
  if (!deps['@google/generative-ai']) {
    errors.push('package.json: Missing dependency @google/generative-ai');
  }
  if (!deps['lucide-react']) {
    errors.push('package.json: Missing dependency lucide-react');
  }
}

// 3. Verify src/index.css
const indexCss = checkFileExists('src/index.css');
if (indexCss) {
  const checks = [
    { name: 'Canvas Color (#f5f5f5)', regex: /--color-canvas:\s*#f5f5f5/i },
    { name: 'Ink Color (#0c0a09)', regex: /--color-ink:\s*#0c0a09/i },
    { name: 'Mint Gradient Orb Color', regex: /--color-gradient-mint:\s*#[0-9a-fA-F]{6}/ },
    { name: 'Peach Gradient Orb Color', regex: /--color-gradient-peach:\s*#[0-9a-fA-F]{6}/ },
    { name: 'Pill Radius Token', regex: /--rounded-pill:\s*9999px/ },
    { name: 'Card Radius Token', regex: /--rounded-xl:\s*16px/ },
    { name: 'Prefers-reduced-motion media query', regex: /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/ },
    { name: 'Card style class', regex: /\.card\s*\{[^}]*border-radius:\s*(var\(--rounded-xl\)|16px)/ },
    { name: 'Btn style class', regex: /\.btn\s*\{[^}]*border-radius:\s*(var\(--rounded-pill\)|9999px)/ },
    { name: 'Floating gradient orbs container', regex: /\.gradient-orbs-container/ },
    { name: 'Orb base class', regex: /\.orb/ }
  ];

  checks.forEach(check => {
    if (!check.regex.test(indexCss)) {
      errors.push(`src/index.css: Missing or incorrect ${check.name}`);
    }
  });
}

// 4. Verify src/components/Navigation.jsx
const navJsx = checkFileExists('src/components/Navigation.jsx');
if (navJsx) {
  const expectedIcons = ['Settings', 'Sparkles', 'Layers', 'Calendar', 'Play', 'Clock'];
  expectedIcons.forEach(icon => {
    if (!navJsx.includes(icon)) {
      errors.push(`src/components/Navigation.jsx: Missing Lucide icon usage/import of ${icon}`);
    }
  });
}

if (errors.length > 0) {
  console.error('\n❌ Verification Failed:');
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('\n✨ All design system verifications passed successfully! ✨');
}
