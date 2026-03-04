import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddPlayersFromOrgDialog from "./AddPlayersFromOrgDialog";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";
import { api } from "../../../shared/api/client";

// Mock api
vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("AddPlayersFromOrgDialog", () => {
  const mockPlayers = [
    { id: 1, user_id: 1, user_name: "Alice", user_username: "alice" },
    { id: 2, user_id: 2, user_name: "Bob", user_username: "bob" },
    { id: 3, user_id: 3, user_name: "Charlie", user_username: "charlie" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as Mock).mockResolvedValue(mockPlayers);
  });

  it("loads and displays organization players not in pelada", async () => {
    render(
      <ThemeContextProvider>
        <AddPlayersFromOrgDialog
          open={true}
          onClose={() => {}}
          onAdd={async () => {}}
          organizationId={1}
          excludePlayerIds={[3]} // Charlie is already in pelada
        />
      </ThemeContextProvider>,
    );

    // Should show Alice and Bob
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    // Should NOT show Charlie
    expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
  });

  it("filters players by search input", async () => {
    render(
      <ThemeContextProvider>
        <AddPlayersFromOrgDialog
          open={true}
          onClose={() => {}}
          onAdd={async () => {}}
          organizationId={1}
          excludePlayerIds={[]}
        />
      </ThemeContextProvider>,
    );

    await waitFor(() => screen.getByText("Alice"));

    const searchInput = screen.getByPlaceholderText(
      "peladas.panel.available.add_dialog.search_placeholder",
    );
    fireEvent.change(searchInput, { target: { value: "ali" } });

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("selects and submits players", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ThemeContextProvider>
        <AddPlayersFromOrgDialog
          open={true}
          onClose={onClose}
          onAdd={onAdd}
          organizationId={1}
          excludePlayerIds={[]}
        />
      </ThemeContextProvider>,
    );

    await waitFor(() => screen.getByText("Alice"));

    // Select Alice and Bob
    fireEvent.click(screen.getByText("Alice"));
    fireEvent.click(screen.getByText("Bob"));

    const submitBtn = screen.getByText(
      "peladas.panel.available.add_dialog.submit",
    );
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith([1, 2]);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
