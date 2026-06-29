import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import OrderTimeline from "./OrderTimeline";

describe("OrderTimeline", () => {
  it("renders an event per entry with its label and document detail", () => {
    render(
      <OrderTimeline
        events={[
          { id: 1, type: "placed", actor: null, metadata: {}, created_at: "2026-05-18T09:00:00Z" },
          {
            id: 2,
            type: "document_added",
            actor: { id: 2, first_name: "Paul", last_name: "Martin" },
            metadata: { filename: "brief.pdf" },
            created_at: "2026-05-18T09:30:00Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Commande passée")).toBeInTheDocument();
    expect(screen.getByText("Document ajouté")).toBeInTheDocument();
    expect(screen.getByText("brief.pdf")).toBeInTheDocument();
  });

  it("shows an empty state when there are no events", () => {
    render(<OrderTimeline events={[]} />);
    expect(screen.getByText(/aucune activité/i)).toBeInTheDocument();
  });
});
