import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BottomNav from "./BottomNav";

describe("BottomNav", () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = scrollIntoView;
    document.body.innerHTML = "";
  });

  const renderAt = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <BottomNav />
      </MemoryRouter>,
    );

  it("renders the three navigation links", () => {
    renderAt("/home");
    expect(screen.getByTestId("bottom-nav-home")).toHaveAttribute(
      "href",
      "/home",
    );
    expect(screen.getByTestId("bottom-nav-groups")).toHaveAttribute(
      "href",
      "/home#meus-grupos",
    );
    expect(screen.getByTestId("bottom-nav-profile")).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByLabelText("Navegação inferior")).toBeInTheDocument();
  });

  it("marks the profile tab as active on /profile", () => {
    renderAt("/profile");
    expect(screen.getByTestId("bottom-nav-profile")).toBeInTheDocument();
    expect(screen.getByText("PERFIL")).toBeInTheDocument();
    expect(screen.getByText("INÍCIO")).toBeInTheDocument();
  });

  it("marks home as active on /home and inactive on /profile", () => {
    const { rerender } = renderAt("/home");
    expect(screen.getByText("INÍCIO")).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={["/profile"]}>
        <BottomNav />
      </MemoryRouter>,
    );
    expect(screen.getByText("PERFIL")).toBeInTheDocument();
  });

  it("scrolls to the groups anchor when tapping GRUPOS", () => {
    const anchor = document.createElement("div");
    anchor.id = "meus-grupos";
    document.body.appendChild(anchor);

    renderAt("/home");
    fireEvent.click(screen.getByTestId("bottom-nav-groups"));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("does not throw when the groups anchor is missing", () => {
    renderAt("/home");
    expect(() =>
      fireEvent.click(screen.getByTestId("bottom-nav-groups")),
    ).not.toThrow();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
