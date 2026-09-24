import { describe, it, expect } from "vitest";
import { getInitials } from "./initials";

describe("getInitials", () => {
  it("extracts first two initials in uppercase", () => {
    expect(getInitials("Rafael Duarte")).toBe("RD");
    expect(getInitials("Zé Ricardo")).toBe("ZR");
    expect(getInitials("Lionel Andres Messi")).toBe("LA");
    expect(getInitials("Neymar")).toBe("N");
  });

  it("handles extra whitespace and special spacing", () => {
    expect(getInitials("  Carlos   Eduardo  ")).toBe("CE");
  });

  it("returns fallback when name is null, undefined, or empty", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials(null)).toBe("");
    expect(getInitials(undefined)).toBe("");
    expect(getInitials("", "JG")).toBe("JG");
    expect(getInitials(null, "JG")).toBe("JG");
  });
});
