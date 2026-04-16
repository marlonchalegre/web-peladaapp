import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
import { SecureAvatar } from "./SecureAvatar";
import { clearAvatarCache } from "../utils/avatar-cache";

// Mock API client
vi.mock("../api/client", () => ({
  api: {
    apiBaseUrl: "http://test-api",
  },
}));

describe("SecureAvatar", () => {
  const mockToken = "fake-jwt-token";
  const userId = 123;
  const filename = "avatar.png";

  beforeEach(() => {
    vi.clearAllMocks();
    clearAvatarCache();
    localStorage.setItem("authToken", mockToken);

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

  it("fetches the image with correct headers and displays it", async () => {
    render(
      <SecureAvatar userId={userId} filename={filename} fallbackText="T" />,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/user/${userId}/avatar`),
        expect.objectContaining({
          headers: {
            Authorization: `Token ${mockToken}`,
          },
        }),
      );
    });

    // Verify it used the created object URL
    const img = document.querySelector("img");
    expect(img?.src).toBe("blob:http://test-url");
  });

  it("displays fallback text when no filename is provided", () => {
    render(<SecureAvatar userId={userId} fallbackText="Fallback" />);
    expect(global.fetch).not.toHaveBeenCalled();
    const fallback = document.querySelector(".MuiAvatar-root");
    expect(fallback?.textContent).toBe("Fallback");
  });

  it("uses the cache for subsequent requests for the same image", async () => {
    const { unmount } = render(
      <SecureAvatar userId={userId} filename={filename} />,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Render another instance with the same props
    render(<SecureAvatar userId={userId} filename={filename} />);

    // Should NOT fetch again because of the singleton cache
    expect(global.fetch).toHaveBeenCalledTimes(1);

    unmount();
  });

  it("handles fetch errors gracefully by showing fallback", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(
      <SecureAvatar userId={userId} filename={filename} fallbackText="Err" />,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fallback = document.querySelector(".MuiAvatar-root");
    expect(fallback?.textContent).toBe("Err");
  });
});
