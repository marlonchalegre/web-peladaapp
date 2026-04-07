import type { TFunction } from "i18next";

/**
 * Maps common API error messages to localized strings.
 * @param error The error object (likely an ApiError or Error)
 * @param t The translation function from useTranslation
 * @param fallback Optional fallback message key
 * @returns A localized error message
 */
export function getLocalizedErrorMessage(
  error: unknown,
  t: TFunction,
  fallback?: string
): string {
  if (!(error instanceof Error)) {
    return fallback ? t(fallback) : t("common.errors.unexpected");
  }

  const message = error.message;

  // Check for specific backend error messages (post-fix)
  if (message.includes("Email already exists")) {
    return t("common.errors.email_already_exists");
  }

  if (message.includes("Username already exists")) {
    return t("common.errors.username_already_exists");
  }

  // Check for generic server error message from our updated exception handler
  if (message.includes("An unexpected error occurred")) {
    return t("common.errors.server_error");
  }

  return message;
}
