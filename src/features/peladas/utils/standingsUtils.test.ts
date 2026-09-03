import { describe, it, expect } from "vitest";
import {
  getStandingPoints,
  isAbsoluteTie,
  getMathematicalChampion,
  type StandingRow,
} from "./standingsUtils";
import type { Match } from "../../../shared/api/endpoints";

describe("standingsUtils", () => {
  describe("getStandingPoints", () => {
    it("uses points if defined", () => {
      expect(getStandingPoints({ wins: 2, draws: 1, points: 10 })).toBe(10);
    });

    it("calculates 3*wins + draws when points is undefined", () => {
      expect(getStandingPoints({ wins: 2, draws: 1 })).toBe(7);
    });
  });

  describe("isAbsoluteTie", () => {
    it("returns true when points, GD and GF are identical", () => {
      const a: StandingRow = {
        teamId: "1",
        name: "A",
        wins: 1,
        draws: 1,
        losses: 0,
        goalsFor: 4,
        goalsAgainst: 2,
        goalDifference: 2,
      };
      const b: StandingRow = { ...a, teamId: "2", name: "B" };
      expect(isAbsoluteTie(a, b)).toBe(true);
    });

    it("returns false when any tiebreak differs", () => {
      const a: StandingRow = {
        teamId: "1",
        name: "A",
        wins: 1,
        draws: 1,
        losses: 0,
        goalsFor: 4,
        goalsAgainst: 2,
        goalDifference: 2,
      };
      const bDifferentPoints: StandingRow = { ...a, wins: 2 };
      const bDifferentGD: StandingRow = { ...a, goalDifference: 3 };
      const bDifferentGF: StandingRow = { ...a, goalsFor: 5 };

      expect(isAbsoluteTie(a, bDifferentPoints)).toBe(false);
      expect(isAbsoluteTie(a, bDifferentGD)).toBe(false);
      expect(isAbsoluteTie(a, bDifferentGF)).toBe(false);
    });
  });

  describe("getMathematicalChampion - All Matches Finished", () => {
    it("returns null for empty standings", () => {
      expect(getMathematicalChampion([])).toBeNull();
    });

    it("returns null if first place has 0 wins and 0 draws", () => {
      const standings: StandingRow[] = [
        {
          teamId: "1",
          name: "Team 1",
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        },
      ];
      expect(getMathematicalChampion(standings)).toBeNull();
    });

    it("returns single team if it has at least one win or draw", () => {
      const standings: StandingRow[] = [
        {
          teamId: "1",
          name: "Team 1",
          wins: 1,
          draws: 0,
          losses: 0,
          goalsFor: 2,
          goalsAgainst: 0,
          goalDifference: 2,
          points: 3,
        },
      ];
      expect(getMathematicalChampion(standings)?.teamId).toBe("1");
    });

    it("returns champion when first place has strictly more points", () => {
      const standings: StandingRow[] = [
        {
          teamId: "1",
          name: "Team 1",
          wins: 2,
          draws: 0,
          losses: 0,
          goalsFor: 4,
          goalsAgainst: 1,
          goalDifference: 3,
          points: 6,
        },
        {
          teamId: "2",
          name: "Team 2",
          wins: 1,
          draws: 0,
          losses: 1,
          goalsFor: 2,
          goalsAgainst: 2,
          goalDifference: 0,
          points: 3,
        },
      ];
      const matches: Match[] = [
        {
          id: "m1",
          home_team_id: "1",
          away_team_id: "2",
          home_score: 2,
          away_score: 1,
          status: "finished",
        } as Match,
        {
          id: "m2",
          home_team_id: "1",
          away_team_id: "2",
          home_score: 2,
          away_score: 0,
          status: "finished",
        } as Match,
      ];
      expect(getMathematicalChampion(standings, matches)?.teamId).toBe("1");
    });

    it("breaks tie on Goal Difference when points are equal", () => {
      const standings: StandingRow[] = [
        {
          teamId: "1",
          name: "Team 1",
          wins: 1,
          draws: 0,
          losses: 1,
          goalsFor: 5,
          goalsAgainst: 1,
          goalDifference: 4,
          points: 3,
        },
        {
          teamId: "2",
          name: "Team 2",
          wins: 1,
          draws: 0,
          losses: 1,
          goalsFor: 2,
          goalsAgainst: 1,
          goalDifference: 1,
          points: 3,
        },
      ];
      const matches: Match[] = [
        {
          id: "m1",
          home_team_id: "1",
          away_team_id: "2",
          home_score: 5,
          away_score: 1,
          status: "finished",
        } as Match,
      ];
      expect(getMathematicalChampion(standings, matches)?.teamId).toBe("1");
    });

    it("breaks tie on Goals For when points and GD are equal", () => {
      const standings: StandingRow[] = [
        {
          teamId: "1",
          name: "Team 1",
          wins: 1,
          draws: 0,
          losses: 0,
          goalsFor: 4,
          goalsAgainst: 2,
          goalDifference: 2,
          points: 3,
        },
        {
          teamId: "2",
          name: "Team 2",
          wins: 1,
          draws: 0,
          losses: 0,
          goalsFor: 2,
          goalsAgainst: 0,
          goalDifference: 2,
          points: 3,
        },
      ];
      const matches: Match[] = [
        {
          id: "m1",
          home_team_id: "1",
          away_team_id: "2",
          home_score: 1,
          away_score: 0,
          status: "finished",
        } as Match,
      ];
      expect(getMathematicalChampion(standings, matches)?.teamId).toBe("1");
    });

    it("returns null on absolute tie (points, GD, and GF all equal)", () => {
      const standings: StandingRow[] = [
        {
          teamId: "1",
          name: "Team 1",
          wins: 1,
          draws: 1,
          losses: 0,
          goalsFor: 3,
          goalsAgainst: 1,
          goalDifference: 2,
          points: 4,
        },
        {
          teamId: "2",
          name: "Team 2",
          wins: 1,
          draws: 1,
          losses: 0,
          goalsFor: 3,
          goalsAgainst: 1,
          goalDifference: 2,
          points: 4,
        },
      ];
      const matches: Match[] = [
        {
          id: "m1",
          home_team_id: "1",
          away_team_id: "2",
          home_score: 1,
          away_score: 1,
          status: "finished",
        } as Match,
      ];
      expect(getMathematicalChampion(standings, matches)).toBeNull();
    });
  });

  describe("getMathematicalChampion - In-Progress Pelada (Remaining Matches)", () => {
    it("returns champion when leader is mathematically unreachable by all challengers", () => {
      // Team 1 has 7 points.
      // Team 2 has 1 point and 1 match left (max possible = 4 points).
      // Team 3 has 0 points and 1 match left (max possible = 3 points).
      const standings: StandingRow[] = [
        {
          teamId: "t1",
          name: "Team 1",
          wins: 2,
          draws: 1,
          losses: 0,
          goalsFor: 6,
          goalsAgainst: 1,
          goalDifference: 5,
          points: 7,
        },
        {
          teamId: "t2",
          name: "Team 2",
          wins: 0,
          draws: 1,
          losses: 1,
          goalsFor: 1,
          goalsAgainst: 3,
          goalDifference: -2,
          points: 1,
        },
        {
          teamId: "t3",
          name: "Team 3",
          wins: 0,
          draws: 0,
          losses: 1,
          goalsFor: 0,
          goalsAgainst: 3,
          goalDifference: -3,
          points: 0,
        },
      ];

      const matches: Match[] = [
        {
          id: "m1",
          home_team_id: "t1",
          away_team_id: "t2",
          home_score: 3,
          away_score: 1,
          status: "finished",
        } as Match,
        {
          id: "m2",
          home_team_id: "t1",
          away_team_id: "t3",
          home_score: 3,
          away_score: 0,
          status: "finished",
        } as Match,
        {
          id: "m3",
          home_team_id: "t1",
          away_team_id: "t2",
          home_score: 0,
          away_score: 0,
          status: "finished",
        } as Match,
        // Match 4 is still scheduled between t2 and t3
        {
          id: "m4",
          home_team_id: "t2",
          away_team_id: "t3",
          home_score: 0,
          away_score: 0,
          status: "scheduled",
        } as Match,
      ];

      const champ = getMathematicalChampion(standings, matches);
      expect(champ).not.toBeNull();
      expect(champ?.teamId).toBe("t1");
    });

    it("returns null if a challenger can mathematically tie the leader on points", () => {
      // Team 1 has 3 points (1 win).
      // Team 2 has 0 points and 1 match remaining against Team 3 (max 3 points).
      // If Team 2 wins, Team 2 ties Team 1 with 3 points and could win on GD!
      const standings: StandingRow[] = [
        {
          teamId: "t1",
          name: "Team 1",
          wins: 1,
          draws: 0,
          losses: 0,
          goalsFor: 2,
          goalsAgainst: 1,
          goalDifference: 1,
          points: 3,
        },
        {
          teamId: "t2",
          name: "Team 2",
          wins: 0,
          draws: 0,
          losses: 1,
          goalsFor: 1,
          goalsAgainst: 2,
          goalDifference: -1,
          points: 0,
        },
        {
          teamId: "t3",
          name: "Team 3",
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        },
      ];

      const matches: Match[] = [
        {
          id: "m1",
          home_team_id: "t1",
          away_team_id: "t2",
          home_score: 2,
          away_score: 1,
          status: "finished",
        } as Match,
        // Match 2 is scheduled
        {
          id: "m2",
          home_team_id: "t2",
          away_team_id: "t3",
          home_score: 0,
          away_score: 0,
          status: "scheduled",
        } as Match,
      ];

      expect(getMathematicalChampion(standings, matches)).toBeNull();
    });

    it("returns null if a challenger can surpass the leader on points", () => {
      // Team 1 has 4 points.
      // Team 2 has 3 points and 1 match remaining (max 6 points).
      const standings: StandingRow[] = [
        {
          teamId: "t1",
          name: "Team 1",
          wins: 1,
          draws: 1,
          losses: 0,
          goalsFor: 3,
          goalsAgainst: 1,
          goalDifference: 2,
          points: 4,
        },
        {
          teamId: "t2",
          name: "Team 2",
          wins: 1,
          draws: 0,
          losses: 1,
          goalsFor: 2,
          goalsAgainst: 2,
          goalDifference: 0,
          points: 3,
        },
      ];

      const matches: Match[] = [
        {
          id: "m1",
          home_team_id: "t1",
          away_team_id: "t2",
          home_score: 2,
          away_score: 1,
          status: "finished",
        } as Match,
        {
          id: "m2",
          home_team_id: "t2",
          away_team_id: "t1",
          home_score: 0,
          away_score: 0,
          status: "scheduled",
        } as Match,
      ];

      expect(getMathematicalChampion(standings, matches)).toBeNull();
    });

    it("correctly simulates direct matchups: Team 1 clinches when competitors cannot both get full points", () => {
      // Team 1 has 6 points from 2 matches and no remaining games.
      // Team 2 has 2 points.
      // Team 3 has 1 point.
      // Remaining match: Team 2 vs Team 3.
      // If Team 2 wins: Team 2 gets 5 pts, Team 3 gets 1 pt. Team 1 (6 pts) wins!
      // If Draw: Team 2 gets 3 pts, Team 3 gets 2 pts. Team 1 (6 pts) wins!
      // If Team 3 wins: Team 2 gets 2 pts, Team 3 gets 4 pts. Team 1 (6 pts) wins!
      // Under ALL scenarios, Team 1 has strictly the most points!
      const standings: StandingRow[] = [
        {
          teamId: "t1",
          name: "Team 1",
          wins: 2,
          draws: 0,
          losses: 0,
          goalsFor: 4,
          goalsAgainst: 1,
          goalDifference: 3,
          points: 6,
        },
        {
          teamId: "t2",
          name: "Team 2",
          wins: 0,
          draws: 2,
          losses: 1,
          goalsFor: 2,
          goalsAgainst: 3,
          goalDifference: -1,
          points: 2,
        },
        {
          teamId: "t3",
          name: "Team 3",
          wins: 0,
          draws: 1,
          losses: 1,
          goalsFor: 1,
          goalsAgainst: 3,
          goalDifference: -2,
          points: 1,
        },
      ];

      const matches: Match[] = [
        {
          id: "m1",
          home_team_id: "t1",
          away_team_id: "t2",
          home_score: 2,
          away_score: 1,
          status: "finished",
        } as Match,
        {
          id: "m2",
          home_team_id: "t1",
          away_team_id: "t3",
          home_score: 2,
          away_score: 0,
          status: "finished",
        } as Match,
        {
          id: "m3",
          home_team_id: "t2",
          away_team_id: "t3",
          home_score: 1,
          away_score: 1,
          status: "finished",
        } as Match,
        // Match 4: Team 2 vs Team 3 (last match)
        {
          id: "m4",
          home_team_id: "t2",
          away_team_id: "t3",
          home_score: 0,
          away_score: 0,
          status: "scheduled",
        } as Match,
      ];

      const champ = getMathematicalChampion(standings, matches);
      expect(champ).not.toBeNull();
      expect(champ?.teamId).toBe("t1");
    });
  });
});
