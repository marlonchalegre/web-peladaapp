import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export type GroupTabKey =
  | "agenda"
  | "roster"
  | "statistics"
  | "finance"
  | "settings";

interface GroupTabsBarProps {
  orgId: string;
  orgName: string;
  active: GroupTabKey;
  playersCount?: number;
  financePending?: number;
  isAdmin?: boolean;
  /**
   * When true (default) the strip uses negative margins to reach the viewport
   * edges, for pages whose container is full-width on desktop.
   */
  bleed?: boolean;
}

/**
 * Full-bleed white sub-navigation matching the redesign reference (4b).
 * It is meant to be rendered as a direct child of a full-width page container
 * so the white strip reaches both edges of the viewport.
 */
export default function GroupTabsBar({
  orgId,
  orgName,
  active,
  playersCount,
  financePending,
  isAdmin = false,
}: GroupTabsBarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tabSx = (key: GroupTabKey) => ({
    background: "none",
    border: "none",
    py: 1.75,
    px: 1.9,
    borderBottom: active === key ? "3px solid" : "3px solid transparent",
    borderBottomColor: active === key ? "text.primary" : "transparent",
    mb: "-1.5px",
    fontFamily: "Archivo, sans-serif",
    fontWeight: active === key ? 800 : 700,
    fontSize: "11.5px",
    letterSpacing: ".04em",
    color: active === key ? "text.primary" : "text.secondary",
    cursor: "pointer",
    outline: "none",
    whiteSpace: "nowrap" as const,
    textTransform: "uppercase" as const,
    "&:hover": { color: "text.primary" },
    "&:focus-visible": {
      color: "text.primary",
      outline: "2px solid",
      outlineColor: "primary.main",
      outlineOffset: "2px",
    },
  });

  const count = (value?: number) =>
    value && value > 0 ? (
      <Box component="span" sx={{ color: "secondary.main" }}>
        {value}
      </Box>
    ) : null;

  return (
    <Box
      component="nav"
      aria-label="Group sub-navigation"
      sx={{
        width: "100%",
        bgcolor: "background.paper",
        borderBottom: "1.5px solid",
        borderColor: "divider",
        px: { xs: 2, md: 4, lg: 5 },
        mb: 3,
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
            pr: 2.2,
            mr: 0.75,
            borderRight: "1.5px solid",
            borderColor: "divider",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {orgName}
        </Typography>

        <Box
          component="button"
          type="button"
          onClick={() => navigate(`/organizations/${orgId}`)}
          sx={tabSx("agenda")}
        >
          {t("organizations.tabs.agenda", "AGENDA")}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() =>
            navigate(`/organizations/${orgId}/management?tab=members`)
          }
          sx={tabSx("roster")}
        >
          {t("organizations.tabs.roster", "ELENCO")} {count(playersCount)}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => navigate(`/organizations/${orgId}/statistics`)}
          sx={tabSx("statistics")}
        >
          {t("organizations.tabs.statistics", "ESTATÍSTICAS")}
        </Box>
        {isAdmin && (
          <Box
            component="button"
            type="button"
            onClick={() =>
              navigate(`/organizations/${orgId}/management?tab=finance`)
            }
            sx={tabSx("finance")}
          >
            {t("organizations.tabs.finance", "FINANCEIRO")}{" "}
            {count(financePending)}
          </Box>
        )}
        {isAdmin && (
          <Box
            component="button"
            type="button"
            onClick={() =>
              navigate(`/organizations/${orgId}/management?tab=settings`)
            }
            sx={tabSx("settings")}
          >
            {t("organizations.tabs.settings", "AJUSTES")}
          </Box>
        )}
      </Box>
    </Box>
  );
}
