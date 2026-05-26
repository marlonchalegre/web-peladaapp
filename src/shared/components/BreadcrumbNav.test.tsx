import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import BreadcrumbNav from "./BreadcrumbNav";
import { MemoryRouter } from "react-router-dom";

describe("BreadcrumbNav", () => {
  it("renders breadcrumbs correctly including home, intermediate items with/without paths, and current page", () => {
    const items = [
      { label: "Organization Page", path: "/organizations/1" },
      { label: "No Path Item" }, // triggers fallback to={item.path || "#"}
      { label: "Current Page" }, // isLast item
    ];

    render(
      <MemoryRouter>
        <BreadcrumbNav items={items} />
      </MemoryRouter>,
    );

    // 1. Verify Home Link is rendered
    const homeLink = document.querySelector('a[href="/home"]');
    expect(homeLink).toBeInTheDocument();

    // 2. Verify Organization Page is rendered with correct path
    const orgLink = screen.getByText("Organization Page");
    expect(orgLink).toBeInTheDocument();
    expect(orgLink.closest("a")).toHaveAttribute("href", "/organizations/1");

    // 3. Verify No Path Item falls back to "#"
    const noPathItem = screen.getByText("No Path Item");
    expect(noPathItem).toBeInTheDocument();
    expect(noPathItem.closest("a")).toHaveAttribute("href", "/");

    // 4. Verify Current Page is rendered as isLast (Box/Typography instead of Link)
    const currentPageText = screen.getByText("Current Page");
    expect(currentPageText).toBeInTheDocument();
    expect(currentPageText.closest("a")).toBeNull();
  });
});
