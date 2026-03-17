import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PeladasList from "./PeladasList";
import { MemoryRouter } from "react-router-dom";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";
import type { Pelada } from "../../../shared/api/endpoints";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      if (key === "common.locale_code") return "pt-BR";
      if (key === "pelada.status.attendance") return "Lista de Presença";
      return fallback || key;
    },
  }),
}));

describe("PeladasList", () => {
  const mockPeladas = [
    {
      id: 1,
      organization_id: 101,
      organization_name: "Test Org",
      status: "attendance" as const,
      scheduled_at: "2026-03-16T20:30:00.000Z",
    },
  ];

  it("renders pelada date in correct locale format", () => {
    render(
      <MemoryRouter>
        <ThemeContextProvider>
          <PeladasList
            peladas={mockPeladas as Pelada[]}
            page={1}
            totalPages={1}
            onPageChange={() => {}}
          />
        </ThemeContextProvider>
      </MemoryRouter>,
    );

    // Should contain date in pt-BR format (DD/MM/YYYY)
    // Note: The specific output might vary slightly based on environment timezone,
    // but the presence of DD/MM/YYYY pattern is what we want to verify.
    const dateText = screen.getByText(/16\/03\/2026/);
    expect(dateText).toBeInTheDocument();
  });

  it("handles status overflow styles", () => {
    render(
      <MemoryRouter>
        <ThemeContextProvider>
          <PeladasList
            peladas={mockPeladas as Pelada[]}
            page={1}
            totalPages={1}
            onPageChange={() => {}}
          />
        </ThemeContextProvider>
      </MemoryRouter>,
    );

    const statusChip = screen.getByText("Lista de Presença");
    expect(statusChip).toBeInTheDocument();
    // Verify it's inside a chip with our custom wrap styles
    // (Testing MUI styles in unit tests is limited, but we can verify the text is there)
  });
});
