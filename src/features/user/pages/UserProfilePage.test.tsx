import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import UserProfilePage from "./UserProfilePage";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
import { getUser, updateUserProfile, deleteUser, uploadUserAvatar, deleteUserAvatar } from "../../../shared/api/client";
import { useAuth } from "../../../app/providers/AuthContext";

// Mock API
vi.mock("../../../shared/api/client", () => ({
  getUser: vi.fn(),
  updateUserProfile: vi.fn(),
  deleteUser: vi.fn(),
  uploadUserAvatar: vi.fn(),
  deleteUserAvatar: vi.fn(),
  api: {
    apiBaseUrl: "http://localhost",
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("UserProfilePage", () => {
  const mockSignIn = vi.fn();
  const mockSignOut = vi.fn();
  const defaultUser = {
    id: "1",
    name: "Test User",
    username: "testuser",
    email: "test@example.com",
    phone: "5511999999999",
    position: "Goalkeeper",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as Mock).mockReturnValue({
      user: defaultUser,
      signIn: mockSignIn,
      signOut: mockSignOut,
      token: "fake-token",
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["mock-image"], { type: "image/png" })),
    });
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://test-avatar-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("loads and displays user profile with position and phone", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);

    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
      expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
      expect(screen.getByDisplayValue("(11) 99999-9999")).toBeInTheDocument();
      expect(
        screen.getByText("common.positions.goalkeeper"),
      ).toBeInTheDocument();
    });
  });

  it("updates user profile phone", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);

    (updateUserProfile as Mock).mockResolvedValue({
      ...defaultUser,
      phone: "123456789",
    });

    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("(11) 99999-9999")).toBeInTheDocument();
    });

    const phoneInput = screen.getByLabelText(/common.fields.phone/i);
    fireEvent.change(phoneInput, {
      target: { value: "123456789" },
    });

    fireEvent.click(screen.getByText("user.profile.button.save"));

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith("1", {
        phone: "+55123456789",
      });
    });
  });

  it("updates user profile name", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);

    (updateUserProfile as Mock).mockResolvedValue({
      ...defaultUser,
      name: "Updated User",
    });

    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/common.fields.name/i);
    fireEvent.change(nameInput, {
      target: { value: "Updated User" },
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Updated User")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("user.profile.button.save"));

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith("1", {
        name: "Updated User",
      });
    });
  });

  it("updates user profile position", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);

    (updateUserProfile as Mock).mockResolvedValue({
      ...defaultUser,
      position: "Striker",
    });

    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    });

    const positionSelect = screen.getByLabelText(/common.fields.position/i);
    fireEvent.mouseDown(positionSelect);

    const option = await screen.findByText("common.positions.striker");
    fireEvent.click(option);

    fireEvent.click(screen.getByText("user.profile.button.save"));

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith("1", {
        position: "Striker",
      });
    });
  });

  it("allows updating profile with empty email", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);
    (updateUserProfile as Mock).mockResolvedValue({
      ...defaultUser,
      email: "",
    });

    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/common.fields.email/i);
    fireEvent.change(emailInput, { target: { value: "" } });

    fireEvent.click(screen.getByText("user.profile.button.save"));

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith("1", {
        email: "",
      });
    });
  });

  it("handles duplicate email error with friendly message", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);
    (updateUserProfile as Mock).mockRejectedValue(
      new Error("Email already exists"),
    );

    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/common.fields.email/i);
    fireEvent.change(emailInput, {
      target: { value: "duplicate@example.com" },
    });

    fireEvent.click(screen.getByText("user.profile.button.save"));

    await waitFor(() => {
      expect(
        screen.getByText("common.errors.email_already_exists"),
      ).toBeInTheDocument();
    });
  });

  it("redirects to /login if user is not authenticated", async () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      signIn: mockSignIn,
      signOut: mockSignOut,
      token: "fake-token",
    });

    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("shows error if uploaded avatar is too large (>2MB)", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);
    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByDisplayValue("Test User")).toBeInTheDocument());

    const file = new File(["a".repeat(3 * 1024 * 1024)], "avatar.png", { type: "image/png" });
    const label = screen.getByLabelText("upload picture");
    const input = label.querySelector("input")!;
    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });
    
    await act(async () => {
      fireEvent.change(input);
    });

    expect(screen.getByText("user.profile.error.file_too_large")).toBeInTheDocument();
  });

  it("handles avatar upload successfully", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);
    (uploadUserAvatar as Mock).mockResolvedValue({ avatar_filename: "new-avatar.png" });
    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByDisplayValue("Test User")).toBeInTheDocument());

    const file = new File(["avatar-content"], "avatar.png", { type: "image/png" });
    const label = screen.getByLabelText("upload picture");
    const input = label.querySelector("input")!;
    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });
    
    await act(async () => {
      fireEvent.change(input);
    });

    expect(uploadUserAvatar).toHaveBeenCalledWith("1", file);
    expect(mockSignIn).toHaveBeenCalledWith("fake-token", expect.objectContaining({ avatar_filename: "new-avatar.png" }));
    expect(screen.getByText("user.profile.success.avatar_updated")).toBeInTheDocument();
  });

  it("handles avatar upload error gracefully", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);
    (uploadUserAvatar as Mock).mockRejectedValue("Upload Failed");
    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByDisplayValue("Test User")).toBeInTheDocument());

    const file = new File(["avatar-content"], "avatar.png", { type: "image/png" });
    const label = screen.getByLabelText("upload picture");
    const input = label.querySelector("input")!;
    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });
    
    await act(async () => {
      fireEvent.change(input);
    });

    expect(screen.getByText("user.profile.error.upload_failed")).toBeInTheDocument();
  });

  it("handles avatar deletion successfully", async () => {
    const userWithAvatar = { ...defaultUser, avatar_filename: "existing.png" };
    (useAuth as Mock).mockReturnValue({
      user: userWithAvatar,
      signIn: mockSignIn,
      signOut: mockSignOut,
      token: "fake-token",
    });
    (getUser as Mock).mockResolvedValue(userWithAvatar);
    (deleteUserAvatar as Mock).mockResolvedValue({});

    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByDisplayValue("Test User")).toBeInTheDocument());

    const deleteButton = screen.getByLabelText("delete picture");
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(deleteUserAvatar).toHaveBeenCalledWith("1");
    expect(mockSignIn).toHaveBeenCalledWith("fake-token", expect.objectContaining({ avatar_filename: null }));
    expect(screen.getByText("user.profile.success.avatar_deleted")).toBeInTheDocument();
  });

  it("handles avatar deletion error gracefully", async () => {
    const userWithAvatar = { ...defaultUser, avatar_filename: "existing.png" };
    (useAuth as Mock).mockReturnValue({
      user: userWithAvatar,
      signIn: mockSignIn,
      signOut: mockSignOut,
      token: "fake-token",
    });
    (getUser as Mock).mockResolvedValue(userWithAvatar);
    (deleteUserAvatar as Mock).mockRejectedValue("Delete Failed");

    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByDisplayValue("Test User")).toBeInTheDocument());

    const deleteButton = screen.getByLabelText("delete picture");
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(screen.getByText("user.profile.error.delete_failed")).toBeInTheDocument();
  });

  it("shows error if passwords do not match", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);
    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByDisplayValue("Test User")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("user.profile.field.new_password"), { target: { value: "pass1" } });
    fireEvent.change(screen.getByLabelText("user.profile.field.confirm_password"), { target: { value: "pass2" } });
    fireEvent.click(screen.getByText("user.profile.button.save"));

    expect(screen.getByText("user.profile.error.password_mismatch")).toBeInTheDocument();
  });

  it("shows error if name is empty on save", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);
    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByDisplayValue("Test User")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/common.fields.name/i), { target: { value: "  " } });
    fireEvent.click(screen.getByText("user.profile.button.save"));

    expect(screen.getByText("user.profile.error.name_required")).toBeInTheDocument();
  });

  it("shows error if no changes are submitted", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);
    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByDisplayValue("Test User")).toBeInTheDocument());

    fireEvent.click(screen.getByText("user.profile.button.save"));

    expect(screen.getByText("user.profile.error.no_changes")).toBeInTheDocument();
  });

  it("handles delete account dialog interactions and successful deletion", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);
    (deleteUser as Mock).mockResolvedValue({});
    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByDisplayValue("Test User")).toBeInTheDocument());

    // Open Dialog
    fireEvent.click(screen.getByText("user.profile.button.delete_account"));
    expect(screen.getByText("user.profile.dialog.delete_title")).toBeInTheDocument();

    // Cancel Dialog
    const cancelButtons = screen.getAllByText("common.cancel");
    fireEvent.click(cancelButtons[1]); // dialog cancel button
    await waitFor(() => expect(screen.queryByText("user.profile.dialog.delete_title")).not.toBeInTheDocument());

    // Open again and confirm
    fireEvent.click(screen.getByText("user.profile.button.delete_account"));
    fireEvent.click(screen.getByText("user.profile.dialog.delete_button"));

    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledWith("1");
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("handles delete account failure gracefully", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);
    (deleteUser as Mock).mockRejectedValue("String error");
    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByDisplayValue("Test User")).toBeInTheDocument());

    fireEvent.click(screen.getByText("user.profile.button.delete_account"));
    fireEvent.click(screen.getByText("user.profile.dialog.delete_button"));

    await waitFor(() => {
      expect(screen.getByText("user.profile.error.delete_failed")).toBeInTheDocument();
    });
  });

  it("handles profile load error gracefully during initial render", async () => {
    (getUser as Mock).mockRejectedValue(new Error("Profile Load Fail"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("user.profile.error.load_failed")).toBeInTheDocument();
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("updates username correctly on change and handles cancel button click navigation", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);
    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByDisplayValue("testuser")).toBeInTheDocument());

    const usernameInput = screen.getByLabelText(/common.fields.username/i);
    fireEvent.change(usernameInput, { target: { value: "newusername" } });
    expect(screen.getByDisplayValue("newusername")).toBeInTheDocument();

    const cancelButton = screen.getByText("common.cancel");
    fireEvent.click(cancelButton);
    expect(mockNavigate).toHaveBeenCalledWith("/home");
  });

  it("closes the delete account dialog when onClose is triggered on the Dialog component", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);
    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByDisplayValue("Test User")).toBeInTheDocument());

    // Open dialog
    fireEvent.click(screen.getByText("user.profile.button.delete_account"));
    const dialogTitle = screen.getByText("user.profile.dialog.delete_title");
    expect(dialogTitle).toBeInTheDocument();

    // Trigger close by clicking backdrop or escape key
    const backdrop = document.querySelector(".MuiBackdrop-root");
    if (backdrop) {
      fireEvent.click(backdrop);
    } else {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape", keyCode: 27 });
    }
    await waitFor(() => expect(screen.queryByText("user.profile.dialog.delete_title")).not.toBeInTheDocument());
  });

  it("updates username and password on save", async () => {
    (getUser as Mock).mockResolvedValue(defaultUser);
    (updateUserProfile as Mock).mockResolvedValue({
      ...defaultUser,
      username: "newusername",
    });

    render(
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/common.fields.username/i);
    fireEvent.change(usernameInput, { target: { value: "newusername" } });

    fireEvent.change(screen.getByLabelText("user.profile.field.new_password"), { target: { value: "matchingpass" } });
    fireEvent.change(screen.getByLabelText("user.profile.field.confirm_password"), { target: { value: "matchingpass" } });

    fireEvent.click(screen.getByText("user.profile.button.save"));

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith("1", {
        username: "newusername",
        password: "matchingpass",
      });
    });
  });
});
