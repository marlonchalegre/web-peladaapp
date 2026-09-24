export interface VersionInfo {
  version: string;
  gitHash?: string;
  buildTime?: string;
}

let cachedVersionInfo: VersionInfo | null = null;
let inflightVersionPromise: Promise<VersionInfo | null> | null = null;

export const getClientVersion = (): string => {
  return import.meta.env.VITE_APP_VERSION || "dev";
};

export const isDevVersion = (): boolean => {
  return getClientVersion() === "dev";
};

export const fetchVersionInfo = async (
  force = false,
): Promise<VersionInfo | null> => {
  if (cachedVersionInfo && !force) {
    return cachedVersionInfo;
  }
  if (inflightVersionPromise && !force) {
    return inflightVersionPromise;
  }

  inflightVersionPromise = (async () => {
    try {
      const response = await fetch("/version.json?t=" + Date.now(), {
        cache: "no-store",
      });
      if (response.ok) {
        cachedVersionInfo = (await response.json()) as VersionInfo;
        return cachedVersionInfo;
      }
    } catch (e) {
      console.warn("Could not fetch version.json", e);
    } finally {
      inflightVersionPromise = null;
    }
    return null;
  })();

  return inflightVersionPromise;
};

export const resetVersionCacheForTesting = (): void => {
  cachedVersionInfo = null;
  inflightVersionPromise = null;
};
