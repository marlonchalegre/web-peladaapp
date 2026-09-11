import ReactGA from "react-ga4";
import { getPageTitle } from "./pageTitles";

export const getMeasurementId = () =>
  import.meta.env.VITE_GOOGLE_ANALYTICS_ID as string | undefined;

export const initGA = () => {
  const measurementId = getMeasurementId();
  if (measurementId) {
    ReactGA.initialize(measurementId);
  }
};

export const logPageView = (path: string, title?: string) => {
  if (getMeasurementId()) {
    const pageTitle =
      title || (typeof document !== "undefined" ? document.title : undefined);
    const location =
      typeof window !== "undefined" ? window.location.href : undefined;

    ReactGA.send({
      hitType: "pageview",
      page: path,
      title: pageTitle,
      location,
    });
  }
};

export interface ClickEventParams {
  buttonId: string;
  buttonText?: string;
  pageName: string;
  pagePath: string;
}

export const logCustomEvent = (
  eventName: string,
  params?: Record<string, unknown>,
) => {
  if (getMeasurementId()) {
    ReactGA.event(eventName, params);
  }
};

export const logClickEvent = ({
  buttonId,
  buttonText,
  pageName,
  pagePath,
}: ClickEventParams) => {
  const cleanText = buttonText ? buttonText.slice(0, 80) : undefined;

  logCustomEvent("button_click", {
    button_id: buttonId,
    button_text: cleanText,
    page_name: pageName,
    page_path: pagePath,
    category: "Interaction",
    label: `${buttonId}${cleanText ? ` (${cleanText.slice(0, 40)})` : ""}`,
  });
};

/**
 * Extracts structured click metadata from a clickable DOM element.
 * Prioritizes explicit analytics/test IDs for buttonId, while preserving
 * human-readable buttonText (via textContent, aria-label, or title).
 */
export const extractClickDetails = (
  clickable: HTMLElement,
  currentPath: string,
): ClickEventParams => {
  const analyticsId = clickable.getAttribute("data-analytics-id");
  const testId = clickable.getAttribute("data-testid");
  const elementId = clickable.getAttribute("id");
  const ariaLabel = clickable.getAttribute("aria-label");
  const titleAttr = clickable.getAttribute("title");

  const rawText = clickable.textContent?.trim().replace(/\s+/g, " ") || "";
  const elementText = rawText || ariaLabel || titleAttr || "";

  const pageTitle = getPageTitle(currentPath);
  const buttonIdentifier =
    analyticsId ||
    testId ||
    elementId ||
    (elementText ? elementText.slice(0, 30) : clickable.tagName.toLowerCase());

  return {
    buttonId: buttonIdentifier,
    buttonText: elementText || undefined,
    pageName: pageTitle,
    pagePath: currentPath,
  };
};

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
}

export const logEvent = ({
  category,
  action,
  label,
  value,
  nonInteraction,
}: AnalyticsEvent) => {
  if (getMeasurementId()) {
    ReactGA.event({
      category,
      action,
      label,
      value,
      nonInteraction,
    });
  }
};
