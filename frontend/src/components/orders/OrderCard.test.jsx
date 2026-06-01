import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import OrderCard from "./OrderCard";

const order = {
  id: 1,
  status: "accepted",
  payment_status: "unpaid",
  amount: "250.00",
  currency: "EUR",
  listing: { title: "Article cardiologie" },
  doctor: { id: 2, first_name: "Paul", last_name: "Martin" },
  writer: { id: 3, first_name: "Marie", last_name: "Durand" },
  deliverables: [],
};

function renderCard(role) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <OrderCard order={order} role={role} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("OrderCard", () => {
  it("shows the pay action for an accepted, unpaid order (doctor view)", () => {
    renderCard("doctor");
    expect(screen.getByText("Article cardiologie")).toBeInTheDocument();
    expect(screen.getByText(/Marie Durand/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /payer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /annuler/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /contacter/i })).toBeInTheDocument();
  });
});
