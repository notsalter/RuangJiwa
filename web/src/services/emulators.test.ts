import { it, expect } from 'vitest';
import { emulatorEnabled } from './emulators';
it('only opts into loopback emulators for explicit demo project config', () => {
  expect(emulatorEnabled({})).toBe(false);
  expect(emulatorEnabled({ VITE_FIREBASE_EMULATORS: 'true', VITE_FIREBASE_PROJECT_ID: 'production-project' })).toBe(false);
  expect(emulatorEnabled({ VITE_FIREBASE_EMULATORS: 'false', VITE_FIREBASE_PROJECT_ID: 'demo-ruangjiwa' })).toBe(false);
  expect(emulatorEnabled({ VITE_FIREBASE_EMULATORS: 'true', VITE_FIREBASE_PROJECT_ID: 'demo-ruangjiwa' })).toBe(true);
});
