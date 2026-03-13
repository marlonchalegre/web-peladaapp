import { useState, useEffect, useMemo } from "react";
import type { TimerStatus } from "../../../shared/api/endpoints";

export function usePeladaTimer(
  startedAt: string | null | undefined,
  accumulatedMs: number | null | undefined,
  status: TimerStatus | null | undefined,
  onStart?: () => Promise<void>,
  onPause?: () => Promise<void>,
  onReset?: () => Promise<void>,
) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (status === "running") {
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [status]);

  const elapsedMs = useMemo(() => {
    let elapsed = accumulatedMs || 0;
    if (status === "running" && startedAt && now > 0) {
      const startTime = new Date(startedAt).getTime();
      elapsed += now - startTime;
    }
    return elapsed;
  }, [startedAt, accumulatedMs, status, now]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const formattedTime = useMemo(() => formatTime(elapsedMs), [elapsedMs]);

  return {
    elapsedMs,
    formattedTime,
    status: status || "stopped",
    start: onStart,
    pause: onPause,
    reset: onReset,
  };
}
