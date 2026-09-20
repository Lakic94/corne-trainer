import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base './' keeps the build portable: GitHub Pages, custom domains, and
// double-clicking dist/index.html all keep working.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile({ useRecommendedBuildConfig: true })],
  build: { outDir: 'dist', emptyOutDir: true },
});
