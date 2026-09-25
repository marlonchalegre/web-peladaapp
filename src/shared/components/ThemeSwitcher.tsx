import { IconButton, Tooltip, type SxProps, type Theme } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../app/providers/ThemeContext";

interface ThemeSwitcherProps {
  sx?: SxProps<Theme>;
  iconSize?: number;
  "data-testid"?: string;
}

export function ThemeSwitcher({
  sx,
  iconSize = 16,
  "data-testid": dataTestId = "theme-switcher",
}: ThemeSwitcherProps) {
  const { mode, toggleTheme } = useAppTheme();
  const { t } = useTranslation();
  const isDark = mode === "dark";

  const title = isDark
    ? t("common.theme.light", "Modo Claro")
    : t("common.theme.dark", "Modo Escuro");

  return (
    <Tooltip title={title}>
      <IconButton
        onClick={toggleTheme}
        aria-label={title}
        data-testid={dataTestId}
        sx={{
          width: 32,
          height: 32,
          borderRadius: "10px",
          border: (theme) =>
            theme.palette.mode === "dark"
              ? "1.5px solid rgba(255,255,255,0.12)"
              : "1.5px solid #3a3b3e",
          color: (theme) =>
            theme.palette.mode === "dark" ? "text.secondary" : "#9a958a",
          p: 0,
          "&:hover": {
            color: "text.primary",
            borderColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.4)"
                : "text.secondary",
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.04)",
          },
          ...sx,
        }}
      >
        {isDark ? (
          <Brightness7Icon sx={{ fontSize: iconSize }} />
        ) : (
          <Brightness4Icon sx={{ fontSize: iconSize }} />
        )}
      </IconButton>
    </Tooltip>
  );
}

export default ThemeSwitcher;
