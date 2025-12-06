/**
 * checksum.js - ZIP 파일 SHA256 체크섬 생성 및 versions.json 생성
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

// package.json에서 버전 읽기
const packageJson = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

// ZIP 파일 찾기
const zipFilename = `EngEagle_v${version}_mv3.zip`;
const zipPath = resolve(distDir, zipFilename);

console.log(`🔐 Generating SHA256 checksum...\n`);

// ZIP 파일 확인
if (!existsSync(zipPath)) {
  console.error(`❌ Error: ${zipFilename} not found. Run "npm run zip" first.`);
  process.exit(1);
}

// SHA256 해시 계산
const fileBuffer = readFileSync(zipPath);
const hashSum = createHash('sha256');
hashSum.update(fileBuffer);
const hex = hashSum.digest('hex');

console.log(`   📁 File: ${zipFilename}`);
console.log(`   🔑 SHA256: ${hex}`);

// sha256.txt 저장
const checksumContent = `${hex}  ${zipFilename}\n`;
const checksumPath = resolve(distDir, 'sha256.txt');
writeFileSync(checksumPath, checksumContent, 'utf8');
console.log(`   💾 Saved: sha256.txt`);

// versions.json 생성
const today = new Date().toISOString().split('T')[0];
const versionsData = {
  version: version,
  date: today,
  files: {
    zip: zipFilename,
    sha256: 'sha256.txt'
  },
  checksum: hex
};

const versionsPath = resolve(distDir, 'versions.json');
writeFileSync(versionsPath, JSON.stringify(versionsData, null, 2), 'utf8');
console.log(`   💾 Saved: versions.json`);

console.log(`\n✅ Checksum generation complete!\n`);

// 결과 출력
console.log('📋 versions.json content:');
console.log(JSON.stringify(versionsData, null, 2));
console.log('');

