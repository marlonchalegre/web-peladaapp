import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, CircularProgress } from "@mui/material";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  pullThreshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  pullThreshold = 80,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    } else {
      // Default behavior: reload page
      window.location.reload();
    }
    // Note: If we reload the page, the following lines won't execute, which is fine.
    setIsRefreshing(false);
    setPullDistance(0);
  }, [isRefreshing, onRefresh]);

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].pageY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling || isRefreshing || window.scrollY > 0) return;

      const currentY = e.touches[0].pageY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Apply resistance
        const resistance = 0.4;
        const distance = diff * resistance;
        setPullDistance(Math.min(distance, pullThreshold + 20));

        // Prevent default only if we are actually pulling down at the top
        if (e.cancelable) {
          e.preventDefault();
        }
      } else {
        setIsPulling(false);
        setPullDistance(0);
      }
    },
    [isPulling, isRefreshing, pullThreshold],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isPulling || isRefreshing) return;

    if (pullDistance >= pullThreshold) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
    setIsPulling(false);
  }, [isPulling, isRefreshing, pullDistance, pullThreshold, handleRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  return (
    <Box ref={containerRef} sx={{ position: "relative", minHeight: "100%" }}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: pullThreshold,
          pointerEvents: "none",
          zIndex: 1000,
          transform: `translateY(${Math.min(pullDistance - pullThreshold, 0)}px)`,
          transition: isPulling ? "none" : "transform 0.3s ease",
          opacity: Math.min(pullDistance / pullThreshold, 1),
        }}
      >
        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: "50%",
            p: 1,
            boxShadow: 3,
            display: "flex",
          }}
        >
          {isRefreshing ? (
            <CircularProgress size={24} />
          ) : (
            <CircularProgress
              variant="determinate"
              value={Math.min((pullDistance / pullThreshold) * 100, 100)}
              size={24}
            />
          )}
        </Box>
      </Box>
      <Box
        sx={{
          transform: `translateY(${isRefreshing ? pullThreshold / 2 : pullDistance / 2}px)`,
          transition: isPulling ? "none" : "transform 0.3s ease",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
