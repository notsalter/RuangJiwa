export function firebaseConfig(env: Record<string, unknown>) {
  const keys = { apiKey: 'API_KEY', authDomain: 'AUTH_DOMAIN', projectId: 'PROJECT_ID', storageBucket: 'STORAGE_BUCKET', appId: 'APP_ID' };
  const config: Record<string, string> = {};
  for (const [key, suffix] of Object.entries(keys)) {
    const value = env[`VITE_FIREBASE_${suffix}`];
    if (typeof value !== 'string' || !value.trim()) return null;
    config[key] = value.trim();
  }
  return config;
}
export function safePhotoUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}
export function safeError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.startsWith('auth/') && ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password', 'auth/email-already-in-use'].includes(code)) return 'Tidak dapat masuk atau mendaftar dengan data tersebut. Periksa email dan kata sandi.';
  if (code === 'auth/too-many-requests') return 'Terlalu banyak percobaan. Tunggu sebelum mencoba lagi.';
  if (code === 'permission-denied') return 'Akses ditolak. Periksa sesi dan aturan akses Firebase.';
  if (code === 'auth/requires-recent-login') return 'Masuk kembali sebelum mengubah profil.';
  return 'Tidak dapat menyelesaikan permintaan. Periksa koneksi. Coba lagi.';
}
