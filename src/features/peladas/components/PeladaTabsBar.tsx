import { Box, Typography, Button } from "@mui/material";
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
      borderBottom: isActive ? "3px solid #17181a" : "3px solid transparent",
      mb: "-1.5px",
      fontFamily: "Archivo, sans-serif",
      fontWeight: isActive ? 800 : 700,
      fontSize: "11.5px",
      letterSpacing: ".04em",
      color: isActive ? "#17181a" : "#6b675c",
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
        color: "#17181a",
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
      aria-label="Pelada sub-navigation"
      sx={{
        width: "100%",
        bgcolor: "#ffffff",
        borderBottom: "1.5px solid #eae6db",
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
            color: "#6b675c",
            pr: 2.25,
            mr: 1,
            borderRight: "1.5px solid #eae6db",
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
          LISTA DE PRESENÇA
          {count !== undefined && count > 0 && (
            <Box
              component="span"
              sx={{
                color: active === "attendance" ? "#146b3a" : "#a8452a",
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
          TIMES
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
          PARTIDAS
        </Button>

        {/* 4. Votação */}
        <Button
          component={RouterLink}
          to={`/peladas/${peladaId}/voting`}
          sx={tabButtonSx("voting")}
        >
          VOTAÇÃO
        </Button>

        {/* 5. Súmula */}
        <Button
          component={RouterLink}
          to={`/peladas/${peladaId}/results`}
          sx={tabButtonSx("results")}
        >
          SÚMULA
        </Button>
      </Box>
    </Box>
  );
}
