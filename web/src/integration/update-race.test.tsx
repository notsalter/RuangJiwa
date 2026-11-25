import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/preact";
import { PwaControls } from "../pwa/PwaControls";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker;
});
it("rechecks unsaved changes when the consenting worker activates instead of blindly reloading", async () => {
  vi.stubEnv("PROD", true);
  const reload = vi.fn();
  const original = window;
  vi.stubGlobal("window", {
    matchMedia: original.matchMedia,
    addEventListener: original.addEventListener.bind(original),
    removeEventListener: original.removeEventListener.bind(original),
    location: { reload },
  });
  const worker = Object.assign(new EventTarget(), {
    state: "installed",
    postMessage: vi.fn(),
  });
  const registration = Object.assign(new EventTarget(), {
    waiting: worker,
    active: worker,
    installing: null,
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register: async () => registration },
  });
  const view = render(<PwaControls hasUnsavedChanges={false} />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Perbarui dan muat ulang" }),
  );
  expect(worker.postMessage).toHaveBeenCalledOnce();
  view.rerender(<PwaControls hasUnsavedChanges={true} />);
  worker.state = "activated";
  worker.dispatchEvent(new Event("statechange"));
  expect(reload).not.toHaveBeenCalled();
  expect((await screen.findByRole("alert")).textContent).toContain("jurnal");
});
