import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Login from "./Login";

vi.mock("@/api/auth", () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({ access: "a", refresh: "r" }),
    me: vi.fn().mockResolvedValue({ id: 1, email: "u@example.com", is_writer: false }),
  },
}));

import { authApi } from "@/api/auth";

function renderLogin() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Login page", () => {
  beforeEach(() => {
    authApi.login.mockClear();
    authApi.me.mockClear();
  });

  it("calls authApi.login when the form is submitted", async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/e-mail/i), "user@example.com");
    await userEvent.type(screen.getByLabelText(/mot de passe/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith("user@example.com", "secret"),
    );
  });
});
