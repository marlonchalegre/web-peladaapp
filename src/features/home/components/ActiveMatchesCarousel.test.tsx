/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
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

const mockUpdateAttendance = vi.fn();

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
    mockUpdateAttendance.mockResolvedValue(undefined);
  });

  it("renders nothing if there are no active peladas", () => {
    const { container } = render(
      <BrowserRouter>
        <ActiveMatchesCarousel
          peladas={[]}
          onUpdateAttendance={mockUpdateAttendance}
        />
      </BrowserRouter>,
    );
    expect(container.firstChild).toBeNull();

    // Check with only closed matches
    const { container: closedContainer } = render(
      <BrowserRouter>
        <ActiveMatchesCarousel
          peladas={[{ id: "5", status: "closed" }] as any}
          onUpdateAttendance={mockUpdateAttendance}
        />
      </BrowserRouter>,
    );
    expect(closedContainer.firstChild).toBeNull();
  });

  it("filters out closed peladas and renders the first active pelada on mount", () => {
    render(
      <BrowserRouter>
        <ActiveMatchesCarousel
          peladas={mockPeladas}
          onUpdateAttendance={mockUpdateAttendance}
        />
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
        <ActiveMatchesCarousel
          peladas={mockPeladas}
          onUpdateAttendance={mockUpdateAttendance}
        />
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
        <ActiveMatchesCarousel
          peladas={mockPeladas}
          onUpdateAttendance={mockUpdateAttendance}
        />
      </BrowserRouter>,
    );

    // Initial state: Org A (attendance) -> Link /peladas/1/attendance via "Ver Lista de Presença"
    const viewListBtn = screen.getByRole("button", {
      name: /Ver Lista de Presença/,
    });
    fireEvent.click(viewListBtn);
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

  it("renders both attendance buttons and highlights confirm when user is confirmed", () => {
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
        <ActiveMatchesCarousel
          peladas={mockPeladaConfirmed as any}
          onUpdateAttendance={mockUpdateAttendance}
        />
      </BrowserRouter>,
    );

    const confirmBtn = screen.getByTestId("carousel-attendance-confirm-btn");
    const cancelBtn = screen.getByTestId("carousel-attendance-cancel-btn");

    expect(confirmBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();
    expect(confirmBtn.className).toContain("MuiButton-contained");
    expect(confirmBtn.className).toContain("MuiButton-colorSuccess");
    expect(cancelBtn.className).toContain("MuiButton-outlined");
    expect(cancelBtn.className).toContain("MuiButton-colorError");
  });

  it("renders both attendance buttons and highlights decline when user is declined", () => {
    const mockPeladaDeclined = [
      {
        id: "1",
        status: "attendance",
        organization_name: "Org A",
        scheduled_at: "2026-05-01T19:30:00Z",
        user_attendance_status: "declined",
      },
    ];

    render(
      <BrowserRouter>
        <ActiveMatchesCarousel
          peladas={mockPeladaDeclined as any}
          onUpdateAttendance={mockUpdateAttendance}
        />
      </BrowserRouter>,
    );

    const confirmBtn = screen.getByTestId("carousel-attendance-confirm-btn");
    const cancelBtn = screen.getByTestId("carousel-attendance-cancel-btn");

    expect(confirmBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();
    expect(confirmBtn.className).toContain("MuiButton-outlined");
    expect(confirmBtn.className).toContain("MuiButton-colorSuccess");
    expect(cancelBtn.className).toContain("MuiButton-contained");
    expect(cancelBtn.className).toContain("MuiButton-colorError");
  });

  it("allows switching attendance response directly on screen", async () => {
    const onUpdateAttendance = vi.fn().mockResolvedValue(undefined);
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
        <ActiveMatchesCarousel
          peladas={mockPeladaConfirmed as any}
          onUpdateAttendance={onUpdateAttendance}
        />
      </BrowserRouter>,
    );

    const cancelBtn = screen.getByTestId("carousel-attendance-cancel-btn");
    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    expect(onUpdateAttendance).toHaveBeenCalledWith("1", "declined");
  });

  describe("attendance edge cases", () => {
    const attendancePelada = (
      id: string,
      user_attendance_status?: string | null,
    ) =>
      ({
        id,
        status: "attendance",
        organization_name: `Org ${id}`,
        scheduled_at: "2026-05-01T19:30:00Z",
        user_attendance_status,
      }) as any;

    it("treats a waitlisted player as confirmed", () => {
      render(
        <BrowserRouter>
          <ActiveMatchesCarousel
            peladas={[attendancePelada("1", "waitlist")] as any}
            onUpdateAttendance={mockUpdateAttendance}
          />
        </BrowserRouter>,
      );

      expect(
        screen.getByTestId("carousel-attendance-confirm-btn").className,
      ).toContain("MuiButton-contained");
    });

    it("leaves both buttons outlined when the player has not answered", () => {
      render(
        <BrowserRouter>
          <ActiveMatchesCarousel
            peladas={[attendancePelada("1", null)] as any}
            onUpdateAttendance={mockUpdateAttendance}
          />
        </BrowserRouter>,
      );

      expect(
        screen.getByTestId("carousel-attendance-confirm-btn").className,
      ).toContain("MuiButton-outlined");
      expect(
        screen.getByTestId("carousel-attendance-cancel-btn").className,
      ).toContain("MuiButton-outlined");
    });

    it("blocks both buttons while the update is in flight", async () => {
      let resolveUpdate: () => void = () => {};
      const onUpdateAttendance = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveUpdate = resolve;
          }),
      );

      render(
        <BrowserRouter>
          <ActiveMatchesCarousel
            peladas={[attendancePelada("1", null)] as any}
            onUpdateAttendance={onUpdateAttendance}
          />
        </BrowserRouter>,
      );

      fireEvent.click(screen.getByTestId("carousel-attendance-confirm-btn"));

      expect(
        screen.getByTestId("carousel-attendance-confirm-btn"),
      ).toBeDisabled();
      expect(
        screen.getByTestId("carousel-attendance-cancel-btn"),
      ).toBeDisabled();

      await act(async () => {
        resolveUpdate();
      });

      expect(
        screen.getByTestId("carousel-attendance-confirm-btn"),
      ).not.toBeDisabled();
    });

    it("lets the refreshed pelada win over the optimistic value", async () => {
      // The server can answer with a different status than the one requested —
      // a full pelada turns a confirmation into a waitlist entry. Once the
      // parent has refetched, its value has to be the one on screen.
      const onUpdateAttendance = vi.fn().mockResolvedValue(undefined);
      const { rerender } = render(
        <BrowserRouter>
          <ActiveMatchesCarousel
            peladas={[attendancePelada("1", null)] as any}
            onUpdateAttendance={onUpdateAttendance}
          />
        </BrowserRouter>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("carousel-attendance-confirm-btn"));
      });

      rerender(
        <BrowserRouter>
          <ActiveMatchesCarousel
            peladas={[attendancePelada("1", "declined")] as any}
            onUpdateAttendance={onUpdateAttendance}
          />
        </BrowserRouter>,
      );

      expect(
        screen.getByTestId("carousel-attendance-cancel-btn").className,
      ).toContain("MuiButton-contained");
    });

    it("rolls back to the previous answer when the update fails", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const onUpdateAttendance = vi
        .fn()
        .mockRejectedValue(new Error("network down"));

      render(
        <BrowserRouter>
          <ActiveMatchesCarousel
            peladas={[attendancePelada("1", "confirmed")] as any}
            onUpdateAttendance={onUpdateAttendance}
          />
        </BrowserRouter>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("carousel-attendance-cancel-btn"));
      });

      expect(
        screen.getByTestId("carousel-attendance-confirm-btn").className,
      ).toContain("MuiButton-contained");
      expect(
        screen.getByTestId("carousel-attendance-cancel-btn").className,
      ).toContain("MuiButton-outlined");
      consoleError.mockRestore();
    });

    it("survives the list shrinking under the current index", () => {
      // Confirming attendance makes the parent refetch, and a pelada that
      // closed meanwhile drops out of the list.
      const three = [
        attendancePelada("1", null),
        attendancePelada("2", null),
        attendancePelada("3", null),
      ];
      const { rerender } = render(
        <BrowserRouter>
          <ActiveMatchesCarousel
            peladas={three as any}
            onUpdateAttendance={mockUpdateAttendance}
          />
        </BrowserRouter>,
      );

      fireEvent.click(screen.getByTestId("carousel-next-btn"));
      fireEvent.click(screen.getByTestId("carousel-next-btn"));
      expect(screen.getByText("Org 3")).toBeInTheDocument();

      expect(() =>
        rerender(
          <BrowserRouter>
            <ActiveMatchesCarousel
              peladas={[attendancePelada("1", null)] as any}
              onUpdateAttendance={mockUpdateAttendance}
            />
          </BrowserRouter>,
        ),
      ).not.toThrow();

      expect(screen.getByText("Org 1")).toBeInTheDocument();
    });

    it("still steps through what is left after the list shrinks", () => {
      const three = [
        attendancePelada("1", null),
        attendancePelada("2", null),
        attendancePelada("3", null),
      ];
      const { rerender } = render(
        <BrowserRouter>
          <ActiveMatchesCarousel
            peladas={three as any}
            onUpdateAttendance={mockUpdateAttendance}
          />
        </BrowserRouter>,
      );

      fireEvent.click(screen.getByTestId("carousel-next-btn"));
      fireEvent.click(screen.getByTestId("carousel-next-btn"));

      rerender(
        <BrowserRouter>
          <ActiveMatchesCarousel
            peladas={
              [attendancePelada("1", null), attendancePelada("2", null)] as any
            }
            onUpdateAttendance={mockUpdateAttendance}
          />
        </BrowserRouter>,
      );

      expect(screen.getByText("Org 2")).toBeInTheDocument();
      fireEvent.click(screen.getByTestId("carousel-next-btn"));
      expect(screen.getByText("Org 1")).toBeInTheDocument();
    });

    it("shows a single call to action outside the attendance phase", () => {
      render(
        <BrowserRouter>
          <ActiveMatchesCarousel
            peladas={
              [
                {
                  id: "1",
                  status: "running",
                  organization_name: "Org A",
                  scheduled_at: "2026-05-01T19:30:00Z",
                },
              ] as any
            }
            onUpdateAttendance={mockUpdateAttendance}
          />
        </BrowserRouter>,
      );

      expect(
        screen.queryByTestId("carousel-attendance-confirm-btn"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("carousel-attendance-cancel-btn"),
      ).not.toBeInTheDocument();
    });
  });
});
