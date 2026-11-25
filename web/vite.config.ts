import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
import { createManifest, normalizeBasePath } from './src/pwa/deployment';
import { isShellAssetPath } from './src/pwa/policy';

export default defineConfig(({ mode }) => {
  const base = normalizeBasePath(loadEnv(mode, process.cwd(), 'VITE_').VITE_BASE_PATH);
  return {
    base,
    plugins: [
      preact(),
      VitePWA({
        registerType: 'prompt',
        strategies: 'injectManifest',
        srcDir: 'src/pwa',
        filename: 'sw.ts',
        injectRegister: false,
        includeManifestIcons: false,
        manifest: createManifest(base),
        injectManifest: {
          globPatterns: ['index.html', 'assets/*.{js,css}', 'favicon.svg', 'icons/*.png'],
          manifestTransforms: [(entries) => ({
            manifest: [...new Map(entries.filter((entry) => isShellAssetPath(entry.url)).map((entry) => [entry.url, entry])).values()],
            warnings: [],
          })],
          rollupFormat: 'iife',
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: { target: 'es2022', sourcemap: false },
  };
});
