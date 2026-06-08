import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ForgotPassword from "./ForgotPassword";

vi.mock("@/api/auth", () => ({
  authApi: {
    requestPasswordReset: vi.fn().mockResolvedValue({ detail: "ok" }),
  },
}));

import { authApi } from "@/api/auth";

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <ForgotPassword />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ForgotPassword page", () => {
  beforeEach(() => {
    authApi.requestPasswordReset.mockClear();
  });

  it("submits the email and shows the confirmation screen", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/e-mail/i), "user@example.com");
    await userEvent.click(screen.getByRole("button", { name: /envoyer le lien/i }));

    await waitFor(() =>
      expect(authApi.requestPasswordReset).toHaveBeenCalledWith("user@example.com"),
    );
    expect(await screen.findByText(/vérifiez votre boîte mail/i)).toBeInTheDocument();
  });
});
