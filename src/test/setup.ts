import React from "react";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Fix act warnings for React 18/19
// @ts-expect-error - IS_REACT_ACT_ENVIRONMENT is used by React internals
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock react-i18next
const tSpy = (key: string) => {
  if (key === "common.locale_code") return "en-US";
  return key;
};
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: tSpy,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
      language: "en",
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock localStorage
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    length: 0,
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Systemically disable MUI ripples to avoid act warnings from animations
// We use a named export mock for MUI components to ensure they all use the same mocked base
vi.mock("@mui/material/ButtonBase", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@mui/material/ButtonBase")>();
  return {
    ...actual,
    default: React.forwardRef((props: unknown, ref: React.Ref<unknown>) => {
      const { children, style, ...rest } = props as {
        children: React.ReactNode;
        style?: React.CSSProperties;
      };
      return React.createElement(
        "button",
        {
          ...rest,
          ref,
          type: "button",
          style: {
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
            ...style,
          },
        },
        children,
      );
    }),
  };
});

// Mock TouchRipple directly as well
vi.mock("@mui/material/ButtonBase/TouchRipple", () => ({
  default: React.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
    React.useImperativeHandle(ref, () => ({
      pulsate: () => {},
      start: () => {},
      stop: () => {},
    }));
    return null;
  }),
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});
