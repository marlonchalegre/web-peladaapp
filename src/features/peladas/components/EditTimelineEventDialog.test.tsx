/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EditTimelineEventDialog from "./EditTimelineEventDialog";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: string) => def || key,
  }),
}));

describe("EditTimelineEventDialog", () => {
  const mockMatch = {
    id: "m1",
    pelada_id: "pelada-1",
    sequence: 1,
    home_team_id: "t1",
    away_team_id: "t2",
    home_score: 1,
    away_score: 0,
    status: "in_progress",
  } as any;

  const mockGoalEvent = {
    id: "e-goal-1",
    match_id: "m1",
    player_id: "p1",
    event_type: "goal",
    session_time_ms: 120000,
    match_time_ms: 60000,
    team_id: "t1",
  } as any;

  const mockAssistEvent = {
    id: "e-assist-1",
    match_id: "m1",
    player_id: "p2",
    event_type: "assist",
    parent_event_id: "e-goal-1",
    session_time_ms: 120000,
    match_time_ms: 60000,
    team_id: "t1",
  } as any;

  const orgPlayerIdToPlayer = {
    p1: {
      id: "p1",
      user_id: "u1",
      user_name: "Alice (Scorer)",
      user_position: "striker",
    },
    p2: {
      id: "p2",
      user_id: "u2",
      user_name: "Bob (Assistant)",
      user_position: "midfielder",
    },
    p3: {
      id: "p3",
      user_id: "u3",
      user_name: "Charlie (Defender)",
      user_position: "defender",
    },
    p4: {
      id: "p4",
      user_id: "u4",
      user_name: "Dave (Opponent)",
      user_position: "striker",
    },
    p5: {
      id: "p5",
      user_id: "u5",
      user_name: "Eve (Bench)",
      user_position: "midfielder",
    },
  } as any;

  const orgPlayerIdToUserId = {
    p1: "u1",
    p2: "u2",
    p3: "u3",
    p4: "u4",
    p5: "u5",
  };

  const userIdToName = {
    u1: "Alice (Scorer)",
    u2: "Bob (Assistant)",
    u3: "Charlie (Defender)",
    u4: "Dave (Opponent)",
    u5: "Eve (Bench)",
  };

  const teamNameById = {
    t1: "Time Azul",
    t2: "Time Branco",
  };

  const lineupsByMatch = {
    m1: {
      t1: [
        { team_id: "t1", player_id: "p1", is_goalkeeper: false },
        { team_id: "t1", player_id: "p2", is_goalkeeper: false },
        { team_id: "t1", player_id: "p3", is_goalkeeper: false },
      ],
      t2: [{ team_id: "t2", player_id: "p4", is_goalkeeper: false }],
    },
  };

  const teamPlayers = {
    t1: [
      { team_id: "t1", player_id: "p1" },
      { team_id: "t1", player_id: "p2" },
      { team_id: "t1", player_id: "p3" },
    ],
    t2: [{ team_id: "t2", player_id: "p4" }],
  } as any;

  const orgPlayerIdToTeamId = {
    p1: "t1",
    p2: "t1",
    p3: "t1",
    p4: "t2",
  };

  it("renders the dialog with match details, quick select chips, and initializes selected scorer and assistant", () => {
    render(
      <EditTimelineEventDialog
        open={true}
        event={mockGoalEvent}
        match={mockMatch}
        onClose={vi.fn()}
        onSave={vi.fn()}
        orgPlayerIdToPlayer={orgPlayerIdToPlayer}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        userIdToName={userIdToName}
        teamNameById={teamNameById}
        lineupsByMatch={lineupsByMatch}
        teamPlayers={teamPlayers}
        orgPlayerIdToTeamId={orgPlayerIdToTeamId}
        matchEvents={[mockGoalEvent, mockAssistEvent]}
      />,
    );

    // Dialog is visible
    expect(screen.getByTestId("edit-event-dialog")).toBeInTheDocument();

    // Title and match info
    expect(screen.getByText("Edit Goal & Assist")).toBeInTheDocument();
    expect(screen.getByText(/Time Azul vs Time Branco/)).toBeInTheDocument();

    // Quick select chips for primary team members
    expect(screen.getByTestId("quick-select-scorer-p1")).toBeInTheDocument();
    expect(screen.getByTestId("quick-select-scorer-p2")).toBeInTheDocument();
    expect(screen.getByTestId("quick-select-scorer-p3")).toBeInTheDocument();

    // Scorer select is populated with Alice (p1)
    const scorerSelect = screen.getByTestId("edit-scorer-select");
    const scorerInput = scorerSelect.querySelector("input") as HTMLInputElement;
    expect(scorerInput.value).toBe("p1");

    // Assistant select is populated with Bob (p2)
    const assistantSelect = screen.getByTestId("edit-assistant-select");
    const assistantInput = assistantSelect.querySelector(
      "input",
    ) as HTMLInputElement;
    expect(assistantInput.value).toBe("p2");
  });

  it("allows selecting any player (opponent or bench) for goal and assistance", async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <EditTimelineEventDialog
        open={true}
        event={mockGoalEvent}
        match={mockMatch}
        onClose={vi.fn()}
        onSave={handleSave}
        orgPlayerIdToPlayer={orgPlayerIdToPlayer}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        userIdToName={userIdToName}
        teamNameById={teamNameById}
        lineupsByMatch={lineupsByMatch}
        teamPlayers={teamPlayers}
        orgPlayerIdToTeamId={orgPlayerIdToTeamId}
        matchEvents={[mockGoalEvent, mockAssistEvent]}
      />,
    );

    // Open scorer select dropdown
    const scorerSelect = screen.getByTestId("edit-scorer-select");
    const selectBtn = within(scorerSelect).getByRole("combobox");
    fireEvent.mouseDown(selectBtn);

    const listbox = await screen.findByRole("listbox");

    // Primary team member (Alice) is shown
    expect(within(listbox).getByText("Alice (Scorer)")).toBeInTheDocument();

    // Opponent player (Dave) is NOT available
    expect(
      within(listbox).queryByText(/Dave \(Opponent\)/),
    ).not.toBeInTheDocument();

    // Bench player (Eve) IS available
    const benchOption = within(listbox).getByText("Eve (Bench)");
    expect(benchOption).toBeInTheDocument();

    // Select Eve (Bench player as informal sub) as the scorer
    fireEvent.click(benchOption);

    const scorerInput = scorerSelect.querySelector("input") as HTMLInputElement;
    expect(scorerInput.value).toBe("p5");

    // Now open assistant select and pick Charlie
    const assistantSelect = screen.getByTestId("edit-assistant-select");
    const assistSelectBtn = within(assistantSelect).getByRole("combobox");
    fireEvent.mouseDown(assistSelectBtn);

    const assistListbox = await screen.findByRole("listbox");
    expect(
      within(assistListbox).queryByText(/Dave \(Opponent\)/),
    ).not.toBeInTheDocument();

    const charlieAssistOption =
      within(assistListbox).getByText("Charlie (Defender)");
    fireEvent.click(charlieAssistOption);

    const assistantInput = assistantSelect.querySelector(
      "input",
    ) as HTMLInputElement;
    expect(assistantInput.value).toBe("p3");

    // Click Save
    const saveBtn = screen.getByTestId("save-event-edit-button");
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith("p5", "p3");
  });

  it("updates selection when clicking quick select chips", () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <EditTimelineEventDialog
        open={true}
        event={mockGoalEvent}
        match={mockMatch}
        onClose={vi.fn()}
        onSave={handleSave}
        orgPlayerIdToPlayer={orgPlayerIdToPlayer}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        userIdToName={userIdToName}
        teamNameById={teamNameById}
        lineupsByMatch={lineupsByMatch}
        teamPlayers={teamPlayers}
        orgPlayerIdToTeamId={orgPlayerIdToTeamId}
        matchEvents={[mockGoalEvent]}
      />,
    );

    // Quick select Charlie (p3) as scorer
    const charlieChip = screen.getByTestId("quick-select-scorer-p3");
    fireEvent.click(charlieChip);

    const scorerSelect = screen.getByTestId("edit-scorer-select");
    const scorerInput = scorerSelect.querySelector("input") as HTMLInputElement;
    expect(scorerInput.value).toBe("p3");

    // Quick select 'Without assistance'
    const noAssistChip = screen.getByTestId("quick-select-assistant-none");
    fireEvent.click(noAssistChip);

    const assistantSelect = screen.getByTestId("edit-assistant-select");
    const assistantInput = assistantSelect.querySelector(
      "input",
    ) as HTMLInputElement;
    expect(assistantInput.value).toBe("none");

    // Click Save
    const saveBtn = screen.getByTestId("save-event-edit-button");
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith("p3", null);
  });

  it("does not display assistant select for non-goal events", () => {
    const ownGoalEvent = {
      ...mockGoalEvent,
      event_type: "own_goal",
    };

    render(
      <EditTimelineEventDialog
        open={true}
        event={ownGoalEvent}
        match={mockMatch}
        onClose={vi.fn()}
        onSave={vi.fn()}
        orgPlayerIdToPlayer={orgPlayerIdToPlayer}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        userIdToName={userIdToName}
        teamNameById={teamNameById}
        lineupsByMatch={lineupsByMatch}
        teamPlayers={teamPlayers}
        orgPlayerIdToTeamId={orgPlayerIdToTeamId}
        matchEvents={[ownGoalEvent]}
      />,
    );

    expect(screen.getByText("Edit Own Goal")).toBeInTheDocument();
    expect(screen.queryByTestId("edit-assistant-select")).toBeNull();
  });

  it("makes standard and fixed goalkeepers available for selection as both scorer and assistant", () => {
    const customOrgPlayers = {
      ...orgPlayerIdToPlayer,
      gk1: {
        id: "gk1",
        user_id: "ugk1",
        user_name: "Goleiro Fixo Home",
        user_position: "goalkeeper",
      },
      gk2: {
        id: "gk2",
        user_id: "ugk2",
        user_name: "Goleiro Fixo Away",
        user_position: "goalkeeper",
      },
    };
    const customOrgToUser = {
      ...orgPlayerIdToUserId,
      gk1: "ugk1",
      gk2: "ugk2",
    };
    const customUserToName = {
      ...userIdToName,
      ugk1: "Goleiro Fixo Home",
      ugk2: "Goleiro Fixo Away",
    };

    const mockPelada = {
      id: "pelada-1",
      fixed_goalkeepers: true,
      home_fixed_goalkeeper_id: "gk1",
      away_fixed_goalkeeper_id: "gk2",
    } as any;

    render(
      <EditTimelineEventDialog
        open={true}
        event={mockGoalEvent}
        match={mockMatch}
        pelada={mockPelada}
        onClose={vi.fn()}
        onSave={vi.fn()}
        orgPlayerIdToPlayer={customOrgPlayers}
        orgPlayerIdToUserId={customOrgToUser}
        userIdToName={customUserToName}
        teamNameById={teamNameById}
        lineupsByMatch={lineupsByMatch}
        teamPlayers={teamPlayers}
        orgPlayerIdToTeamId={orgPlayerIdToTeamId}
        matchEvents={[mockGoalEvent, mockAssistEvent]}
      />,
    );

    // Goal Scorer quick chips should include the team's fixed goalkeeper
    const scorerGkChip = screen.getByTestId("quick-select-scorer-gk1");
    expect(scorerGkChip).toBeInTheDocument();
    expect(scorerGkChip).toHaveTextContent("Goleiro Fixo Home");

    // Opponent fixed goalkeeper should NOT be present in chips or options
    expect(screen.queryByTestId("quick-select-scorer-gk2")).toBeNull();

    // Select the fixed goalkeeper as scorer
    fireEvent.click(scorerGkChip);
    const scorerInput = screen
      .getByTestId("edit-scorer-select")
      .querySelector("input") as HTMLInputElement;
    expect(scorerInput.value).toBe("gk1");

    // Once gk1 is the scorer, they can't assist their own goal, but other teammates can
    expect(screen.queryByTestId("quick-select-assistant-gk1")).toBeNull();

    // Now select Alice (p1) back as scorer
    const scorerAliceChip = screen.getByTestId("quick-select-scorer-p1");
    fireEvent.click(scorerAliceChip);
    expect(scorerInput.value).toBe("p1");

    // Now the goalkeeper gk1 MUST be available in the assistant quick-select chips
    const assistantGkChip = screen.getByTestId("quick-select-assistant-gk1");
    expect(assistantGkChip).toBeInTheDocument();
    expect(assistantGkChip).toHaveTextContent("Goleiro Fixo Home");

    // Select the fixed goalkeeper as the assistant!
    fireEvent.click(assistantGkChip);
    const assistantInput = screen
      .getByTestId("edit-assistant-select")
      .querySelector("input") as HTMLInputElement;
    expect(assistantInput.value).toBe("gk1");
  });

  it("handles save rejection gracefully without crashing", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handleSave = vi.fn().mockRejectedValue(new Error("Network error"));
    const handleClose = vi.fn();

    render(
      <EditTimelineEventDialog
        open={true}
        event={mockGoalEvent}
        match={mockMatch}
        onClose={handleClose}
        onSave={handleSave}
        orgPlayerIdToPlayer={orgPlayerIdToPlayer}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        userIdToName={userIdToName}
        teamNameById={teamNameById}
        lineupsByMatch={lineupsByMatch}
        teamPlayers={teamPlayers}
        orgPlayerIdToTeamId={orgPlayerIdToTeamId}
        matchEvents={[mockGoalEvent]}
      />,
    );

    const saveBtn = screen.getByTestId("save-event-edit-button");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save edited event",
        expect.any(Error),
      );
    });

    // Close should not be called on failure
    expect(handleClose).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("gracefully includes an unknown/guest player attached to the event", () => {
    const guestEvent = {
      ...mockGoalEvent,
      player_id: "guest-player-999",
    };

    render(
      <EditTimelineEventDialog
        open={true}
        event={guestEvent}
        match={mockMatch}
        onClose={vi.fn()}
        onSave={vi.fn()}
        orgPlayerIdToPlayer={orgPlayerIdToPlayer}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        userIdToName={userIdToName}
        teamNameById={teamNameById}
        lineupsByMatch={lineupsByMatch}
        teamPlayers={teamPlayers}
        orgPlayerIdToTeamId={orgPlayerIdToTeamId}
        matchEvents={[guestEvent]}
      />,
    );

    // Should display fallback name
    const scorerSelect = screen.getByTestId("edit-scorer-select");
    const scorerInput = scorerSelect.querySelector("input") as HTMLInputElement;
    expect(scorerInput.value).toBe("guest-player-999");
  });

  it("triggers onClose when clicking the Cancel button", () => {
    const handleClose = vi.fn();
    render(
      <EditTimelineEventDialog
        open={true}
        event={mockGoalEvent}
        match={mockMatch}
        onClose={handleClose}
        onSave={vi.fn()}
        orgPlayerIdToPlayer={orgPlayerIdToPlayer}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        userIdToName={userIdToName}
        teamNameById={teamNameById}
      />,
    );

    const cancelBtn = screen.getByText("common.actions.cancel");
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("does not reset user form modifications during background polling updates", () => {
    const { rerender } = render(
      <EditTimelineEventDialog
        open={true}
        event={mockGoalEvent}
        match={mockMatch}
        onClose={vi.fn()}
        onSave={vi.fn()}
        orgPlayerIdToPlayer={orgPlayerIdToPlayer}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        userIdToName={userIdToName}
        teamNameById={teamNameById}
        lineupsByMatch={lineupsByMatch}
        teamPlayers={teamPlayers}
        orgPlayerIdToTeamId={orgPlayerIdToTeamId}
        matchEvents={[mockGoalEvent, mockAssistEvent]}
      />,
    );

    // User changes scorer to p3
    const chipP3 = screen.getByTestId("quick-select-scorer-p3");
    fireEvent.click(chipP3);

    const scorerInput = screen
      .getByTestId("edit-scorer-select")
      .querySelector("input") as HTMLInputElement;
    expect(scorerInput.value).toBe("p3");

    // Background polling sends fresh matchEvents and fresh match references
    rerender(
      <EditTimelineEventDialog
        open={true}
        event={mockGoalEvent}
        match={{ ...mockMatch }}
        onClose={vi.fn()}
        onSave={vi.fn()}
        orgPlayerIdToPlayer={orgPlayerIdToPlayer}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        userIdToName={userIdToName}
        teamNameById={teamNameById}
        lineupsByMatch={{ ...lineupsByMatch }}
        teamPlayers={{ ...teamPlayers }}
        orgPlayerIdToTeamId={orgPlayerIdToTeamId}
        matchEvents={[
          mockGoalEvent,
          mockAssistEvent,
          { id: "new-event", match_id: "m1" } as any,
        ]}
      />,
    );

    // Scorer must remain p3 (not reset to p1)
    expect(scorerInput.value).toBe("p3");
  });
});
