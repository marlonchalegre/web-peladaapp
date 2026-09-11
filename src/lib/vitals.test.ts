import { describe, it, expect, vi, beforeEach } from "vitest";
import ReactGA from "react-ga4";

vi.mock("react-ga4", () => ({
  default: {
    event: vi.fn(),
  },
}));

vi.stubEnv("VITE_GOOGLE_ANALYTICS_ID", "G-TEST12345");

import { sendToAnalytics } from "./vitals";

describe("sendToAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends metric under consolidated web_vitals event name", () => {
    sendToAnalytics({
      name: "LCP",
      value: 2345.67,
      delta: 120.5,
      id: "v3-1234",
      navigationType: "navigate",
      entries: [],
      rating: "good",
    });

    expect(ReactGA.event).toHaveBeenCalledWith("web_vitals", {
      metric_name: "LCP",
      value: 2346,
      metric_delta: 121,
      metric_id: "v3-1234",
      category: "Web Vitals",
      label: "LCP",
      non_interaction: true,
    });
  });

  it("multiplies CLS score by 1000 for integer representation", () => {
    sendToAnalytics({
      name: "CLS",
      value: 0.054,
      delta: 0.012,
      id: "v3-5678",
      navigationType: "navigate",
      entries: [],
      rating: "good",
    });

    expect(ReactGA.event).toHaveBeenCalledWith("web_vitals", {
      metric_name: "CLS",
      value: 54,
      metric_delta: 12,
      metric_id: "v3-5678",
      category: "Web Vitals",
      label: "CLS",
      non_interaction: true,
    });
  });
});
