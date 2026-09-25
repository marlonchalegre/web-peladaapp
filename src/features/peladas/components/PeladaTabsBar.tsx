import { Box, Typography, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

export type PeladaTabKey =
  | "attendance"
  | "teams"
  | "matches"
  | "voting"
  | "results";

export interface PeladaTabsBarProps {
  peladaId: string;
  dayStr?: string | number;
  monthStr?: string | number;
  dateStr?: string;
  active: PeladaTabKey;
  confirmedCount?: number;
  totalConfirmed?: number;
  isPeladaOpen?: boolean;
  status?: "open" | "closed" | string | null;
}

/**
 * 100% full-width white sub-navigation for Pelada pages matching redesign references (5a, 5b).
 * Renders full bleed at the top level on desktop, with centered inner tabs at maxWidth 1124px.
 */
export default function PeladaTabsBar({
  peladaId,
  dayStr,
  monthStr,
  dateStr,
  active,
  confirmedCount,
  totalConfirmed,
  isPeladaOpen,
  status,
}: PeladaTabsBarProps) {
  const { t } = useTranslation();
  const finalOpen =
    isPeladaOpen !== undefined
      ? isPeladaOpen
      : status
        ? status === "open"
        : true;
  const count = confirmedCount ?? totalConfirmed;
  const tabButtonSx = (key: PeladaTabKey) => {
    const isActive = active === key;
    return {
      py: 1.75,
      px: 2,
      borderBottom: isActive ? "3px solid" : "3px solid transparent",
      borderBottomColor: isActive ? "text.primary" : "transparent",
      mb: "-1.5px",
      fontFamily: "Archivo, sans-serif",
      fontWeight: isActive ? 800 : 700,
      fontSize: "11.5px",
      letterSpacing: ".04em",
      color: isActive ? "text.primary" : "text.secondary",
      textTransform: "uppercase" as const,
      borderRadius: 0,
      lineHeight: 1,
      bgcolor: "transparent",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
      "&:hover": {
        color: "text.primary",
        bgcolor: "transparent",
      },
    };
  };

  const formattedDate = dateStr
    ? `PELADA ${dateStr}`
    : dayStr && monthStr
      ? `PELADA ${dayStr}/${monthStr}`
      : "PELADA";

  return (
    <Box
      component="nav"
      aria-label={t("peladas.tabs.aria_label")}
      sx={{
        width: "100%",
        bgcolor: "background.paper",
        borderBottom: "1.5px solid",
        borderColor: "divider",
        px: { xs: 2, md: 4, lg: 5 },
        display: { xs: "none", md: "block" },
      }}
    >
      <Box
        sx={{
          maxWidth: 1124,
          mx: "auto",
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: "9px",
            letterSpacing: ".14em",
            color: "text.secondary",
            pr: 2.25,
            mr: 1,
            borderRight: "1.5px solid",
            borderColor: "divider",
            textTransform: "uppercase",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {formattedDate}
        </Typography>

        {/* 1. Lista de Presença */}
        <Button
          component={RouterLink}
          to={`/peladas/${peladaId}/attendance`}
          sx={tabButtonSx("attendance")}
        >
          {t("peladas.tabs.attendance")}
          {count !== undefined && count > 0 && (
            <Box
              component="span"
              sx={{
                color:
                  active === "attendance" ? "primary.main" : "secondary.main",
                ml: 0.75,
                fontWeight: 800,
              }}
            >
              {count}
            </Box>
          )}
        </Button>

        {/* 2. Times */}
        <Button
          component={RouterLink}
          to={`/peladas/${peladaId}`}
          sx={tabButtonSx("teams")}
        >
          {t("peladas.tabs.teams")}
        </Button>

        {/* 3. Partidas */}
        <Button
          component={RouterLink}
          to={
            finalOpen
              ? `/peladas/${peladaId}/build-schedule`
              : `/peladas/${peladaId}/matches`
          }
          sx={tabButtonSx("matches")}
        >
          {t("peladas.tabs.matches")}
        </Button>

        {/* 4. Votação */}
        <Button
          component={RouterLink}
          to={`/peladas/${peladaId}/voting`}
          sx={tabButtonSx("voting")}
        >
          {t("peladas.tabs.voting")}
        </Button>

        {/* 5. Súmula */}
        <Button
          component={RouterLink}
          to={`/peladas/${peladaId}/results`}
          sx={tabButtonSx("results")}
        >
          {t("peladas.tabs.results")}
        </Button>
      </Box>
    </Box>
  );
}
