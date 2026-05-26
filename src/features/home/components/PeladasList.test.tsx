/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PeladasList from "./PeladasList";
import { MemoryRouter } from "react-router-dom";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === "common.locale_code") return "pt-BR";
      return key;
    },
  }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("PeladasList", () => {
  const mockPeladas = [
    {
      id: "1",
      status: "attendance",
      organization_name: "Org 1",
      scheduled_at: "2024-01-01T10:00:00Z",
    },
    {
      id: "2",
      status: "running",
      organization_name: "Org 2",
      scheduled_at: "2024-01-02T10:00:00Z",
    },
    {
      id: "3",
      status: "voting",
      organization_name: "Org 3",
      scheduled_at: "2024-01-03T10:00:00Z",
    },
    {
      id: "4",
      status: "closed",
      organization_name: "Org 4",
      scheduled_at: "2024-01-04T10:00:00Z",
    },
    {
      id: "5",
      status: "open",
      organization_name: "Org 5",
      scheduled_at: "2024-01-05T10:00:00Z",
    },
  ] as any;

  it("renders correctly and navigates to correct links based on status", () => {
    render(
      <MemoryRouter>
        <PeladasList
          peladas={mockPeladas}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Org 1")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("pelada-row-1"));
    expect(mockNavigate).toHaveBeenCalledWith("/peladas/1/attendance");

    fireEvent.click(screen.getByTestId("pelada-row-2"));
    expect(mockNavigate).toHaveBeenCalledWith("/peladas/2/matches");

    fireEvent.click(screen.getByTestId("pelada-row-3"));
    expect(mockNavigate).toHaveBeenCalledWith("/peladas/3/voting");

    fireEvent.click(screen.getByTestId("pelada-row-4"));
    expect(mockNavigate).toHaveBeenCalledWith("/peladas/4/results");

    fireEvent.click(screen.getByTestId("pelada-row-5"));
    expect(mockNavigate).toHaveBeenCalledWith("/peladas/5");
  });

  it("handles pagination clicks", () => {
    const onPageChange = vi.fn();
    render(
      <MemoryRouter>
        <PeladasList
          peladas={mockPeladas}
          page={1}
          totalPages={2}
          onPageChange={onPageChange}
        />
      </MemoryRouter>,
    );

    const nextButton = screen.getByLabelText("Go to page 2");
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalled();
  });

  it("renders empty state correctly", () => {
    render(
      <MemoryRouter>
        <PeladasList
          peladas={[]}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("home.sections.peladas.empty")).toBeInTheDocument();
  });
});
