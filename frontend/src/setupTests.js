import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement ResizeObserver, which some Radix primitives (e.g. the
// checkbox's hidden bubble input) reference on mount. Provide a no-op stub.
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserver;
