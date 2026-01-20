import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import OrganizationManagementPage from "./OrganizationManagementPage";
import { api } from "../../../shared/api/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../../../app/providers/AuthProvider";

// Mock api client
vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
    getPaginated: vi.fn(),
    setToken: vi.fn(),
    setAuthErrorHandler: vi.fn(),
  },
}));

// Mock window.confirm
const mockConfirm = vi.fn();
window.confirm = mockConfirm;

describe("OrganizationManagementPage", () => {
  const mockOrg = { id: 1, name: "Test Org" };
  const mockPlayers = [
    { id: 101, user_id: 1, organization_id: 1, grade: 5, position_id: 1 },
    { id: 102, user_id: 2, organization_id: 1, grade: 4, position_id: 2 },
  ];
  const mockAdmins = [
    {
      id: 201,
      organization_id: 1,
      user_id: 1,
      user_name: "User One",
      user_email: "user1@example.com",
    },
  ];
  const mockUsers = [
    { id: 1, name: "User One", email: "user1@example.com" },
    { id: 2, name: "User Two", email: "user2@example.com" },
    { id: 3, name: "User Three", email: "user3@example.com" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);

    // Default successful responses
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (url === "/api/organizations/1/players")
        return Promise.resolve(mockPlayers);
      if (url === "/api/organizations/1/admins")
        return Promise.resolve(mockAdmins);
      if (url === "/api/users") return Promise.resolve(mockUsers);
      return Promise.reject(new Error(`Unhandled GET: ${url}`));
    });
  });

  const renderComponent = () => {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/organizations/1/management"]}>
          <Routes>
            <Route
              path="/organizations/:id/management"
              element={<OrganizationManagementPage />}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
  };

  it("renders loading state initially", () => {
    renderComponent();
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("renders organization details and sections after loading", async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText("organizations.management.title"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("organizations.management.sections.members"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("organizations.management.sections.admins"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("organizations.management.sections.danger_zone"),
    ).toBeInTheDocument();

    // Check if players are listed (checking all is fine here)
    expect(screen.getAllByText("User One").length).toBeGreaterThan(0);
    expect(screen.getAllByText("User Two").length).toBeGreaterThan(0);
  });

  it("handles removing a member", async () => {
    vi.mocked(api.delete).mockResolvedValue({});
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText("organizations.management.sections.members"),
      ).toBeInTheDocument();
    });

    // Find the members section container
    // We search for the paper containing the specific header
    const membersHeading = screen.getByText(
      "organizations.management.sections.members",
    );
    // Paper is the closest div usually in MUI
    const membersSection = membersHeading.closest(
      "div.MuiPaper-root",
    ) as HTMLElement;
    const membersList = within(membersSection!).getByRole("list");

    // User Two is a member
    const userTwoItem = within(membersList).getByText("User Two").closest("li");
    const deleteBtn = within(userTwoItem!).getByRole("button");

    fireEvent.click(deleteBtn);

    expect(mockConfirm).toHaveBeenCalled();
    expect(api.delete).toHaveBeenCalledWith("/api/players/102");

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/organizations/1/players");
    });
  });

  it("handles adding a new admin", async () => {
    vi.mocked(api.post).mockResolvedValue({
      id: 202,
      organization_id: 1,
      user_id: 2,
    });
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText("organizations.management.sections.admins"),
      ).toBeInTheDocument();
    });

    const selectLabel = screen.getByLabelText(
      "organizations.dialog.manage_admins.select_user_label",
    );
    fireEvent.mouseDown(selectLabel);

    // The option in the dropdown
    const option = await screen.findByRole("option", { name: /User Two/ });
    fireEvent.click(option);

    const adminsHeading = screen.getByText(
      "organizations.management.sections.admins",
    );
    const adminsSection = adminsHeading.closest(
      "div.MuiPaper-root",
    ) as HTMLElement;
    const addBtn = within(adminsSection!).getByText("common.add");

    fireEvent.click(addBtn);

    expect(api.post).toHaveBeenCalledWith("/api/organizations/1/admins", {
      user_id: 2,
    });
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/organizations/1/admins");
    });
  });

  it("handles removing an admin", async () => {
    const twoAdmins = [
      ...mockAdmins,
      {
        id: 202,
        organization_id: 1,
        user_id: 2,
        user_name: "User Two",
        user_email: "user2@example.com",
      },
    ];
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === "/api/organizations/1/admins")
        return Promise.resolve(twoAdmins);
      if (url === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (url === "/api/organizations/1/players")
        return Promise.resolve(mockPlayers);
      if (url === "/api/users") return Promise.resolve(mockUsers);
      return Promise.reject(new Error(`Unhandled GET: ${url}`));
    });

    vi.mocked(api.delete).mockResolvedValue({});
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText("organizations.management.sections.admins"),
      ).toBeInTheDocument();
    });

    const adminsHeading = screen.getByText(
      "organizations.management.sections.admins",
    );
    const adminsSection = adminsHeading.closest(
      "div.MuiPaper-root",
    ) as HTMLElement;
    const adminList = within(adminsSection!).getByRole("list");

    const userTwoAdminItem = within(adminList)
      .getByText("User Two")
      .closest("li");
    const deleteBtn = within(userTwoAdminItem!).getByRole("button");

    fireEvent.click(deleteBtn);

    expect(api.delete).toHaveBeenCalledWith("/api/organizations/1/admins/2");
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/organizations/1/admins");
    });
  });

  it("prevents removing the last admin", async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText("organizations.management.sections.admins"),
      ).toBeInTheDocument();
    });

    const adminsHeading = screen.getByText(
      "organizations.management.sections.admins",
    );
    const adminsSection = adminsHeading.closest(
      "div.MuiPaper-root",
    ) as HTMLElement;
    const adminList = within(adminsSection!).getByRole("list");
    const deleteBtn = within(adminList).getAllByRole("button")[0];

    expect(deleteBtn).toBeDisabled();
    expect(deleteBtn).toHaveAttribute(
      "title",
      "organizations.dialog.manage_admins.cannot_remove_last_admin_tooltip",
    );

    // Ensure we don't try to delete
    fireEvent.click(deleteBtn);
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("handles adding players flow", async () => {
    vi.mocked(api.post).mockResolvedValue({});
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText("organizations.management.sections.members"),
      ).toBeInTheDocument();
    });

    const membersHeading = screen.getByText(
      "organizations.management.sections.members",
    );
    const membersSection = membersHeading.closest(
      "div.MuiPaper-root",
    ) as HTMLElement;
    const addMembersBtn = within(membersSection!).getByText("common.add");

    fireEvent.click(addMembersBtn);

    expect(
      screen.getByText("organizations.dialog.add_players.title"),
    ).toBeInTheDocument();

    const userThreeCheckbox = screen
      .getByText("User Three")
      .closest("li")
      ?.querySelector('input[type="checkbox"]');
    fireEvent.click(userThreeCheckbox!);

    const addSelectedBtn = screen.getByText(
      "organizations.dialog.add_players.add_selected",
    );
    fireEvent.click(addSelectedBtn);

    expect(api.post).toHaveBeenCalledWith("/api/players", {
      organization_id: 1,
      user_id: 3,
    });
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/organizations/1/players");
    });
  });

  it("handles organization deletion with confirmation", async () => {
    vi.mocked(api.delete).mockResolvedValue({});
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText("organizations.management.sections.danger_zone"),
      ).toBeInTheDocument();
    });

    const deleteOrgBtn = screen.getByText("organizations.table.aria.delete");
    fireEvent.click(deleteOrgBtn);

    expect(
      screen.getByText("organizations.management.delete_confirm_title"),
    ).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Test Org");
    // Find dialog actions to scope confirm button
    const cancelBtn = screen.getByText("common.cancel");
    const dialogActions = cancelBtn.closest(".MuiDialogActions-root");
    const confirmBtn = within(dialogActions as HTMLElement).getAllByRole(
      "button",
    )[1];

    expect(confirmBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: "Wrong Name" } });
    expect(confirmBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: "Test Org" } });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);

    expect(api.delete).toHaveBeenCalledWith("/api/organizations/1");
  });

  it("handles API errors gracefully", async () => {
    const errorMsg = "Failed to fetch data";
    vi.mocked(api.get).mockRejectedValue(new Error(errorMsg));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
  });
});
