import { createContext, useContext } from "react";
import type { PaletteMode } from "@mui/material";

export type ThemeContextType = {
  mode: PaletteMode;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      mode: "light" as PaletteMode,
      toggleTheme: () => {},
    };
  }
  return context;
};
