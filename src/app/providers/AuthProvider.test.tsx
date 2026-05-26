/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./AuthContext";
import { api } from "../../shared/api/client";
import { jwtDecode } from "jwt-decode";

// Mock the api client
vi.mock("../../shared/api/client", () => ({
  api: {
    setAuthErrorHandler: vi.fn(),
    get: vi.fn(),
  },
  logout: vi.fn(),
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock jwt-decode
vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

// Helper component
function TestComponent() {
  const { isAuthenticated, user, signIn, signOut, refreshUser } = useAuth();
  return (
    <div>
      <div data-testid="authenticated">
        {isAuthenticated ? "true" : "false"}
      </div>
      <div data-testid="user">{user?.name || "null"}</div>
      <button
        onClick={() =>
          signIn("test-token", { id: "1", name: "Test User" } as any)
        }
      >
        Sign In
      </button>
      <button onClick={async () => await signOut()}>Sign Out</button>
      <button onClick={async () => await refreshUser()}>Refresh</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(jwtDecode).mockReturnValue({
      id: "1",
      email: "t@e.com",
      admin_orgs: [],
    });
  });

  it("initializes with no authentication when localStorage is empty", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  });

  it("updates state when signIn is called", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    await user.click(screen.getByText("Sign In"));
    await waitFor(() =>
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true"),
    );
  });

  it("extracts admin_orgs from token in signIn", async () => {
    const user = userEvent.setup();
    vi.mocked(jwtDecode).mockReturnValue({
      id: "1",
      email: "t@e.com",
      admin_orgs: ["org1"],
    } as any);
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    await user.click(screen.getByText("Sign In"));
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("authUser") || "{}");
      expect(stored.admin_orgs).toEqual(["org1"]);
    });
  });

  it("refreshes user data successfully", async () => {
    const user = userEvent.setup();
    localStorage.setItem("authUser", JSON.stringify({ id: "1", name: "Old" }));
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/users/me")
        return Promise.resolve({ id: "1", name: "New", is_blocked: false });
      if (url.includes("/organizations"))
        return Promise.resolve([{ id: "org1", role: "admin" }]);
      return Promise.resolve([]);
    });
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    await user.click(screen.getByText("Refresh"));
    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("New"),
    );
    const stored = JSON.parse(localStorage.getItem("authUser") || "{}");
    expect(stored.admin_orgs).toEqual(["org1"]);
  });

  it("clears authentication state when signOut is called", async () => {
    const user = userEvent.setup();
    localStorage.setItem("authUser", JSON.stringify({ id: "1", name: "User" }));
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    await user.click(screen.getByText("Sign Out"));
    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
      expect(screen.getByTestId("user")).toHaveTextContent("null");
    });
    expect(localStorage.getItem("authUser")).toBeNull();
  });

  it("handles auth error by clearing authentication", async () => {
    localStorage.setItem("authUser", JSON.stringify({ id: "1", name: "User" }));
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    expect(api.setAuthErrorHandler).toHaveBeenCalled();
    const authErrorHandler = vi.mocked(api.setAuthErrorHandler).mock
      .calls[0][0];
    await act(async () => {
      authErrorHandler();
    });
    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
      expect(screen.getByTestId("user")).toHaveTextContent("null");
    });
    expect(localStorage.getItem("authUser")).toBeNull();
  });
});
