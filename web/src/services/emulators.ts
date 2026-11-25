export const emulatorEnabled = (env: Record<string, unknown>) =>
  env.VITE_FIREBASE_EMULATORS === "true" &&
  env.VITE_FIREBASE_PROJECT_ID === "demo-ruangjiwa";
