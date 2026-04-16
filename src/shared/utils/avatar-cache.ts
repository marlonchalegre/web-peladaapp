// Global cache for Blob URLs to avoid redundant fetches and memory usage
// key: full url, value: { blobUrl: string, refCount: number }
export interface CacheEntry {
  blobUrl: string;
  refCount: number;
}

export const avatarCache: Record<string, CacheEntry> = {};

/**
 * Clears the avatar cache. Internal use only (primarily for tests).
 */
export const clearAvatarCache = () => {
  Object.keys(avatarCache).forEach((key) => {
    URL.revokeObjectURL(avatarCache[key].blobUrl);
    delete avatarCache[key];
  });
};
