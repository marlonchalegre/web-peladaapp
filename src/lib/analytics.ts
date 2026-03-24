import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
  }
};

export const logPageView = (path: string) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.send({ hitType: "pageview", page: path });
  }
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
  if (GA_MEASUREMENT_ID) {
    ReactGA.event({
      category,
      action,
      label,
      value,
      nonInteraction,
    });
  }
};

/**
 * Specialized helper for logging button/link clicks with page context
 */
export const logClickEvent = (
  pageName: string,
  elementName: string,
  elementText?: string,
) => {
  logEvent({
    category: "Interaction",
    action: `Click: ${pageName}`,
    label: `${elementName}${elementText ? ` (${elementText})` : ""}`,
  });
};
