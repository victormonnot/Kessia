import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Requests from "./Requests";

vi.mock("@/hooks/useRequests", () => ({
  useRequests: () => ({
    data: {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 7,
          title: "Revue systématique en oncologie",
          status: "open",
          deadline: "2026-07-15",
          budget: "400.00",
          specialty: "oncologie",
          proposals_count: 2,
        },
      ],
    },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));

function renderRequests() {
  return render(
    <MemoryRouter initialEntries={["/requests"]}>
      <Requests />
    </MemoryRouter>,
  );
}

describe("Requests page", () => {
  it("renders the request board and cards", () => {
    renderRequests();
    expect(screen.getByRole("heading", { name: "Demandes" })).toBeInTheDocument();
    expect(screen.getByText("Revue systématique en oncologie")).toBeInTheDocument();
    expect(screen.getByText("2 propositions")).toBeInTheDocument();
  });
});
