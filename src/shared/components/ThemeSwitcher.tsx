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
          border: (theme) => `1.5px solid ${theme.palette.divider}`,
          color: "text.secondary",
          p: 0,
          "&:hover": {
            color: "text.primary",
            borderColor: "text.primary",
            bgcolor: "action.hover",
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
