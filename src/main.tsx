import { StrictMode, Suspense } from "react";
import { CssBaseline } from "@mui/material";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import "./lib/i18n";
import { Loading } from "./shared/components/Loading";
import { ThemeContextProvider } from "./app/providers/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeContextProvider>
      <CssBaseline />
      <Suspense fallback={<Loading fullScreen />}>
        <App />
      </Suspense>
    </ThemeContextProvider>
  </StrictMode>,
);
