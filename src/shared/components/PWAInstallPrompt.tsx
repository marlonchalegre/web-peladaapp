import { useState, useEffect, useRef } from "react";
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
import { getClientVersion, fetchVersionInfo } from "../../lib/version";
import {
  logAppVersionMismatch,
  logAppVersionUpdateAvailable,
  logAppVersionUpdateAccepted,
  logAppVersionUpdated,
} from "../../lib/analytics";

let hasLoggedVersion = false;
const FOCUS_CHECK_COOLDOWN_MS = 60_000;

export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const { showIOSInstructions, setShowIOSInstructions } = usePWA();
  const [serverVersion, setServerVersion] = useState<string>("unknown");
  const serverVersionRef = useRef<string>("unknown");
  const hasLoggedUpdateAvailableRef = useRef(false);
  const lastFocusCheckRef = useRef<number>(0);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (r) {
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

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const data = await fetchVersionInfo(true);
        if (!data) return;

        const currentVersion = getClientVersion();
        const serverVer = data.version || "unknown";
        serverVersionRef.current = serverVer;
        setServerVersion((prev) => (prev !== serverVer ? serverVer : prev));

        if (!hasLoggedVersion) {
          hasLoggedVersion = true;
          const asciiArt = `
  __  __ _       _            _____      _           _       
 |  \\/  (_)     | |          |  __ \\    | |         | |      
 | \\  / |_ _ __ | |__   __ _ | |__) |___| | __ _  __| | __ _ 
 | |\\/| | | '_ \\| '_ \\ / _\` ||  ___/ _ \\ |/ _\` |/ _\` |/ _\` |
 | |  | | | | | | | | | (_| || |  |  __/ | (_| | (_| | (_| |
 |_|  |_|_|_| |_|_| |_|\\__,_||_|   \\___|_|\\__,_|\\__,_|\\__,_|
`;
          const serverGitHash = data.gitHash || "unknown";
          const serverBuildTime = data.buildTime || "unknown";

          const hasController = !!navigator.serviceWorker?.controller;
          const controllerState =
            navigator.serviceWorker?.controller?.state || "none";
          const controllerScript =
            navigator.serviceWorker?.controller?.scriptURL || "none";

          let cacheKeys: string[] = [];
          try {
            if ("caches" in window) {
              cacheKeys = await caches.keys();
            }
          } catch {
            // ignore cache access issues
          }

          const isOnline = navigator.onLine;

          console.log(
            `%c${asciiArt}\n%c⚽ Minha Pelada ⚽\n` +
              `%c[App Status]\n` +
              `• Client Version:  ${currentVersion}\n` +
              `• Server Version:  ${serverVer} (Build: ${serverBuildTime}, Hash: ${serverGitHash})\n` +
              `• Network Status:  ${isOnline ? "🟢 Online" : "🔴 Offline"}\n\n` +
              `%c[Service Worker & Cache]\n` +
              `• Controlled:      ${hasController ? `🟢 Yes (${controllerState})` : "🔴 No"}\n` +
              `• Controller URL:  ${controllerScript}\n` +
              `• Active Caches:   [${cacheKeys.join(", ") || "none"}]`,
            "color: #4caf50; font-weight: bold;",
            "color: #2196f3; font-weight: bold; font-size: 14px;",
            "color: #ff9800; font-weight: bold; font-size: 12px;",
            "color: #00bcd4; font-weight: bold; font-size: 12px;",
          );
        }

        const isLocalhost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        const hasVersionMismatch =
          currentVersion &&
          currentVersion !== "dev" &&
          data.version !== currentVersion;

        const isStuckOnProdDev =
          !isLocalhost && currentVersion === "dev" && data.version !== "dev";

        const lastLocalVersion = localStorage.getItem("pwa_app_version");
        const hasLocalMismatch =
          !isLocalhost &&
          lastLocalVersion &&
          lastLocalVersion !== currentVersion;

        const performCleanupAndReload = async (reason: string) => {
          console.log(
            `Clearing service worker and caches due to: ${reason}. client=${currentVersion}, server=${data.version}`,
          );

          const cleanupTasks: Promise<unknown>[] = [];

          if ("serviceWorker" in navigator) {
            cleanupTasks.push(
              navigator.serviceWorker
                .getRegistrations()
                .then((registrations) =>
                  Promise.all(registrations.map((r) => r.unregister())),
                )
                .catch((err) =>
                  console.warn("Failed to unregister service worker:", err),
                ),
            );
          }

          if ("caches" in window) {
            cleanupTasks.push(
              caches
                .keys()
                .then((cacheNames) =>
                  Promise.all(cacheNames.map((name) => caches.delete(name))),
                )
                .catch((err) => console.warn("Failed to clear caches:", err)),
            );
          }

          await Promise.all(cleanupTasks);

          localStorage.setItem("pwa_app_version", currentVersion);
          console.log("Cleanup complete. Reloading page...");
          window.location.reload();
        };

        if (hasVersionMismatch || isStuckOnProdDev || hasLocalMismatch) {
          let reason = "Version Mismatch";
          if (isStuckOnProdDev) reason = "Stuck on Prod Dev Build";
          if (hasLocalMismatch)
            reason = `Local Storage Version Mismatch (local=${lastLocalVersion})`;
          logAppVersionMismatch({
            currentVersion,
            serverVersion: serverVer,
            reason,
          });
          await performCleanupAndReload(reason);
        } else if (lastLocalVersion !== currentVersion) {
          localStorage.setItem("pwa_app_version", currentVersion);
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
    lastFocusCheckRef.current = Date.now();
    const interval = setInterval(checkVersion, 30 * 60 * 1000);

    const onFocusThrottled = () => {
      const now = Date.now();
      if (now - lastFocusCheckRef.current >= FOCUS_CHECK_COOLDOWN_MS) {
        lastFocusCheckRef.current = now;
        checkVersion();
        checkServiceWorkerUpdate();
      }
    };

    window.addEventListener("focus", onFocusThrottled);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocusThrottled);
    };
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      let refreshing = false;

      const handleControllerChange = () => {
        if (refreshing) return;
        if (navigator.serviceWorker.controller) {
          refreshing = true;
          const activeServerVersion = serverVersionRef.current;
          logAppVersionUpdated(
            activeServerVersion !== "unknown"
              ? activeServerVersion
              : getClientVersion(),
          );
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

  useEffect(() => {
    if (
      needRefresh &&
      !hasLoggedUpdateAvailableRef.current &&
      serverVersion !== "unknown"
    ) {
      hasLoggedUpdateAvailableRef.current = true;
      logAppVersionUpdateAvailable({
        currentVersion: getClientVersion(),
        newVersion: serverVersion,
      });
    }
  }, [needRefresh, serverVersion]);

  const handleClose = () => {
    setNeedRefresh(false);
    setShowIOSInstructions(false);
  };

  return (
    <>
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
                onClick={() => {
                  logAppVersionUpdateAccepted({
                    currentVersion: getClientVersion(),
                    newVersion:
                      serverVersionRef.current !== "unknown"
                        ? serverVersionRef.current
                        : serverVersion,
                  });
                  updateServiceWorker(true);
                }}
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
