import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminPanelPage from "./AdminPanelPage";
import { useAuth } from "../../../app/providers/AuthContext";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock react-i18next
const mockT = (key: string, arg2?: unknown, arg3?: unknown) => {
  const options = (typeof arg2 === "object" ? arg2 : arg3) as
    | Record<string, string>
    | undefined;
  if (key === "admin.dialogs.reset_password.description") {
    return `Digite a nova senha para o usuário ${options?.name} (@${options?.username}).`;
  }
  if (key === "admin.dialogs.edit_user.description") {
    return `Atualize os dados de e-mail e telefone para o usuário ${options?.name} (@${options?.username}).`;
  }
  if (key === "admin.dialogs.delete_user.description") {
    return `Tem certeza de que deseja remover permanentemente o usuário ${options?.name} (@${options?.username})? Esta ação não pode ser desfeita e todas as informações associadas serão excluídas.`;
  }
  if (key === "admin.dialogs.manage_admins.description") {
    return `Gerencie os administradores da organização ${options?.name}.`;
  }
  if (key === "admin.dialogs.delete_org.description") {
    return `Tem certeza de que deseja remover permanentemente a organização ${options?.name}? Esta ação não pode ser desfeita e todas as informações associadas serão excluídas.`;
  }
  if (key === "admin.dialogs.delete_pelada.description") {
    return `Tem certeza de que deseja remover permanentemente a pelada agendada para ${options?.date} da organização ${options?.orgName}? Esta ação excluirá todos os times, estatísticas, partidas, votos, lembretes e presenças associados. Esta ação não pode ser desfeita.`;
  }
  return key;
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

// Setup mock api functions
const {
  mockSearchUsers,
  mockListOrganizationsAdmin,
  mockDeleteUser,
  mockResetUserPassword,
  mockListAdminsByOrganization,
  mockAddOrganizationAdmin,
  mockRemoveOrganizationAdmin,
  mockDeleteOrganization,
  mockUpdateUserProfile,
  mockListPeladasAdmin,
  mockDeletePeladaAdmin,
} = vi.hoisted(() => ({
  mockSearchUsers: vi.fn(),
  mockListOrganizationsAdmin: vi.fn(),
  mockDeleteUser: vi.fn(),
  mockResetUserPassword: vi.fn(),
  mockListAdminsByOrganization: vi.fn(),
  mockAddOrganizationAdmin: vi.fn(),
  mockRemoveOrganizationAdmin: vi.fn(),
  mockDeleteOrganization: vi.fn(),
  mockUpdateUserProfile: vi.fn(),
  mockListPeladasAdmin: vi.fn(),
  mockDeletePeladaAdmin: vi.fn(),
}));

// Mock client module
vi.mock("../../../shared/api/client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../shared/api/client")>();
  return {
    ...actual,
    updateUserProfile: mockUpdateUserProfile,
  };
});

// Mock endpoints module
vi.mock("../../../shared/api/endpoints", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../shared/api/endpoints")>();
  return {
    ...actual,
    createApi: vi.fn(() => ({
      searchUsers: mockSearchUsers,
      listOrganizationsAdmin: mockListOrganizationsAdmin,
      deleteUser: mockDeleteUser,
      resetUserPassword: mockResetUserPassword,
      listAdminsByOrganization: mockListAdminsByOrganization,
      addOrganizationAdmin: mockAddOrganizationAdmin,
      removeOrganizationAdmin: mockRemoveOrganizationAdmin,
      deleteOrganization: mockDeleteOrganization,
      toggleBlockUser: vi.fn(),
      toggleOrgCreation: vi.fn(),
      toggleGlobalAdmin: vi.fn(),
      toggleBlockOrganization: vi.fn(),
      listPeladasAdmin: mockListPeladasAdmin,
      deletePeladaAdmin: mockDeletePeladaAdmin,
    })),
  };
});

describe("AdminPanelPage", () => {
  const mockCurrentUser = {
    id: "super-admin-id",
    name: "Global Admin",
    username: "superadmin",
    is_super_admin: true,
  };

  const mockUsersList = {
    data: [
      {
        id: "user-1",
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        is_super_admin: false,
        is_blocked: false,
        allow_org_creation: true,
      },
      {
        id: "super-admin-id",
        name: "Global Admin",
        username: "superadmin",
        email: "super@example.com",
        is_super_admin: true,
        is_blocked: false,
        allow_org_creation: true,
      },
    ],
    total: 2,
    page: 1,
    perPage: 10,
    totalPages: 1,
  };

  const mockOrgsList = {
    data: [
      {
        id: "org-1",
        name: "Cool Organization",
        is_blocked: false,
      },
    ],
    total: 1,
    page: 1,
    perPage: 10,
    totalPages: 1,
  };

  const mockPeladasList = {
    data: [
      {
        id: "pelada-1",
        organization_id: "org-1",
        organization_name: "Cool Organization",
        status: "attendance",
        scheduled_at: "2026-07-08T18:00:00Z",
      },
    ],
    total: 1,
    page: 1,
    perPage: 10,
    totalPages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation((...args) => {
      console.log("CONSOLE ERROR:", ...args);
    });
    (useAuth as Mock).mockReturnValue({ user: mockCurrentUser });
    mockSearchUsers.mockResolvedValue(mockUsersList);
    mockListOrganizationsAdmin.mockResolvedValue(mockOrgsList);
    mockListPeladasAdmin.mockResolvedValue(mockPeladasList);
  });

  it("renders the users list and action buttons properly", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AdminPanelPage />
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(mockSearchUsers).toHaveBeenCalled();
    });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByTestId("reset-password-btn-user-1")).toBeInTheDocument();
    expect(screen.getByTestId("delete-user-btn-user-1")).toBeInTheDocument();

    // The delete button for the current user should be disabled
    const deleteSelfBtn = screen.getByTestId("delete-user-btn-super-admin-id");
    expect(deleteSelfBtn).toBeDisabled();
  });

  it("opens reset password dialog and submits successfully", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <MemoryRouter>
          <AdminPanelPage />
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const resetBtn = screen.getByTestId("reset-password-btn-user-1");
    await user.click(resetBtn);

    // Dialog should be open
    expect(
      screen.getByText(
        "Digite a nova senha para o usuário John Doe (@johndoe).",
      ),
    ).toBeInTheDocument();

    const input = screen.getByTestId("new-password-input");
    await user.type(input, "newsecurepassword");

    mockResetUserPassword.mockResolvedValueOnce({ success: true });

    const confirmBtn = screen.getByTestId("confirm-reset-password-btn");
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockResetUserPassword).toHaveBeenCalledWith(
        "user-1",
        "newsecurepassword",
      );
    });
  });

  it("opens delete user dialog and deletes user successfully", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <MemoryRouter>
          <AdminPanelPage />
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTestId("delete-user-btn-user-1");
    await user.click(deleteBtn);

    // Dialog should be open
    expect(
      screen.getByText(
        "Tem certeza de que deseja remover permanentemente o usuário John Doe (@johndoe)? Esta ação não pode ser desfeita e todas as informações associadas serão excluídas.",
      ),
    ).toBeInTheDocument();

    mockDeleteUser.mockResolvedValueOnce(undefined);

    const confirmBtn = screen.getByTestId("confirm-delete-user-btn");
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith("user-1");
    });
  });

  it("manages organization admins (lists, searches, adds, and removes admins)", async () => {
    const user = userEvent.setup();

    // Mock the sequence of fetching administrators
    mockListAdminsByOrganization
      .mockResolvedValueOnce([
        {
          id: "admin-rec-1",
          organization_id: "org-1",
          user_id: "admin-user-id",
          user_name: "Admin User One",
          user_username: "admin1",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "admin-rec-1",
          organization_id: "org-1",
          user_id: "admin-user-id",
          user_name: "Admin User One",
          user_username: "admin1",
        },
        {
          id: "admin-rec-2",
          organization_id: "org-1",
          user_id: "bob-user-id",
          user_name: "Bob Builder",
          user_username: "bob",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "admin-rec-2",
          organization_id: "org-1",
          user_id: "bob-user-id",
          user_name: "Bob Builder",
          user_username: "bob",
        },
      ]);

    await act(async () => {
      render(
        <MemoryRouter>
          <AdminPanelPage />
        </MemoryRouter>,
      );
    });

    // Switch to Organizations Tab
    const orgsTab = screen.getByText("admin.tabs.organizations");
    await user.click(orgsTab);

    await waitFor(() => {
      expect(mockListOrganizationsAdmin).toHaveBeenCalled();
    });

    expect(screen.getByText("Cool Organization")).toBeInTheDocument();
    const manageAdminsBtn = screen.getByTestId("manage-admins-btn-org-1");
    await user.click(manageAdminsBtn);

    // Dialog should be open, fetching current admins
    await waitFor(() => {
      expect(mockListAdminsByOrganization).toHaveBeenCalledWith("org-1");
    });
    expect(screen.getByText("Admin User One")).toBeInTheDocument();

    // Test adding an admin
    const searchInput = screen.getByTestId("admin-search-input");
    await user.type(searchInput, "bob");

    const searchMockResults = {
      data: [
        {
          id: "bob-user-id",
          name: "Bob Builder",
          username: "bob",
          email: "bob@example.com",
        },
      ],
      total: 1,
      page: 1,
      perPage: 10,
      totalPages: 1,
    };
    mockSearchUsers.mockResolvedValueOnce(searchMockResults);

    const searchBtn = screen.getByTestId("search-admin-users-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    });

    mockAddOrganizationAdmin.mockResolvedValueOnce({ success: true });
    // Click add button for Bob Builder
    const addBtn = screen.getByTestId("add-admin-btn-bob-user-id");
    await user.click(addBtn);

    await waitFor(() => {
      expect(mockAddOrganizationAdmin).toHaveBeenCalledWith(
        "org-1",
        "bob-user-id",
      );
    });

    // Verify Bob is now in list
    await waitFor(() => {
      expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    });

    // Test removing an admin
    mockRemoveOrganizationAdmin.mockResolvedValueOnce(undefined);
    // Click remove button for Admin User One
    const removeBtn = screen.getByTestId("remove-admin-btn-admin-user-id");
    await user.click(removeBtn);

    await waitFor(() => {
      expect(mockRemoveOrganizationAdmin).toHaveBeenCalledWith(
        "org-1",
        "admin-user-id",
      );
    });
  });

  it("opens delete organization dialog and deletes organization successfully", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <MemoryRouter>
          <AdminPanelPage />
        </MemoryRouter>,
      );
    });

    // Switch to Organizations Tab
    const orgsTab = screen.getByText("admin.tabs.organizations");
    await user.click(orgsTab);

    await waitFor(() => {
      expect(screen.getByText("Cool Organization")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTestId("delete-org-btn-org-1");
    await user.click(deleteBtn);

    // Dialog should be open
    expect(
      screen.getByText(
        "Tem certeza de que deseja remover permanentemente a organização Cool Organization? Esta ação não pode ser desfeita e todas as informações associadas serão excluídas.",
      ),
    ).toBeInTheDocument();

    mockDeleteOrganization.mockResolvedValueOnce(undefined);

    const confirmBtn = screen.getByTestId("confirm-delete-org-btn");
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteOrganization).toHaveBeenCalledWith("org-1");
    });
  });

  it("opens edit user dialog and updates user email and phone successfully", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <MemoryRouter>
          <AdminPanelPage />
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const editBtn = screen.getByTestId("edit-user-btn-user-1");
    await user.click(editBtn);

    // Dialog should be open
    expect(
      screen.getByText(
        "Atualize os dados de e-mail e telefone para o usuário John Doe (@johndoe).",
      ),
    ).toBeInTheDocument();

    const emailInput = screen.getByTestId("edit-user-email-input");
    const phoneInput = screen.getByTestId("edit-user-phone-input");

    // Clear and type new values
    await user.clear(emailInput);
    await user.type(emailInput, "newjohn@example.com");
    await user.clear(phoneInput);
    await user.type(phoneInput, "5511988888888");

    const updatedUser = {
      id: "user-1",
      name: "John Doe",
      username: "johndoe",
      email: "newjohn@example.com",
      phone: "5511988888888",
    };
    mockUpdateUserProfile.mockResolvedValueOnce(updatedUser);

    const saveBtn = screen.getByTestId("confirm-edit-user-btn");
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith("user-1", {
        email: "newjohn@example.com",
        phone: "5511988888888",
      });
    });

    // Check that email and phone are updated/displayed in the list
    await waitFor(() => {
      expect(screen.getByText("newjohn@example.com")).toBeInTheDocument();
      expect(screen.getByText("5511988888888")).toBeInTheDocument();
    });
  });

  it("allows navigation to peladas tab, displays peladas list, and deletes pelada successfully", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <MemoryRouter>
          <AdminPanelPage />
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Switch to Peladas tab
    const peladasTab = screen.getByRole("tab", { name: "admin.tabs.peladas" });
    await user.click(peladasTab);

    await waitFor(() => {
      expect(mockListPeladasAdmin).toHaveBeenCalled();
    });

    expect(screen.getByText("Cool Organization")).toBeInTheDocument();
    expect(screen.getByText("pelada-1")).toBeInTheDocument();

    const deleteBtn = screen.getByTestId("delete-pelada-btn-pelada-1");
    await user.click(deleteBtn);

    // Dialog should be open
    expect(
      screen.getByText(/Tem certeza de que deseja remover permanentemente/i),
    ).toBeInTheDocument();

    mockDeletePeladaAdmin.mockResolvedValueOnce(undefined);

    const confirmBtn = screen.getByTestId("confirm-delete-pelada-btn");
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeletePeladaAdmin).toHaveBeenCalledWith("pelada-1");
    });
  });
});
