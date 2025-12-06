/**
 * Content script를 IIFE 형식으로 빌드
 * Chrome content_scripts는 ES 모듈을 지원하지 않으므로 별도 빌드 필요
 */
import * as esbuild from 'esbuild';
import { mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const outDir = resolve(rootDir, 'dist/src/content');

// 출력 디렉터리 생성
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

// Content script 빌드
await esbuild.build({
  entryPoints: [resolve(rootDir, 'src/content/selection.ts')],
  bundle: true,
  format: 'iife',
  outfile: resolve(outDir, 'selection.js'),
  target: 'es2020',
  minify: false,
});

console.log('✓ Content script built (IIFE format)');

