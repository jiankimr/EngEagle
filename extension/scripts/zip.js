/**
 * zip.js - dist 디렉터리를 ZIP으로 압축
 */

import { createWriteStream, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

// package.json에서 버전 읽기
const packageJson = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

// 출력 파일명
const outputFilename = `EngEagle_v${version}_mv3.zip`;
const outputPath = resolve(distDir, outputFilename);

console.log(`📦 Creating ZIP archive: ${outputFilename}\n`);

// dist 디렉터리 확인
if (!existsSync(distDir)) {
  console.error('❌ Error: dist directory not found. Run "npm run build" first.');
  process.exit(1);
}

// 출력 스트림 생성
const output = createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // 최대 압축
});

// 이벤트 핸들러
output.on('close', () => {
  const size = (archive.pointer() / 1024).toFixed(2);
  console.log(`✅ Archive created successfully!`);
  console.log(`   📁 ${outputFilename}`);
  console.log(`   📊 Size: ${size} KB`);
  console.log(`   📍 Location: ${outputPath}\n`);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('⚠️  Warning:', err);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  console.error('❌ Archive error:', err);
  process.exit(1);
});

// 파이프 연결
archive.pipe(output);

// dist 디렉터리 내용 추가 (ZIP 파일 자체는 제외)
archive.glob('**/*', {
  cwd: distDir,
  ignore: ['*.zip', 'sha256.txt', 'versions.json'],
  dot: false,
});

// 아카이브 완료
archive.finalize();

