import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve, join } from 'path';
import { copyFileSync, existsSync, renameSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';

export default defineConfig({
  base: './', // Use relative paths for Chrome extension
  plugins: [
    vue(),
    {
      name: 'copy-manifest',
      closeBundle() {
        // Copy manifest.json to dist
        if (existsSync('manifest.json')) {
          copyFileSync('manifest.json', 'dist/manifest.json');
        }
        // Copy icons folder to dist
        const iconsDir = 'icons';
        const distIconsDir = 'dist/icons';
        if (existsSync(iconsDir)) {
          // Create dist/icons directory if it doesn't exist
          if (!existsSync(distIconsDir)) {
            mkdirSync(distIconsDir, { recursive: true });
          }
          // Copy all icon files
          const iconFiles = readdirSync(iconsDir);
          for (let i = 0; i < iconFiles.length; i++) {
            const file = iconFiles[i];
            const srcPath = join(iconsDir, file);
            const destPath = join(distIconsDir, file);
            copyFileSync(srcPath, destPath);
          }
        }
        // Move HTML files from dist/src/ to dist/ and fix paths
        const distSrcPath = 'dist/src';
        if (existsSync(distSrcPath)) {
          const files = readdirSync(distSrcPath);
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.endsWith('.html')) {
              const srcPath = join(distSrcPath, file);
              const destPath = join('dist', file);
              if (existsSync(srcPath)) {
                let content = readFileSync(srcPath, 'utf-8');
                content = content.replace(/\.\.\/assets\//g, './assets/');
                content = content.replace(/\.\.\/devtools\.js/g, './devtools.js');
                content = content.replace(/\.\.\/background\.js/g, './background.js');
                writeFileSync(destPath, content, 'utf-8');
              }
            }
          }
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        panel: resolve(__dirname, 'src/panel.html'),
        devtools: resolve(__dirname, 'src/devtools.html'),
        background: resolve(__dirname, 'src/background.ts'),
        devtoolsScript: resolve(__dirname, 'src/devtools.ts'),
        contentScript: resolve(__dirname, 'src/contentScript.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }
          if (chunkInfo.name === 'devtoolsScript') {
            return 'devtools.js';
          }
          if (chunkInfo.name === 'contentScript') {
            return 'contentScript.js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Check if the source path contains the HTML file name
          const source = assetInfo.source || '';
          if (typeof source === 'string') {
            if (source.includes('panel.html') || assetInfo.name === 'panel.html') {
              return 'panel.html';
            }
            if (source.includes('devtools.html') || assetInfo.name === 'devtools.html') {
              return 'devtools.html';
            }
          }
          if (assetInfo.name === 'panel.html') {
            return 'panel.html';
          }
          if (assetInfo.name === 'devtools.html') {
            return 'devtools.html';
          }
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});

