import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PlayerRatingsContent from "./PlayerRatingsContent";
import { type Player } from "../../../shared/api/endpoints";

// Mock endpoints
vi.mock("../../../shared/api/endpoints", async () => {
  const actual = await vi.importActual("../../../shared/api/endpoints");
  return {
    ...actual,
    createApi: () => ({
      updatePlayer: vi.fn().mockResolvedValue({}),
    }),
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockPlayers: Player[] = [
  {
    id: 1,
    user_id: 101,
    organization_id: 10,
    user_name: "Alice",
    user_username: "alice",
    grade: 5,
  },
  {
    id: 2,
    user_id: 102,
    organization_id: 10,
    user_name: "Bob",
    user_username: "bob",
    grade: 7,
  },
  {
    id: 3,
    user_id: 103,
    organization_id: 10,
    user_name: "Charlie",
    user_username: "charlie",
    grade: null,
  },
];

describe("PlayerRatingsContent", () => {
  const defaultProps = {
    orgId: 10,
    initialPlayers: mockPlayers,
    orgName: "Test Org",
    onUpdateSuccess: vi.fn(),
  };

  it("renders the player ratings list", () => {
    render(<PlayerRatingsContent {...defaultProps} />);
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("Charlie")).toBeDefined();
  });

  it("updates player rating", async () => {
    render(<PlayerRatingsContent {...defaultProps} />);

    const aliceRatingInput = screen
      .getByTestId("rating-input-1")
      .querySelector("input")!;
    fireEvent.change(aliceRatingInput, { target: { value: "8.5" } });

    await waitFor(() => {
      expect(screen.getByText("8.5")).toBeDefined();
    });
    expect(defaultProps.onUpdateSuccess).toHaveBeenCalled();
  });

  it("filters players by name", () => {
    render(<PlayerRatingsContent {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(
      "organizations.ratings.search_placeholder",
    );

    fireEvent.change(searchInput, { target: { value: "bob" } });

    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.queryByText("Alice")).toBeNull();
  });

  it("paginates players", () => {
    const manyPlayers = Array.from({ length: 15 }, (_, i) => ({
      id: i + 200,
      user_id: i + 200,
      organization_id: 10,
      user_name: `User ${i + 200}`,
      user_username: `u${i + 200}`,
      grade: 5,
    }));

    render(
      <PlayerRatingsContent {...defaultProps} initialPlayers={manyPlayers} />,
    );

    // Default rows per page is 10
    expect(screen.getAllByRole("row").length).toBe(11); // 10 rows + header

    expect(screen.getByText("User 200")).toBeDefined();

    // Go to next page
    const nextButton = screen.getByTitle("Go to next page");
    fireEvent.click(nextButton);

    // Header + 5 items
    expect(screen.getAllByRole("row").length).toBe(6);
    expect(screen.getByText("User 210")).toBeDefined();
  });
});
