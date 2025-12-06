/**
 * create-icons.js - 플레이스홀더 아이콘 생성
 * 실제 배포 시에는 디자인된 PNG 아이콘으로 교체 필요
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const iconsDir = resolve(__dirname, '../icons');

// 아이콘 디렉터리 생성
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// 간단한 1x1 투명 PNG (Base64)
// 실제 배포 시에는 적절한 아이콘으로 교체해야 합니다
const minimalPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// 각 크기의 플레이스홀더 생성
const sizes = [16, 48, 128, 256];

console.log('🖼️  Creating placeholder icons...\n');

for (const size of sizes) {
  const filename = `${size}.png`;
  const filepath = resolve(iconsDir, filename);
  
  // 간단한 플레이스홀더 생성
  writeFileSync(filepath, minimalPng);
  console.log(`   ✅ icons/${filename}`);
}

console.log('\n⚠️  Note: These are placeholder icons (1x1 transparent PNG).');
console.log('   Replace with properly designed icons before publishing.\n');

