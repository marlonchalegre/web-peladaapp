import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MembersSection from "./MembersSection";
import { type User, type Player } from "../../../shared/api/endpoints";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockUsers: User[] = [
  {
    id: 1,
    name: "Alice",
    username: "alice",
    email: "alice@example.com",
    position: "STRIKER",
  },
  {
    id: 2,
    name: "Bob",
    username: "bob",
    email: "bob@example.com",
    position: "GOALKEEPER",
  },
  {
    id: 3,
    name: "Charlie",
    username: "charlie",
    email: "charlie@example.com",
    position: "DEFENDER",
  },
];

const mockPlayers: Player[] = [
  { id: 101, user_id: 1, organization_id: 10, grade: 5 },
  { id: 102, user_id: 2, organization_id: 10, grade: 5 },
  { id: 103, user_id: 3, organization_id: 10, grade: 5 },
];

const usersMap = new Map<number, User>(mockUsers.map((u) => [u.id, u]));

describe("MembersSection", () => {
  const defaultProps = {
    players: mockPlayers,
    usersMap,
    onAddClick: vi.fn(),
    onInviteClick: vi.fn(),
    onRemovePlayer: vi.fn(),
    actionLoading: false,
  };

  it("renders the members list with positions", () => {
    render(<MembersSection {...defaultProps} />);
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("common.positions.striker")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("common.positions.goalkeeper")).toBeDefined();
    expect(screen.getByText("Charlie")).toBeDefined();
    expect(screen.getByText("common.positions.defender")).toBeDefined();

    // Verify email is NOT rendered
    expect(screen.queryByText("alice@example.com")).toBeNull();
    expect(screen.queryByText("bob@example.com")).toBeNull();
    expect(screen.queryByText("charlie@example.com")).toBeNull();
  });

  it("filters members by name", () => {
    render(<MembersSection {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(
      "common.fields.player_name",
    );

    fireEvent.change(searchInput, { target: { value: "ali" } });

    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.queryByText("Bob")).toBeNull();
    expect(screen.queryByText("Charlie")).toBeNull();
  });

  it("does not filter members by email anymore", () => {
    render(<MembersSection {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(
      "common.fields.player_name",
    );

    fireEvent.change(searchInput, { target: { value: "bob@example" } });

    expect(screen.queryByText("Bob")).toBeNull();
  });

  it("paginates members", () => {
    // Create many players for pagination
    const manyPlayers = Array.from({ length: 15 }, (_, i) => ({
      id: i + 200,
      user_id: i + 200,
      organization_id: 10,
    }));
    const manyUsers = new Map<number, User>(
      manyPlayers.map((p) => [
        p.user_id,
        { id: p.user_id, name: `User ${p.id}`, username: `u${p.id}` },
      ]),
    );

    render(
      <MembersSection
        {...defaultProps}
        players={manyPlayers}
        usersMap={manyUsers}
      />,
    );

    // Default rows per page is 10
    expect(screen.getAllByRole("listitem")).toHaveLength(10);

    // Check if "User 200" is there (first page)
    expect(screen.getByText("User 200")).toBeDefined();

    // Go to next page
    const nextButton = screen.getByTitle("Go to next page");
    fireEvent.click(nextButton);

    // Now should have 5 items
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("User 210")).toBeDefined();
  });

  it("calls onRemovePlayer when delete button is clicked", () => {
    render(<MembersSection {...defaultProps} />);
    const deleteButtons = screen
      .getAllByRole("button")
      .filter((b) => b.querySelector('svg[data-testid="DeleteIcon"]'));

    fireEvent.click(deleteButtons[0]);
    expect(defaultProps.onRemovePlayer).toHaveBeenCalledWith(mockPlayers[0].id);
  });
});
