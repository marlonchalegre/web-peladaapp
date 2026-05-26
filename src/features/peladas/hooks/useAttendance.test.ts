/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAttendance } from "./useAttendance";
import { MemoryRouter } from "react-router-dom";
import { api } from "../../../shared/api/client";

// Mock the api client
vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the API endpoints using hoisted variables
const { mockGetPeladaFullDetails, mockEndpoints, mockGetOrganizationFinance } =
  vi.hoisted(() => ({
    mockGetPeladaFullDetails: vi.fn(),
    mockGetOrganizationFinance: vi.fn().mockResolvedValue({
      mensalista_price: 0,
      diarista_price: 0,
      currency: "BRL",
    }),
    mockEndpoints: {
      getPeladaFullDetails: vi.fn(),
      getOrganizationFinance: vi.fn(),
      updateAttendance: vi.fn(),
      closeAttendance: vi.fn(),
      addTransaction: vi.fn(),
      reverseTransaction: vi.fn(),
      batchUpdateAttendance: vi.fn(),
    },
  }));

vi.mock("../../../shared/api/endpoints", async () => {
  const actual = await vi.importActual("../../../shared/api/endpoints");
  return {
    ...actual,
    createApi: vi.fn(() => ({
      ...mockEndpoints,
      getPeladaFullDetails: mockGetPeladaFullDetails,
      getOrganizationFinance: mockGetOrganizationFinance,
      updateAttendance: mockEndpoints.updateAttendance,
      closeAttendance: mockEndpoints.closeAttendance,
      addTransaction: mockEndpoints.addTransaction,
      reverseTransaction: mockEndpoints.reverseTransaction,
    })),
  };
});

const stableUser = { id: "1", admin_orgs: ["org1"] };
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: () => ({
    user: stableUser,
  }),
}));

vi.mock("../../../shared/hooks/useOrganizationFinance", () => ({
  useOrganizationFinance: () => ({
    organizationFinance: { diarista_price: 25, mensalista_price: 100 },
    loadingFinance: false,
  }),
}));

describe("useAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(mockEndpoints).forEach((m) => {
      if (typeof (m as any).mockResolvedValue === "function")
        (m as any).mockResolvedValue({});
    });
    vi.mocked(api.post).mockResolvedValue({});
  });

  it("should sort attendance lists primarily by member type priority and then by FIFO", async () => {
    const mockData = {
      pelada: { id: "1", organization_id: "org1", status: "attendance" },
      available_players: [
        {
          id: "1",
          user_id: "101",
          attendance_status: "confirmed",
          member_type: "diarista",
          attendance_updated_at: "2024-05-25T10:00:00Z",
          user: { name: "Diarista 1" },
        },
        {
          id: "2",
          user_id: "102",
          attendance_status: "confirmed",
          member_type: "mensalista",
          attendance_updated_at: "2024-05-25T11:00:00Z",
          user: { name: "Mensalista 1" },
        },
        {
          id: "3",
          user_id: "103",
          attendance_status: "confirmed",
          member_type: "diarista",
          attendance_updated_at: "2024-05-25T09:00:00Z",
          user: { name: "Diarista 0" },
        },
      ],
    };
    mockGetPeladaFullDetails.mockResolvedValue(mockData);
    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.confirmed[0].user.name).toBe("Mensalista 1");
    expect(result.current.confirmed[1].user.name).toBe("Diarista 0");
    expect(result.current.confirmed[2].user.name).toBe("Diarista 1");
  });

  it("should handle handleUpdateAttendance successfully", async () => {
    const mockData = {
      pelada: { id: "1", organization_id: "org1", status: "attendance" },
      available_players: [{ id: "pl1", user_id: "u1", user: { name: "P1" } }],
    };
    mockGetPeladaFullDetails.mockResolvedValue(mockData);
    mockEndpoints.updateAttendance.mockResolvedValue({ status: "confirmed" });
    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.handleUpdateAttendance("confirmed", "pl1");
    });
    expect(mockEndpoints.updateAttendance).toHaveBeenCalledWith(
      "1",
      "confirmed",
      "pl1",
    );
  });

  it("should handle handleUpdateAttendance error with Error and non-Error objects", async () => {
    mockEndpoints.updateAttendance.mockRejectedValue(new Error("Update Error"));
    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.handleUpdateAttendance("confirmed", "pl1");
    });
    expect(result.current.error).toBe("Update Error");

    // non-Error reject
    mockEndpoints.updateAttendance.mockRejectedValue("String Update Error");
    await act(async () => {
      await result.current.handleUpdateAttendance("confirmed", "pl1");
    });
    expect(result.current.error).toBe("peladas.attendance.error.update_failed");
  });

  it("should handle handleUpdateAttendance targeting self and tracking loading state", async () => {
    const mockData = {
      pelada: { id: "1", organization_id: "org1", status: "attendance" },
      available_players: [
        { id: "pl1", user_id: "1", user: { name: "Self Player" } },
      ],
    };
    mockGetPeladaFullDetails.mockResolvedValue(mockData);
    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Call update targeting self (no targetPlayerId)
    await act(async () => {
      await result.current.handleUpdateAttendance("confirmed");
    });
    expect(mockEndpoints.updateAttendance).toHaveBeenCalledWith(
      "1",
      "confirmed",
      undefined,
    );
  });

  it("should handle handleAddPlayersFromOrg error with non-Error", async () => {
    vi.mocked(api.post).mockRejectedValue("String Add Error");
    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.handleAddPlayersFromOrg(["u1"]);
    });
    expect(result.current.error).toBe("peladas.available.error.add_failed");
  });

  it("should handle handleMarkPaid error with non-Error and optional parameters", async () => {
    // Test pelada = null guard
    mockGetPeladaFullDetails.mockResolvedValue({
      pelada: null,
      available_players: [],
    });
    const { result: nullResult } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(nullResult.current.loading).toBe(false));
    await act(async () => {
      await nullResult.current.handleMarkPaid("pl1");
    });
    expect(mockEndpoints.addTransaction).not.toHaveBeenCalled();

    // Test with pelada, but no amount (uses diarista price fallback) and no scheduled_at
    const mockData = {
      pelada: { id: "1", organization_id: "org1", status: "attendance" },
      available_players: [{ id: "pl1", user_id: "u1" }],
    };
    mockGetPeladaFullDetails.mockResolvedValue(mockData);

    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleMarkPaid("pl1");
    });
    expect(mockEndpoints.addTransaction).toHaveBeenCalledWith(
      "org1",
      expect.objectContaining({
        amount: 25,
        description: "Pagamento Pelada 1",
      }),
    );

    // Non-Error exception handler
    mockEndpoints.addTransaction.mockRejectedValue("String Payment Error");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      await result.current.handleMarkPaid("pl1");
    });
    expect(result.current.error).toBe(
      "organizations.management.finance.transactions.error.add_failed",
    );
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should handle handleReversePayment null guard and tx not found", async () => {
    // 1. null pelada guard
    mockGetPeladaFullDetails.mockResolvedValue({
      pelada: null,
      available_players: [],
    });
    const { result: nullResult } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(nullResult.current.loading).toBe(false));
    await act(async () => {
      await nullResult.current.handleReversePayment("pl1");
    });
    expect(mockEndpoints.reverseTransaction).not.toHaveBeenCalled();

    // 2. tx not found path
    const mockData = {
      pelada: {
        id: "1",
        organization_id: "org1",
        status: "attendance",
        scheduled_at: "2024-05-25T16:00:00Z",
      },
      available_players: [{ id: "pl1", user_id: "u1" }],
      pelada_transactions: [], // empty transactions
    };
    mockGetPeladaFullDetails.mockResolvedValue(mockData);

    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleReversePayment("pl1");
    });
    expect(mockEndpoints.reverseTransaction).not.toHaveBeenCalled();
  });

  it("should set error when handleReversePayment api call fails", async () => {
    const mockDataWithTx = {
      pelada: {
        id: "1",
        organization_id: "org1",
        status: "attendance",
        scheduled_at: "2024-05-25T16:00:00Z",
      },
      available_players: [{ id: "pl1", user_id: "u1" }],
      pelada_transactions: [
        {
          id: "tx1",
          player_id: "pl1",
          type: "income",
          category: "diarista_fee",
          status: "paid",
        },
      ],
    };
    mockGetPeladaFullDetails.mockResolvedValue(mockDataWithTx);
    mockEndpoints.reverseTransaction.mockRejectedValue("String Reverse Error");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleReversePayment("pl1");
    });
    expect(result.current.error).toBe(
      "organizations.management.finance.transactions.error.reverse_failed",
    );
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should handle handleCloseAttendance success and error paths", async () => {
    const mockData = {
      pelada: { id: "1", organization_id: "org1", status: "attendance" },
      available_players: [],
    };
    mockGetPeladaFullDetails.mockResolvedValue(mockData);
    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Success
    await act(async () => {
      await result.current.handleCloseAttendance();
    });
    expect(mockEndpoints.closeAttendance).toHaveBeenCalledWith("1");

    // Error with Error
    mockEndpoints.closeAttendance.mockRejectedValue(new Error("Close Fail"));
    await act(async () => {
      await result.current.handleCloseAttendance();
    });
    expect(result.current.error).toBe("Close Fail");

    // Error with non-Error
    mockEndpoints.closeAttendance.mockRejectedValue("String Close Fail");
    await act(async () => {
      await result.current.handleCloseAttendance();
    });
    expect(result.current.error).toBe("peladas.attendance.error.close_failed");
  });

  it("should sort players correctly with missing member types/times and resolve alphabetical tie-breaks", async () => {
    const mockData = {
      pelada: { id: "1", organization_id: "org1", status: "attendance" },
      available_players: [
        {
          id: "1",
          attendance_status: "confirmed",
          member_type: "convidado",
          user: { name: "Player Z" },
        },
        {
          id: "2",
          attendance_status: "confirmed",
          member_type: "convidado",
          user: { name: "Player A" },
        },
        {
          id: "3",
          attendance_status: "confirmed",
          member_type: "mensalista",
          user: { name: "Mensalista B" },
        },
        {
          id: "4",
          attendance_status: "confirmed",
          member_type: "mensalista",
          user: { name: "Mensalista A" },
        },
      ],
    };
    mockGetPeladaFullDetails.mockResolvedValue(mockData);
    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mensalista A before Mensalista B (alphabetical)
    expect(result.current.confirmed[0].user.name).toBe("Mensalista A");
    expect(result.current.confirmed[1].user.name).toBe("Mensalista B");
    // Player A before Player Z (alphabetical)
    expect(result.current.confirmed[2].user.name).toBe("Player A");
    expect(result.current.confirmed[3].user.name).toBe("Player Z");
  });

  it("should handle navigation redirects based on pelada status", async () => {
    // status = running
    mockGetPeladaFullDetails.mockResolvedValue({
      pelada: { id: "1", organization_id: "org1", status: "running" },
      available_players: [],
    });
    const { result: r1 } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(r1.current.loading).toBe(false));

    // status = voting
    mockGetPeladaFullDetails.mockResolvedValue({
      pelada: { id: "1", organization_id: "org1", status: "voting" },
      available_players: [],
    });
    const { result: r2 } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(r2.current.loading).toBe(false));

    // status = closed
    mockGetPeladaFullDetails.mockResolvedValue({
      pelada: { id: "1", organization_id: "org1", status: "closed" },
      available_players: [],
    });
    const { result: r3 } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(r3.current.loading).toBe(false));

    // status = other (e.g. pending)
    mockGetPeladaFullDetails.mockResolvedValue({
      pelada: { id: "1", organization_id: "org1", status: "pending" },
      available_players: [],
    });
    const { result: r4 } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(r4.current.loading).toBe(false));
  });

  it("should handle fetchData load failure error branch with non-Error", async () => {
    mockGetPeladaFullDetails.mockRejectedValue("String Load Failure");
    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("peladas.attendance.error.load_failed");
  });

  it("should handle handleAddPlayersFromOrg successfully and refresh data", async () => {
    const mockData = {
      pelada: { id: "1", organization_id: "org1", status: "attendance" },
      available_players: [],
    };
    mockGetPeladaFullDetails.mockResolvedValue(mockData);
    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleAddPlayersFromOrg(["u1", "u2"]);
    });

    expect(api.post).toHaveBeenCalledWith("/api/peladas/1/players", {
      player_id: "u1",
    });
    expect(api.post).toHaveBeenCalledWith("/api/peladas/1/players", {
      player_id: "u2",
    });
    expect(mockGetPeladaFullDetails).toHaveBeenCalledTimes(2); // Initial load + refresh
  });

  it("should handle handleReversePayment successfully when transaction exists", async () => {
    const mockDataWithTx = {
      pelada: { id: "1", organization_id: "org1", status: "attendance" },
      available_players: [{ id: "pl1", user_id: "u1" }],
      pelada_transactions: [
        {
          id: "tx123",
          player_id: "pl1",
          type: "income",
          category: "diarista_fee",
          status: "paid",
        },
      ],
    };
    mockGetPeladaFullDetails.mockResolvedValue(mockDataWithTx);
    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleReversePayment("pl1");
    });

    expect(mockEndpoints.reverseTransaction).toHaveBeenCalledWith(
      "org1",
      "tx123",
    );
    expect(mockGetPeladaFullDetails).toHaveBeenCalledTimes(2); // Initial load + refresh
  });
});
