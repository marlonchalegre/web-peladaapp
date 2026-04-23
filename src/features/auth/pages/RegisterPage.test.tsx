import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import RegisterPage from "./RegisterPage";
import { MemoryRouter } from "react-router-dom";
import { register, login } from "../../../shared/api/client";
import { useAuth } from "../../../app/providers/AuthContext";

// Mock API
vi.mock("../../../shared/api/client", () => ({
  register: vi.fn(),
  login: vi.fn(),
  api: {
    post: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock getLocalizedErrorMessage
vi.mock("../../../shared/helpers/error-message", () => ({
  getLocalizedErrorMessage: vi.fn((err) => err.message || "error"),
}));

describe("RegisterPage", () => {
  const mockSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as Mock).mockReturnValue({
      isAuthenticated: false,
      signIn: mockSignIn,
    });
  });

  it("renders registration form and submits with phone", async () => {
    (register as Mock).mockResolvedValue({});
    (login as Mock).mockResolvedValue({ token: "token", user: { id: 1 } });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByTestId("register-name"), {
      target: { value: "New User" },
    });
    fireEvent.change(screen.getByTestId("register-username"), {
      target: { value: "newuser" },
    });
    fireEvent.change(screen.getByTestId("register-email"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByTestId("register-phone"), {
      target: { value: "123456789" },
    });
    fireEvent.change(screen.getByTestId("register-password"), {
      target: { value: "pass123" },
    });

    fireEvent.click(screen.getByTestId("register-submit"));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        "New User",
        "newuser",
        "new@example.com",
        "pass123",
        undefined,
        "+55123456789",
      );
      expect(mockSignIn).toHaveBeenCalledWith("token", { id: 1 });
    });
  });

  it("allows registration without phone", async () => {
    (register as Mock).mockResolvedValue({});
    (login as Mock).mockResolvedValue({ token: "token", user: { id: 1 } });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByTestId("register-name"), {
      target: { value: "New User" },
    });
    fireEvent.change(screen.getByTestId("register-username"), {
      target: { value: "newuser" },
    });
    fireEvent.change(screen.getByTestId("register-password"), {
      target: { value: "pass123" },
    });

    fireEvent.click(screen.getByTestId("register-submit"));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        "New User",
        "newuser",
        undefined,
        "pass123",
        undefined,
        undefined,
      );
    });
  });
});
