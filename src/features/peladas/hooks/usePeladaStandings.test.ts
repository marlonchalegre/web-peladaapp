import { describe, it, expect } from "vitest";
import { usePeladaStandings } from "./usePeladaStandings";
import { renderHook } from "@testing-library/react";
import { type Match, type Team } from "../../../shared/api/endpoints";

describe("usePeladaStandings Tie-breaking logic", () => {
  const mockTeams: Team[] = [
    { id: 1, pelada_id: 1, name: "Time A" },
    { id: 2, pelada_id: 1, name: "Time B" },
  ];

  it("should tie-break using Goal Difference then Goals Scored", () => {
    // Total:
    // Time A: 1W 0D 1L, 3 pts, 4 GS, 4 GC, 0 GD
    // Time B: 1W 0D 1L, 3 pts, 4 GS, 4 GC, 0 GD
    // They are equal. Let's make them different.

    const matches2: Match[] = [
      // Time A wins 2-0 (3 pts, +2 GD, 2 GS)
      { id: 1, pelada_id: 1, home_team_id: 1, away_team_id: 2, home_score: 2, away_score: 0, status: "finished", sequence: 1 },
      // Time B wins 3-2 (3 pts, +1 GD, 3 GS)
      { id: 2, pelada_id: 1, home_team_id: 2, away_team_id: 1, home_score: 3, away_score: 2, status: "finished", sequence: 2 },
    ];
    
    // Total:
    // Time A: 1W 0D 1L, 3 pts, GS: 4, GC: 3, GD: +1
    // Time B: 1W 0D 1L, 3 pts, GS: 3, GC: 4, GD: -1
    
    const { result } = renderHook(() => usePeladaStandings(
      matches2,
      mockTeams,
      [],
      null,
      {},
      {},
      {},
      {}
    ));

    // Time A should be first due to GD (+1 vs -1)
    expect(result.current.standings[0].teamId).toBe(1);
    expect(result.current.standings[0].goalsFor).toBe(4);
    expect(result.current.standings[0].goalsAgainst).toBe(3);
    expect(result.current.standings[0].goalDifference).toBe(1);
  });

  it("should tie-break using Goals Scored if GD is equal", () => {
    // Total:
    // Time A: 1W 0D 1L, 3 pts, GS: 2, GC: 2, GD: 0
    // Time B: 1W 0D 1L, 3 pts, GS: 2, GC: 2, GD: 0
    // Still equal. 
    
    const matches2: Match[] = [
        // A: 1W, 0D, 0L. GS: 3, GC: 0, GD: 3
        { id: 1, pelada_id: 1, home_team_id: 1, away_team_id: 3, home_score: 3, away_score: 0, status: "finished", sequence: 1 },
        // B: 1W, 0D, 0L. GS: 4, GC: 1, GD: 3
        { id: 2, pelada_id: 1, home_team_id: 2, away_team_id: 3, home_score: 4, away_score: 1, status: "finished", sequence: 2 },
    ];
    const teams = [...mockTeams, { id: 3, pelada_id: 1, name: "Time C" }];

    const { result } = renderHook(() => usePeladaStandings(
      matches2,
      teams,
      [],
      null,
      {},
      {},
      {},
      {}
    ));

    // Time B should be first due to GS (4 vs 3) since GD is both 3
    expect(result.current.standings[0].teamId).toBe(2);
    expect(result.current.standings[0].goalDifference).toBe(3);
    expect(result.current.standings[0].goalsFor).toBe(4);
  });
});
