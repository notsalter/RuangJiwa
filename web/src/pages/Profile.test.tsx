import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { AvatarSaveError } from "../services/avatar";
import { ProfilePage } from "./Profile";
import { Session } from "../core/session";
import type { Backend } from "../core/types";
it("edits name/photo with immutable account email and safe reset feedback", async () => {
  const saveProfile = vi.fn(async () => {}),
    resetPassword = vi.fn(async () => {});
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: "account@example.test" });
      return () => {};
    },
    profile: async () => ({
      id: "a",
      name: "Nama sebelumnya",
      email: "wrong-profile@example.test",
      photoUrl: "javascript:alert(1)",
    }),
    saveProfile,
    resetPassword,
  } as unknown as Backend);
  session.start();
  render(<ProfilePage session={session} />);
  await waitFor(() =>
    expect(
      (screen.getByLabelText("Nama profil") as HTMLInputElement).value,
    ).toBe("Nama sebelumnya"),
  );
  expect((screen.getByLabelText("Email akun") as HTMLInputElement).value).toBe(
    "account@example.test",
  );
  expect(screen.getByLabelText("Email akun").hasAttribute("readonly")).toBe(
    true,
  );
  expect(screen.queryByRole("img")).toBeNull();
  fireEvent.input(screen.getByLabelText("Nama profil"), {
    target: { value: "Nama baru" },
  });
  const photo = new File(["photo"], "photo.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Foto profil (opsional)"), {
    target: { files: [photo] },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan profil" }).closest("form")!,
  );
  await waitFor(() =>
    expect(saveProfile).toHaveBeenCalledWith("a", "Nama baru", photo),
  );
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Simpan profil" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Kirim pemulihan kata sandi" }),
  );
  await waitFor(() =>
    expect(resetPassword).toHaveBeenCalledWith("account@example.test"),
  );
  expect(await screen.findByText(/Jika email/)).toBeTruthy();
});
it("partial avatar failure stays visible without false success and retains selected file for retry", async () => {
  const saveProfile = vi.fn().mockRejectedValueOnce(new AvatarSaveError(new Error("permission-denied"))).mockResolvedValue(undefined);
  const session = new Session({observe: (cb: Parameters<Backend["observe"]>[0]) => {cb({uid: "a", email: null}); return () => {};}, profile: async () => ({id: "a"}), saveProfile} as unknown as Backend);
  session.start(); render(<ProfilePage session={session} />);
  await waitFor(() => expect(screen.queryByText(/Memuat profil/)).toBeNull());
  fireEvent.input(screen.getByLabelText("Nama profil"), {target:{value:"New"}});
  const photo = new File(["image"], "x.png", {type:"image/png"});
  fireEvent.change(screen.getByLabelText("Foto profil (opsional)"), {target:{files:[photo]}});
  const form = screen.getByRole("button", {name:"Simpan profil"}).closest("form")!;
  fireEvent.submit(form);
  expect(await screen.findByText(/tersimpan sebagian/)).toBeTruthy();
  expect(screen.queryByText("Profil tersimpan.")).toBeNull();
  fireEvent.submit(form);
  await screen.findByText("Profil tersimpan.");
  expect(saveProfile).toHaveBeenLastCalledWith("a", "New", photo);
});
it("renders an authenticated blob, never a stored HTTPS avatar", async () => {
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => { cb({uid: "a", email: null, photoURL: "https://example.test/old"}); return () => {}; },
    profile: async () => ({id: "a", profileImagePath: "profile_images/a/avatar.png", photoUrl: "https://example.test/old"}),
    getPhoto: async () => new Blob(["image"], {type:"image/png"}),
  } as unknown as Backend);
  const create = vi.fn(() => "blob:trusted");
  Object.defineProperty(URL, "createObjectURL", {configurable: true, value: create});
  Object.defineProperty(URL, "revokeObjectURL", {configurable: true, value: vi.fn()});
  session.start();
  render(<ProfilePage session={session} />);
  await waitFor(() => expect(screen.getByRole("img").getAttribute("src")).toBe("blob:trusted"));
  expect(create).toHaveBeenCalledTimes(1);
});
