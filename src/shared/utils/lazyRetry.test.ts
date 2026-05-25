import { describe, it, expect, vi, beforeEach } from "vitest";
import { lazyRetry } from "./lazyRetry";
import * as React from "react";

// Mock React.lazy
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    lazy: vi.fn((factory) => factory),
  };
});

describe("lazyRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    // Mock window.location.reload
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: vi.fn() },
    });
    // Mock console.warn and console.error
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should load component successfully on first try", async () => {
    const mockComponent = { default: () => null };
    const componentImport = vi.fn().mockResolvedValue(mockComponent);
    
    const factory = lazyRetry(componentImport, "TestComponent") as unknown as () => Promise<any>;
    const result = await factory();
    
    expect(result).toBe(mockComponent);
    expect(window.localStorage.getItem("lazy-retry-TestComponent-refreshed")).toBe("false");
  });

  it("should force refresh on first failure", async () => {
    const error = new Error("ChunkLoadError");
    const componentImport = vi.fn().mockRejectedValue(error);
    
    const factory = lazyRetry(componentImport, "TestComponent") as unknown as () => Promise<any>;
    const result = await factory();
    
    expect(window.location.reload).toHaveBeenCalled();
    expect(window.localStorage.getItem("lazy-retry-TestComponent-refreshed")).toBe("true");
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to load chunk for TestComponent. Force refreshing...",
      error,
    );
    // Should return a dummy component
    expect(result.default).toBeDefined();
  });

  it("should throw error if failed after refresh", async () => {
    window.localStorage.setItem("lazy-retry-TestComponent-refreshed", "true");
    const error = new Error("Persistent Error");
    const componentImport = vi.fn().mockRejectedValue(error);
    
    const factory = lazyRetry(componentImport, "TestComponent") as unknown as () => Promise<any>;
    
    await expect(factory()).rejects.toThrow("Persistent Error");
    expect(window.location.reload).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "Failed to load chunk for TestComponent even after refresh.",
      error,
    );
  });
});
