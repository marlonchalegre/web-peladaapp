import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CreatePeladaForm from "./CreatePeladaForm";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe("CreatePeladaForm", () => {
  it("renders with default notify_casual_players checked and submits payload", async () => {
    const handleCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CreatePeladaForm organizationId="org-123" onCreate={handleCreate} />
      </LocalizationProvider>,
    );

    const switchElement = screen.getByRole("switch", {
      name: /Avisar convidados e diaristas/i,
    });

    expect(switchElement).toBeChecked();

    const submitBtn = screen.getByTestId("create-pelada-submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: "org-123",
          notify_casual_players: true,
        }),
      );
    });
  });

  it("allows toggling notify_casual_players to false before submitting", async () => {
    const handleCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CreatePeladaForm organizationId="org-123" onCreate={handleCreate} />
      </LocalizationProvider>,
    );

    const switchElement = screen.getByRole("switch", {
      name: /Avisar convidados e diaristas/i,
    });

    fireEvent.click(switchElement);
    expect(switchElement).not.toBeChecked();

    const submitBtn = screen.getByTestId("create-pelada-submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: "org-123",
          notify_casual_players: false,
        }),
      );
    });
  });

  it("submits max_players when entered", async () => {
    const handleCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CreatePeladaForm organizationId="org-123" onCreate={handleCreate} />
      </LocalizationProvider>,
    );

    const maxInput = screen
      .getByTestId("create-pelada-max-players")
      .querySelector("input")!;
    fireEvent.change(maxInput, { target: { value: "16" } });

    const submitBtn = screen.getByTestId("create-pelada-submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: "org-123",
          max_players: 16,
        }),
      );
    });
  });

  it("pre-fills max_players input when defaultMaxPlayers prop is provided", async () => {
    const handleCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CreatePeladaForm
          organizationId="org-123"
          defaultMaxPlayers={14}
          onCreate={handleCreate}
        />
      </LocalizationProvider>,
    );

    const maxInput = screen
      .getByTestId("create-pelada-max-players")
      .querySelector("input")!;
    expect(maxInput.value).toBe("14");

    const submitBtn = screen.getByTestId("create-pelada-submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: "org-123",
          max_players: 14,
        }),
      );
    });
  });

  it("allows overriding pre-filled defaultMaxPlayers", async () => {
    const handleCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CreatePeladaForm
          organizationId="org-123"
          defaultMaxPlayers={14}
          onCreate={handleCreate}
        />
      </LocalizationProvider>,
    );

    const maxInput = screen
      .getByTestId("create-pelada-max-players")
      .querySelector("input")!;
    fireEvent.change(maxInput, { target: { value: "20" } });

    const submitBtn = screen.getByTestId("create-pelada-submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: "org-123",
          max_players: 20,
        }),
      );
    });
  });
});
