import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
export default defineConfig({
  plugins: [preact()],
  esbuild: {
    tsconfigRaw: {
      compilerOptions: { jsx: "react-jsx", jsxImportSource: "preact" },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["tests/**", "e2e/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.*", "src/test/**", "src/main.tsx"],
    },
  },
});
