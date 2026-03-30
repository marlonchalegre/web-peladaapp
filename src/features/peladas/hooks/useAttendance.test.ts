import { renderHook, waitFor } from "@testing-library/react";
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
    })),
  };
});

// Mock Auth context
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, admin_orgs: [1] },
  }),
}));

describe("useAttendance sorting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should sort attendance lists by member_type priority and then by updated_at (FIFO)", async () => {
    const mockData = {
      pelada: { id: 1, organization_id: 1, status: "attendance" },
      available_players: [
        {
          id: 1,
          user_id: 101,
          attendance_status: "confirmed",
          attendance_updated_at: "2026-03-23T08:00:00Z",
          user: { name: "Convidado 1" },
          member_type: "convidado",
        },
        {
          id: 2,
          user_id: 102,
          attendance_status: "confirmed",
          attendance_updated_at: "2026-03-23T10:00:00Z",
          user: { name: "Diarista 1" },
          member_type: "diarista",
        },
        {
          id: 3,
          user_id: 103,
          attendance_status: "confirmed",
          attendance_updated_at: "2026-03-23T09:00:00Z",
          user: { name: "Mensalista 1" },
          member_type: "mensalista",
        },
        {
          id: 4,
          user_id: 104,
          attendance_status: "confirmed",
          attendance_updated_at: "2026-03-23T07:00:00Z",
          user: { name: "Diarista 2" },
          member_type: "diarista",
        },
      ],
    };

    mockGetPeladaFullDetails.mockResolvedValue(mockData);

    const { result } = renderHook(() => useAttendance(1), {
      wrapper: MemoryRouter,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Order should be:
    // 1. Mensalista 1 (priority 1)
    // 2. Diarista 2 (priority 2, earlier time)
    // 3. Diarista 1 (priority 2, later time)
    // 4. Convidado 1 (priority 3)
    expect(result.current.confirmed[0].user.name).toBe("Mensalista 1");
    expect(result.current.confirmed[1].user.name).toBe("Diarista 2");
    expect(result.current.confirmed[2].user.name).toBe("Diarista 1");
    expect(result.current.confirmed[3].user.name).toBe("Convidado 1");
  });

  it("should fallback to alphabetical sort if updated_at is missing or equal", async () => {
    const mockData = {
      pelada: { id: 1, organization_id: 1, status: "attendance" },
      available_players: [
        {
          id: 1,
          user_id: 101,
          attendance_status: "confirmed",
          attendance_updated_at: "2026-03-23T10:00:00Z",
          user: { name: "Charlie" },
        },
        {
          id: 2,
          user_id: 102,
          attendance_status: "confirmed",
          attendance_updated_at: "2026-03-23T10:00:00Z",
          user: { name: "Alpha" },
        },
        {
          id: 3,
          user_id: 103,
          attendance_status: "confirmed",
          attendance_updated_at: undefined,
          user: { name: "Bravo" },
        },
      ],
    };

    mockGetPeladaFullDetails.mockResolvedValue(mockData);

    const { result } = renderHook(() => useAttendance(1), {
      wrapper: MemoryRouter,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Alpha and Charlie have same time (10:00), so sorted alphabetically: Alpha, then Charlie.
    // Bravo has no time (Infinity), so it comes last.
    expect(result.current.confirmed[0].user.name).toBe("Alpha");
    expect(result.current.confirmed[1].user.name).toBe("Charlie");
    expect(result.current.confirmed[2].user.name).toBe("Bravo");
  });
});
