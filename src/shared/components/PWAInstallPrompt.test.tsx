import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PWAInstallPrompt } from "./PWAInstallPrompt";
import * as analytics from "../../lib/analytics";
import { resetVersionCacheForTesting } from "../../lib/version";

let mockNeedRefresh = false;
const mockUpdateServiceWorker = vi.fn();
const mockSetNeedRefresh = vi.fn();

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [mockNeedRefresh, mockSetNeedRefresh],
    updateServiceWorker: mockUpdateServiceWorker,
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "app.new_version_available": "Uma nova versão está disponível!",
        "common.update": "Atualizar",
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock("../../app/providers/PWAContext", () => ({
  usePWA: () => ({
    showIOSInstructions: false,
    setShowIOSInstructions: vi.fn(),
  }),
}));

describe("PWAInstallPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetVersionCacheForTesting();
    mockNeedRefresh = false;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: "20260924-1000" }),
    });
  });

  it("logs app_version_update_available when needRefresh is true", async () => {
    mockNeedRefresh = true;
    const logUpdateAvailableSpy = vi.spyOn(
      analytics,
      "logAppVersionUpdateAvailable",
    );

    render(<PWAInstallPrompt />);

    await waitFor(() => {
      expect(logUpdateAvailableSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          newVersion: "20260924-1000",
        }),
      );
    });

    expect(
      screen.getByText("Uma nova versão está disponível!"),
    ).toBeInTheDocument();
  });

  it("logs app_version_update_accepted when user clicks update button", async () => {
    mockNeedRefresh = true;
    const logUpdateAcceptedSpy = vi.spyOn(
      analytics,
      "logAppVersionUpdateAccepted",
    );

    render(<PWAInstallPrompt />);

    const updateButton = await screen.findByRole("button", {
      name: "Atualizar",
    });

    await waitFor(() => {
      expect(analytics.logAppVersionUpdateAvailable).toHaveBeenCalledWith(
        expect.objectContaining({
          newVersion: "20260924-1000",
        }),
      );
    });

    fireEvent.click(updateButton);

    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);
    expect(logUpdateAcceptedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        currentVersion: "dev",
        newVersion: "20260924-1000",
      }),
    );
  });

  it("logs app_version_mismatch when version mismatch is detected", async () => {
    vi.stubEnv("VITE_APP_VERSION", "20260920-1000");
    const logMismatchSpy = vi.spyOn(analytics, "logAppVersionMismatch");

    // Mock window.location.reload
    const originalReload = window.location.reload;
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...window.location, reload: vi.fn(), hostname: "pelada.app" },
    });

    render(<PWAInstallPrompt />);

    await waitFor(() => {
      expect(logMismatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          currentVersion: "20260920-1000",
          serverVersion: "20260924-1000",
          reason: "Version Mismatch",
        }),
      );
    });

    window.location.reload = originalReload;
    vi.unstubAllEnvs();
  });
});
