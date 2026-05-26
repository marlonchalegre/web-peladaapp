/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup, act } from "@testing-library/react";
import { SecureAvatar } from "./SecureAvatar";
import { clearAvatarCache } from "../utils/avatar-cache";

// Mock API client
vi.mock("../api/client", () => ({
  api: {
    apiBaseUrl: "http://test-api",
  },
}));

describe("SecureAvatar", () => {
  const userId = 123;
  const filename = "avatar.png";

  beforeEach(() => {
    vi.clearAllMocks();
    clearAvatarCache();

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () =>
        Promise.resolve(
          new Blob(["test-image-content"], { type: "image/png" }),
        ),
    });

    // Mock URL methods
    global.URL.createObjectURL = vi
      .fn()
      .mockReturnValue("blob:http://test-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("fetches the image with correct credentials and displays it", async () => {
    render(
      <SecureAvatar
        userId={userId.toString()}
        filename={filename}
        fallbackText="T"
      />,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/user/${userId}/avatar`),
        expect.objectContaining({
          credentials: "same-origin",
        }),
      );
    });

    // Verify it used the created object URL
    const img = document.querySelector("img");
    expect(img?.src).toBe("blob:http://test-url");
  });

  it("displays fallback text when no filename is provided", () => {
    render(<SecureAvatar userId={userId.toString()} fallbackText="Fallback" />);
    expect(global.fetch).not.toHaveBeenCalled();
    const fallback = document.querySelector(".MuiAvatar-root");
    expect(fallback?.textContent).toBe("Fallback");
  });

  it("uses the cache for subsequent requests for the same image", async () => {
    const { unmount } = render(
      <SecureAvatar userId={userId.toString()} filename={filename} />,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Render another instance with the same props
    render(<SecureAvatar userId={userId.toString()} filename={filename} />);

    // Should NOT fetch again because of the singleton cache
    expect(global.fetch).toHaveBeenCalledTimes(1);

    unmount();
  });

  it("handles fetch errors gracefully by showing fallback", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(
      <SecureAvatar
        userId={userId.toString()}
        filename={filename}
        fallbackText="Err"
      />,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fallback = document.querySelector(".MuiAvatar-root");
    expect(fallback?.textContent).toBe("Err");
    consoleSpy.mockRestore();
  });

  it("should clear the timeout if unmounted quickly", async () => {
    const { unmount } = render(
      <SecureAvatar userId={userId.toString()} filename={filename} />,
    );
    unmount();
  });

  it("should revoke object URL and delete from cache after 5 seconds of being unused", async () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <SecureAvatar userId={userId.toString()} filename={filename} />,
    );

    // Wait for mount and fetch resolution
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    unmount();

    // The cleanup timer is set to 5000ms
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(
      "blob:http://test-url",
    );
    vi.useRealTimers();
  });

  it("should reuse cached object URL on concurrent fetches when the first fetch resolves", async () => {
    let resolveFetch: (value: any) => void = () => {};
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(global.fetch).mockReturnValue(fetchPromise as any);

    render(<SecureAvatar userId={userId.toString()} filename={filename} />);
    render(<SecureAvatar userId={userId.toString()} filename={filename} />);

    expect(global.fetch).toHaveBeenCalledTimes(2);

    // Resolve the fetches
    await act(async () => {
      resolveFetch({
        ok: true,
        blob: () =>
          Promise.resolve(new Blob(["content"], { type: "image/png" })),
      });
    });

    // The second component should reuse the cache from the first component's resolution
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
  });
});
