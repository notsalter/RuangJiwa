import { beforeEach, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { Session } from "../core/session";
import type { Backend } from "../core/types";
import { useAvatar } from "./avatar";
let observe: Parameters<Backend["observe"]>[0];
const blob = () => new Blob(["image"], {type: "image/png"});
function setup(read = vi.fn(async () => blob())) {
  let path = "profile_images/a/first";
  const session = new Session({ observe: (cb: Parameters<Backend["observe"]>[0]) => {observe = cb; cb({uid: "a", email: null}); return () => {};}, profile: async (uid: string) => ({id: uid, profileImagePath: path}), getPhoto: read, logout: async () => {} } as unknown as Backend);
  session.start();
  function View() { const image = useAvatar(session); return <>{image.url && <img alt="avatar" src={image.url} />}{image.loading && <span>loading</span>}{image.error && <span role="alert">{image.error}</span>}<button onClick={image.retry}>Retry</button><button onClick={image.failed}>Decode failure</button></>; }
  const view = render(<View />);
  return { session, read, view, replace: async () => {path = "profile_images/a/second"; await session.refreshProfile();} };
}
const create = vi.fn(), revoke = vi.fn();
beforeEach(() => {
  create.mockReset().mockImplementation(() => `blob:trusted-${create.mock.calls.length}`); revoke.mockReset();
  Object.defineProperty(URL, "createObjectURL", {configurable: true, value: create});
  Object.defineProperty(URL, "revokeObjectURL", {configurable: true, value: revoke});
  Object.defineProperty(navigator, "onLine", {configurable: true, value: true});
});
it("revokes replacement synchronously then logout; unmount disposes the live URL", async () => {
  const {session, replace, view} = setup();
  await waitFor(() => expect(screen.getByAltText("avatar").getAttribute("src")).toBe("blob:trusted-1"));
  await act(replace);
  await waitFor(() => expect(screen.getByAltText("avatar").getAttribute("src")).toBe("blob:trusted-2"));
  expect(revoke).toHaveBeenCalledWith("blob:trusted-1");
  const logout = session.logout();
  expect(revoke).toHaveBeenCalledWith("blob:trusted-2");
  await act(async () => {await logout;});
  expect(screen.queryByAltText("avatar")).toBeNull();
  view.unmount();
});
it("offline invalidates a late read even when the same account and path return", async () => {
  let resolve!: (value: Blob) => void;
  const read = vi.fn(() => new Promise<Blob>(r => {resolve = r;}));
  const {session} = setup(read);
  await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
  const stale = resolve;
  act(() => {session.setOnline(false); session.setOnline(true);});
  await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
  await act(async () => {stale(blob());}); expect(create).not.toHaveBeenCalled();
  await act(async () => {resolve(blob());}); expect(create).toHaveBeenCalledTimes(1);
  act(() => {session.setOnline(false);}); expect(revoke).toHaveBeenCalledWith("blob:trusted-1");
});
it("account switch and unmount reject stale async reads", async () => {
  let resolve!: (value: Blob) => void;
  const read = vi.fn(() => new Promise<Blob>(r => {resolve = r;}));
  const {view} = setup(read);
  await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
  const old = resolve;
  act(() => observe({uid: "b", email: null}));
  await act(async () => old(blob())); expect(create).not.toHaveBeenCalled();
  view.unmount(); await act(async () => resolve(blob())); expect(create).not.toHaveBeenCalled();
});
it("read errors end loading and retry; image decode failure revokes once", async () => {
  const read = vi.fn().mockRejectedValueOnce(new Error("storage/unauthorized")).mockResolvedValue(blob());
  const {view} = setup(read);
  expect(await screen.findByRole("alert")).toBeTruthy(); expect(screen.queryByText("loading")).toBeNull();
  fireEvent.click(screen.getByText("Retry"));
  await waitFor(() => expect(screen.getByAltText("avatar").getAttribute("src")).toBe("blob:trusted-1"));
  fireEvent.click(screen.getByText("Decode failure"));
  await screen.findByRole("alert"); view.unmount();
  expect(revoke.mock.calls).toEqual([["blob:trusted-1"]]);
});
it("unmount revokes a successfully rendered URL", async () => {
  const {view} = setup();
  await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
  view.unmount(); expect(revoke).toHaveBeenCalledWith("blob:trusted-1");
});
