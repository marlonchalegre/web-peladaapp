import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TeamsSection, {
  type TeamsSectionProps,
  type PlayerWithUser,
} from "./TeamsSection";
import type { Team } from "../../../shared/api/endpoints";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { number?: number }) => {
      if (key === "peladas.teams.default_name") {
        return `Team ${options?.number}`;
      }
      return key;
    },
  }),
}));

// Mock TeamCard to avoid mounting its complex inner elements
vi.mock("./TeamCard", () => ({
  default: vi.fn(
    ({ team, players, averageScore, onDelete, onDrop, onDragStartPlayer }) => (
      <div data-testid={`team-card-${team.id}`}>
        <span>Team: {team.name}</span>
        <span>Average: {averageScore ?? "N/A"}</span>
        <span>Players Count: {players.length}</span>
        <button data-testid={`delete-team-${team.id}`} onClick={onDelete}>
          Delete Team
        </button>
        <div
          data-testid={`dropzone-${team.id}`}
          onDrop={(e) => onDrop(e)}
          onDragOver={(e) => e.preventDefault()}
        >
          Dropzone
        </div>
        {players.map(
          (p: {
            id: string;
            displayScore?: string;
            user?: { name?: string };
          }) => (
            <div
              key={p.id}
              data-testid={`player-${p.id}`}
              draggable
              onDragStart={(e) => onDragStartPlayer(e, p.id)}
            >
              {p.user?.name} ({p.displayScore})
            </div>
          ),
        )}
      </div>
    ),
  ),
}));

describe("TeamsSection", () => {
  let defaultProps: TeamsSectionProps;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps = {
      teams: [
        { id: "t1", name: "Team A" },
        { id: "t2", name: "Team B" },
      ] as Team[],
      teamPlayers: {
        t1: [
          { id: "p1", grade: 8.5, user: { name: "Player 1" } },
          { id: "p2", grade: 9.0, user: { name: "Player 2" } },
        ] as PlayerWithUser[],
        t2: [
          { id: "p3", grade: 7.0, user: { name: "Player 3" } },
        ] as PlayerWithUser[],
      },
      playersPerTeam: 5,
      creatingTeam: false,
      locked: false,
      onCreateTeam: vi.fn().mockResolvedValue(undefined),
      onDeleteTeam: vi.fn().mockResolvedValue(undefined),
      onDragStartPlayer: vi.fn(),
      dropToTeam: vi.fn().mockResolvedValue(undefined),
      scores: {
        p1: 9.5, // overrides grade 8.5
      },
      isAdminOverride: true,
      hasFixedGoalkeepers: false,
      peladaTransactions: [],
      organizationId: "org1",
      onMarkPaid: vi.fn(),
      onReversePayment: vi.fn(),
    };
  });

  it("renders teams and calls average score calculation correctly", () => {
    render(<TeamsSection {...defaultProps} />);

    expect(screen.getByTestId("team-card-t1")).toBeInTheDocument();
    expect(screen.getByTestId("team-card-t2")).toBeInTheDocument();

    // Average for Team A: (p1 score=9.5 + p2 grade=9.0) / 2 = 9.25
    expect(screen.getByText("Average: 9.25")).toBeInTheDocument();

    // Average for Team B: p3 grade=7.0
    expect(screen.getByText("Average: 7")).toBeInTheDocument();

    // Display scores: p1 has overridden displayScore "9.5", p2 has grade displayScore "9.0"
    expect(screen.getByText("Player 1 (9.5)")).toBeInTheDocument();
    expect(screen.getByText("Player 2 (9.0)")).toBeInTheDocument();
  });

  it("handles empty team players list and average score calculation gracefully", () => {
    const props = {
      ...defaultProps,
      teamPlayers: {
        t1: [],
        t2: [
          { id: "p3", grade: undefined, user: { name: "Player 3" } },
        ] as PlayerWithUser[],
      },
    };
    render(<TeamsSection {...props} />);

    expect(screen.getByTestId("team-card-t1")).toBeInTheDocument();
    expect(screen.getAllByText("Average: N/A")).toHaveLength(2);
    expect(screen.getByText("Player 3 (-)")).toBeInTheDocument();
  });

  it("displays loading indicator when creatingTeam is true", () => {
    const props = { ...defaultProps, creatingTeam: true };
    const { container } = render(<TeamsSection {...props} />);

    // CircularProgress should be present
    expect(
      container.querySelector(".MuiCircularProgress-root"),
    ).toBeInTheDocument();
  });

  it("calls onDeleteTeam when a team's delete button is clicked", () => {
    render(<TeamsSection {...defaultProps} />);

    const deleteButton = screen.getByTestId("delete-team-t1");
    fireEvent.click(deleteButton);

    expect(defaultProps.onDeleteTeam).toHaveBeenCalledWith("t1");
  });

  it("calls onCreateTeam when add team button is clicked", () => {
    render(<TeamsSection {...defaultProps} />);

    const addButton = screen.getByTestId("add-team-button");
    fireEvent.click(addButton);

    expect(defaultProps.onCreateTeam).toHaveBeenCalledWith("Team 3");
  });

  it("does not show add team button when locked is true or isAdminOverride is false", () => {
    const { rerender } = render(
      <TeamsSection {...defaultProps} locked={true} />,
    );
    expect(screen.queryByTestId("add-team-button")).not.toBeInTheDocument();

    rerender(<TeamsSection {...defaultProps} isAdminOverride={false} />);
    expect(screen.queryByTestId("add-team-button")).not.toBeInTheDocument();
  });

  it("wires drag and drop operations correctly", () => {
    render(<TeamsSection {...defaultProps} />);

    // Test drag start on player 1
    const player1 = screen.getByText("Player 1 (9.5)");
    fireEvent.dragStart(player1);
    expect(defaultProps.onDragStartPlayer).toHaveBeenCalled();

    // Test drop on team 2
    const dropzoneT2 = screen.getByTestId("dropzone-t2");
    fireEvent.drop(dropzoneT2);
    expect(defaultProps.dropToTeam).toHaveBeenCalled();
  });
});
