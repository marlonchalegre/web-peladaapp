import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAttendance } from "./useAttendance";
import { MemoryRouter } from "react-router-dom";

// Mock the API endpoints using hoisted variables
const { mockGetPeladaFullDetails, mockEndpoints } = vi.hoisted(() => ({
  mockGetPeladaFullDetails: vi.fn(),
  mockEndpoints: {
    getPeladaFullDetails: vi.fn(),
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

  it("should sort attendance lists by updated_at (FIFO)", async () => {
    const mockData = {
      pelada: { id: 1, organization_id: 1, status: "attendance" },
      available_players: [
        {
          id: 1,
          user_id: 101,
          attendance_status: "confirmed",
          attendance_updated_at: "2026-03-23T10:00:00Z",
          user: { name: "Zebra" },
        },
        {
          id: 2,
          user_id: 102,
          attendance_status: "confirmed",
          attendance_updated_at: "2026-03-23T09:00:00Z",
          user: { name: "Albatross" },
        },
        {
          id: 3,
          user_id: 103,
          attendance_status: "waitlist",
          attendance_updated_at: "2026-03-23T11:00:00Z",
          user: { name: "Lion" },
        },
        {
          id: 4,
          user_id: 104,
          attendance_status: "waitlist",
          attendance_updated_at: "2026-03-23T10:30:00Z",
          user: { name: "Tiger" },
        },
      ],
    };

    mockGetPeladaFullDetails.mockResolvedValue(mockData);

    const { result } = renderHook(() => useAttendance(1), {
      wrapper: MemoryRouter,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Confirmed should be sorted by time: Albatross (09:00) then Zebra (10:00)
    expect(result.current.confirmed[0].user.name).toBe("Albatross");
    expect(result.current.confirmed[1].user.name).toBe("Zebra");

    // Waitlist should be sorted by time: Tiger (10:30) then Lion (11:00)
    expect(result.current.waitlist[0].user.name).toBe("Tiger");
    expect(result.current.waitlist[1].user.name).toBe("Lion");
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
