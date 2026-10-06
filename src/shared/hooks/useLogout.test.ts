import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLogout } from "./useLogout";

const mockSignOut = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../app/providers/AuthContext", () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

describe("useLogout", () => {
  it("calls onCloseMenu, signOut, and navigates to '/'", async () => {
    const onCloseMenu = vi.fn();
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current(onCloseMenu);
    });

    expect(onCloseMenu).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("functions properly when no callback is provided", async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
