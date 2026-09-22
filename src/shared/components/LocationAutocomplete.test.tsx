import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LocationAutocomplete from "./LocationAutocomplete";

describe("LocationAutocomplete", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with initial value", () => {
    const onChange = vi.fn();
    render(
      <LocationAutocomplete
        value="Arena Vila Nova"
        onChange={onChange}
        label="Local"
        dataTestId="loc-auto"
      />,
    );

    const input = screen.getByTestId("loc-auto-input") as HTMLInputElement;
    expect(input.value).toBe("Arena Vila Nova");
  });

  it("calls onChange when typing", () => {
    const onChange = vi.fn();
    render(
      <LocationAutocomplete
        value=""
        onChange={onChange}
        label="Local"
        dataTestId="loc-auto"
      />,
    );

    const input = screen.getByTestId("loc-auto-input");
    fireEvent.change(input, { target: { value: "Estádio Morumbi" } });

    expect(onChange).toHaveBeenCalledWith("Estádio Morumbi");
  });

  it("fetches OpenStreetMap suggestions on input and displays them", async () => {
    const mockResults = [
      {
        place_id: 1,
        display_name: "Arena das Dunas, Avenida Prudente de Morais, Natal, RN",
      },
      {
        place_id: 2,
        display_name: "Arena Corinthians, Itaquera, São Paulo, SP",
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    } as Response);

    const onChange = vi.fn();
    render(
      <LocationAutocomplete
        value=""
        onChange={onChange}
        label="Local"
        dataTestId="loc-auto"
        debounceMs={50}
      />,
    );

    const input = screen.getByTestId("loc-auto-input");
    fireEvent.change(input, { target: { value: "Arena" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    // Suggestions become options and the current input is always offered too.
    fireEvent.mouseDown(input);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Arena" } });

    await waitFor(() => {
      expect(
        screen.getByText(
          "Arena das Dunas, Avenida Prudente de Morais, Natal, RN",
        ),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Arena Corinthians, Itaquera, São Paulo, SP"),
    ).toBeInTheDocument();
    expect(screen.getByText("Arena")).toBeInTheDocument();
  });

  it("does not fetch suggestions for inputs shorter than 3 characters", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(
      <LocationAutocomplete
        value=""
        onChange={vi.fn()}
        dataTestId="loc-auto"
        debounceMs={10}
      />,
    );

    const input = screen.getByTestId("loc-auto-input");
    fireEvent.change(input, { target: { value: "Ar" } });

    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps only the typed value when the lookup fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    render(
      <LocationAutocomplete
        value=""
        onChange={vi.fn()}
        dataTestId="loc-auto"
        debounceMs={10}
      />,
    );

    const input = screen.getByTestId("loc-auto-input");
    fireEvent.change(input, { target: { value: "Arena Vila" } });

    await new Promise((resolve) => setTimeout(resolve, 40));
    fireEvent.mouseDown(input);

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Arena Vila");
  });

  it("aborts the in-flight lookup when the input changes", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );

    render(
      <LocationAutocomplete
        value=""
        onChange={vi.fn()}
        dataTestId="loc-auto"
        debounceMs={30}
      />,
    );

    const input = screen.getByTestId("loc-auto-input");
    fireEvent.change(input, { target: { value: "Arena Vila" } });
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: "Arena Vila Nova" } });
    await new Promise((resolve) => setTimeout(resolve, 40));
    // First request was aborted by the cleanup of the previous effect.
    expect(fetchSpy.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it("calls onChange when selecting a suggestion", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        { place_id: 1, display_name: "Quadra do Parque, Campinas, SP" },
      ],
    } as Response);

    const onChange = vi.fn();
    render(
      <LocationAutocomplete
        value=""
        onChange={onChange}
        dataTestId="loc-auto"
        debounceMs={10}
      />,
    );

    const input = screen.getByTestId("loc-auto-input");
    fireEvent.change(input, { target: { value: "Quadra" } });
    await waitFor(() => {
      expect(
        screen.getByText("Quadra do Parque, Campinas, SP"),
      ).toBeInTheDocument();
    });

    fireEvent.mouseDown(input);
    fireEvent.click(screen.getByText("Quadra do Parque, Campinas, SP"));
    expect(onChange).toHaveBeenCalledWith("Quadra do Parque, Campinas, SP");
  });
});
