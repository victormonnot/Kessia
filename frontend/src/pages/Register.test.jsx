import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Register from "./Register";

vi.mock("@/api/auth", () => ({
  authApi: {
    register: vi.fn().mockResolvedValue({ access: "a", user: { id: 1, email: "u@example.com" } }),
    me: vi.fn().mockResolvedValue({ id: 1, email: "u@example.com", is_writer: false }),
  },
}));

import { authApi } from "@/api/auth";

function renderRegister() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/register"]}>
        <Register />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Register page", () => {
  beforeEach(() => {
    authApi.register.mockClear();
  });

  it("submits the new account payload", async () => {
    renderRegister();
    await userEvent.type(screen.getByLabelText("Prénom"), "Marie");
    await userEvent.type(screen.getByLabelText("Nom"), "Durand");
    await userEvent.type(screen.getByLabelText(/e-mail/i), "marie@example.com");
    await userEvent.type(screen.getByLabelText(/mot de passe/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    // TanStack Query v5 passes a second context arg to a bare mutationFn, so we
    // assert on the payload (first argument) only.
    await waitFor(() => expect(authApi.register).toHaveBeenCalled());
    expect(authApi.register.mock.calls[0][0]).toEqual({
      email: "marie@example.com",
      password: "password123",
      first_name: "Marie",
      last_name: "Durand",
    });
  });

  it("blocks submission when required fields are empty", async () => {
    renderRegister();
    await userEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

    await waitFor(() => expect(screen.getByText(/le prénom est requis/i)).toBeInTheDocument());
    expect(authApi.register).not.toHaveBeenCalled();
  });
});
