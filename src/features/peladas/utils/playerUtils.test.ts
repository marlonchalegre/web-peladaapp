import { describe, it, expect } from "vitest";
import { sortPlayersByPosition } from "./playerUtils";
import { User } from "../../../shared/api/endpoints";

describe("sortPlayersByPosition", () => {
  const createPlayer = (
    id: number,
    name: string,
    position: string,
    isGk = false,
  ) => ({
    id,
    user_id: id,
    organization_id: 1,
    user: { id, name, username: name.toLowerCase(), position } as User,
    is_goalkeeper: isGk,
  });

  it("should sort players by position (GK -> DF -> MF -> ST)", () => {
    const p1 = createPlayer(1, "Striker", "Striker");
    const p2 = createPlayer(2, "Defender", "Defender");
    const p3 = createPlayer(3, "Midfielder", "Midfielder");
    const p4 = createPlayer(4, "Goalkeeper", "Goalkeeper");

    const sorted = sortPlayersByPosition([p1, p2, p3, p4]);

    expect(sorted[0].user.name).toBe("Goalkeeper");
    expect(sorted[1].user.name).toBe("Defender");
    expect(sorted[2].user.name).toBe("Midfielder");
    expect(sorted[3].user.name).toBe("Striker");
  });

  it("should prioritize manual is_goalkeeper flag", () => {
    const p1 = createPlayer(1, "Fake Striker", "Striker", true);
    const p2 = createPlayer(2, "Real Goalkeeper", "Goalkeeper", false);

    const sorted = sortPlayersByPosition([p2, p1]);

    expect(sorted[0].user.name).toBe("Fake Striker");
    expect(sorted[1].user.name).toBe("Real Goalkeeper");
  });

  it("should be case-insensitive for position names", () => {
    const p1 = createPlayer(1, "Lower", "striker");
    const p2 = createPlayer(2, "Upper", "GOALKEEPER");

    const sorted = sortPlayersByPosition([p1, p2]);

    expect(sorted[0].user.name).toBe("Upper");
    expect(sorted[1].user.name).toBe("Lower");
  });

  it("should sort alphabetically by name as a tie-breaker", () => {
    const p1 = createPlayer(1, "Zebra", "Defender");
    const p2 = createPlayer(2, "Apple", "Defender");

    const sorted = sortPlayersByPosition([p1, p2]);

    expect(sorted[0].user.name).toBe("Apple");
    expect(sorted[1].user.name).toBe("Zebra");
  });

  it("should handle missing or unknown positions by putting them at the end", () => {
    const p1 = createPlayer(1, "Unknown", "Surprise");
    const p2 = createPlayer(2, "Goalkeeper", "Goalkeeper");

    const sorted = sortPlayersByPosition([p1, p2]);

    expect(sorted[0].user.name).toBe("Goalkeeper");
    expect(sorted[1].user.name).toBe("Unknown");
  });
});
