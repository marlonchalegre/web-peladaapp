import { useState, useEffect } from "react";
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

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered:", r);
    },
    onRegisterError(error) {
      console.error("SW registration error", error);
    },
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Update UI notify the user they can add to home screen
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleClose = () => {
    setShowInstallPrompt(false);
    setNeedRefresh(false);
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
            <Button
              color="inherit"
              size="small"
              onClick={() => updateServiceWorker(true)}
            >
              {t("common.update")}
            </Button>
          }
        >
          {t("app.new_version_available")}
        </Alert>
      </Snackbar>

      {/* Prompt for install */}
      <Snackbar
        open={showInstallPrompt}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          icon={<DownloadIcon />}
          action={
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button color="inherit" size="small" onClick={handleInstallClick}>
                {t("common.install")}
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
          <Typography variant="body2">{t("app.install_prompt")}</Typography>
        </Alert>
      </Snackbar>
    </>
  );
}
