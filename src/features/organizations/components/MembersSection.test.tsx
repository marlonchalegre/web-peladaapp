import { render, screen, fireEvent, within } from "@testing-library/react";
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
    id: "1",
    name: "Alice",
    username: "alice",
    email: "alice@example.com",
    position: "STRIKER",
  },
  {
    id: "2",
    name: "Bob",
    username: "bob",
    email: "bob@example.com",
    position: "GOALKEEPER",
  },
  {
    id: "3",
    name: "Charlie",
    username: "charlie",
    email: "charlie@example.com",
    position: "DEFENDER",
  },
];

const mockPlayers: Player[] = [
  { id: "101", user_id: "1", organization_id: "10", grade: 5 },
  { id: "102", user_id: "2", organization_id: "10", grade: 5 },
  { id: "103", user_id: "3", organization_id: "10", grade: 5 },
];

const usersMap = new Map<string, User>(mockUsers.map((u) => [u.id, u]));

describe("MembersSection", () => {
  const defaultProps = {
    players: mockPlayers,
    usersMap,
    onAddClick: vi.fn(),
    onInviteClick: vi.fn(),
    onRemovePlayer: vi.fn(),
    onUpdatePlayer: vi.fn(),
    actionLoading: false,
    page: 0,
    rowsPerPage: 10,
    onPageChange: vi.fn(),
    onRowsPerPageChange: vi.fn(),
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
  it("calls onPageChange when pagination is used", () => {
    // Create many players for pagination
    const manyPlayers = Array.from({ length: 15 }, (_, i) => ({
      id: String(i + 1),
      user_id: String(i + 1),
      organization_id: "10",
    }));

    const manyUsersMap = new Map<string, User>(
      manyPlayers.map((p) => [
        p.user_id,
        { id: p.user_id, name: `User ${p.id}`, username: `u${p.id}` } as User,
      ]),
    );

    render(
      <MembersSection
        {...defaultProps}
        players={manyPlayers as Player[]}
        usersMap={manyUsersMap}
      />,
    );

    // Go to next page
    const nextButton = screen.getByTitle("Go to next page");
    fireEvent.click(nextButton);

    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
  });

  it("calls onRemovePlayer when delete button is clicked", () => {
    render(<MembersSection {...defaultProps} />);
    const deleteButtons = screen
      .getAllByRole("button")
      .filter((b) => b.querySelector('svg[data-testid="DeleteIcon"]'));

    fireEvent.click(deleteButtons[0]);
    expect(defaultProps.onRemovePlayer).toHaveBeenCalledWith(mockPlayers[0].id);
  });

  it("does not show temporary member type options for regular players", () => {
    render(<MembersSection {...defaultProps} />);
    const selectContainer = screen.getByTestId("member-type-select-101");
    const selectButton = selectContainer.querySelector("[role='combobox']");
    expect(selectButton).not.toBeNull();
    fireEvent.mouseDown(selectButton!);

    const listbox = screen.getByRole("listbox");
    expect(
      within(listbox).queryByText(
        "organizations.management.member_type.convidado",
      ),
    ).not.toBeNull();
    expect(
      within(listbox).queryByText(
        "organizations.management.member_type.diarista",
      ),
    ).not.toBeNull();
    expect(
      within(listbox).queryByText(
        "organizations.management.member_type.mensalista",
      ),
    ).not.toBeNull();

    expect(
      within(listbox).queryByText(
        "organizations.management.member_type.mensalista_temporario",
      ),
    ).toBeNull();
    expect(
      within(listbox).queryByText(
        "organizations.management.member_type.diarista_temporario",
      ),
    ).toBeNull();
  });

  it("disables the dropdown when player has a temporary member type", () => {
    const tempPlayers: Player[] = [
      {
        id: "101",
        user_id: "1",
        organization_id: "10",
        grade: 5,
        member_type: "mensalista_temporario",
      },
      {
        id: "102",
        user_id: "2",
        organization_id: "10",
        grade: 5,
        member_type: "diarista_temporario",
      },
    ];
    render(<MembersSection {...defaultProps} players={tempPlayers} />);

    const select101 = screen
      .getByTestId("member-type-select-101")
      .querySelector("input");
    expect(select101).toBeDisabled();

    const select102 = screen
      .getByTestId("member-type-select-102")
      .querySelector("input");
    expect(select102).toBeDisabled();

    expect(
      screen.getByText(
        "organizations.management.member_type.mensalista_temporario",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "organizations.management.member_type.diarista_temporario",
      ),
    ).toBeDefined();
  });

  it("opens the player radar dialog when clicking on a player and saves changes", () => {
    render(<MembersSection {...defaultProps} />);

    const clickZone = screen.getByTestId("player-click-zone-101");
    expect(clickZone).toBeDefined();

    fireEvent.click(clickZone);

    expect(screen.getByTestId("player-radar-dialog")).toBeDefined();
    expect(
      within(screen.getByTestId("player-radar-dialog")).getByText("Alice"),
    ).toBeDefined();

    const saveButton = screen.getByTestId("radar-dialog-save-button");
    fireEvent.click(saveButton);

    expect(defaultProps.onUpdatePlayer).toHaveBeenCalledWith("101", {
      passing: 0,
      ball_control: 0,
      velocity: 0,
      shooting: 0,
      dribbling: 0,
      defending: 0,
    });
  });
});
