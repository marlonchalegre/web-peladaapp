import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

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
}: GroupTabsBarProps) {
  const navigate = useNavigate();

  const tabSx = (key: GroupTabKey) => ({
    py: 1.75,
    px: 1.9,
    borderBottom:
      active === key ? "3px solid #17181a" : "3px solid transparent",
    mb: "-1.5px",
    fontFamily: "Archivo, sans-serif",
    fontWeight: active === key ? 800 : 700,
    fontSize: "11.5px",
    letterSpacing: ".04em",
    color: active === key ? "#17181a" : "#6b675c",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    textTransform: "uppercase" as const,
    "&:hover": { color: "#17181a" },
  });

  const count = (value?: number) =>
    value && value > 0 ? (
      <Box component="span" sx={{ color: "#a8452a" }}>
        {value}
      </Box>
    ) : null;

  return (
    <Box
      component="nav"
      aria-label="Group sub-navigation"
      sx={{
        width: "100%",
        bgcolor: "#ffffff",
        borderBottom: "1.5px solid #eae6db",
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
            color: "#6b675c",
            pr: 2.2,
            mr: 0.75,
            borderRight: "1.5px solid #eae6db",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {orgName}
        </Typography>

        <Box
          onClick={() => navigate(`/organizations/${orgId}`)}
          sx={tabSx("agenda")}
        >
          AGENDA
        </Box>
        <Box
          onClick={() =>
            navigate(`/organizations/${orgId}/management?tab=members`)
          }
          sx={tabSx("roster")}
        >
          ELENCO {count(playersCount)}
        </Box>
        <Box
          onClick={() => navigate(`/organizations/${orgId}/statistics`)}
          sx={tabSx("statistics")}
        >
          ESTATÍSTICAS
        </Box>
        <Box
          onClick={() =>
            navigate(`/organizations/${orgId}/management?tab=finance`)
          }
          sx={tabSx("finance")}
        >
          FINANCEIRO {count(financePending)}
        </Box>
        <Box
          onClick={() =>
            navigate(`/organizations/${orgId}/management?tab=settings`)
          }
          sx={tabSx("settings")}
        >
          AJUSTES
        </Box>
      </Box>
    </Box>
  );
}
