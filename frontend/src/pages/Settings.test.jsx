import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Settings from "./Settings";
import { useAuthStore } from "@/store/authStore";

beforeEach(() => {
  useAuthStore.setState({
    accessToken: null,
    user: {
      id: 1,
      email: "doctor@kessia.demo",
      first_name: "Marie",
      last_name: "Durand",
      bio: "",
      is_writer: false,
      is_verified: false,
    },
  });
});

describe("Settings page", () => {
  it("renders profile and account sections for a doctor", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/settings"]}>
          <Settings />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("heading", { name: "Paramètres" })).toBeInTheDocument();
    expect(screen.getByText("doctor@kessia.demo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Marie")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /devenir rédacteur/i })).toBeInTheDocument();
  });
});
