import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Listings from "./Listings";

vi.mock("@/hooks/useListings", () => ({
  useListings: () => ({
    data: {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          title: "Article de recherche en cardiologie",
          price: "250.00",
          writer_name: "Marie Durand",
          writer_is_verified: true,
          writer_rating: 4.5,
          writer_reviews_count: 3,
          specialty: "cardiology",
          deliverable_type: "research_paper",
          turnaround_days: 7,
        },
      ],
    },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));

function renderListings() {
  return render(
    <MemoryRouter initialEntries={["/listings"]}>
      <Listings />
    </MemoryRouter>,
  );
}

describe("Listings page", () => {
  it("renders the catalogue and listing cards", () => {
    renderListings();
    expect(screen.getByRole("heading", { name: "Annonces" })).toBeInTheDocument();
    expect(screen.getByText("Article de recherche en cardiologie")).toBeInTheDocument();
    expect(screen.getByText("Marie Durand")).toBeInTheDocument();
  });
});
