import { describe, it, expect } from "vitest";
import {
  formatRating,
  formatSkill,
  performanceFromStars,
  toRecentMatchRows,
} from "./profileFormat";
import type { ProfileRecentPelada } from "../../../shared/api/endpoints";

describe("profileFormat", () => {
  describe("formatRating / formatSkill", () => {
    it("renders one decimal with a pt-BR comma", () => {
      expect(formatRating(7.4)).toBe("7,4");
      expect(formatSkill(4.0)).toBe("4,0");
      expect(formatRating(10)).toBe("10,0");
    });

    it("falls back to a dash for nullish values", () => {
      expect(formatRating(null)).toBe("—");
      expect(formatRating(undefined)).toBe("—");
      expect(formatSkill(null)).toBe("—");
      expect(formatSkill(undefined)).toBe("—");
    });
  });

  describe("performanceFromStars", () => {
    it("maps the 1-5 stars anchors onto the 1-10 scale", () => {
      expect(performanceFromStars(1)).toBe(1);
      expect(performanceFromStars(2)).toBe(4);
      expect(performanceFromStars(3)).toBe(7);
      expect(performanceFromStars(4)).toBe(9);
      expect(performanceFromStars(5)).toBe(10);
    });

    it("interpolates between anchors", () => {
      expect(performanceFromStars(1.5)).toBe(2.5);
      expect(performanceFromStars(2.5)).toBe(5.5);
      expect(performanceFromStars(3.5)).toBe(8);
      expect(performanceFromStars(4.5)).toBe(9.5);
    });

    it("clamps values outside the 1-5 range", () => {
      expect(performanceFromStars(0)).toBe(1);
      expect(performanceFromStars(7)).toBe(10);
    });
  });

  describe("toRecentMatchRows", () => {
    const basePelada: ProfileRecentPelada = {
      id: "p1",
      scheduled_at: "2026-09-09T19:00:00Z",
      matches_count: 4,
      players_count: 22,
      champion_team_name: "Time 2",
      organization_id: "o1",
      organization_name: "100Fôlego",
    };

    it("returns an empty list for undefined input", () => {
      expect(toRecentMatchRows(undefined)).toEqual([]);
    });

    it("renders the player's own line with team, position and MVP badge", () => {
      const [row] = toRecentMatchRows([
        {
          ...basePelada,
          user: {
            player_id: "pl1",
            player_name: "Igor",
            team_name: "Time 2",
            team_position: 1,
            goals: 2,
            assists: 1,
            own_goals: 0,
            avg_stars: 4.1,
            is_mvp: true,
            is_garcom: false,
          },
        },
      ]);
      expect(row.date).toMatch(/^\d{2}\/\d{2}$/);
      expect(row.group).toBe("100Fôlego");
      expect(row.desc).toBe("2 gols · 1 assist.");
      expect(row.sub).toBe("Time 2 · 1º lugar");
      expect(row.badge).toBe("MVP");
      expect(row.score).toBe("9,1");
    });

    it("prefers the garçom badge when the player was not MVP", () => {
      const [row] = toRecentMatchRows([
        {
          ...basePelada,
          user: {
            player_id: "pl1",
            player_name: "Igor",
            team_name: "Time 1",
            team_position: 2,
            goals: 0,
            assists: 3,
            own_goals: 0,
            avg_stars: null,
            is_mvp: false,
            is_garcom: true,
          },
        },
      ]);
      expect(row.badge).toBe("GARÇOM");
      expect(row.score).toBe("—");
    });

    it("falls back to champion info when the user did not play", () => {
      const [row] = toRecentMatchRows([basePelada]);
      expect(row.desc).toBe("Campeão: Time 2");
      expect(row.sub).toBe("");
      expect(row.badge).toBeNull();
      expect(row.score).toBe("—");
    });

    it("falls back to 'Não jogou' when there is no user line and no champion", () => {
      const [row] = toRecentMatchRows([
        { ...basePelada, champion_team_name: null },
      ]);
      expect(row.desc).toBe("Não jogou");
    });

    it("uses the location as the subtitle when the user did not play", () => {
      const [row] = toRecentMatchRows([
        {
          ...basePelada,
          champion_team_name: null,
          location: "Arena Vila Nova",
        },
      ]);
      expect(row.sub).toBe("Arena Vila Nova");
    });

    it("renders a placeholder date when scheduled_at is missing or invalid", () => {
      const [missing] = toRecentMatchRows([
        { ...basePelada, scheduled_at: null },
      ]);
      expect(missing.date).toBe("--");
      const [invalid] = toRecentMatchRows([
        { ...basePelada, scheduled_at: "not-a-date" },
      ]);
      expect(invalid.date).toBe("--");
    });
  });
});
