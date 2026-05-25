import { describe, it, expect, vi, beforeEach } from "vitest";
import { avatarCache, clearAvatarCache } from "./avatar-cache";

describe("avatar-cache", () => {
  beforeEach(() => {
    // Mock URL.revokeObjectURL
    global.URL.revokeObjectURL = vi.fn();
    clearAvatarCache();
  });

  it("should start with an empty cache", () => {
    expect(Object.keys(avatarCache).length).toBe(0);
  });

  it("should clear the cache and revoke Blob URLs", () => {
    const url1 = "http://example.com/1.png";
    const blobUrl1 = "blob:123";
    avatarCache[url1] = { blobUrl: blobUrl1, refCount: 1 };

    const url2 = "http://example.com/2.png";
    const blobUrl2 = "blob:456";
    avatarCache[url2] = { blobUrl: blobUrl2, refCount: 2 };

    clearAvatarCache();

    expect(Object.keys(avatarCache).length).toBe(0);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(blobUrl1);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(blobUrl2);
  });
});
