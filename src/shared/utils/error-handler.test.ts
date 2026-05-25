import { describe, it, expect, vi } from "vitest";
import { getLocalizedErrorMessage } from "./error-handler";
import type { TFunction } from "i18next";

describe("error-handler", () => {
  const t = vi.fn((key: string) => key) as unknown as TFunction;

  it("should return fallback when error is not an Error instance and fallback is provided", () => {
    const result = getLocalizedErrorMessage({}, t, "fallback.key");
    expect(result).toBe("fallback.key");
    expect(t).toHaveBeenCalledWith("fallback.key");
  });

  it("should return unexpected error when error is not an Error instance and no fallback", () => {
    const result = getLocalizedErrorMessage({}, t);
    expect(result).toBe("common.errors.unexpected");
    expect(t).toHaveBeenCalledWith("common.errors.unexpected");
  });

  it("should return localized email exists error", () => {
    const error = new Error("Email already exists");
    const result = getLocalizedErrorMessage(error, t);
    expect(result).toBe("common.errors.email_already_exists");
    expect(t).toHaveBeenCalledWith("common.errors.email_already_exists");
  });

  it("should return localized username exists error", () => {
    const error = new Error("Username already exists");
    const result = getLocalizedErrorMessage(error, t);
    expect(result).toBe("common.errors.username_already_exists");
    expect(t).toHaveBeenCalledWith("common.errors.username_already_exists");
  });

  it("should return localized server error", () => {
    const error = new Error("An unexpected error occurred on the server");
    const result = getLocalizedErrorMessage(error, t);
    expect(result).toBe("common.errors.server_error");
    expect(t).toHaveBeenCalledWith("common.errors.server_error");
  });

  it("should return original message if no specific match found", () => {
    const error = new Error("Some other error");
    const result = getLocalizedErrorMessage(error, t);
    expect(result).toBe("Some other error");
  });
});
