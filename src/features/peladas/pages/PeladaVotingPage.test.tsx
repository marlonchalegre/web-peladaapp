import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PeladaVotingPage from "./PeladaVotingPage";
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
    user: { id: 1, name: "Current User", email: "me@test.com" },
    isAuthenticated: true,
  }),
}));

// Mock MUI Rating component to easily test its value
vi.mock("@mui/material", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    Rating: (props: { value: number | null; "data-testid"?: string }) => (
      <input
        type="number"
        data-testid={props["data-testid"]}
        value={props.value || ""}
        readOnly
      />
    ),
  };
});

describe("PeladaVotingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pre-populates existing votes if available", async () => {
    const mockVotingInfo = {
      can_vote: true,
      has_voted: true,
      eligible_players: [
        { player_id: 11, name: "Player 11" },
        { player_id: 12, name: "Player 12" },
      ],
      current_votes: [{ target_id: 11, stars: 4 }],
      voter_player_id: 10,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/voting-info")
        return Promise.resolve(mockVotingInfo);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/voting"]}>
        <Routes>
          <Route path="/peladas/:id/voting" element={<PeladaVotingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      // Check if the rating input for player 11 has value 4
      const rating11 = screen.getByTestId("rating-11") as HTMLInputElement;
      expect(rating11.value).toBe("4");

      // Check if the rating input for player 12 is empty
      const rating12 = screen.getByTestId("rating-12") as HTMLInputElement;
      expect(rating12.value).toBe("");

      // Check for the "already voted" message
      expect(
        screen.getByText("peladas.voting.info.already_voted_view_change"),
      ).toBeInTheDocument();
    });
  });

  it("renders voting form with eligible players", async () => {
    const mockVotingInfo = {
      can_vote: true,
      has_voted: false,
      eligible_players: [{ player_id: 11, name: "Target Player" }],
      voter_player_id: 10,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/voting-info")
        return Promise.resolve(mockVotingInfo);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/voting"]}>
        <Routes>
          <Route path="/peladas/:id/voting" element={<PeladaVotingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      // t('peladas.voting.title', { id: 1 }) -> 'peladas.voting.title' with simple mock
      expect(
        screen.getAllByText("peladas.voting.title").length,
      ).toBeGreaterThan(0);
      expect(screen.getByText("Target Player")).toBeInTheDocument();
    });
  });

  it("renders warning when no players are eligible for voting", async () => {
    const mockVotingInfo = {
      can_vote: true,
      has_voted: false,
      eligible_players: [],
      voter_player_id: 10,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/voting-info")
        return Promise.resolve(mockVotingInfo);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/voting"]}>
        <Routes>
          <Route path="/peladas/:id/voting" element={<PeladaVotingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("peladas.voting.warning.no_eligible_players"),
      ).toBeInTheDocument();
    });
  });
});
