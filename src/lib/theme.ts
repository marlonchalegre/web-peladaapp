import { createTheme, alpha } from "@mui/material";
import type { PaletteMode } from "@mui/material";

declare module "@mui/material/styles" {
  interface Palette {
    home: Palette["primary"];
    away: Palette["primary"];
    attendance: {
      button: {
        confirmed: {
          bg: string;
          text: string;
          border: string;
          boxShadow: string;
          icon: string;
          hoverBg: string;
        };
        declined: {
          bg: string;
          text: string;
          border: string;
          boxShadow: string;
          icon: string;
          hoverBg: string;
        };
        dimmed: {
          bg: string;
          text: string;
          border: string;
          boxShadow: string;
          icon: string;
          hoverBg: string;
        };
        pending: {
          bg: string;
          text: string;
          border: string;
          boxShadow: string;
          icon: string;
          hoverBg: string;
        };
      };
    };
  }
  interface PaletteOptions {
    home?: PaletteOptions["primary"];
    away?: PaletteOptions["primary"];
    attendance?: {
      button?: {
        confirmed?: {
          bg?: string;
          text?: string;
          border?: string;
          boxShadow?: string;
          icon?: string;
          hoverBg?: string;
        };
        declined?: {
          bg?: string;
          text?: string;
          border?: string;
          boxShadow?: string;
          icon?: string;
          hoverBg?: string;
        };
        dimmed?: {
          bg?: string;
          text?: string;
          border?: string;
          boxShadow?: string;
          icon?: string;
          hoverBg?: string;
        };
        pending?: {
          bg?: string;
          text?: string;
          border?: string;
          boxShadow?: string;
          icon?: string;
          hoverBg?: string;
        };
      };
    };
  }
}

export const getTheme = (mode: PaletteMode) => {
  const baseTheme = createTheme({
    palette: {
      mode,
      primary: {
        main: "#2563eb", // blue-600
        dark: "#1d4ed8", // blue-700
        light: mode === "light" ? "#dbeafe" : "#1e293b", // blue-100 or blue-900
      },
      secondary: {
        main: "#6366f1", // indigo-500
        light: mode === "light" ? "#e0e7ff" : "#312e81", // indigo-100 or indigo-900
      },
      home: {
        main: "#f97316", // orange-500
      },
      away: {
        main: "#2563eb", // blue-600
      },
      success: {
        main: mode === "light" ? "#166534" : "#4ade80", // green-800 or green-400
        light: mode === "light" ? "#dcfce7" : "#064e3b", // green-100 or green-900
      },
      warning: {
        main: "#e65100", // orange-900
        light: "#ffe0b2", // orange-100
      },
      text: {
        primary: mode === "light" ? "#0f172a" : "#f1f5f9", // slate-900 or slate-100
        secondary: mode === "light" ? "#64748b" : "#94a3b8", // slate-500 or slate-400
      },
      background: {
        default: mode === "light" ? "#f8f9fa" : "#020617", // slate-50 or slate-950
        paper: mode === "light" ? "#ffffff" : "#0f172a", // white or slate-900
      },
      grey: {
        50: "#f8f9fa",
        100: "#f1f5f9",
        200: "#e2e8f0",
        300: "#cbd5e1",
        400: "#94a3b8",
        500: "#64748b",
        600: "#475569",
        700: "#334155",
        800: "#1e293b",
        900: "#0f172a",
      },
      divider: mode === "light" ? "#e2e8f0" : "#1e293b",
    },
    typography: {
      fontFamily: [
        "Inter",
        "system-ui",
        "Avenir",
        "Helvetica",
        "Arial",
        "sans-serif",
      ].join(", "),
      h1: { fontSize: "2.25rem", fontWeight: 700 },
      h2: { fontSize: "1.75rem", fontWeight: 700 },
      h3: { fontSize: "1.5rem", fontWeight: 700 },
      h4: { fontSize: "1.25rem", fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          html: {
            height: "100%",
            margin: 0,
            padding: 0,
          },
          body: {
            height: "100%",
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            transition: "background-color 0.3s ease, color 0.3s ease",
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
          },
          "#root": {
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
          },
          ".droppable": {
            border: "2px dashed transparent",
            transition:
              "border-color 120ms ease-in-out, background-color 120ms ease-in-out",
          },
          ".droppable--over": {
            borderColor: alpha(theme.palette.primary.main, 0.5),
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          },
          ".panel": {
            backgroundColor: alpha(theme.palette.text.primary, 0.04),
            border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
            borderRadius: 8,
            padding: "12px 14px",
            textAlign: "left",
          },
        }),
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            width: "90%",
            maxWidth: "90% !important",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            transition: "background-color 0.3s ease, box-shadow 0.3s ease",
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
      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            fontWeight: "bold",
            color: theme.palette.text.primary,
            fontSize: "0.875rem",
          }),
          body: ({ theme }) => ({
            color: theme.palette.text.primary,
          }),
        },
      },
    },
  });

  Object.assign(baseTheme.palette, {
    attendance: {
      button: {
        confirmed: {
          bg: "#ffffff",
          text: baseTheme.palette.success.main,
          border: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          icon: baseTheme.palette.success.main,
          hoverBg: alpha("#ffffff", 0.9),
        },
        declined: {
          bg: "#ffffff",
          text: baseTheme.palette.error.main,
          border: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          icon: baseTheme.palette.error.main,
          hoverBg: alpha("#ffffff", 0.9),
        },
        dimmed: {
          bg: alpha("#ffffff", 0.1),
          text: alpha("#ffffff", 0.6),
          border: `1px solid ${alpha("#ffffff", 0.2)}`,
          boxShadow: "none",
          icon: alpha("#ffffff", 0.6),
          hoverBg: alpha("#ffffff", 0.2),
        },
        pending: {
          bg: alpha("#ffffff", 0.15),
          text: "#ffffff",
          border: `1px solid ${alpha("#ffffff", 0.3)}`,
          boxShadow: "none",
          icon: "#ffffff",
          hoverBg: alpha("#ffffff", 0.25),
        },
      },
    },
  });

  return baseTheme;
};

export default getTheme("light");
