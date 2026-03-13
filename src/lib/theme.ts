import { createTheme, alpha } from "@mui/material";
import type { PaletteMode } from "@mui/material";

declare module "@mui/material/styles" {
  interface Palette {
    home: Palette["primary"];
    away: Palette["primary"];
  }
  interface PaletteOptions {
    home?: PaletteOptions["primary"];
    away?: PaletteOptions["primary"];
  }
}

export const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#10b981", // Emerald 500
        light: "#34d399",
        dark: "#059669",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#6366f1", // Indigo 500
        light: "#818cf8",
        dark: "#4f46e5",
        contrastText: "#ffffff",
      },
      home: {
        main: "#f97316", // Orange 500 (Existing)
        light: "#fb923c",
        dark: "#ea580c",
        contrastText: "#ffffff",
      },
      away: {
        main: "#2563eb", // Blue 600 (Existing)
        light: "#60a5fa",
        dark: "#1d4ed8",
        contrastText: "#ffffff",
      },
      background: {
        default: mode === "light" ? "#f8fafc" : "#0f172a", // Slate 50 or Slate 900
        paper: mode === "light" ? "#ffffff" : "#1e293b", // White or Slate 800
      },
      text: {
        primary: mode === "light" ? "#1e293b" : "#f1f5f9",
        secondary: mode === "light" ? "#64748b" : "#94a3b8",
      },
      divider: mode === "light" ? alpha("#64748b", 0.1) : alpha("#94a3b8", 0.1),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800, letterSpacing: "-0.02em" },
      h2: { fontWeight: 800, letterSpacing: "-0.02em" },
      h3: { fontWeight: 700, letterSpacing: "-0.01em" },
      h4: { fontWeight: 700, letterSpacing: "-0.01em" },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: "none" },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
            },
          },
          containedPrimary: {
            "&:hover": {
              backgroundColor: "#059669",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
          elevation1: {
            boxShadow:
              mode === "light"
                ? "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
                : "0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            transition: "background-color 0.3s ease",
          },
        },
      },
    },
  });

export default getTheme("light");
