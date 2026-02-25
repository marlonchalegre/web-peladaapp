import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AddPlayersDialog from "./AddPlayersDialog";

const { mockSearchUsers } = vi.hoisted(() => ({
  mockSearchUsers: vi.fn(),
}));

// Mock the whole endpoints module
vi.mock("../../../shared/api/endpoints", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../shared/api/endpoints")>();
  return {
    ...actual,
    createApi: vi.fn(() => ({
      searchUsers: mockSearchUsers,
    })),
  };
});

describe("AddPlayersDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default search result
    mockSearchUsers.mockResolvedValue({
      data: [
        { id: 1, name: "Alice Smith", username: "alice", email: "alice@test.com" },
        { id: 2, name: "Bob Jones", username: "bob", email: "bob@test.com" },
      ],
      total: 2,
      page: 1,
      perPage: 10,
      totalPages: 1,
    });
  });

  const defaultProps = {
    open: true,
    selectedIds: new Set<number>(),
    onSelectAll: vi.fn(),
    onClear: vi.fn(),
    onToggle: vi.fn(),
    onAddSelected: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
    excludeUserIds: new Set<number>([10]),
  };

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  it("renders correctly when open and triggers initial search", async () => {
    await act(async () => {
      render(<AddPlayersDialog {...defaultProps} />);
    });

    expect(
      screen.getByText("organizations.dialog.add_players.title"),
    ).toBeInTheDocument();

    await waitFor(
      () => {
        expect(mockSearchUsers).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("debounces search input", async () => {
    await act(async () => {
      render(<AddPlayersDialog {...defaultProps} />);
    });

    const input = screen.getByPlaceholderText("common.fields.name / common.fields.email");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Cristiano" } });
      await sleep(500);
    });

    await waitFor(() => {
      expect(mockSearchUsers).toHaveBeenCalledWith("Cristiano", 1, 10);
    });
  });

  it("excludes users present in excludeUserIds", async () => {
    mockSearchUsers.mockResolvedValue({
      data: [
        { id: 1, name: "Alice", username: "alice", email: "" },
        { id: 10, name: "Excluded", username: "excluded", email: "" },
      ],
      total: 2,
      page: 1,
      perPage: 10,
      totalPages: 1,
    });

    await act(async () => {
      render(<AddPlayersDialog {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    expect(screen.queryByText("Excluded")).not.toBeInTheDocument();
  });

  it("calls onSelectAll with visible user IDs", async () => {
    await act(async () => {
      render(<AddPlayersDialog {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });

    const selectAllBtn = screen.getByText(
      "organizations.dialog.add_players.select_all",
    );

    await act(async () => {
      fireEvent.click(selectAllBtn);
    });

    expect(defaultProps.onSelectAll).toHaveBeenCalledWith([1, 2]);
  });

  it("calls onToggle when a checkbox is clicked", async () => {
    await act(async () => {
      render(<AddPlayersDialog {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");

    await act(async () => {
      fireEvent.click(checkboxes[0]);
    });

    expect(defaultProps.onToggle).toHaveBeenCalledWith(1, true);
  });

  it("shows 'Load More' button when hasMore is true", async () => {
    mockSearchUsers.mockResolvedValue({
      data: [{ id: 1, name: "Alice", username: "alice", email: "" }],
      total: 2,
      page: 1,
      perPage: 1,
      totalPages: 2,
    });

    await act(async () => {
      render(<AddPlayersDialog {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText("common.load_more")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("common.load_more"));
    });

    await waitFor(() => {
      expect(mockSearchUsers).toHaveBeenCalledWith("", 2, 10);
    });
  });

  it("displays 'no results' message when search returns nothing", async () => {
    mockSearchUsers.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      perPage: 10,
      totalPages: 0,
    });

    await act(async () => {
      render(<AddPlayersDialog {...defaultProps} />);
    });

    const input = screen.getByPlaceholderText("common.fields.name / common.fields.email");

    await act(async () => {
      fireEvent.change(input, { target: { value: "unknown-user" } });
      await sleep(500);
    });

    await waitFor(() => {
      expect(
        screen.getByText("organizations.dialog.add_players.no_results"),
      ).toBeInTheDocument();
    });
  });
});
