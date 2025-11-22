import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve, join } from 'path';
import { copyFileSync, existsSync, renameSync, readFileSync, writeFileSync, readdirSync } from 'fs';

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
                // Read the file content
                let content = readFileSync(srcPath, 'utf-8');
                // Fix paths: replace ../assets/ with ./assets/
                content = content.replace(/\.\.\/assets\//g, './assets/');
                // Fix paths: replace ../devtools.js with ./devtools.js
                content = content.replace(/\.\.\/devtools\.js/g, './devtools.js');
                // Fix paths: replace ../background.js with ./background.js (if needed)
                content = content.replace(/\.\.\/background\.js/g, './background.js');
                // Write to destination with fixed paths
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
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }
          if (chunkInfo.name === 'devtoolsScript') {
            return 'devtools.js';
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

