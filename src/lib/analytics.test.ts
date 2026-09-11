import { describe, it, expect, vi, beforeEach } from "vitest";
import ReactGA from "react-ga4";

vi.mock("react-ga4", () => ({
  default: {
    initialize: vi.fn(),
    send: vi.fn(),
    event: vi.fn(),
  },
}));

vi.stubEnv("VITE_GOOGLE_ANALYTICS_ID", "G-TEST12345");

import {
  initGA,
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

  it("initializes GA with measurement ID", () => {
    initGA();
    expect(ReactGA.initialize).toHaveBeenCalledWith("G-TEST12345");
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
