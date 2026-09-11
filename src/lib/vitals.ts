import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";
import { logCustomEvent } from "./analytics";

export function sendToAnalytics(metric: Metric) {
  const { name, delta, id, value } = metric;
  const isCLS = name === "CLS";

  // Group all Core Web Vitals under a single "web_vitals" event
  // to avoid cluttering GA4 event reports with separate FCP, LCP, CLS, INP, TTFB events
  logCustomEvent("web_vitals", {
    metric_name: name,
    value: Math.round(isCLS ? value * 1000 : value),
    metric_delta: Math.round(isCLS ? delta * 1000 : delta),
    metric_id: id,
    category: "Web Vitals",
    label: name,
    non_interaction: true,
  });

  if (import.meta.env.DEV) {
    console.log("[Web Vitals]", name, value, delta, id);
  }
}

export const reportWebVitals = () => {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
};
