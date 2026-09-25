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
        main: "#146b3a", // Pitch green
        dark: "#0f5c33",
        light: "#bfe6ce",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#a8452a", // Terracotta / warm red
        dark: "#8a351f",
        light: "#f6ece8",
        contrastText: "#ffffff",
      },
      home: {
        main: "#146b3a",
      },
      away: {
        main: "#a8452a",
      },
      success: {
        main: "#146b3a",
        light: "#bfe6ce",
      },
      warning: {
        main: "#f2a100", // Amber / stats accent
        light: "#fef3d6",
      },
      text: {
        primary: mode === "light" ? "#17181a" : "#f6f4ee",
        secondary: mode === "light" ? "#6b675c" : "#9a958a",
      },
      background: {
        default: mode === "light" ? "#f6f4ee" : "#17181a",
        paper: mode === "light" ? "#ffffff" : "#222428",
      },
      grey: {
        50: "#fbfaf7",
        100: "#f6f4ee",
        200: "#eae6db",
        300: "#ddd8cc",
        400: "#c9c4b6",
        500: "#9a958a",
        600: "#6b675c",
        700: "#4a4740",
        800: "#2d2c29",
        900: "#17181a",
      },
      divider: mode === "light" ? "#eae6db" : "#2d3035",
    },
    typography: {
      fontFamily: [
        "Archivo",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        "sans-serif",
      ].join(", "),
      h1: { fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.02em" },
      h2: { fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.01em" },
      h3: { fontSize: "1.5rem", fontWeight: 800 },
      h4: { fontSize: "1.25rem", fontWeight: 800 },
      h5: { fontSize: "1.1rem", fontWeight: 700 },
      h6: { fontSize: "0.95rem", fontWeight: 700 },
      button: {
        fontWeight: 800,
        textTransform: "none",
        letterSpacing: "0.04em",
      },
    },
    shape: { borderRadius: 14 },
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
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor:
              theme.palette.mode === "light"
                ? alpha(theme.palette.grey[500], 0.06)
                : alpha(theme.palette.common.white, 0.05),
          }),
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: ({ theme }) => ({
            "& > .MuiTableRow-root:nth-of-type(even)": {
              backgroundColor:
                theme.palette.mode === "light"
                  ? alpha(theme.palette.grey[500], 0.035)
                  : alpha(theme.palette.common.white, 0.025),
            },
          }),
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.divider,
            padding: theme.spacing(1.5, 2),
          }),
          head: ({ theme }) => ({
            fontWeight: 700,
            color: theme.palette.text.secondary,
            fontSize: "0.8125rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            borderBottom: `2px solid ${theme.palette.divider}`,
            backgroundColor: "inherit",
          }),
          body: ({ theme }) => ({
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: ({ theme }) => ({
            transition: "background-color 0.15s ease-in-out",
            "&:last-child td, &:last-child th": {
              border: 0,
            },
            "&.MuiTableRow-hover:hover": {
              backgroundColor: alpha(
                theme.palette.primary.main,
                theme.palette.mode === "light" ? 0.05 : 0.1,
              ),
            },
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            transition: "all 0.15s ease-in-out",
          },
          outlined: ({ theme }) => ({
            ...(theme.palette.mode === "dark" && {
              "&:hover": {
                borderColor: theme.palette.text.primary,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
              },
            }),
          }),
          contained: ({ theme }) => ({
            ...(theme.palette.mode === "dark" && {
              "&:hover": {
                filter: "brightness(1.15)",
              },
            }),
          }),
          text: ({ theme }) => ({
            ...(theme.palette.mode === "dark" && {
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.08)",
              },
            }),
          }),
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            transition: "all 0.15s ease-in-out",
            ...(theme.palette.mode === "dark" && {
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }),
          }),
        },
      },
    },
  });

  Object.assign(baseTheme.palette, {
    attendance: {
      button: {
        confirmed: {
          bg: mode === "dark" ? "#146b3a" : "#ffffff",
          text: mode === "dark" ? "#ffffff" : "#146b3a",
          border: "2px solid #146b3a",
          boxShadow: "0 3px 0 #0d4526",
          icon: mode === "dark" ? "#ffffff" : "#146b3a",
          hoverBg: mode === "dark" ? "#178246" : alpha("#ffffff", 0.9),
        },
        declined: {
          bg: mode === "dark" ? "#a8452a" : "#ffffff",
          text: mode === "dark" ? "#ffffff" : "#a8452a",
          border: "2px solid #a8452a",
          boxShadow: "0 3px 0 #5c2011",
          icon: mode === "dark" ? "#ffffff" : "#a8452a",
          hoverBg: mode === "dark" ? "#bd4f32" : alpha("#ffffff", 0.9),
        },
        dimmed: {
          bg: mode === "dark" ? "#2d3035" : "#eae6db",
          text: mode === "dark" ? "#9a958a" : "#6b675c",
          border:
            mode === "dark" ? "1.5px solid #3d424a" : "1.5px solid #ddd8cc",
          boxShadow: "none",
          icon: mode === "dark" ? "#9a958a" : "#6b675c",
          hoverBg: mode === "dark" ? "#383b42" : "#ddd8cc",
        },
        pending: {
          bg: mode === "dark" ? "#24262a" : "#f6f4ee",
          text: mode === "dark" ? "#f6f4ee" : "#17181a",
          border: mode === "dark" ? "2px solid #3d424a" : "2px solid #17181a",
          boxShadow: mode === "dark" ? "0 3px 0 #000000" : "0 3px 0 #17181a",
          icon: mode === "dark" ? "#f6f4ee" : "#17181a",
          hoverBg: mode === "dark" ? "#2d3035" : "#eae6db",
        },
      },
    },
  });

  return baseTheme;
};

export default getTheme("light");
