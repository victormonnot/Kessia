import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import WriterProfile from "./WriterProfile";

vi.mock("@/hooks/useWriters", () => ({
  useWriter: () => ({
    data: {
      id: 3,
      first_name: "Marie",
      last_name: "Durand",
      is_verified: true,
      avg_rating: 4.5,
      reviews_count: 1,
      specialties: ["cardiologie"],
      bio: "Rédactrice scientifique senior.",
      listings: [
        {
          id: 1,
          title: "Article cardiologie",
          price: "250.00",
          writer_name: "Marie Durand",
          writer_is_verified: true,
          writer_rating: 4.5,
          writer_reviews_count: 1,
          specialty: "cardiologie",
          deliverable_type: "research_paper",
          turnaround_days: 7,
        },
      ],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useReviews", () => ({
  useWriterReviews: () => ({
    data: {
      results: [
        {
          id: 1,
          doctor: { first_name: "Paul", last_name: "Martin" },
          rating: 5,
          comment: "Travail excellent, livré en avance.",
          created_at: "2026-05-01T10:00:00Z",
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useMessaging", () => ({
  useStartConversation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("WriterProfile page", () => {
  it("renders the writer header, listings and reviews", () => {
    render(
      <MemoryRouter initialEntries={["/redacteurs/3"]}>
        <WriterProfile />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Marie Durand" })).toBeInTheDocument();
    expect(screen.getByText("Vérifié")).toBeInTheDocument();
    expect(screen.getByText("Article cardiologie")).toBeInTheDocument();
    expect(screen.getByText("Travail excellent, livré en avance.")).toBeInTheDocument();
    expect(screen.getByText("Paul Martin")).toBeInTheDocument();
  });
});
