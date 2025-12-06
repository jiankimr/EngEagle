/**
 * resize-logo.js - 로고를 아이콘 크기로 리사이즈
 */

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionDir = resolve(__dirname, '..');
const rootDir = resolve(extensionDir, '..');

// 원본 로고 경로
const logoPath = resolve(rootDir, 'images/logo.png');
const iconsDir = resolve(extensionDir, 'icons');

// 아이콘 크기
const sizes = [16, 48, 128, 256];

console.log('🖼️  Resizing logo to icon sizes...\n');
console.log(`   Source: ${logoPath}\n`);

async function resizeIcons() {
  for (const size of sizes) {
    const outputPath = resolve(iconsDir, `${size}.png`);
    
    await sharp(logoPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`   ✅ ${size}x${size} → icons/${size}.png`);
  }
  
  console.log('\n✅ Icons generated successfully!\n');
}

resizeIcons().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

