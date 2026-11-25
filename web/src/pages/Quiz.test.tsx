import { it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/preact";
import { QuizPage } from "./Quiz";
import { Session } from "../core/session";
import type { Backend } from "../core/types";
it("requires complete responses, persists actual scoring and shows honest informal result/history", async () => {
  const create = vi.fn(async () => {});
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async () => [
      {
        id: "q",
        userId: "a",
        quizType: "anxiety",
        score: 0,
        category: "low",
        takenAt: "2026-01-01Z",
      },
    ],
    create,
  } as unknown as Backend);
  session.start();
  render(<QuizPage session={session} />);
  fireEvent.click(screen.getByRole("button", { name: "Isi Stres Harian" }));
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan hasil kuis" }).closest("form")!,
  );
  expect(screen.getByRole("alert").textContent).toContain("semua");
  expect(create).not.toHaveBeenCalled();
  screen
    .getAllByRole("group")
    .forEach((group) =>
      fireEvent.click(within(group).getByLabelText("Hampir Selalu")),
    );
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan hasil kuis" }).closest("form")!,
  );
  await waitFor(() =>
    expect(create).toHaveBeenCalledWith(
      "quizHistory",
      "a",
      expect.objectContaining({
        quizType: "stress",
        score: 15,
        category: "high",
      }),
    ),
  );
  expect(await screen.findByText("Tinggi: 15 / 15")).toBeTruthy();
  expect(screen.getByText(/bukan diagnosis/)).toBeTruthy();
  expect(screen.getByText(/Kecemasan: 0/)).toBeTruthy();
});
