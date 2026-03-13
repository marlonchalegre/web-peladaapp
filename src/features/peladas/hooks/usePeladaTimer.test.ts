import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePeladaTimer } from "./usePeladaTimer";

describe("usePeladaTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should calculate elapsed time when running", () => {
    const baseTime = 1000000;
    vi.setSystemTime(baseTime);

    // startedAt was 5s ago
    const startedAt = new Date(baseTime - 5000).toISOString();

    const { result } = renderHook(() =>
      usePeladaTimer(startedAt, 0, "running", false),
    );

    // After first render and effect, it should pick up the time
    act(() => {
      vi.advanceTimersByTime(100); // Trigger first interval
      vi.setSystemTime(baseTime + 100);
    });

    // It might not be exactly 5000 if effect haven't run yet, but let's check
    // If it's still 0, we need to wait for another tick
    if (result.current.elapsedMs === 0) {
      act(() => {
        vi.advanceTimersByTime(100);
        vi.setSystemTime(baseTime + 200);
      });
    }

    expect(result.current.elapsedMs).toBeGreaterThanOrEqual(5000);

    const current = result.current.elapsedMs;
    act(() => {
      vi.advanceTimersByTime(1000);
      vi.setSystemTime(baseTime + 1200);
    });

    expect(result.current.elapsedMs).toBeGreaterThan(current);
  });

  it("should NOT run if parent is closed even if status is running", () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const startedAt = new Date(now - 5000).toISOString();
    const { result } = renderHook(() =>
      usePeladaTimer(startedAt, 5000, "running", true),
    );

    // Should show accumulated time but not tick
    expect(result.current.elapsedMs).toBe(5000);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.elapsedMs).toBe(5000);
  });

  it("should show accumulated time when paused", () => {
    const { result } = renderHook(() =>
      usePeladaTimer(null, 120000, "paused", false),
    );

    expect(result.current.elapsedMs).toBe(120000);
    expect(result.current.formattedTime).toBe("00:02:00");
  });
});
