/**
 * publish-to-netlify.js
 * dist 산출물을 루트의 download/releases/로 복사
 */

import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionDir = resolve(__dirname, '..');
const rootDir = resolve(extensionDir, '..');
const distDir = resolve(extensionDir, 'dist');
const downloadDir = resolve(rootDir, 'download');
const releasesDir = resolve(downloadDir, 'releases');

console.log('🚀 Publishing to download folder...\n');

// 디렉터리 생성
const dirs = [downloadDir, releasesDir];
for (const dir of dirs) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`   📁 Created: ${dir.replace(rootDir, '')}`);
  }
}

// package.json에서 버전 읽기
const packageJson = JSON.parse(readFileSync(resolve(extensionDir, 'package.json'), 'utf8'));
const version = packageJson.version;

// 복사할 파일들
const filesToCopy = [
  `EngEagle_v${version}_mv3.zip`,
  'sha256.txt',
  'versions.json'
];

console.log('\n📦 Copying files to releases/:');

for (const file of filesToCopy) {
  const srcPath = resolve(distDir, file);
  const destPath = resolve(releasesDir, file);
  
  if (existsSync(srcPath)) {
    copyFileSync(srcPath, destPath);
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ⚠️  ${file} - Not found, skipping`);
  }
}

// versions.json을 download/ 최상위에도 복사
const versionsPath = resolve(distDir, 'versions.json');
const versionsDestPath = resolve(downloadDir, 'versions.json');
if (existsSync(versionsPath)) {
  copyFileSync(versionsPath, versionsDestPath);
  console.log(`   ✅ versions.json → download/`);
}

console.log('\n✅ Publish complete!');
console.log('\n📋 Next steps:');
console.log('   1. Commit and push to Git');
console.log('   2. Netlify will auto-deploy');
console.log('   3. Access /download page to download the extension\n');
