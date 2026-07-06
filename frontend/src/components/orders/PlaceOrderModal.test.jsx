import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import PlaceOrderModal from "./PlaceOrderModal";

const navigate = vi.fn();
vi.mock("react-router-dom", async (orig) => {
  const actual = await orig();
  return { ...actual, useNavigate: () => navigate };
});

const createMutate = vi.fn().mockResolvedValue({ id: 42 });
vi.mock("@/hooks/useOrders", () => ({
  useCreateOrder: () => ({ mutateAsync: createMutate, isPending: false }),
}));

const uploadAttachment = vi.fn().mockResolvedValue({});
vi.mock("@/api/orders", () => ({
  ordersApi: { uploadAttachment: (...args) => uploadAttachment(...args) },
}));

describe("PlaceOrderModal", () => {
  it("creates the order, uploads the brief documents, then opens the order", async () => {
    render(
      <MemoryRouter>
        <PlaceOrderModal
          listing={{ id: 5, title: "Article cardiologie", price: "200.00" }}
          open
          onClose={vi.fn()}
        />
      </MemoryRouter>,
    );

    const file = new File(["data"], "brief.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText("brief.pdf")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /passer commande/i }));

    await waitFor(() =>
      expect(createMutate).toHaveBeenCalledWith({ listing: 5, message: "" }),
    );
    await waitFor(() => expect(uploadAttachment).toHaveBeenCalledTimes(1));
    expect(uploadAttachment.mock.calls[0][0]).toBe(42);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/commandes/42"));
  });
});
