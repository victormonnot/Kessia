import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import VerifyEmail from "./VerifyEmail";

vi.mock("@/api/auth", () => ({
  authApi: {
    verifyEmail: vi.fn().mockResolvedValue({ detail: "ok" }),
    me: vi.fn().mockResolvedValue({ id: 1, is_email_verified: true }),
  },
}));

import { authApi } from "@/api/auth";

function renderAt(path) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <VerifyEmail />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("VerifyEmail page", () => {
  beforeEach(() => {
    authApi.verifyEmail.mockClear();
  });

  it("auto-verifies with the uid/token from the URL and shows success", async () => {
    renderAt("/verify-email?uid=abc&token=xyz");
    await waitFor(() =>
      expect(authApi.verifyEmail).toHaveBeenCalledWith({ uid: "abc", token: "xyz" }),
    );
    expect(await screen.findByText(/adresse confirmée/i)).toBeInTheDocument();
  });

  it("shows an invalid-link message when params are missing", () => {
    renderAt("/verify-email");
    expect(screen.getByText(/lien invalide/i)).toBeInTheDocument();
    expect(authApi.verifyEmail).not.toHaveBeenCalled();
  });
});
