import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Inbox from "./Inbox";

vi.mock("@/hooks/useMessaging", () => ({
  useConversations: () => ({
    data: {
      results: [
        {
          id: 5,
          other_user: { first_name: "Marie", last_name: "Durand" },
          order: 12,
          unread_count: 2,
          last_message: {
            body: "Bonjour, voici le brouillon.",
            created_at: "2026-05-20T10:00:00Z",
          },
        },
      ],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("Inbox page", () => {
  it("renders the conversation list with unread badge", () => {
    render(
      <MemoryRouter initialEntries={["/messages"]}>
        <Inbox />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Messagerie" })).toBeInTheDocument();
    expect(screen.getByText("Marie Durand")).toBeInTheDocument();
    expect(screen.getByText("Bonjour, voici le brouillon.")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
