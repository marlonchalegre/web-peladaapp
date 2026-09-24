import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getClientVersion,
  isDevVersion,
  fetchVersionInfo,
  resetVersionCacheForTesting,
} from "./version";

describe("version", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetVersionCacheForTesting();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns default 'dev' when VITE_APP_VERSION is not set", () => {
    vi.stubEnv("VITE_APP_VERSION", "");
    expect(getClientVersion()).toBe("dev");
    expect(isDevVersion()).toBe(true);
  });

  it("returns VITE_APP_VERSION when configured", () => {
    vi.stubEnv("VITE_APP_VERSION", "20260924-1000");
    expect(getClientVersion()).toBe("20260924-1000");
    expect(isDevVersion()).toBe(false);
  });

  it("fetches version info successfully from /version.json", async () => {
    const mockData = {
      version: "20260924-1000",
      gitHash: "abcdef1",
      buildTime: "2026-09-24T10:00:00Z",
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const info = await fetchVersionInfo();
    expect(info).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/version.json?t="),
      { cache: "no-store" },
    );
  });

  it("deduplicates concurrent in-flight requests and caches result", async () => {
    const mockData = {
      version: "20260924-1000",
      gitHash: "abcdef1",
      buildTime: "2026-09-24T10:00:00Z",
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    // Fire 3 calls concurrently
    const [res1, res2, res3] = await Promise.all([
      fetchVersionInfo(),
      fetchVersionInfo(),
      fetchVersionInfo(),
    ]);

    expect(res1).toEqual(mockData);
    expect(res2).toEqual(mockData);
    expect(res3).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    // Subsequent call without force also uses cache
    const cached = await fetchVersionInfo();
    expect(cached).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    // Call with force = true bypasses cache
    await fetchVersionInfo(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("returns null when fetch fails or response is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const info = await fetchVersionInfo();
    expect(info).toBeNull();
  });

  it("catches fetch exception and returns null", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const info = await fetchVersionInfo();
    expect(info).toBeNull();
  });
});
