import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { AuthContext } from "../providers/AuthContext";
import type { AuthContextValue } from "../providers/AuthContext";

const mockAuthContext = (
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue => ({
  token: null,
  user: null,
  isAuthenticated: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  ...overrides,
});

describe("ProtectedRoute", () => {
  it("redirects to /login when user is not authenticated", () => {
    const authValue = mockAuthContext({ isAuthenticated: false });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders protected content when user is authenticated", () => {
    const authValue = mockAuthContext({
      isAuthenticated: true,
      token: "valid-token",
      user: { id: 1, name: "Test User", email: "test@example.com" },
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("redirects to /login when token is null", () => {
    const authValue = mockAuthContext({
      isAuthenticated: false,
      token: null,
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/organizations"]}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/organizations" element={<div>Organizations</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Organizations")).not.toBeInTheDocument();
  });

  it("redirects to /login when user is null even if token exists", () => {
    const authValue = mockAuthContext({
      isAuthenticated: false, // This should be false if user is null
      token: "some-token",
      user: null,
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/profile"]}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<div>Profile Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Profile Page")).not.toBeInTheDocument();
  });

  it("allows access to multiple nested protected routes when authenticated", () => {
    const authValue = mockAuthContext({
      isAuthenticated: true,
      token: "valid-token",
      user: { id: 1, name: "Test User", email: "test@example.com" },
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/organizations"]}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<div>Home</div>} />
              <Route path="/organizations" element={<div>Organizations</div>} />
              <Route path="/profile" element={<div>Profile</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Organizations")).toBeInTheDocument();
  });
});
