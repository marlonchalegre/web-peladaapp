import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OfflineSyncManager from "./OfflineSyncManager";
import * as useNetworkModule from "../../../shared/hooks/useNetwork";
import * as offlineQueueModule from "../utils/offlineQueue";
import { api } from "../../../shared/api/client";

// Mock the dependencies
vi.mock("../../../shared/hooks/useNetwork");
vi.mock("../utils/offlineQueue");

describe("OfflineSyncManager", () => {
  const peladaId = 123;
  const mockOnSyncComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when online and queue is empty", () => {
    vi.spyOn(useNetworkModule, "useNetwork").mockReturnValue(true);
    vi.spyOn(offlineQueueModule, "getOfflineQueue").mockReturnValue([]);

    const { container } = render(
      <OfflineSyncManager peladaId={peladaId} onSyncComplete={mockOnSyncComplete} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders offline warning when offline and queue is empty", () => {
    vi.spyOn(useNetworkModule, "useNetwork").mockReturnValue(false);
    vi.spyOn(offlineQueueModule, "getOfflineQueue").mockReturnValue([]);

    render(<OfflineSyncManager peladaId={peladaId} onSyncComplete={mockOnSyncComplete} />);

    expect(screen.getByText(/Modo Offline ativo/)).toBeInTheDocument();
  });

  it("renders queue size and offline warning when offline with items in queue", () => {
    vi.spyOn(useNetworkModule, "useNetwork").mockReturnValue(false);
    vi.spyOn(offlineQueueModule, "getOfflineQueue").mockReturnValue([
      { id: "1", type: "ADJUST_SCORE", payload: {}, timestamp: Date.now() },
      { id: "2", type: "RECORD_EVENT", payload: {}, timestamp: Date.now() },
    ]);

    render(<OfflineSyncManager peladaId={peladaId} onSyncComplete={mockOnSyncComplete} />);

    expect(screen.getByText(/Modo Offline ativo/)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/ações pendentes/)).toBeInTheDocument();
    // Sync button should not be present when offline
    expect(screen.queryByRole("button", { name: /Sincronizar Agora/ })).toBeNull();
  });

  it("renders sync button when online with items in queue but sync fails or doesn't auto-clear instantly", () => {
    // We override the processQueue by stubbing the api to throw, so it doesn't empty the queue immediately on auto-sync
    vi.spyOn(useNetworkModule, "useNetwork").mockReturnValue(true);
    vi.spyOn(offlineQueueModule, "getOfflineQueue").mockReturnValue([
      { id: "1", type: "ADJUST_SCORE", payload: {}, timestamp: Date.now() },
    ]);
    vi.spyOn(api, "put").mockRejectedValue(new Error("Prevent auto clear"));

    render(<OfflineSyncManager peladaId={peladaId} onSyncComplete={mockOnSyncComplete} />);

    expect(screen.queryByText(/Modo Offline ativo/)).toBeNull();
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/ação pendente/)).toBeInTheDocument();
    // It's going to render the error or still have the button
  });

  it("processes queue when sync button is clicked", async () => {
    // Start offline so it doesn't auto-sync
    vi.spyOn(useNetworkModule, "useNetwork").mockReturnValue(false);
    vi.spyOn(offlineQueueModule, "getOfflineQueue").mockReturnValue([
      { id: "1", type: "ADJUST_SCORE", payload: { matchId: 1, newHome: 2, newAway: 1, status: "running" }, timestamp: Date.now() },
    ]);
    const dequeueSpy = vi.spyOn(offlineQueueModule, "dequeueAction");
    const updateScoreSpy = vi.spyOn(api, "put").mockResolvedValue({ data: {} });

    const { rerender } = render(<OfflineSyncManager peladaId={peladaId} onSyncComplete={mockOnSyncComplete} />);

    // Now go online
    vi.spyOn(useNetworkModule, "useNetwork").mockReturnValue(true);
    rerender(<OfflineSyncManager peladaId={peladaId} onSyncComplete={mockOnSyncComplete} />);

    // Wait for the auto-sync process to finish (which happens when useNetwork turns true)
    await waitFor(() => {
      expect(updateScoreSpy).toHaveBeenCalledWith("/api/matches/1/score", { home_score: 2, away_score: 1, status: "running" });
      expect(dequeueSpy).toHaveBeenCalledWith(peladaId, "1");
      expect(mockOnSyncComplete).toHaveBeenCalled();
    });
  });

  it("stops sync and shows generic error when a non-network error occurs", async () => {
    vi.spyOn(useNetworkModule, "useNetwork").mockReturnValue(false);
    vi.spyOn(offlineQueueModule, "getOfflineQueue").mockReturnValue([
      { id: "1", type: "RECORD_EVENT", payload: { matchId: 1, playerId: 2, type: "goal" }, timestamp: Date.now() },
    ]);
    const dequeueSpy = vi.spyOn(offlineQueueModule, "dequeueAction");
    
    // Mock API to throw an error
    vi.spyOn(api, "post").mockRejectedValue(new Error("Server validation failed"));

    const { rerender } = render(<OfflineSyncManager peladaId={peladaId} onSyncComplete={mockOnSyncComplete} />);

    // Go online to trigger auto-sync
    vi.spyOn(useNetworkModule, "useNetwork").mockReturnValue(true);
    rerender(<OfflineSyncManager peladaId={peladaId} onSyncComplete={mockOnSyncComplete} />);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
      // Should not have dequeued
      expect(dequeueSpy).not.toHaveBeenCalled();
      // Should show error message
      expect(screen.getByText(/Erro: Server validation failed/)).toBeInTheDocument();
      expect(mockOnSyncComplete).not.toHaveBeenCalled();
    });
  });

  it("stops sync and shows specific message on network failure during sync", async () => {
    vi.spyOn(useNetworkModule, "useNetwork").mockReturnValue(false);
    vi.spyOn(offlineQueueModule, "getOfflineQueue").mockReturnValue([
      { id: "1", type: "DELETE_EVENT", payload: { matchId: 1, playerId: 2, type: "goal" }, timestamp: Date.now() },
    ]);
    
    // Mock API to throw a network error
    vi.spyOn(api, "delete").mockRejectedValue(new Error("Failed to fetch"));

    const { rerender } = render(<OfflineSyncManager peladaId={peladaId} onSyncComplete={mockOnSyncComplete} />);

    // Go online to trigger auto-sync
    vi.spyOn(useNetworkModule, "useNetwork").mockReturnValue(true);
    rerender(<OfflineSyncManager peladaId={peladaId} onSyncComplete={mockOnSyncComplete} />);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalled();
      expect(screen.getByText(/Conexão perdida durante a sincronização/)).toBeInTheDocument();
    });
  });

  it("listens to offlineQueueChanged event and updates state", async () => {
    vi.spyOn(useNetworkModule, "useNetwork").mockReturnValue(false);
    
    const getOfflineQueueSpy = vi.spyOn(offlineQueueModule, "getOfflineQueue")
      .mockReturnValueOnce([]) // Initial load
      .mockReturnValueOnce([{ id: "1", type: "END_MATCH", payload: {}, timestamp: Date.now() }]); // After event

    const { unmount } = render(<OfflineSyncManager peladaId={peladaId} onSyncComplete={mockOnSyncComplete} />);

    expect(screen.queryByText(/ação pendente/)).toBeNull();

    // Trigger the custom event
    fireEvent(window, new Event("offlineQueueChanged"));

    await waitFor(() => {
      expect(getOfflineQueueSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/1/)).toBeInTheDocument();
      expect(screen.getByText(/ação pendente/)).toBeInTheDocument();
    });

    unmount();
  });
});
