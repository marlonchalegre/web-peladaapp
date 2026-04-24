import { StrictMode } from "react";
import { CssBaseline } from "@mui/material";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import "./lib/i18n";
import { ThemeContextProvider } from "./app/providers/ThemeProvider";

import { reportWebVitals } from "./lib/vitals";

// Initialize Web Vitals tracking
reportWebVitals();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeContextProvider>
      <CssBaseline />
      <App />
    </ThemeContextProvider>
  </StrictMode>,
);
