import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import PeladaTabsBar, { type PeladaTabKey } from "./PeladaTabsBar";

describe("PeladaTabsBar", () => {
  const renderBar = (
    active: PeladaTabKey = "teams",
    extra: Partial<ComponentProps<typeof PeladaTabsBar>> = {},
  ) =>
    render(
      <MemoryRouter>
        <PeladaTabsBar peladaId="p1" active={active} {...extra} />
      </MemoryRouter>,
    );

  it("renders all five tab links", () => {
    renderBar();
    expect(screen.getByLabelText("Pelada sub-navigation")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /LISTA DE PRESENÇA/ }),
    ).toHaveAttribute("href", "/peladas/p1/attendance");
    expect(screen.getByRole("link", { name: /TIMES/ })).toHaveAttribute(
      "href",
      "/peladas/p1",
    );
    expect(screen.getByRole("link", { name: /VOTAÇÃO/ })).toHaveAttribute(
      "href",
      "/peladas/p1/voting",
    );
    expect(screen.getByRole("link", { name: /SÚMULA/ })).toHaveAttribute(
      "href",
      "/peladas/p1/results",
    );
  });

  it("formats the date label from day and month", () => {
    renderBar("teams", { dayStr: "16", monthStr: "09" });
    expect(screen.getByText("PELADA 16/09")).toBeInTheDocument();
  });

  it("renders the raw day/month values without padding", () => {
    renderBar("teams", { dayStr: 9, monthStr: 5 });
    expect(screen.getByText("PELADA 9/5")).toBeInTheDocument();
  });

  it("prefers an explicit dateStr over day/month", () => {
    renderBar("teams", { dateStr: "24/09", dayStr: 1, monthStr: 1 });
    expect(screen.getByText("PELADA 24/09")).toBeInTheDocument();
  });

  it("falls back to a bare PELADA label when no date is given", () => {
    renderBar("teams");
    expect(screen.getByText("PELADA")).toBeInTheDocument();
  });

  it("shows the confirmed count badge on the attendance tab", () => {
    renderBar("attendance", { confirmedCount: 7 });
    expect(
      screen.getByRole("link", { name: /LISTA DE PRESENÇA\s*7/ }),
    ).toBeInTheDocument();
  });

  it("omits the badge when there is no count", () => {
    renderBar("attendance");
    expect(
      screen.getByRole("link", { name: "LISTA DE PRESENÇA" }),
    ).toBeInTheDocument();
  });

  it("points PARTIDAS to the schedule builder while the pelada is open", () => {
    renderBar("matches", { isPeladaOpen: true });
    expect(screen.getByRole("link", { name: /PARTIDAS/ })).toHaveAttribute(
      "href",
      "/peladas/p1/build-schedule",
    );
  });

  it("points PARTIDAS to the matches page when the pelada is closed", () => {
    renderBar("matches", { status: "closed" });
    expect(screen.getByRole("link", { name: /PARTIDAS/ })).toHaveAttribute(
      "href",
      "/peladas/p1/matches",
    );
  });

  it("lets isPeladaOpen override the status-derived route", () => {
    renderBar("matches", { status: "closed", isPeladaOpen: true });
    expect(screen.getByRole("link", { name: /PARTIDAS/ })).toHaveAttribute(
      "href",
      "/peladas/p1/build-schedule",
    );
  });

  it("treats an unknown status without isPeladaOpen as closed", () => {
    renderBar("matches", { status: "running" });
    expect(screen.getByRole("link", { name: /PARTIDAS/ })).toHaveAttribute(
      "href",
      "/peladas/p1/matches",
    );
  });
});
