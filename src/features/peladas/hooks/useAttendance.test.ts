import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAttendance } from "./useAttendance";
import { MemoryRouter } from "react-router-dom";

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
    })),
  };
});

const stableUser = { id: "1", admin_orgs: ["1"] };

// Mock Auth context
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: () => ({
    user: stableUser,
  }),
}));

describe("useAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should sort attendance lists correctly", async () => {
    const mockData = {
      pelada: { id: "1", organization_id: "1", status: "attendance" },
      available_players: [
        {
          id: "1",
          user_id: "101",
          attendance_status: "confirmed",
          attendance_updated_at: "2026-03-23T08:00:00Z",
          user: { name: "Convidado 1" },
          member_type: "convidado",
        },
        {
          id: "3",
          user_id: "103",
          attendance_status: "confirmed",
          attendance_updated_at: "2026-03-23T09:00:00Z",
          user: { name: "Mensalista 1" },
          member_type: "mensalista",
        },
      ],
    };

    mockGetPeladaFullDetails.mockResolvedValue(mockData);

    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.confirmed[0].user.name).toBe("Mensalista 1");
    expect(result.current.confirmed[1].user.name).toBe("Convidado 1");
  });

  it("should handle handleUpdateAttendance successfully", async () => {
    const mockData = {
      pelada: { id: "1", organization_id: "1", status: "attendance" },
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

    expect(mockEndpoints.updateAttendance).toHaveBeenCalledWith("1", "confirmed", "pl1");
  });

  it("should handle handleCloseAttendance successfully", async () => {
    const mockData = {
      pelada: { id: "1", organization_id: "1", status: "attendance" },
      available_players: [],
    };
    mockGetPeladaFullDetails.mockResolvedValue(mockData);
    mockEndpoints.closeAttendance.mockResolvedValue({});

    const { result } = renderHook(() => useAttendance("1"), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleCloseAttendance();
    });

    expect(mockEndpoints.closeAttendance).toHaveBeenCalledWith("1");
  });
});
