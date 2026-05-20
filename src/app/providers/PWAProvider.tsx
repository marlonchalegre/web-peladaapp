import React, { useState, useEffect, useCallback } from "react";
import {
  PWAContext,
  type BeforeInstallPromptEvent,
  type PWAContextType,
} from "./PWAContext";

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const installApp = useCallback(async () => {
    if (isIOS && !isStandalone) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
  }, [deferredPrompt, isIOS, isStandalone]);

  const value: PWAContextType = {
    isInstallable: !!deferredPrompt || (isIOS && !isStandalone),
    isIOS,
    isStandalone,
    installApp,
    showIOSInstructions,
    setShowIOSInstructions,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
};
