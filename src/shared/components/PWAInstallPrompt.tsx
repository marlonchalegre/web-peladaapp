import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  Snackbar,
  Button,
  IconButton,
  Alert,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import { useTranslation } from "react-i18next";
import { usePWA } from "../../app/providers/PWAContext";

export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const { showIOSInstructions, setShowIOSInstructions } = usePWA();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (r) {
        // Check for updates every hour
        setInterval(
          () => {
            r.update();
          },
          60 * 60 * 1000,
        );
      }
    },
    onRegisterError(error) {
      console.error("SW registration error", error);
    },
  });

  // Manual version check to ensure we're not running a stale version
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch("/version.json?t=" + Date.now(), {
          cache: "no-store",
        });
        if (!response.ok) return;

        const data = await response.json();
        const currentVersion = import.meta.env.VITE_APP_VERSION;

        if (
          currentVersion &&
          currentVersion !== "dev" &&
          data.version !== currentVersion
        ) {
          console.log("New version detected via version.json:", data.version);
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.update();
          }
        }
      } catch (err) {
        console.warn("Failed to check version.json", err);
      }
    };

    const checkServiceWorkerUpdate = async () => {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, 30 * 60 * 1000);

    // Check for updates when the user returns to the app tab
    window.addEventListener("focus", checkVersion);
    window.addEventListener("focus", checkServiceWorkerUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkVersion);
      window.removeEventListener("focus", checkServiceWorkerUpdate);
    };
  }, []);

  // Automatically reload the page when the service worker is updated and takes control
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const hasController = !!navigator.serviceWorker.controller;
      let refreshing = false;

      const handleControllerChange = () => {
        if (refreshing) return;
        if (hasController) {
          refreshing = true;
          console.log("Service worker updated. Reloading page...");
          window.location.reload();
        }
      };

      navigator.serviceWorker.addEventListener(
        "controllerchange",
        handleControllerChange,
      );
      return () => {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          handleControllerChange,
        );
      };
    }
  }, []);

  const handleClose = () => {
    setNeedRefresh(false);
    setShowIOSInstructions(false);
  };

  return (
    <>
      {/* Prompt for update */}
      <Snackbar
        open={needRefresh}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={() => setNeedRefresh(false)}
      >
        <Alert
          severity="info"
          action={
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                onClick={() => updateServiceWorker(true)}
              >
                {t("common.update")}
              </Button>
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleClose}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          {t("app.new_version_available")}
        </Alert>
      </Snackbar>

      {/* Prompt for manual install (iOS) - Only shown when user clicks "Install" in menu */}
      <Snackbar
        open={showIOSInstructions}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={handleClose}
      >
        <Alert
          severity="info"
          icon={<DownloadIcon />}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          <Typography variant="body2">{t("app.ios_install_prompt")}</Typography>
        </Alert>
      </Snackbar>
    </>
  );
}
