import { describe, it, expect, vi, beforeEach } from "vitest";
import ReactGA from "react-ga4";

vi.mock("react-ga4", () => ({
  default: {
    initialize: vi.fn(),
    send: vi.fn(),
    event: vi.fn(),
    set: vi.fn(),
  },
}));

vi.stubEnv("VITE_GOOGLE_ANALYTICS_ID", "G-TEST12345");

import {
  initGA,
  setAppVersion,
  logAppVersion,
  logAppVersionMismatch,
  logAppVersionUpdateAvailable,
  logAppVersionUpdateAccepted,
  logAppVersionUpdated,
  logPageView,
  logClickEvent,
  logCustomEvent,
  logEvent,
  extractClickDetails,
} from "./analytics";

describe("analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes GA with measurement ID and sets app version", () => {
    initGA("20260924-1000");
    expect(ReactGA.initialize).toHaveBeenCalledWith("G-TEST12345");
    expect(ReactGA.set).toHaveBeenCalledWith({ app_version: "20260924-1000" });
  });

  it("sets app version globally on ReactGA", () => {
    setAppVersion("20260924-2000");
    expect(ReactGA.set).toHaveBeenCalledWith({ app_version: "20260924-2000" });
  });

  it("logs app_version event with details and sets global app_version", () => {
    logAppVersion({
      version: "20260924-1000",
      gitHash: "abcdef1",
      buildTime: "2026-09-24T10:00:00Z",
    });

    expect(ReactGA.set).toHaveBeenCalledWith({ app_version: "20260924-1000" });
    expect(ReactGA.event).toHaveBeenCalledWith("app_version", {
      app_version: "20260924-1000",
      version: "20260924-1000",
      git_hash: "abcdef1",
      build_time: "2026-09-24T10:00:00Z",
      category: "App",
      label: "20260924-1000",
      non_interaction: true,
    });
  });

  it("logs app_version_mismatch event", () => {
    logAppVersionMismatch({
      currentVersion: "20260923-1000",
      serverVersion: "20260924-1000",
      reason: "Version Mismatch",
    });

    expect(ReactGA.event).toHaveBeenCalledWith("app_version_mismatch", {
      current_version: "20260923-1000",
      server_version: "20260924-1000",
      reason: "Version Mismatch",
      category: "App",
      label: "20260923-1000 -> 20260924-1000 (Version Mismatch)",
      non_interaction: true,
    });
  });

  it("logs app_version_update_available event", () => {
    logAppVersionUpdateAvailable({
      currentVersion: "20260923-1000",
      newVersion: "20260924-1000",
    });

    expect(ReactGA.event).toHaveBeenCalledWith("app_version_update_available", {
      current_version: "20260923-1000",
      new_version: "20260924-1000",
      category: "App",
      label: "20260923-1000 -> 20260924-1000",
      non_interaction: true,
    });
  });

  it("logs app_version_update_accepted event", () => {
    logAppVersionUpdateAccepted({
      currentVersion: "20260923-1000",
      newVersion: "20260924-1000",
    });

    expect(ReactGA.event).toHaveBeenCalledWith("app_version_update_accepted", {
      current_version: "20260923-1000",
      new_version: "20260924-1000",
      category: "App",
      label: "20260923-1000 -> 20260924-1000",
    });
  });

  it("logs app_version_updated event", () => {
    logAppVersionUpdated("20260924-1000");

    expect(ReactGA.set).toHaveBeenCalledWith({ app_version: "20260924-1000" });
    expect(ReactGA.event).toHaveBeenCalledWith("app_version_updated", {
      version: "20260924-1000",
      app_version: "20260924-1000",
      category: "App",
      label: "20260924-1000",
      non_interaction: true,
    });
  });

  it("sends pageview with path and page title", () => {
    logPageView("/home", "Início | Minha Pelada");
    expect(ReactGA.send).toHaveBeenCalledWith(
      expect.objectContaining({
        hitType: "pageview",
        page: "/home",
        title: "Início | Minha Pelada",
      }),
    );
  });

  it("logs button_click with structured object parameters", () => {
    logClickEvent({
      buttonId: "create-org-btn",
      buttonText: "Criar Organização",
      pageName: "Início | Minha Pelada",
      pagePath: "/home",
    });

    expect(ReactGA.event).toHaveBeenCalledWith("button_click", {
      button_id: "create-org-btn",
      button_text: "Criar Organização",
      page_name: "Início | Minha Pelada",
      page_path: "/home",
      category: "Interaction",
      label: "create-org-btn (Criar Organização)",
    });
  });

  it("extracts click details from DOM element with data-analytics-id", () => {
    const button = document.createElement("button");
    button.setAttribute("data-analytics-id", "save-button");
    button.textContent = "Salvar Dados";

    const details = extractClickDetails(button, "/home");
    expect(details).toEqual({
      buttonId: "save-button",
      buttonText: "Salvar Dados",
      pageName: "Início | Minha Pelada",
      pagePath: "/home",
    });
  });

  it("extracts click details falling back to data-testid or tag name", () => {
    const link = document.createElement("a");
    link.setAttribute("data-testid", "org-link");
    link.textContent = "Ver Organização";

    const details = extractClickDetails(link, "/organizations/123");
    expect(details.buttonId).toBe("org-link");
    expect(details.pageName).toBe("Detalhes da Organização | Minha Pelada");
  });

  it("logs custom events with parameters", () => {
    logCustomEvent("pelada_created", { pelada_id: "123" });
    expect(ReactGA.event).toHaveBeenCalledWith("pelada_created", {
      pelada_id: "123",
    });
  });

  it("logs legacy event structure", () => {
    logEvent({
      category: "User",
      action: "login",
      label: "google",
    });

    expect(ReactGA.event).toHaveBeenCalledWith({
      category: "User",
      action: "login",
      label: "google",
      value: undefined,
      nonInteraction: undefined,
    });
  });
});
