import { describe, expect, it } from "vitest";

import { errorMessage, formatPrice, fullName, initials } from "./format";

describe("format helpers", () => {
  it("formatPrice renders EUR amounts and handles invalid input", () => {
    const out = formatPrice("250");
    expect(out).toMatch(/250/);
    expect(out).toMatch(/€/);
    expect(formatPrice(null)).toBe("—");
    expect(formatPrice("abc")).toBe("—");
  });

  it("fullName builds a name with sensible fallbacks", () => {
    expect(fullName({ first_name: "Marie", last_name: "Durand" })).toBe("Marie Durand");
    expect(fullName({ email: "a@b.c" })).toBe("a@b.c");
    expect(fullName(null, "Anonyme")).toBe("Anonyme");
  });

  it("initials derives uppercase initials", () => {
    expect(initials({ first_name: "Marie", last_name: "Durand" })).toBe("MD");
    expect(initials({ email: "zoe@x.fr" })).toBe("Z");
    expect(initials(null)).toBe("?");
  });

  it("errorMessage extracts DRF detail and field errors", () => {
    expect(errorMessage({ response: { data: { detail: "Boom" } } })).toBe("Boom");
    expect(errorMessage({ response: { data: { email: ["Invalide"] } } })).toBe("Invalide");
    expect(errorMessage({}, "Repli")).toBe("Repli");
  });
});
