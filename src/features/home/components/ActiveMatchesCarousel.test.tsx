/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ActiveMatchesCarousel from "./ActiveMatchesCarousel";
import { BrowserRouter } from "react-router-dom";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => {
      if (key === "common.locale_code") return "pt-BR";
      return defaultValue || key;
    },
  }),
}));

describe("ActiveMatchesCarousel", () => {
  const mockPeladas = [
    {
      id: "1",
      status: "attendance",
      organization_name: "Org A",
      scheduled_at: "2026-05-01T19:30:00Z",
    },
    {
      id: "2",
      status: "voting",
      organization_name: "Org B",
      scheduled_at: "2026-05-02T19:30:00Z",
    },
    {
      id: "3",
      status: "running",
      organization_name: "Org C",
      scheduled_at: "2026-05-03T19:30:00Z",
    },
    {
      id: "4",
      status: "open",
      organization_name: "Org D",
      scheduled_at: "2026-05-04T19:30:00Z",
    },
    {
      id: "5",
      status: "closed", // Should be filtered out as it's not active
      organization_name: "Org E",
      scheduled_at: "2026-05-05T19:30:00Z",
    },
  ] as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing if there are no active peladas", () => {
    const { container } = render(
      <BrowserRouter>
        <ActiveMatchesCarousel peladas={[]} />
      </BrowserRouter>,
    );
    expect(container.firstChild).toBeNull();

    // Check with only closed matches
    const { container: closedContainer } = render(
      <BrowserRouter>
        <ActiveMatchesCarousel
          peladas={[{ id: "5", status: "closed" }] as any}
        />
      </BrowserRouter>,
    );
    expect(closedContainer.firstChild).toBeNull();
  });

  it("filters out closed peladas and renders the first active pelada on mount", () => {
    render(
      <BrowserRouter>
        <ActiveMatchesCarousel peladas={mockPeladas} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Org A")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirmar Presença/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 de 4 partidas")).toBeInTheDocument();
  });

  it("navigates through active peladas using next and prev buttons", () => {
    render(
      <BrowserRouter>
        <ActiveMatchesCarousel peladas={mockPeladas} />
      </BrowserRouter>,
    );

    // Initial state: Org A (attendance)
    expect(screen.getByText("Org A")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirmar Presença/ }),
    ).toBeInTheDocument();

    const nextButtons = screen.getAllByRole("button");
    const nextBtn = nextButtons.find((b) =>
      b.querySelector("[data-testid='ChevronRightIcon']"),
    );
    const prevBtn = nextButtons.find((b) =>
      b.querySelector("[data-testid='ChevronLeftIcon']"),
    );

    expect(nextBtn).toBeDefined();
    expect(prevBtn).toBeDefined();

    // Go to Next: Org B (voting)
    fireEvent.click(nextBtn!);
    expect(screen.getByText("Org B")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Votar no MVP/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 de 4 partidas")).toBeInTheDocument();

    // Go to Next: Org C (running)
    fireEvent.click(nextBtn!);
    expect(screen.getByText("Org C")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Acompanhar Partida/ }),
    ).toBeInTheDocument();

    // Go to Next: Org D (open)
    fireEvent.click(nextBtn!);
    expect(screen.getByText("Org D")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ver Detalhes/ }),
    ).toBeInTheDocument();

    // Go back using Prev: Org C
    fireEvent.click(prevBtn!);
    expect(screen.getByText("Org C")).toBeInTheDocument();
  });

  it("directs user to the correct link based on status when action button is clicked", () => {
    render(
      <BrowserRouter>
        <ActiveMatchesCarousel peladas={mockPeladas} />
      </BrowserRouter>,
    );

    // Initial state: Org A (attendance) -> Link /peladas/1/attendance
    const btn = screen.getByRole("button", { name: /Confirmar Presença/ });
    fireEvent.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith("/peladas/1/attendance");

    // Clear mocks, navigate to Org B (voting) -> Link /peladas/2/voting
    vi.clearAllMocks();
    const nextButtons = screen.getAllByRole("button");
    const nextBtn = nextButtons.find((b) =>
      b.querySelector("[data-testid='ChevronRightIcon']"),
    );
    fireEvent.click(nextBtn!);

    const voteBtn = screen.getByRole("button", { name: /Votar no MVP/ });
    fireEvent.click(voteBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/peladas/2/voting");
  });

  it("renders 'Ver Lista de Presença' and success color if user has already responded to attendance", () => {
    const mockPeladaConfirmed = [
      {
        id: "1",
        status: "attendance",
        organization_name: "Org A",
        scheduled_at: "2026-05-01T19:30:00Z",
        user_attendance_status: "confirmed",
      },
    ];

    render(
      <BrowserRouter>
        <ActiveMatchesCarousel peladas={mockPeladaConfirmed as any} />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("button", { name: /Ver Lista de Presença/ }),
    ).toBeInTheDocument();
  });
});
