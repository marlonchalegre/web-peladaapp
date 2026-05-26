import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PeladaVotingResultsPage from "./PeladaVotingResultsPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";
import { api } from "../../../shared/api/client";

// Mock the API client
vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
  },
}));

const theme = createTheme();

const renderWithProviders = (id = "1") => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[`/peladas/${id}/results`]}>
        <Routes>
          <Route
            path="/peladas/:id/results"
            element={<PeladaVotingResultsPage />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
};

describe("PeladaVotingResultsPage Restricted Access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the restricted view when receiving a 403 error (user didn't vote)", async () => {
    // Create a mock Axios error for 403 Forbidden
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 403,
        data: { message: "Você precisa votar para ter acesso aos resultados" },
      },
    };

    vi.mocked(api.get).mockRejectedValueOnce(axiosError);

    renderWithProviders();

    // Should show the restriction dialog
    // The t mock in setup.ts returns the key as the text
    await waitFor(() => {
      expect(screen.getByText(/common\.actions\.view/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/peladas\.voting\.results\.error\.not_voted/i),
    ).toBeInTheDocument();

    // Should NOT show the "Vote Now" button as it was removed
    expect(
      screen.queryByText(/peladas\.detail\.button\.vote/i),
    ).not.toBeInTheDocument();

    // Should show the "Back" button
    expect(screen.getByText(/common\.back/i)).toBeInTheDocument();
  });

  it("shows the actual error message when an exception is thrown", async () => {
    const errorMessage = "Custom Network Error";
    const error = new Error(errorMessage);
    vi.mocked(api.get).mockRejectedValueOnce(error);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("renders voting results successfully with standard and fallback scenarios", async () => {
    const mockSuccessResults = {
      mvp: [
        {
          player_id: "p1",
          user_id: null,
          name: "Player A",
          average_stars: 4.8,
          position: null,
          goals: 2,
          assists: 1,
        },
        {
          player_id: "p2",
          user_id: "u2",
          name: "Player B",
          average_stars: 4.5,
          position: "Striker",
          goals: 1,
          assists: 2,
        },
        {
          player_id: "p3",
          user_id: "u3",
          name: "Player C",
          average_stars: 4.2,
          position: "Goalkeeper",
          goals: 0,
          assists: 0,
        },
      ],
      striker: [],
      garcom: [],
      total_voted: 3,
      total_eligible: 10,
      voters: [
        { player_id: "p1", name: "Player A", has_voted: true },
        { player_id: "p2", name: "Player B", has_voted: true },
        { player_id: "p3", name: "Player C", has_voted: true },
      ],
      organization_id: null,
      organization_name: null,
    };

    vi.mocked(api.get).mockResolvedValueOnce(mockSuccessResults);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("peladas.voting.results.hero_title")).toBeInTheDocument();
    });

    expect(screen.getByText("common.organization")).toBeInTheDocument();

    const orgLink = screen.getByText("common.organization").closest("a");
    expect(orgLink).toHaveAttribute("href", "/home");

    expect(screen.getAllByText("Player A").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Player B").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Player C").length).toBeGreaterThanOrEqual(1);

    const noAwardsMessages = screen.getAllByText("peladas.voting.results.no_awards");
    expect(noAwardsMessages.length).toBe(2);

    expect(screen.getByText("common.positions.unknown")).toBeInTheDocument();
    expect(screen.getByText("common.positions.striker")).toBeInTheDocument();
    expect(screen.getByText("common.positions.goalkeeper")).toBeInTheDocument();
  });

  it("shows still voting message when receiving a 400 error", async () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: "Voting is still open" },
      },
    };

    vi.mocked(api.get).mockRejectedValueOnce(axiosError);

    renderWithProviders();

    await waitFor(() => {
      expect(
        screen.getByText("peladas.voting.results.error.still_voting"),
      ).toBeInTheDocument();
    });
  });
});
