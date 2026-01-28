import { StrictMode, Suspense } from "react";
import { CssBaseline } from "@mui/material";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "./lib/i18n";
import { Loading } from "./shared/components/Loading.tsx";
import { ThemeContextProvider } from "./app/providers/ThemeContext.tsx";

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
