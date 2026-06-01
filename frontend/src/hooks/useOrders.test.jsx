import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/api/orders", () => ({
  ordersApi: {
    list: vi.fn().mockResolvedValue({ count: 0, results: [] }),
    earnings: vi
      .fn()
      .mockResolvedValue({ in_escrow: "200.00", earned: "85.00", currency: "EUR" }),
  },
}));

import { useEarnings, useOrders } from "./useOrders";
import { ordersApi } from "@/api/orders";

function wrapper({ children }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useOrders", () => {
  it("passes the role filter through to the API", async () => {
    const { result } = renderHook(() => useOrders({ role: "writer" }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(ordersApi.list).toHaveBeenCalledWith({ role: "writer" });
  });
});

describe("useEarnings", () => {
  it("returns the writer earnings summary", async () => {
    const { result } = renderHook(() => useEarnings(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.earned).toBe("85.00");
  });
});
