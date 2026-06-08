import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/api/listings", () => ({
  listingsApi: {
    list: vi.fn().mockResolvedValue({
      count: 1,
      results: [
        {
          id: 1,
          title: "Test",
          specialty: "cardiologie",
          deliverable_type: "research_paper",
          price: "100.00",
          turnaround_days: 5,
          writer: 9,
          writer_name: "A. Writer",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    }),
  },
}));

import { useListings } from "./useListings";
import { listingsApi } from "@/api/listings";

function wrapper({ children }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useListings", () => {
  it("returns paginated results from the API", async () => {
    const { result } = renderHook(() => useListings({ specialty: "cardiologie" }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listingsApi.list).toHaveBeenCalledWith({ specialty: "cardiologie" });
    expect(result.current.data.count).toBe(1);
    expect(result.current.data.results[0].title).toBe("Test");
  });
});
