import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DesktopHeader from "./DesktopHeader";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../app/providers/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "u-1",
      name: "Igor Matos",
      username: "igormatos",
      avatar_filename: "avatar1.png",
    },
    signOut: vi.fn(),
  }),
}));

vi.mock("../../app/providers/ThemeContext", () => ({
  useAppTheme: () => ({
    mode: "light",
    toggleTheme: vi.fn(),
  }),
}));

vi.mock("../../shared/api/client", () => ({
  api: {
    apiBaseUrl: "http://localhost",
    get: vi.fn().mockResolvedValue([]),
    getPaginated: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe("DesktopHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders SecureAvatar in user settings button", () => {
    render(
      <MemoryRouter>
        <DesktopHeader />
      </MemoryRouter>,
    );

    const button = screen.getByTestId("user-settings-button");
    expect(button).toBeInTheDocument();
    const avatar = screen.getByTestId("secure-avatar");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveTextContent("IM");
  });
});
