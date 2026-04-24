import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";
import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

function sendToAnalytics(metric: Metric) {
  if (!GA_MEASUREMENT_ID) return;

  const { name, delta, id, value } = metric;

  ReactGA.event({
    category: "Web Vitals",
    action: name,
    value: Math.round(name === "CLS" ? value * 1000 : value), // values must be integers
    label: id, // id unique to current page load
    nonInteraction: true, // avoids affecting bounce rate
  });

  // Also log to console in development
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
