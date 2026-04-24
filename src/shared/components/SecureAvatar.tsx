import React, { useState, useEffect } from "react";
import { Avatar, type AvatarProps } from "@mui/material";
import { api } from "../api/client";
import { avatarCache } from "../utils/avatar-cache";

interface SecureAvatarProps extends AvatarProps {
  userId?: number;
  filename?: string | null;
  fallbackText?: string;
}

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

    if (!userId || !filename) {
      if (filename === "") {
        console.warn("SecureAvatar: Empty filename for user", userId);
      }
      setImageUrl(undefined);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const cacheKey = `${api.apiBaseUrl || ""}/api/user/${userId}/avatar?t=${encodeURIComponent(filename)}`;

    const fetchImage = async () => {
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
            Authorization: `Token ${localStorage.getItem("authToken")}`,
          },
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

      if (avatarCache[cacheKey]) {
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
      data-testid="secure-avatar"
      sx={{
        ...sx,
        opacity: loading ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {fallbackText || props.children}
    </Avatar>
  );
};
