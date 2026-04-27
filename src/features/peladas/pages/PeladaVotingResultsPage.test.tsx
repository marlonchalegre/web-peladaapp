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
    expect(screen.queryByText(/peladas\.detail\.button\.vote/i)).not.toBeInTheDocument();
    
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
});
