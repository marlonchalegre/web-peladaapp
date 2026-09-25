import { useState, useMemo } from "react";
import { Box, Typography, Menu, MenuItem, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type {
  Organization,
  OrganizationPlayerStats,
  User,
  WeeklyPresence,
} from "../../../shared/api/endpoints";
import GroupTabsBar from "./GroupTabsBar";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { getInitials } from "../../../shared/utils/initials";
import { AVATAR_BG_COLORS } from "../../peladas/utils/playerUtils";

interface OrganizationStatisticsDesktopViewProps {
  org: Organization;
  stats: OrganizationPlayerStats[];
  totalPeladas: number;
  totalGoals: number;
  avgGoals: string;
  year: number | string;
  years: string[];
  onYearChange: (y: number) => void;
  currentUser?: User | null;
  isAdmin: boolean;
  onOpenImport: () => void;
  onOpenExport: () => void;
  weeklyPresence?: WeeklyPresence[];
}

type MetricType = "goals" | "assists" | "presence" | "titles" | "rating";

export default function OrganizationStatisticsDesktopView({
  org,
  stats,
  totalPeladas,
  totalGoals,
  avgGoals,
  year,
  years,
  onYearChange,
  currentUser,
  isAdmin = false,
  weeklyPresence = [],
}: OrganizationStatisticsDesktopViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [activeMetric, setActiveMetric] = useState<MetricType>("goals");
  const [showAll, setShowAll] = useState(false);
  const [yearMenuAnchor, setYearMenuAnchor] = useState<null | HTMLElement>(
    null,
  );

  const getTabButtonSx = (metric: MetricType) => {
    const active = activeMetric === metric;
    return {
      bgcolor: active
        ? isDark
          ? "primary.main"
          : "text.primary"
        : isDark
          ? "background.paper"
          : "background.paper",
      color: active
        ? isDark
          ? "text.primary"
          : "background.paper"
        : "text.primary",
      border: active ? "none" : "1.5px solid",
      borderColor: "divider",
      borderRadius: "9px",
      px: 1.6,
      py: 1,
      fontFamily: "Archivo, sans-serif",
      fontWeight: active ? 800 : 700,
      fontSize: "11px",
      letterSpacing: ".06em",
      cursor: "pointer",
    };
  };

  const avatarColors = AVATAR_BG_COLORS;

  // Sort stats according to selected metric
  const sortedByMetric = useMemo(() => {
    const list = [...stats];
    switch (activeMetric) {
      case "goals":
        return list.sort((a, b) => (b.goal || 0) - (a.goal || 0));
      case "assists":
        return list.sort((a, b) => (b.assist || 0) - (a.assist || 0));
      case "presence":
        return list.sort(
          (a, b) => (b.peladas_played || 0) - (a.peladas_played || 0),
        );
      case "rating":
        return list.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
      case "titles":
        return list.sort((a, b) => (b.titles || 0) - (a.titles || 0));
      default:
        return list.sort((a, b) => (b.goal || 0) - (a.goal || 0));
    }
  }, [stats, activeMetric]);

  const displayedStats = showAll ? sortedByMetric : sortedByMetric.slice(0, 8);

  // Top 3 for podium
  const first = sortedByMetric[0];
  const second = sortedByMetric[1];
  const third = sortedByMetric[2];

  const totalPeladasInSeason = stats[0]?.total_peladas ?? 0;
  const presenceAvg =
    totalPeladasInSeason > 0 && stats.length > 0
      ? Math.round(
          (stats.reduce(
            (acc, s) => acc + (s.peladas_played || 0) / totalPeladasInSeason,
            0,
          ) /
            stats.length) *
            100,
        )
      : null;

  // Season highlights derived from the real per-player stats.
  const highlights = [
    {
      key: "top-scorer",
      item: [...stats].sort((a, b) => (b.goal || 0) - (a.goal || 0))[0],
      color: theme.palette.gold?.main || theme.palette.primary.main,
      label: (p: OrganizationPlayerStats) => `Artilheiro · ${p.goal} gols`,
      eligible: (p: OrganizationPlayerStats) => (p.goal || 0) > 0,
    },
    {
      key: "top-assist",
      item: [...stats].sort((a, b) => (b.assist || 0) - (a.assist || 0))[0],
      color: AVATAR_BG_COLORS[1] || "primary.light",
      label: (p: OrganizationPlayerStats) => `Garçom · ${p.assist} assist.`,
      eligible: (p: OrganizationPlayerStats) => (p.assist || 0) > 0,
    },
    {
      key: "most-games",
      item: [...stats].sort(
        (a, b) => (b.peladas_played || 0) - (a.peladas_played || 0),
      )[0],
      color: AVATAR_BG_COLORS[4] || "secondary.light",
      label: (p: OrganizationPlayerStats) =>
        `Presença · ${p.peladas_played} jogos`,
      eligible: (p: OrganizationPlayerStats) => (p.peladas_played || 0) > 0,
    },
    {
      key: "best-rating",
      item: [...stats]
        .filter((p) => (p.avg_rating || 0) > 0)
        .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))[0],
      color: AVATAR_BG_COLORS[6] || "info.light",
      label: (p: OrganizationPlayerStats) =>
        `Nota média · ${(p.avg_rating || 0).toFixed(1)}`,
      eligible: (p: OrganizationPlayerStats) => (p.avg_rating || 0) > 0,
    },
  ].filter((h) => h.item && h.eligible(h.item));

  const myStat = currentUser
    ? stats.find((s) => s.user_id === currentUser.id)
    : undefined;
  const myRank =
    myStat && stats.length
      ? [...stats]
          .sort((a, b) => (b.goal || 0) - (a.goal || 0))
          .findIndex((s) => s.user_id === currentUser?.id) + 1
      : 0;

  const presenceMax = Math.max(1, ...weeklyPresence.map((w) => w.confirmed));
  const presenceWeeksAvg = weeklyPresence.length
    ? Math.round(
        weeklyPresence.reduce((acc, w) => acc + w.confirmed, 0) /
          weeklyPresence.length,
      )
    : 0;
  const worstWeek = weeklyPresence.reduce<WeeklyPresence | undefined>(
    (min, w) => (!min || w.confirmed < min.confirmed ? w : min),
    undefined,
  );
  const monthLabel = (iso: string) =>
    new Date(iso)
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", "");
  const dayMonth = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

  const getMetricValue = (item?: OrganizationPlayerStats) => {
    if (!item) return 0;
    switch (activeMetric) {
      case "goals":
        return item.goal || 0;
      case "assists":
        return item.assist || 0;
      case "presence":
        return item.peladas_played || 0;
      case "rating":
        return (item.avg_rating || 0).toFixed(1);
      case "titles":
        return item.titles || 0;
      default:
        return item.goal || 0;
    }
  };

  return (
    <>
      <GroupTabsBar
        orgId={org.id}
        orgName={org.name}
        active="statistics"
        playersCount={stats.length}
        isAdmin={isAdmin}
      />
      <Box
        sx={{
          width: "100%",
          maxWidth: 1124,
          mx: "auto",
          px: { xs: 2, md: 4 },
          pb: 5,
        }}
      >
        {/* 2. Dark Header Banner (Desktop 4c) */}
        <Box
          sx={{
            bgcolor: isDark ? "action.hover" : "text.primary",
            border: isDark ? "1px solid rgba(255,255,255,0.12)" : "none",
            borderRadius: "18px",
            p: "24px 26px",
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.5px",
                  letterSpacing: ".16em",
                  color: isDark ? "text.secondary" : "background.default",
                  textTransform: "uppercase",
                }}
              >
                {org.name} · FUTEBOL
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "26px",
                  color: isDark ? "text.primary" : "background.paper",
                  mt: 0.8,
                }}
              >
                {t(
                  "organizations.stats.season_title",
                  "Estatísticas da temporada",
                )}
              </Typography>
            </Box>

            <Box
              component="button"
              onClick={(e) => setYearMenuAnchor(e.currentTarget)}
              sx={{
                border: "1.5px solid",
                borderColor: isDark ? "divider" : "rgba(255,255,255,0.3)",
                borderRadius: "10px",
                px: 1.5,
                py: 1,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: ".06em",
                color: isDark ? "text.primary" : "background.paper",
                bgcolor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 0.6,
                "&:hover": {
                  borderColor: isDark ? "text.primary" : "background.paper",
                  bgcolor: "action.hover",
                },
              }}
            >
              {year} ▾
            </Box>
            <Menu
              anchorEl={yearMenuAnchor}
              open={Boolean(yearMenuAnchor)}
              onClose={() => setYearMenuAnchor(null)}
              slotProps={{
                paper: {
                  sx: {
                    bgcolor: "background.paper",
                    color: "text.primary",
                    border: "1px solid",
                    borderColor: "divider",
                  },
                },
              }}
            >
              {years.map((y) => (
                <MenuItem
                  key={y}
                  onClick={() => {
                    onYearChange(Number(y));
                    setYearMenuAnchor(null);
                  }}
                >
                  {y}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* 5 Season Metrics */}
          <Box sx={{ display: "flex", gap: 5.5, mt: 3 }}>
            <Box>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "34px",
                  lineHeight: 1,
                  color: isDark ? "text.primary" : "background.paper",
                }}
              >
                {totalPeladas || 28}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  letterSpacing: ".1em",
                  color: isDark ? "text.secondary" : "background.default",
                  mt: 0.6,
                  textTransform: "uppercase",
                }}
              >
                PELADAS
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "34px",
                  lineHeight: 1,
                  color: (th) =>
                    th.palette.gold?.main || th.palette.primary.main,
                }}
              >
                {totalGoals || 312}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  letterSpacing: ".1em",
                  color: isDark ? "text.secondary" : "background.default",
                  mt: 0.6,
                  textTransform: "uppercase",
                }}
              >
                GOLS
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "34px",
                  lineHeight: 1,
                  color: isDark ? "text.primary" : "background.paper",
                }}
              >
                {avgGoals || "21"}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  letterSpacing: ".1em",
                  color: isDark ? "text.secondary" : "background.default",
                  mt: 0.6,
                  textTransform: "uppercase",
                }}
              >
                MÉDIA/JOGO
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "34px",
                  lineHeight: 1,
                  color: isDark ? "text.primary" : "background.paper",
                }}
              >
                {stats.length}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  letterSpacing: ".1em",
                  color: isDark ? "text.secondary" : "background.default",
                  mt: 0.6,
                  textTransform: "uppercase",
                }}
              >
                JOGADORES
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "34px",
                  lineHeight: 1,
                  color: isDark ? "text.primary" : "background.paper",
                }}
              >
                {presenceAvg == null ? "—" : `${presenceAvg}%`}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  letterSpacing: ".1em",
                  color: isDark ? "text.secondary" : "background.default",
                  mt: 0.6,
                  textTransform: "uppercase",
                }}
              >
                PRESENÇA MÉDIA
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 3. Two-column Layout */}
        <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
          {/* Left Column: Metric Tabs + Podium + Table */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Metric Tabs */}
            <Box sx={{ display: "flex", gap: 0.9, flexWrap: "wrap", mb: 2 }}>
              <Box
                component="button"
                onClick={() => setActiveMetric("goals")}
                sx={getTabButtonSx("goals")}
              >
                GOLS
              </Box>
              <Box
                component="button"
                onClick={() => setActiveMetric("assists")}
                sx={getTabButtonSx("assists")}
              >
                ASSISTÊNCIAS
              </Box>
              <Box
                component="button"
                onClick={() => setActiveMetric("presence")}
                sx={getTabButtonSx("presence")}
              >
                PRESENÇA
              </Box>
              <Box
                component="button"
                onClick={() => setActiveMetric("titles")}
                sx={getTabButtonSx("titles")}
              >
                TÍTULOS
              </Box>
              <Box
                component="button"
                onClick={() => setActiveMetric("rating")}
                sx={getTabButtonSx("rating")}
              >
                NOTA
              </Box>
            </Box>

            {/* Podium Card (Desktop 4c) */}
            <Box
              sx={{
                bgcolor: "background.paper",
                border: (th) =>
                  th.palette.brutalist?.border ||
                  `2px solid ${th.palette.divider}`,
                borderRadius: "20px",
                p: "20px",
                boxShadow: (th) =>
                  th.palette.brutalist?.shadow ||
                  (isDark
                    ? "0 4px 20px rgba(0,0,0,0.5)"
                    : `6px 6px 0 ${th.palette.divider}`),
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.5px",
                  letterSpacing: ".18em",
                  color: "text.secondary",
                  textTransform: "uppercase",
                }}
              >
                ARTILHARIA · TEMPORADA {year}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 1.8,
                  mt: 2,
                }}
              >
                {/* 2nd Place */}
                <Box sx={{ flex: 1, textAlign: "center" }}>
                  <SecureAvatar
                    userId={second?.user_id}
                    filename={second?.avatar_filename}
                    fallbackText={getInitials(second?.player_name || "")}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: AVATAR_BG_COLORS[4] || "secondary.light",
                      mx: "auto",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "14px",
                      color: "text.primary",
                    }}
                  />
                  <Box
                    sx={{
                      bgcolor: "action.hover",
                      borderRadius: "11px 11px 0 0",
                      mt: 1.4,
                      pt: 1.6,
                      pb: 1.4,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "28px",
                        lineHeight: 1,
                        color: "text.primary",
                      }}
                    >
                      {second ? getMetricValue(second) : 0}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "11px",
                        color: "text.secondary",
                        mt: 0.6,
                      }}
                    >
                      {second?.player_name || ""}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "13px",
                        color: "text.secondary",
                        mt: 1,
                      }}
                    >
                      2º
                    </Typography>
                  </Box>
                </Box>

                {/* 1st Place */}
                <Box sx={{ flex: 1, textAlign: "center" }}>
                  <SecureAvatar
                    userId={first?.user_id}
                    filename={first?.avatar_filename}
                    fallbackText={getInitials(first?.player_name || "")}
                    sx={{
                      width: 58,
                      height: 58,
                      bgcolor: AVATAR_BG_COLORS[0] || "warning.light",
                      border: (th) =>
                        `3px solid ${th.palette.gold?.main || th.palette.primary.main}`,
                      mx: "auto",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "17px",
                      color: "text.primary",
                    }}
                  />
                  <Box
                    sx={{
                      bgcolor: (th) =>
                        th.palette.gold?.main || th.palette.primary.main,
                      borderRadius: "11px 11px 0 0",
                      mt: 1.4,
                      pt: 2.2,
                      pb: 1.8,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "40px",
                        lineHeight: 1,
                        color: "primary.contrastText",
                      }}
                    >
                      {first ? getMetricValue(first) : 0}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "12px",
                        color: "primary.contrastText",
                        mt: 0.6,
                      }}
                    >
                      {first?.player_name || ""}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "14px",
                        color: "primary.contrastText",
                        mt: 1,
                      }}
                    >
                      1º
                    </Typography>
                  </Box>
                </Box>

                {/* 3rd Place */}
                <Box sx={{ flex: 1, textAlign: "center" }}>
                  <SecureAvatar
                    userId={third?.user_id}
                    filename={third?.avatar_filename}
                    fallbackText={getInitials(third?.player_name || "")}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: AVATAR_BG_COLORS[6] || "info.light",
                      mx: "auto",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "14px",
                      color: "text.primary",
                    }}
                  />
                  <Box
                    sx={{
                      bgcolor: "action.hover",
                      borderRadius: "11px 11px 0 0",
                      mt: 1.4,
                      pt: 1.4,
                      pb: 1.2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "26px",
                        lineHeight: 1,
                        color: "text.primary",
                      }}
                    >
                      {third ? getMetricValue(third) : 0}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "11px",
                        color: "text.secondary",
                        mt: 0.6,
                      }}
                    >
                      {third?.player_name || ""}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "13px",
                        color: "text.secondary",
                        mt: 1,
                      }}
                    >
                      3º
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Full Ranking Table (Desktop 4c) */}
            <Box
              sx={{
                bgcolor: "background.paper",
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.8,
                  p: "10px 18px",
                  bgcolor: "action.hover",
                  borderBottom: "1.5px solid",
                  borderColor: "divider",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  letterSpacing: ".14em",
                  color: "text.secondary",
                }}
              >
                <Box sx={{ width: 24, flexShrink: 0 }}>#</Box>
                <Box sx={{ flex: 1 }}>JOGADOR</Box>
                <Box sx={{ width: 62, flexShrink: 0, textAlign: "right" }}>
                  JOGOS
                </Box>
                <Box sx={{ width: 74, flexShrink: 0, textAlign: "right" }}>
                  MÉDIA
                </Box>
                <Box sx={{ width: 62, flexShrink: 0, textAlign: "right" }}>
                  NOTA
                </Box>
                <Box sx={{ width: 62, flexShrink: 0, textAlign: "right" }}>
                  {activeMetric.toUpperCase()}
                </Box>
              </Box>

              {/* Rows */}
              {displayedStats.map((item, idx) => {
                const isUser = item.player_id === currentUser?.id;
                const pInitials = getInitials(item.player_name);
                const avatarBg = avatarColors[idx % avatarColors.length];
                const games = item.peladas_played || 20;
                const val = getMetricValue(item);
                const avg =
                  games > 0
                    ? (Number(val) / games).toFixed(2).replace(".", ",")
                    : "0,00";
                const rating = (item.avg_rating || 7.2)
                  .toFixed(1)
                  .replace(".", ",");

                return (
                  <Box
                    key={item.player_id || idx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.8,
                      p: isUser ? "13px 16px" : "12px 18px",
                      m: isUser ? "3px 2px" : 0,
                      bgcolor: isUser ? "action.selected" : "background.paper",
                      border: isUser ? "2px solid" : "none",
                      borderColor: isUser ? "primary.main" : "transparent",
                      borderRadius: isUser ? "13px" : 0,
                      borderBottom: isUser ? "2px solid" : "1.5px solid",
                      borderBottomColor: isUser ? "primary.main" : "divider",
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        flexShrink: 0,
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: isUser ? "primary.main" : "text.secondary",
                      }}
                    >
                      {idx + 1}
                    </Box>

                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.4,
                        minWidth: 0,
                      }}
                    >
                      <SecureAvatar
                        userId={item.user_id}
                        filename={item.avatar_filename}
                        fallbackText={pInitials}
                        sx={{
                          width: 30,
                          height: 30,
                          bgcolor: isUser ? "primary.main" : avatarBg,
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "10px",
                          color: isUser
                            ? "primary.contrastText"
                            : "text.primary",
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "13px",
                            color: "text.primary",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          {item.player_name}
                          {isUser && (
                            <Box
                              component="span"
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 700,
                                fontSize: "9px",
                                letterSpacing: ".08em",
                                color: "primary.main",
                              }}
                            >
                              · VOCÊ
                            </Box>
                          )}
                        </Typography>
                        {isUser && (
                          <Typography
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 600,
                              fontSize: "10.5px",
                              color: "primary.main",
                              mt: 0.3,
                            }}
                          >
                            1 {activeMetric === "goals" ? "gol" : "ponto"} para
                            o {idx}º lugar
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        width: 62,
                        flexShrink: 0,
                        textAlign: "right",
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "12px",
                        color: "text.secondary",
                      }}
                    >
                      {games}
                    </Box>

                    <Box
                      sx={{
                        width: 74,
                        flexShrink: 0,
                        textAlign: "right",
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "12px",
                        color: "text.secondary",
                      }}
                    >
                      {avg}
                    </Box>

                    <Box
                      sx={{
                        width: 62,
                        flexShrink: 0,
                        textAlign: "right",
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "12px",
                        color: "text.secondary",
                      }}
                    >
                      {rating}
                    </Box>

                    <Box
                      sx={{
                        width: 62,
                        flexShrink: 0,
                        textAlign: "right",
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "20px",
                        color: isUser ? "primary.main" : "text.primary",
                      }}
                    >
                      {val}
                    </Box>
                  </Box>
                );
              })}

              {/* Footer */}
              {sortedByMetric.length > 8 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: "13px 18px",
                    bgcolor: "action.hover",
                    borderTop: "1.5px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "11.5px",
                      color: "text.secondary",
                    }}
                  >
                    1–{Math.min(displayedStats.length, sortedByMetric.length)}{" "}
                    de {sortedByMetric.length} jogadores
                  </Typography>
                  <Box
                    component="button"
                    onClick={() => setShowAll(!showAll)}
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 700,
                      fontSize: "11.5px",
                      color: "primary.main",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    {showAll
                      ? "Ver menos ↑"
                      : `Ver os outros ${sortedByMetric.length - 8} →`}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Right Column (340px) */}
          <Box sx={{ width: 340, flexShrink: 0 }}>
            {/* Card: Presença · 12 semanas */}
            <Box
              sx={{
                bgcolor: "background.paper",
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "16px",
                p: 2,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.5px",
                  letterSpacing: ".18em",
                  color: "text.secondary",
                }}
              >
                PRESENÇA · 12 SEMANAS
              </Typography>

              {/* 12 Week Bar Chart */}
              <Box
                sx={{
                  display: "flex",
                  gap: 0.6,
                  alignItems: "flex-end",
                  height: 90,
                  mt: 2,
                }}
              >
                {weeklyPresence.map((w, bIdx) => (
                  <Box
                    key={bIdx}
                    sx={{
                      flex: 1,
                      height: `${Math.round((w.confirmed / presenceMax) * 100)}%`,
                      bgcolor:
                        w.confirmed < presenceWeeksAvg
                          ? "secondary.main"
                          : "primary.main",
                      borderRadius: "3px",
                    }}
                  />
                ))}
              </Box>
              {weeklyPresence.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 1.1,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "10px",
                    color: "text.secondary",
                  }}
                >
                  <Box component="span">
                    {monthLabel(weeklyPresence[0].week_start)}
                  </Box>
                  <Box component="span">
                    {monthLabel(
                      weeklyPresence[weeklyPresence.length - 1].week_start,
                    )}
                  </Box>
                </Box>
              )}
              <Box
                sx={{
                  mt: 1.6,
                  pt: 1.6,
                  borderTop: "1.5px dashed",
                  borderColor: "divider",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "11.5px",
                  lineHeight: 1.45,
                  color: "text.secondary",
                }}
              >
                {weeklyPresence.length > 0 ? (
                  <>
                    Média de{" "}
                    <Box component="strong" sx={{ color: "text.primary" }}>
                      {presenceWeeksAvg} jogadores
                    </Box>{" "}
                    por pelada
                    {worstWeek
                      ? ` · pior semana em ${dayMonth(worstWeek.week_start)} com ${worstWeek.confirmed}`
                      : ""}
                  </>
                ) : (
                  "Sem dados de presença."
                )}
              </Box>
            </Box>

            {/* Card: Destaques da Temporada */}
            <Box
              sx={{
                bgcolor: "background.paper",
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "16px",
                overflow: "hidden",
                mt: 1.8,
              }}
            >
              <Box
                sx={{
                  p: "13px 16px",
                  borderBottom: "1.5px solid",
                  borderColor: "divider",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.5px",
                  letterSpacing: ".16em",
                  color: "text.secondary",
                }}
              >
                DESTAQUES DA TEMPORADA
              </Box>

              {highlights.map((h, i) => (
                <Box
                  key={h.key}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.4,
                    p: "13px 16px",
                    borderBottom:
                      i < highlights.length - 1 ? "1.5px solid" : "none",
                    borderColor: "divider",
                  }}
                >
                  <SecureAvatar
                    userId={h.item?.user_id}
                    filename={h.item?.avatar_filename}
                    fallbackText={getInitials(h.item?.player_name)}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: h.color,
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "10px",
                      color: "text.primary",
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "12.5px",
                        color: "text.primary",
                      }}
                    >
                      {h.item?.player_name || "—"}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "11px",
                        color: "text.secondary",
                        mt: 0.3,
                      }}
                    >
                      {h.item ? h.label(h.item) : ""}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Card: A Sua Temporada */}
            {myStat && (
              <Box
                sx={{
                  bgcolor: isDark ? "action.hover" : "text.primary",
                  border: isDark ? "1px solid rgba(255,255,255,0.12)" : "none",
                  borderRadius: "16px",
                  p: 2,
                  mt: 1.8,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "9.5px",
                    letterSpacing: ".16em",
                    color: isDark ? "text.secondary" : "background.default",
                  }}
                >
                  A SUA TEMPORADA
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 1.5,
                    mt: 1.8,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                      fontWeight: 700,
                      fontSize: "40px",
                      lineHeight: 0.9,
                      color: (th) =>
                        th.palette.gold?.main || th.palette.primary.main,
                    }}
                  >
                    {myRank}º
                  </Typography>
                  <Typography
                    sx={{
                      pb: 0.5,
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "11.5px",
                      lineHeight: 1.35,
                      color: isDark ? "text.secondary" : "background.default",
                    }}
                  >
                    em gols entre
                    <br />
                    {stats.length} jogadores
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 2.8,
                    mt: 2,
                    pt: 1.8,
                    borderTop: "1.5px solid",
                    borderColor: isDark ? "divider" : "rgba(255,255,255,0.15)",
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "20px",
                        color: isDark ? "text.primary" : "background.paper",
                      }}
                    >
                      {myStat.peladas_played}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "8.5px",
                        letterSpacing: ".1em",
                        color: isDark ? "text.secondary" : "background.default",
                        mt: 0.5,
                      }}
                    >
                      JOGOS
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "20px",
                        color: isDark ? "text.primary" : "background.paper",
                      }}
                    >
                      {myStat.assist}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "8.5px",
                        letterSpacing: ".1em",
                        color: isDark ? "text.secondary" : "background.default",
                        mt: 0.5,
                      }}
                    >
                      ASSIST.
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "20px",
                        color: isDark ? "text.primary" : "background.paper",
                      }}
                    >
                      {(myStat.avg_rating || 0).toFixed(1).replace(".", ",")}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "8.5px",
                        letterSpacing: ".1em",
                        color: isDark ? "text.secondary" : "background.default",
                        mt: 0.5,
                      }}
                    >
                      NOTA
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
