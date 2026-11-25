import type { ManifestOptions } from 'vite-plugin-pwa';

export function normalizeBasePath(value: string | undefined): string {
  if (value === undefined || value === '' || value === '/') return '/';
  const path = value.endsWith('/') ? value.slice(0, -1) : value;
  if (!path.startsWith('/') || !path.slice(1).split('/').every((part) => /^[A-Za-z0-9_-]+$/.test(part))) {
    throw new Error('VITE_BASE_PATH must be / or an absolute path of letters, digits, hyphens and underscores, such as /RuangJiwa/.');
  }
  return `${path}/`;
}

export function createManifest(base: string): Partial<ManifestOptions> {
  return {
    id: base,
    name: 'RuangJiwa',
    short_name: 'RuangJiwa',
    description: 'RuangJiwa: ruang untuk mencatat suasana hati dan menulis jurnal.',
    lang: 'id',
    dir: 'ltr',
    start_url: base,
    scope: base,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    icons: [
      { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${base}icons/icon-512-maskable.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
