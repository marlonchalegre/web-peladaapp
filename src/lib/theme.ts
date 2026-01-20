import { createTheme, alpha } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    secondary: { main: "#9c27b0" },
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
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
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
  },
});

export default theme;
