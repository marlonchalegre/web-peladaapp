import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PeladaVotingResultsPage from "./PeladaVotingResultsPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../../../shared/api/client";

// Mock the API client
vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
  },
}));

describe("PeladaVotingResultsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResults = {
    mvp: [
      {
        player_id: 1,
        name: "MVP Player",
        position: "STRIKER",
        average_stars: 4.8,
        goals: 3,
        assists: 1,
        own_goals: 0,
      },
      {
        player_id: 2,
        name: "Second Place",
        position: "MIDFIELDER",
        average_stars: 4.2,
        goals: 1,
        assists: 2,
        own_goals: 0,
      },
      {
        player_id: 3,
        name: "Third Place",
        position: "DEFENDER",
        average_stars: 3.9,
        goals: 0,
        assists: 0,
        own_goals: 0,
      },
    ],
    striker: [
      {
        player_id: 1,
        name: "MVP Player",
        goals: 3,
        assists: 1,
        average_stars: 4.8,
        own_goals: 0,
      },
    ],
    garcom: [
      {
        player_id: 2,
        name: "Second Place",
        goals: 1,
        assists: 2,
        average_stars: 4.2,
        own_goals: 0,
      },
    ],
    voters: [
      { player_id: 1, name: "MVP Player", has_voted: true },
      { player_id: 2, name: "Second Place", has_voted: true },
      { player_id: 3, name: "Third Place", has_voted: false },
    ],
    total_eligible: 3,
    total_voted: 2,
    organization_id: 123,
    organization_name: "Test Org",
  };

  it("renders results dashboard correctly", async () => {
    (api.get as Mock).mockResolvedValue(mockResults);

    render(
      <MemoryRouter initialEntries={["/peladas/1/results"]}>
        <Routes>
          <Route
            path="/peladas/:id/results"
            element={<PeladaVotingResultsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      // Check title and engagement
      expect(
        screen.getByText("peladas.voting.results.hero_title"),
      ).toBeInTheDocument();
      expect(screen.getByText("67%")).toBeInTheDocument(); // 2/3 voted

      // Check participation text with "of" translation
      expect(screen.getByText(/2 common\.of 3/)).toBeInTheDocument();

      // Check breadcrumb
      const orgBreadcrumb = screen.getByRole("link", { name: "Test Org" });
      expect(orgBreadcrumb).toBeInTheDocument();
      expect(orgBreadcrumb.getAttribute("href")).toBe("/organizations/123");

      // Check MVP Podium (might have multiple occurrences in awards/table/voters)
      expect(screen.getAllByText("MVP Player").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Second Place").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Third Place").length).toBeGreaterThan(0);
      expect(screen.getByText("4.8 ★")).toBeInTheDocument();

      // Check Special Awards
      expect(
        screen.getByText("peladas.voting.results.top_scorer"),
      ).toBeInTheDocument();
      expect(screen.getByText("3 Gols")).toBeInTheDocument();
      expect(
        screen.getByText("peladas.voting.results.top_assists"),
      ).toBeInTheDocument();
      expect(screen.getByText("2 Assis.")).toBeInTheDocument();

      // Check Voter Transparency
      expect(
        screen.getByText("peladas.voting.results.voter_transparency"),
      ).toBeInTheDocument();
    });
  });

  it("handles 'still voting' error correctly", async () => {
    const errorResponse = {
      response: {
        status: 400,
        data: { message: "Voting still in progress" },
      },
      isAxiosError: true,
    };
    (api.get as Mock).mockRejectedValue(errorResponse);

    render(
      <MemoryRouter initialEntries={["/peladas/1/results"]}>
        <Routes>
          <Route
            path="/peladas/:id/results"
            element={<PeladaVotingResultsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("peladas.voting.results.error.still_voting"),
      ).toBeInTheDocument();
    });
  });
});
