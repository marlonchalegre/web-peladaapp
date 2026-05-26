/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PlayerSelectMenu from "./PlayerSelectMenu";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../../shared/components/SecureAvatar", () => ({
  SecureAvatar: ({ userId }: any) => <div data-testid={`mock-avatar-${userId}`}>Avatar</div>,
}));

describe("PlayerSelectMenu", () => {
  const benchPlayers = [
    {
      id: "p1",
      user_id: "u1",
      position: "Goalkeeper",
      user_avatar_filename: null,
    },
    {
      id: "p2",
      user_id: "u2",
      user_position: "Defender",
      user_avatar_filename: "avatar.png",
    },
    {
      id: "p3",
      user_id: "u3",
      user_avatar_filename: null,
    },
  ] as any[];

  const getPlayerName = (pid: string) => {
    if (pid === "p1") return "Alice";
    if (pid === "p2") return "Bob";
    return "Charlie";
  };

  const defaultProps = {
    teamId: "t1",
    benchPlayers,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    getPlayerName,
  };

  it("renders and filters list correctly, showing fallback positions", () => {
    render(<PlayerSelectMenu {...defaultProps} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();

    // Check position mapping uppercase labels
    expect(screen.getByText("COMMON.POSITIONS.GOALKEEPER")).toBeInTheDocument();
    expect(screen.getByText("COMMON.POSITIONS.DEFENDER")).toBeInTheDocument();
    expect(screen.getByText("COMMON.POSITIONS.PLAYER")).toBeInTheDocument();
  });

  it("filters items when typing in search input", () => {
    render(<PlayerSelectMenu {...defaultProps} />);

    const searchInput = screen.getByTestId("player-select-search");
    fireEvent.change(searchInput, { target: { value: "ali" } });

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("shows empty state when search matches no players", () => {
    render(<PlayerSelectMenu {...defaultProps} />);

    const searchInput = screen.getByTestId("player-select-search");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(screen.getByTestId("no-bench-players-text")).toBeInTheDocument();
  });

  it("calls onSelect and onClose when a player is selected", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<PlayerSelectMenu {...defaultProps} onSelect={onSelect} onClose={onClose} />);

    fireEvent.click(screen.getByTestId("bench-player-item-p2"));
    expect(onSelect).toHaveBeenCalledWith("p2");
    expect(onClose).toHaveBeenCalled();
  });
});
