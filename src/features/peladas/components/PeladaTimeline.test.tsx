/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PeladaTimeline from "./PeladaTimeline";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("PeladaTimeline", () => {
  const userIdToName = {
    u1: "User One",
    u2: "User Two",
  };
  const orgPlayerIdToUserId = {
    p1: "u1",
    p2: "u2",
  };
  const teamNameById = {};

  it("renders empty state correctly", () => {
    render(
      <PeladaTimeline
        events={[]}
        userIdToName={userIdToName}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        teamNameById={teamNameById}
      />,
    );
    expect(screen.getByText("peladas.timeline.no_events")).toBeInTheDocument();
  });

  it("renders timeline events and handles time formatting", () => {
    const mockEvents = [
      {
        id: "e1",
        event_type: "goal",
        player_id: "p1",
        session_time_ms: 184000, // 03:04 (no hours)
        match_time_ms: 60000,
      },
      {
        id: "e2",
        event_type: "own_goal",
        player_id: "p2",
        session_time_ms: 7384000, // 02:03:04 (hours > 0)
        match_time_ms: 120000,
      },
      {
        id: "e3",
        event_type: "assist",
        player_id: "p3", // player_id not in map (fallback player name)
        session_time_ms: null, // should render --:--
        match_time_ms: null,
      },
      {
        id: "e4",
        event_type: "some_other_type", // default case icon
        player_id: "p1",
        session_time_ms: undefined,
        match_time_ms: undefined,
      },
    ] as any[];

    render(
      <PeladaTimeline
        events={mockEvents}
        userIdToName={userIdToName}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        teamNameById={teamNameById}
      />,
    );

    // Check Player names
    expect(screen.getByText(/common.goal: User One/)).toBeInTheDocument();
    expect(screen.getByText(/common.own_goal: User Two/)).toBeInTheDocument();
    expect(screen.getByText(/common.assist: Player p3/)).toBeInTheDocument();
    expect(
      screen.getByText(/common.some_other_type: User One/),
    ).toBeInTheDocument();

    // Check time values
    expect(screen.getByText("03:04")).toBeInTheDocument();
    expect(screen.getByText("2:03:04")).toBeInTheDocument();
  });

  it("sorts events by session_time_ms primarily, then by string id comparison", () => {
    const mockEvents = [
      {
        id: "e3",
        event_type: "goal",
        player_id: "p1",
        session_time_ms: null,
      },
      {
        id: "e2",
        event_type: "goal",
        player_id: "p1",
        session_time_ms: 5000,
      },
      {
        id: "e1",
        event_type: "goal",
        player_id: "p1",
        session_time_ms: 1000,
      },
      {
        id: "e4",
        event_type: "goal",
        player_id: "p1",
        session_time_ms: null,
      },
    ] as any[];

    render(
      <PeladaTimeline
        events={mockEvents}
        userIdToName={userIdToName}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        teamNameById={teamNameById}
      />,
    );

    expect(screen.getAllByText(/common.goal/)).toHaveLength(4);
  });

  it("correctly pairs goals and assists when multiple simultaneous goals are scored, using parent_event_id", () => {
    const mockEvents = [
      {
        id: "goal-1",
        event_type: "goal",
        player_id: "p1",
        session_time_ms: 1000,
        match_time_ms: 1000,
      },
      {
        id: "assist-1",
        event_type: "assist",
        player_id: "p2",
        session_time_ms: 1000,
        match_time_ms: 1000,
        parent_event_id: "goal-1",
      },
      {
        id: "goal-2",
        event_type: "goal",
        player_id: "p2",
        session_time_ms: 1000,
        match_time_ms: 1000,
      },
      {
        id: "assist-2",
        event_type: "assist",
        player_id: "p1",
        session_time_ms: 1000,
        match_time_ms: 1000,
        parent_event_id: "goal-2",
      },
    ] as any[];

    render(
      <PeladaTimeline
        events={mockEvents}
        userIdToName={userIdToName}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        teamNameById={teamNameById}
      />,
    );

    // Goal 1 (scored by User One) should have Assist 1 (assisted by User Two)
    expect(screen.getByText(/common.goal: User One/)).toBeInTheDocument();
    expect(screen.getByText(/common.assist: User Two/)).toBeInTheDocument();

    // Goal 2 (scored by User Two) should have Assist 2 (assisted by User One)
    expect(screen.getByText(/common.goal: User Two/)).toBeInTheDocument();
    expect(screen.getByText(/common.assist: User One/)).toBeInTheDocument();
  });
});
