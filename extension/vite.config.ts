import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 재귀적으로 디렉터리 복사
function copyDirRecursive(src: string, dest: string) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = resolve(src, entry);
    const destPath = resolve(dest, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/service.ts'),
        options: resolve(__dirname, 'src/options/index.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'src/background/service.js';
          }
          return 'src/[name]/index.js';
        },
        chunkFileNames: 'src/lib/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            if (assetInfo.name === 'selection.css' || assetInfo.name === 'popup.css') {
              return 'src/content/popup.css';
            }
            return 'src/options/style.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
    target: 'esnext',
    minify: false,
    sourcemap: false,
  },
  plugins: [
    {
      name: 'copy-static-files',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');

        // manifest.json 복사
        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(distDir, 'manifest.json')
        );

        // icons 복사
        const iconsDir = resolve(distDir, 'icons');
        if (!existsSync(iconsDir)) {
          mkdirSync(iconsDir, { recursive: true });
        }
        const iconSizes = ['16', '32', '48', '128', '256'];
        iconSizes.forEach((size) => {
          const iconPath = resolve(__dirname, `icons/${size}.png`);
          if (existsSync(iconPath)) {
            copyFileSync(iconPath, resolve(iconsDir, `${size}.png`));
          }
        });

        // assets 복사
        const assetsDir = resolve(distDir, 'assets');
        if (!existsSync(assetsDir)) {
          mkdirSync(assetsDir, { recursive: true });
        }
        const dictPath = resolve(__dirname, 'assets/dict_en_ko_min.json');
        if (existsSync(dictPath)) {
          copyFileSync(dictPath, resolve(assetsDir, 'dict_en_ko_min.json'));
        }

        // popup.css 복사
        const popupCssPath = resolve(__dirname, 'src/content/popup.css');
        const contentDir = resolve(distDir, 'src/content');
        if (!existsSync(contentDir)) {
          mkdirSync(contentDir, { recursive: true });
        }
        if (existsSync(popupCssPath)) {
          copyFileSync(popupCssPath, resolve(contentDir, 'popup.css'));
        }

        console.log('✓ Static files copied to dist/');
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});

