import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import UserProfilePage from "./UserProfilePage";
import { MemoryRouter } from "react-router-dom";
import { getUser, updateUserProfile } from "../../../shared/api/client";
import { useAuth } from "../../../app/providers/AuthContext";

// Mock API
vi.mock("../../../shared/api/client", () => ({
  getUser: vi.fn(),
  updateUserProfile: vi.fn(),
  deleteUser: vi.fn(),
  api: {
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
    id: 1,
    name: "Test User",
    username: "testuser",
    email: "test@example.com",
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
  });

  it("loads and displays user profile with position", async () => {
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
      expect(
        screen.getByText("common.positions.goalkeeper"),
      ).toBeInTheDocument();
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
      expect(updateUserProfile).toHaveBeenCalledWith(1, {
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
      expect(updateUserProfile).toHaveBeenCalledWith(1, {
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
      expect(updateUserProfile).toHaveBeenCalledWith(1, {
        email: "",
      });
    });
  });
});
