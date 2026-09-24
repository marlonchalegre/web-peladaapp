import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LocationDisplay from "./LocationDisplay";

describe("LocationDisplay", () => {
  it("renders formatted location and link to Google Maps", () => {
    render(
      <LocationDisplay
        location="Ilha do Retiro, Recife, Pernambuco, Região Nordeste, Brasil"
        showDot
        dataTestId="loc-disp"
      />,
    );

    const link = screen.getByTestId("loc-disp");
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Ilha%20do%20Retiro%2C%20Recife%2C%20Pernambuco%2C%20Regi%C3%A3o%20Nordeste%2C%20Brasil",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Ilha do Retiro, Recife")).toBeInTheDocument();
  });

  it("stops propagation on click to avoid triggering card clicks", () => {
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <LocationDisplay
          location="Arena Vila Nova, Campinas"
          dataTestId="loc-disp"
        />
      </div>,
    );

    const link = screen.getByTestId("loc-disp");
    fireEvent.click(link);

    expect(parentClick).not.toHaveBeenCalled();
  });

  it("returns null if location is empty", () => {
    const { container } = render(<LocationDisplay location="" />);
    expect(container.firstChild).toBeNull();
  });
});
