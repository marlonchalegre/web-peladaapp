import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOfflineQueue,
  enqueueAction,
  dequeueAction,
  clearOfflineQueue,
  getOfflineQueueKey,
} from "./offlineQueue";

describe("offlineQueue", () => {
  const peladaId = "test-pelada-id";
  const key = getOfflineQueueKey(peladaId);

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Mock crypto.randomUUID
    global.crypto.randomUUID = vi.fn().mockReturnValue("mock-uuid");
  });

  it("should return an empty array if queue is empty", () => {
    expect(getOfflineQueue(peladaId)).toEqual([]);
  });

  it("should return empty array and log error on invalid JSON", () => {
    localStorage.setItem(key, "invalid-json");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(getOfflineQueue(peladaId)).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should enqueue an action", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const payload = { score: 1 };
    enqueueAction(peladaId, "ADJUST_SCORE", payload);

    const queue = getOfflineQueue(peladaId);
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      id: "mock-uuid",
      type: "ADJUST_SCORE",
      payload,
    });
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    expect(dispatchSpy.mock.calls[0][0].type).toBe("offlineQueueChanged");
  });

  it("should dequeue an action", () => {
    enqueueAction(peladaId, "ADJUST_SCORE", { i: 1 });
    const queueBefore = getOfflineQueue(peladaId);
    const actionId = queueBefore[0].id;

    dequeueAction(peladaId, actionId);
    expect(getOfflineQueue(peladaId)).toHaveLength(0);
  });

  it("should clear the queue", () => {
    enqueueAction(peladaId, "ADJUST_SCORE", { i: 1 });
    expect(getOfflineQueue(peladaId)).toHaveLength(1);

    clearOfflineQueue(peladaId);
    expect(getOfflineQueue(peladaId)).toHaveLength(0);
    expect(localStorage.getItem(key)).toBeNull();
  });
});
