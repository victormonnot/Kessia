import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import OrderWorkspace from "./OrderWorkspace";
import { useAuthStore } from "@/store/authStore";

// Isolate the page from the live chat (WebSocket + messaging hooks).
vi.mock("@/components/messaging/ChatPanel", () => ({
  default: () => <div data-testid="chat-panel" />,
}));

const order = {
  id: 7,
  status: "delivered",
  payment_status: "held",
  amount: "250.00",
  currency: "EUR",
  message: "Merci de respecter le format IMRAD.",
  listing: { title: "Article cardiologie" },
  doctor: { id: 2, first_name: "Paul", last_name: "Martin" },
  writer: { id: 3, first_name: "Marie", last_name: "Durand" },
  deliverables: [
    { id: 1, filename: "article.pdf", note: "", uploaded_at: "2026-05-20T10:00:00Z" },
  ],
  attachments: [
    {
      id: 1,
      filename: "brief.pdf",
      note: "",
      uploaded_by: { id: 2, first_name: "Paul", last_name: "Martin" },
      uploaded_at: "2026-05-18T09:30:00Z",
    },
  ],
  events: [
    {
      id: 1,
      type: "placed",
      actor: { id: 2, first_name: "Paul", last_name: "Martin" },
      metadata: {},
      created_at: "2026-05-18T09:00:00Z",
    },
    {
      id: 2,
      type: "delivered",
      actor: { id: 3, first_name: "Marie", last_name: "Durand" },
      metadata: {},
      created_at: "2026-05-20T10:00:00Z",
    },
  ],
  has_review: false,
  created_at: "2026-05-18T09:00:00Z",
  updated_at: "2026-05-20T10:00:00Z",
};

vi.mock("@/hooks/useOrders", () => ({
  useOrder: () => ({ data: order, isLoading: false, isError: false, refetch: vi.fn() }),
  useOrderConversation: () => ({ data: { id: 99, order: 7 } }),
  useUploadOrderAttachment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  // Consumed by the embedded <OrderActions>.
  useUpdateOrderStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUploadDeliverable: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/commandes/7"]}>
        <Routes>
          <Route path="/commandes/:id" element={<OrderWorkspace />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("OrderWorkspace", () => {
  beforeEach(() => {
    // Signed in as the doctor (id 2) — the counterparty is the writer.
    useAuthStore.setState({ user: { id: 2, is_email_verified: true } });
  });

  it("centralises recap, chat, deliverables and contextual actions", () => {
    renderPage();

    // Recap: title, brief and counterparty (writer, from the doctor's side).
    expect(screen.getByText("Article cardiologie")).toBeInTheDocument();
    expect(screen.getByText(/format IMRAD/)).toBeInTheDocument();
    expect(screen.getByText("Marie Durand")).toBeInTheDocument();
    expect(screen.getByText("Rédacteur")).toBeInTheDocument();

    // Embedded chat + deliverable.
    expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
    expect(screen.getByText("article.pdf")).toBeInTheDocument();

    // Brief documents section: the source doc and the add control (order live).
    expect(screen.getByText("brief.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ajouter un document/i })).toBeInTheDocument();

    // Activity timeline rendered from the order's events.
    expect(screen.getByText("Commande passée")).toBeInTheDocument();
    expect(screen.getByText("Travail livré")).toBeInTheDocument();

    // Contextual action for a delivered order, doctor side.
    expect(
      screen.getByRole("button", { name: /confirmer la réception/i }),
    ).toBeInTheDocument();
    // The chat is on the page, so the standalone "Contacter" is hidden.
    expect(screen.queryByRole("button", { name: /contacter/i })).not.toBeInTheDocument();
  });
});
