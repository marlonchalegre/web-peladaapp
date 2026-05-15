export type OfflineActionType =
  | "ADJUST_SCORE"
  | "RECORD_EVENT"
  | "DELETE_EVENT"
  | "ADD_PLAYER_TO_TEAM"
  | "REPLACE_PLAYER"
  | "CLOSE_PELADA"
  | "END_MATCH"
  | "START_PELADA_TIMER"
  | "PAUSE_PELADA_TIMER"
  | "RESET_PELADA_TIMER"
  | "START_MATCH_TIMER"
  | "PAUSE_MATCH_TIMER"
  | "RESET_MATCH_TIMER";

export interface OfflineAction {
  id: string; // unique ID for the action
  type: OfflineActionType;
  payload: Record<string, unknown>;
  timestamp: number;
}

export function getOfflineQueueKey(peladaId: string) {
  return `pelada_offline_queue_${peladaId}`;
}

export function getOfflineQueue(peladaId: string): OfflineAction[] {
  try {
    const data = localStorage.getItem(getOfflineQueueKey(peladaId));
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to read offline queue", error);
    return [];
  }
}

export function enqueueAction(
  peladaId: string,
  type: OfflineActionType,
  payload: Record<string, unknown>,
) {
  const queue = getOfflineQueue(peladaId);
  const action: OfflineAction = {
    id: crypto.randomUUID(),
    type,
    payload,
    timestamp: Date.now(),
  };
  queue.push(action);
  localStorage.setItem(getOfflineQueueKey(peladaId), JSON.stringify(queue));

  // Dispatch a custom event so other components (like UI) can react
  window.dispatchEvent(new Event("offlineQueueChanged"));
}

export function dequeueAction(peladaId: string, actionId: string) {
  const queue = getOfflineQueue(peladaId);
  const newQueue = queue.filter((a) => a.id !== actionId);
  localStorage.setItem(getOfflineQueueKey(peladaId), JSON.stringify(newQueue));
  window.dispatchEvent(new Event("offlineQueueChanged"));
}

export function clearOfflineQueue(peladaId: string) {
  localStorage.removeItem(getOfflineQueueKey(peladaId));
  window.dispatchEvent(new Event("offlineQueueChanged"));
}
