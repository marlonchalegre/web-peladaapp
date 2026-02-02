import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./AuthContext";
import { api } from "../../shared/api/client";

// Mock the api client
vi.mock("../../shared/api/client", () => ({
  api: {
    setToken: vi.fn(),
    setAuthErrorHandler: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock jwt-decode to avoid parsing errors with dummy tokens
vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(() => ({ admin_orgs: [] })),
}));

// Helper component to test the auth context
function TestComponent() {
  const { isAuthenticated, token, user, signIn, signOut } = useAuth();

  return (
    <div>
      <div data-testid="authenticated">
        {isAuthenticated ? "true" : "false"}
      </div>
      <div data-testid="token">{token || "null"}</div>
      <div data-testid="user">{user?.name || "null"}</div>
      <button
        onClick={() =>
          signIn("test-token", {
            id: 1,
            name: "Test User",
            email: "test@example.com",
          })
        }
      >
        Sign In
      </button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("initializes with no authentication when localStorage is empty", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("token")).toHaveTextContent("null");
    expect(screen.getByTestId("user")).toHaveTextContent("null");
  });

  it("initializes with authentication when localStorage has token and user", () => {
    const mockToken = "stored-token";
    const mockUser = {
      id: 1,
      name: "Stored User",
      email: "stored@example.com",
    };

    localStorage.setItem("authToken", mockToken);
    localStorage.setItem("authUser", JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("token")).toHaveTextContent(mockToken);
    expect(screen.getByTestId("user")).toHaveTextContent(mockUser.name);
  });

  it("sets token in api client when token changes", () => {
    const mockToken = "test-token";
    localStorage.setItem("authToken", mockToken);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(api.setToken).toHaveBeenCalledWith(mockToken);
  });

  it("sets up auth error handler on mount", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(api.setAuthErrorHandler).toHaveBeenCalled();
  });

  it("updates authentication state when signIn is called", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const signInButton = screen.getByText("Sign In");
    signInButton.click();

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
      expect(screen.getByTestId("token")).toHaveTextContent("test-token");
      expect(screen.getByTestId("user")).toHaveTextContent("Test User");
    });

    // Check localStorage
    expect(localStorage.getItem("authToken")).toBe("test-token");
    const storedUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    expect(storedUser.name).toBe("Test User");
  });

  it("clears authentication state when signOut is called", async () => {
    // Set initial auth state
    localStorage.setItem("authToken", "initial-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({ id: 1, name: "User", email: "user@example.com" }),
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // Should be authenticated initially
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");

    const signOutButton = screen.getByText("Sign Out");
    signOutButton.click();

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
      expect(screen.getByTestId("token")).toHaveTextContent("null");
      expect(screen.getByTestId("user")).toHaveTextContent("null");
    });

    // Check localStorage is cleared
    expect(localStorage.getItem("authToken")).toBeNull();
    expect(localStorage.getItem("authUser")).toBeNull();
  });

  it("considers user authenticated only when both token and user exist", () => {
    // Token exists but no user
    localStorage.setItem("authToken", "token-only");

    const { rerender } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");

    // Clear and set user only
    localStorage.clear();
    localStorage.setItem(
      "authUser",
      JSON.stringify({ id: 1, name: "User", email: "user@example.com" }),
    );

    rerender(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  });

  it("calls api.setToken with null when token is cleared", async () => {
    localStorage.setItem("authToken", "initial-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({ id: 1, name: "User", email: "user@example.com" }),
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // Clear mocks from initialization
    vi.clearAllMocks();

    const signOutButton = screen.getByText("Sign Out");
    signOutButton.click();

    await waitFor(() => {
      expect(api.setToken).toHaveBeenCalledWith(null);
    });
  });

  it("handles auth error by clearing authentication", async () => {
    localStorage.setItem("authToken", "expired-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({ id: 1, name: "User", email: "user@example.com" }),
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // Get the auth error handler that was registered
    const authErrorHandler = (api.setAuthErrorHandler as Mock).mock.calls[0][0];

    // Simulate an auth error
    authErrorHandler();

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
      expect(screen.getByTestId("token")).toHaveTextContent("null");
      expect(screen.getByTestId("user")).toHaveTextContent("null");
    });

    // Check localStorage is cleared
    expect(localStorage.getItem("authToken")).toBeNull();
    expect(localStorage.getItem("authUser")).toBeNull();
  });
});
