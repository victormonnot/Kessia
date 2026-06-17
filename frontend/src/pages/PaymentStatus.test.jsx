import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const confirm = vi.fn();
vi.mock("@/api/payments", () => ({
  paymentsApi: { confirm: (...args) => confirm(...args) },
}));

import PaymentStatus from "./PaymentStatus";

function renderAt(search) {
  return render(
    <MemoryRouter initialEntries={[`/paiement/statut${search}`]}>
      <PaymentStatus />
    </MemoryRouter>,
  );
}

describe("PaymentStatus page", () => {
  beforeEach(() => confirm.mockReset());

  it("shows confirmation when funds are held", async () => {
    confirm.mockResolvedValue({ payment_status: "held" });
    renderAt("?order=5");
    expect(await screen.findByText("Paiement confirmé")).toBeInTheDocument();
  });

  it("shows the processing state for a slow (async) payment", async () => {
    confirm.mockResolvedValue({ payment_status: "processing" });
    renderAt("?order=5");
    expect(await screen.findByText("Paiement en cours de traitement")).toBeInTheDocument();
  });

  it("shows a failure state for a failed payment", async () => {
    confirm.mockResolvedValue({ payment_status: "failed" });
    renderAt("?order=5");
    expect(await screen.findByText(/n'a pas abouti/)).toBeInTheDocument();
  });

  it("falls back to Stripe's redirect_status when no backend status is available", async () => {
    // No order id -> the backend sync is skipped; the page relies on the
    // redirect_status Stripe appends to the return URL.
    renderAt("?redirect_status=succeeded");
    expect(await screen.findByText("Paiement confirmé")).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
  });
});
