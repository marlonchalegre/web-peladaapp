import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PhoneInput } from "./PhoneInput";

describe("PhoneInput", () => {
  it("renders correctly with value", () => {
    const onChange = vi.fn();
    render(
      <PhoneInput
        value="+5511999998888"
        onChange={onChange}
        data-testid="phone-input"
      />,
    );

    const input = screen.getByTestId("phone-input") as HTMLInputElement;
    expect(input.value).toBe("(11) 99999-8888");
  });

  it("handles number change", () => {
    const onChange = vi.fn();
    render(
      <PhoneInput value="+55" onChange={onChange} data-testid="phone-input" />,
    );

    const input = screen.getByTestId("phone-input");
    fireEvent.change(input, { target: { value: "11999998888" } });

    expect(onChange).toHaveBeenCalledWith("+5511999998888");
  });

  it("handles country change", () => {
    const onChange = vi.fn();
    render(
      <PhoneInput
        value="+5511999998888"
        onChange={onChange}
        data-testid="phone-input"
      />,
    );

    // Find the select (country picker)
    const select = screen.getByRole("combobox");
    fireEvent.mouseDown(select);

    // Select US
    const usOption = screen.getByText("United States");
    fireEvent.click(usOption);

    expect(onChange).toHaveBeenCalledWith("+111999998888");
  });

  it("infers country from value without plus", () => {
    const onChange = vi.fn();
    render(
      <PhoneInput
        value="111999998888"
        onChange={onChange}
        data-testid="phone-input"
      />,
    );

    // Should infer US (+1)
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("handles empty value", () => {
    const onChange = vi.fn();
    render(
      <PhoneInput value="" onChange={onChange} data-testid="phone-input" />,
    );
    expect(screen.getByText("+55")).toBeInTheDocument();
  });

  it("applies mask correctly", () => {
    const onChange = vi.fn();
    // Portugal mask: ### ### ###
    render(
      <PhoneInput
        value="+351123456789"
        onChange={onChange}
        data-testid="phone-input"
      />,
    );
    const input = screen.getByTestId("phone-input") as HTMLInputElement;
    expect(input.value).toBe("123 456 789");
  });
});
