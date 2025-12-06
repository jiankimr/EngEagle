/**
 * pack.js - dist 디렉터리 검증 스크립트
 * 필수 파일 존재 여부 확인
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = resolve(__dirname, '../dist');

// 필수 파일 목록
const requiredFiles = [
  'manifest.json',
  'src/content/selection.js',
  'src/content/popup.css',
  'src/background/service.js',
  'src/options/index.html',
  'assets/dict_en_ko_min.json',
];

// 필수 디렉터리 목록
const requiredDirs = [
  'icons',
  'src/content',
  'src/background',
  'src/options',
  'assets',
];

console.log('🔍 Validating dist directory...\n');

let hasError = false;

// 디렉터리 검증
console.log('📁 Checking directories:');
for (const dir of requiredDirs) {
  const fullPath = resolve(distDir, dir);
  if (existsSync(fullPath)) {
    console.log(`  ✅ ${dir}`);
  } else {
    console.log(`  ❌ ${dir} - MISSING`);
    hasError = true;
  }
}

console.log('\n📄 Checking files:');
for (const file of requiredFiles) {
  const fullPath = resolve(distDir, file);
  if (existsSync(fullPath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    hasError = true;
  }
}

// 아이콘 검증 (경고만)
console.log('\n🖼️  Checking icons:');
const iconSizes = ['16', '32', '48', '128', '256'];
for (const size of iconSizes) {
  const iconPath = resolve(distDir, `icons/${size}.png`);
  if (existsSync(iconPath)) {
    console.log(`  ✅ icons/${size}.png`);
  } else {
    console.log(`  ⚠️  icons/${size}.png - Missing (placeholder needed)`);
  }
}

console.log('');

if (hasError) {
  console.error('❌ Validation FAILED: Some required files are missing.\n');
  process.exit(1);
} else {
  console.log('✅ Validation PASSED: All required files present.\n');
  process.exit(0);
}

