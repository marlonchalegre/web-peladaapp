import React, { useState, useEffect } from "react";
import { Avatar, type AvatarProps } from "@mui/material";
import { api } from "../api/client";

interface SecureAvatarProps extends AvatarProps {
  userId: number;
  filename?: string | null;
  fallbackText?: string;
}

// Global cache for Blob URLs to avoid redundant fetches and memory usage
// key: full url, value: { blobUrl: string, refCount: number }
interface CacheEntry {
  blobUrl: string;
  refCount: number;
}
const avatarCache: Record<string, CacheEntry> = {};

/**
 * A wrapper around MUI Avatar that fetches the image using an authenticated request.
 * This prevents exposing the JWT token in the URL and caches the result.
 */
export const SecureAvatar: React.FC<SecureAvatarProps> = ({
  userId,
  filename,
  fallbackText,
  sx,
  ...props
}) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let cleanupTimeoutId: NodeJS.Timeout | undefined;
    const cacheKey = `${api.apiBaseUrl || ""}/api/user/${userId}/avatar?t=${filename}`;

    const fetchImage = async () => {
      if (!filename) {
        setImageUrl(undefined);
        return;
      }

      // 1. Check Cache
      const existing = avatarCache[cacheKey];
      if (existing) {
        existing.refCount++;
        setImageUrl(existing.blobUrl);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(cacheKey, {
          headers: {
            "Authorization": `Token ${localStorage.getItem("authToken")}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch avatar");
        }

        const blob = await response.blob();
        if (active) {
          // Double check cache after async fetch
          const existingAfterFetch = avatarCache[cacheKey];
          if (existingAfterFetch) {
            existingAfterFetch.refCount++;
            setImageUrl(existingAfterFetch.blobUrl);
          } else {
            const objectUrl = URL.createObjectURL(blob);
            avatarCache[cacheKey] = { blobUrl: objectUrl, refCount: 1 };
            setImageUrl(objectUrl);
          }
        }
      } catch (error) {
        console.error("Error loading secure avatar:", error);
        if (active) setImageUrl(undefined);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      active = false;
      if (cleanupTimeoutId) {
        clearTimeout(cleanupTimeoutId);
      }
      
      if (filename && avatarCache[cacheKey]) {
        avatarCache[cacheKey].refCount--;
        
        // Only revoke if nobody else is using this image
        // We use a small timeout to prevent revoking/recreating during quick navigation
        if (avatarCache[cacheKey].refCount <= 0) {
          cleanupTimeoutId = setTimeout(() => {
            if (avatarCache[cacheKey] && avatarCache[cacheKey].refCount <= 0) {
              URL.revokeObjectURL(avatarCache[cacheKey].blobUrl);
              delete avatarCache[cacheKey];
            }
          }, 5000);
        }
      }
    };
  }, [userId, filename]);

  return (
    <Avatar
      {...props}
      src={imageUrl}
      sx={{
        ...sx,
        opacity: loading ? 0.6 : 1,
        transition: "opacity 0.2s"
      }}
    >
      {fallbackText || (props.children)}
    </Avatar>
  );
};
