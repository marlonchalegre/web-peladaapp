import { lazy, type ComponentType } from "react";

/**
 * A wrapper for React.lazy that retries the import if it fails.
 * This is useful for handling "error loading dynamically imported module" errors,
 * which often happen when a new version of the app is deployed and old chunks are removed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ComponentType<any> {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.localStorage.getItem(`lazy-retry-${name}-refreshed`) || "false",
    );

    try {
      const component = await componentImport();
      window.localStorage.setItem(`lazy-retry-${name}-refreshed`, "false");
      return component;
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        // Logging the error to help with debugging
        console.warn(
          `Failed to load chunk for ${name}. Force refreshing...`,
          error,
        );
        window.localStorage.setItem(`lazy-retry-${name}-refreshed`, "true");
        window.location.reload();
        return { default: (() => null) as unknown as T };
      }

      // If we already refreshed and it still fails, throw the error
      console.error(
        `Failed to load chunk for ${name} even after refresh.`,
        error,
      );
      throw error;
    }
  });
}
