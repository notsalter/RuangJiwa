import { afterEach } from "vitest";
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }),
});
import { cleanup } from "@testing-library/preact";
afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});
