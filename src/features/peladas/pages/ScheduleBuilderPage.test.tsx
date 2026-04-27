import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ScheduleBuilderPage from "./ScheduleBuilderPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../../../shared/api/client";

// Mock the API client
vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Test User" },
    isAuthenticated: true,
  }),
}));

describe("ScheduleBuilderPage", () => {
  const mockFullDetails = {
    pelada: { id: 1, organization_id: 101, status: "open" },
    teams: [
      { id: 10, name: "Time A" },
      { id: 11, name: "Time B" },
    ],
  };

  const mockPreview = {
    matches: [{ home: 10, away: 11 }],
    template_matches: [{ home: 10, away: 11 }],
    random_matches: [{ home: 11, away: 10 }],
    is_from_format: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders configuration and initial matches", async () => {
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path.includes("/schedule/preview"))
        return Promise.resolve(mockPreview);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/build-schedule"]}>
        <Routes>
          <Route
            path="/peladas/:id/build-schedule"
            element={<ScheduleBuilderPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getAllByText("peladas.detail.button.build_schedule").length,
      ).toBeGreaterThan(0);
      expect(
        screen.getByText("peladas.detail.schedule.planned_matches"),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("10")).toBeInTheDocument(); // Home select
      expect(screen.getByDisplayValue("11")).toBeInTheDocument(); // Away select
    });
  });

  it("shows warning when less than 2 teams exist", async () => {
    const detailsNoTeams = { ...mockFullDetails, teams: [] };
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(detailsNoTeams);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/build-schedule"]}>
        <Routes>
          <Route
            path="/peladas/:id/build-schedule"
            element={<ScheduleBuilderPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("peladas.detail.schedule.warning.not_enough_teams"),
      ).toBeInTheDocument();
    });
  });

  it("adds and removes matches", async () => {
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path.includes("/schedule/preview"))
        return Promise.resolve(mockPreview);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/build-schedule"]}>
        <Routes>
          <Route
            path="/peladas/:id/build-schedule"
            element={<ScheduleBuilderPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      screen.getByText("peladas.detail.schedule.button.add_match"),
    );

    // Add match
    fireEvent.click(
      screen.getByText("peladas.detail.schedule.button.add_match"),
    );

    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      // Header + 2 data rows
      expect(rows.length).toBe(3);
    });

    // Remove match (last one)
    const deleteButtons = screen.getAllByTestId("DeleteIcon");
    fireEvent.click(deleteButtons[1].parentElement!);

    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBe(2);
    });
  });

  it("disables save button when match has same team for home and away", async () => {
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path.includes("/schedule/preview"))
        return Promise.resolve(mockPreview);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/build-schedule"]}>
        <Routes>
          <Route
            path="/peladas/:id/build-schedule"
            element={<ScheduleBuilderPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => screen.getAllByRole("combobox"));

    // Change away team to be same as home (Team A = 10)
    const selects = screen.getAllByRole("combobox");
    // selects[0] is matchesPerTeam, selects[1] is home, selects[2] is away
    fireEvent.mouseDown(selects[2]);
    const options = screen.getAllByRole("option");
    // option[0] is Time A (id 10), option[1] is Time B (id 11)
    fireEvent.click(options[0]);

    await waitFor(() => {
      const saveButton = screen
        .getByText("peladas.detail.schedule.button.use")
        .closest("button");
      expect(saveButton).toBeDisabled();
    });
  });

  it("saves schedule and redirects", async () => {
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path.includes("/schedule/preview"))
        return Promise.resolve(mockPreview);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    (api.post as Mock).mockResolvedValue({ status: "success" });

    render(
      <MemoryRouter initialEntries={["/peladas/1/build-schedule"]}>
        <Routes>
          <Route
            path="/peladas/:id/build-schedule"
            element={<ScheduleBuilderPage />}
          />
          <Route path="/peladas/1" element={<div>Pelada Detail Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => screen.getByText("peladas.detail.schedule.button.use"));
    fireEvent.click(screen.getByText("peladas.detail.schedule.button.use"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/api/peladas/1/schedule",
        expect.any(Object),
      );
      expect(screen.getByText("Pelada Detail Page")).toBeInTheDocument();
    });
  });
});
