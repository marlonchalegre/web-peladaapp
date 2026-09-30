import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCopyFeedback } from "./useCopyFeedback";

describe("useCopyFeedback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets copied to true when copyFn succeeds and resets after timeout", async () => {
    const copyFn = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useCopyFeedback(copyFn, 2000));

    expect(result.current.copied).toBe(false);

    await act(async () => {
      await result.current.triggerCopy();
    });

    expect(copyFn).toHaveBeenCalledTimes(1);
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it("does not set copied to true if copyFn returns false", async () => {
    const copyFn = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(() => useCopyFeedback(copyFn, 2000));

    await act(async () => {
      await result.current.triggerCopy();
    });

    expect(result.current.copied).toBe(false);
  });

  it("clears pending timer on unmount", async () => {
    const copyFn = vi.fn().mockResolvedValue(true);
    const { result, unmount } = renderHook(() => useCopyFeedback(copyFn, 2000));

    await act(async () => {
      await result.current.triggerCopy();
    });

    expect(result.current.copied).toBe(true);
    unmount();

    // Advancing timers should not throw or cause errors after unmount
    act(() => {
      vi.advanceTimersByTime(2000);
    });
  });
});
