import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
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
