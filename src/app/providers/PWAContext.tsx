import { createContext, useContext } from "react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAContextType {
  isInstallable: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  installApp: () => Promise<void>;
  showIOSInstructions: boolean;
  setShowIOSInstructions: (show: boolean) => void;
}

export const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
};
