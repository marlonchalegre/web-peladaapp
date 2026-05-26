import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import PeladaVotingPage from "./PeladaVotingPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../../../shared/api/client";
import { useAuth } from "../../../app/providers/AuthContext";

// Mock the API client
vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "1", name: "Current User", email: "me@test.com" },
    isAuthenticated: true,
  })),
}));

// Mock MUI Rating component to easily test its value
vi.mock("@mui/material", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    Rating: (props: { value: number | null; "data-testid"?: string; onChange?: (e: any, v: number) => void }) => (
      <input
        type="number"
        data-testid={props["data-testid"]}
        value={props.value || ""}
        onChange={(e) => props.onChange?.(e, parseInt(e.target.value, 10))}
      />
    ),
  };
});

describe("PeladaVotingPage", () => {
  const mockVotingInfo = {
    can_vote: true,
    has_voted: false,
    eligible_players: [{ player_id: "11", name: "Target Player", voting_enabled: true }],
    voter_player_id: "10",
  };

  const mockVotingStatus = {
    voters: [{ player_id: "10", name: "Current User", has_voted: false }],
    total_eligible: 1,
    total_voted: 0,
  };

  const mockPeladaDetails = {
    pelada: { id: "1", is_admin: false },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as Mock).mockReturnValue({
      user: { id: "1", name: "Current User", email: "me@test.com" },
      isAuthenticated: true,
    });
  });

  const setupMocks = (info = mockVotingInfo, status = mockVotingStatus, details = mockPeladaDetails) => {
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/voting-info") return Promise.resolve(info);
      if (path === "/api/peladas/1/voting-status") return Promise.resolve(status);
      if (path === "/api/peladas/1/full-details") return Promise.resolve(details);
      return Promise.reject(new Error(`Not found: ${path}`));
    });
  };

  it("pre-populates existing votes if available", async () => {
    const infoWithVotes = {
      ...mockVotingInfo,
      has_voted: true,
      eligible_players: [
        { player_id: "11", name: "Player 11" },
        { player_id: "12", name: "Player 12" },
      ],
      current_votes: [{ target_id: "11", stars: 4 }],
    };
    setupMocks(infoWithVotes);

    render(
      <MemoryRouter initialEntries={["/peladas/1/voting"]}>
        <Routes>
          <Route path="/peladas/:id/voting" element={<PeladaVotingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      const rating11 = screen.getByTestId("rating-11") as HTMLInputElement;
      expect(rating11.value).toBe("4");
      expect(screen.getByText("peladas.voting.info.already_voted_view_change")).toBeInTheDocument();
    });
  });

  it("handles voting submission successfully", async () => {
    setupMocks();
    (api.post as Mock).mockResolvedValue({ votes_cast: 1 });

    render(
      <MemoryRouter initialEntries={["/peladas/1/voting"]}>
        <Routes>
          <Route path="/peladas/:id/voting" element={<PeladaVotingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Target Player")).toBeInTheDocument());

    const rating = screen.getByTestId("rating-11");
    fireEvent.change(rating, { target: { value: "5" } });

    const saveButton = screen.getByTestId("save-votes-button");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/api/peladas/1/votes/batch",
        expect.objectContaining({
          voter_id: "10",
          votes: [{ target_id: "11", stars: 5 }],
        }),
      );
      expect(screen.getAllByText("peladas.voting.success.saved")[0]).toBeInTheDocument();
    });
  });

  it("handles submission failure", async () => {
    setupMocks();
    (api.post as Mock).mockRejectedValue(new Error("Save failed"));

    render(
      <MemoryRouter initialEntries={["/peladas/1/voting"]}>
        <Routes>
          <Route path="/peladas/:id/voting" element={<PeladaVotingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId("save-votes-button")).toBeInTheDocument());
    fireEvent.change(screen.getByTestId("rating-11"), { target: { value: "5" } });
    fireEvent.click(screen.getByTestId("save-votes-button"));

    await waitFor(() => {
      expect(screen.getAllByText("Save failed")[0]).toBeInTheDocument();
    });
  });

  it("allows admin to disable and enable voting for players", async () => {
    const adminDetails = { pelada: { id: "1", is_admin: true } };
    setupMocks(mockVotingInfo, mockVotingStatus, adminDetails);
    (api.post as Mock).mockResolvedValue({ updated: 1 });

    render(
      <MemoryRouter initialEntries={["/peladas/1/voting"]}>
        <Routes>
          <Route path="/peladas/:id/voting" element={<PeladaVotingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("common.actions.disable")).toBeInTheDocument());

    // Disable
    fireEvent.click(screen.getByText("common.actions.disable"));
    fireEvent.click(screen.getAllByText("common.actions.disable")[1]); // Click in dialog

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/api/peladas/1/attendance/voting-enabled",
        expect.objectContaining({ player_id: "11", enabled: false }),
      );
      expect(screen.getByText("common.actions.enable")).toBeInTheDocument();
    });

    // Enable
    fireEvent.click(screen.getByText("common.actions.enable"));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/api/peladas/1/attendance/voting-enabled",
        expect.objectContaining({ player_id: "11", enabled: true }),
      );
    });
  });

  it("handles unauthenticated state", async () => {
    (useAuth as Mock).mockReturnValue({ user: null, isAuthenticated: false });
    setupMocks();

    render(
      <MemoryRouter initialEntries={["/peladas/1/voting"]}>
        <Routes>
          <Route path="/peladas/:id/voting" element={<PeladaVotingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("peladas.voting.error.unauthenticated")).toBeInTheDocument();
    });
  });

  it("handles cannot vote state for non-admins", async () => {
    const cannotVoteInfo = { ...mockVotingInfo, can_vote: false, message: "Custom message" };
    setupMocks(cannotVoteInfo);

    render(
      <MemoryRouter initialEntries={["/peladas/1/voting"]}>
        <Routes>
          <Route path="/peladas/:id/voting" element={<PeladaVotingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Custom message")[0]).toBeInTheDocument();
    });
  });

  it("renders voting status sidebar", async () => {
    const status = {
      voters: [
        { player_id: "11", name: "Voter 11", has_voted: true },
        { player_id: "12", name: "Voter 12", has_voted: false },
      ],
      total_eligible: 2,
      total_voted: 1,
    };
    setupMocks(mockVotingInfo, status);

    render(
      <MemoryRouter initialEntries={["/peladas/1/voting"]}>
        <Routes>
          <Route path="/peladas/:id/voting" element={<PeladaVotingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Voter 11")).toBeInTheDocument();
      expect(screen.getByText("Voter 12")).toBeInTheDocument();
      expect(screen.getByText("peladas.voting.status.voted (1)")).toBeInTheDocument();
      expect(screen.getByText("peladas.voting.status.pending (1)")).toBeInTheDocument();
    });
  });

  it("handles data load failure", async () => {
    (api.get as Mock).mockRejectedValue(new Error("Load fail"));

    render(
      <MemoryRouter initialEntries={["/peladas/1/voting"]}>
        <Routes>
          <Route path="/peladas/:id/voting" element={<PeladaVotingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Load fail")).toBeInTheDocument();
    });
  });

  it("renders warning when no players are eligible for voting", async () => {
    const emptyInfo = { ...mockVotingInfo, eligible_players: [] };
    setupMocks(emptyInfo);

    render(
      <MemoryRouter initialEntries={["/peladas/1/voting"]}>
        <Routes>
          <Route path="/peladas/:id/voting" element={<PeladaVotingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("peladas.voting.warning.no_eligible_players")).toBeInTheDocument();
    });
  });
});
