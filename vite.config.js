import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: 'public',
  publicDir: false, // Disable default public dir to avoid confusion
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './public/index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  base: '/',
  plugins: [
    {
      name: 'copy-samples',
      closeBundle() {
        // Copy samples directory to dist after build
        const samplesDir = join(__dirname, 'public', 'samples');
        const distSamplesDir = join(__dirname, 'dist', 'samples');

        try {
          mkdirSync(distSamplesDir, { recursive: true });
          const files = readdirSync(samplesDir);
          files.forEach(file => {
            copyFileSync(
              join(samplesDir, file),
              join(distSamplesDir, file)
            );
          });
          console.log('✓ Copied samples directory to dist');
        } catch (err) {
          console.error('Error copying samples:', err);
        }
      }
    }
  ]
});
