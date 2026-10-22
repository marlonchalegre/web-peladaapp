import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  Button,
  useTheme,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
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
import {
  SeasonHighlightsCard,
  StatsPodiumCard,
  WeeklyPresenceChartCard,
  YourSeasonSummaryCard,
  type HighlightItem,
} from "./OrganizationStatsWidgets";
import {
  computeWeeklyPresenceSummary,
  sortStatsByMetric,
  type MetricType,
} from "../utils/organizationStatsUtils";

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
  onOpenImport,
  onOpenExport,
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

  const sortedByMetric = useMemo(
    () => sortStatsByMetric(stats, activeMetric),
    [stats, activeMetric],
  );

  const displayedStats = showAll ? sortedByMetric : sortedByMetric.slice(0, 8);

  const first = sortedByMetric[0];
  const second = sortedByMetric[1];
  const third = sortedByMetric[2];

  const totalPeladasInSeason = stats[0]?.total_peladas ?? 0;
  const presenceAvg = useMemo(
    () =>
      totalPeladasInSeason > 0 && stats.length > 0
        ? Math.round(
            (stats.reduce(
              (acc, s) => acc + (s.peladas_played || 0) / totalPeladasInSeason,
              0,
            ) /
              stats.length) *
              100,
          )
        : null,
    [totalPeladasInSeason, stats],
  );

  const highlights: HighlightItem[] = useMemo(() => {
    return [
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
    ]
      .filter((h) => h.item && h.eligible(h.item))
      .map((h) => ({
        key: h.key,
        player: h.item,
        color: h.color,
        label: h.item ? h.label(h.item) : "",
      }));
  }, [stats, theme]);

  const myStat = currentUser
    ? stats.find((s) => s.user_id === currentUser.id)
    : undefined;

  const myRank = useMemo(() => {
    if (!myStat || !stats.length) return 0;
    return (
      [...stats]
        .sort((a, b) => (b.goal || 0) - (a.goal || 0))
        .findIndex((s) => s.user_id === currentUser?.id) + 1
    );
  }, [stats, myStat, currentUser?.id]);

  const { presenceMax, presenceWeeksAvg, worstWeek } = useMemo(
    () => computeWeeklyPresenceSummary(weeklyPresence),
    [weeklyPresence],
  );

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
        {/* Dark Header Banner */}
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
                component="h2"
                data-testid="org-name-header"
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

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              {isAdmin && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileUploadIcon sx={{ fontSize: 16 }} />}
                    onClick={onOpenImport}
                    data-testid="import-stats-button"
                    sx={{
                      borderColor: "divider",
                      color: "inherit",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "11px",
                      letterSpacing: ".06em",
                      borderRadius: "10px",
                      py: 0.8,
                      px: 1.5,
                      textTransform: "uppercase",
                      "&:hover": {
                        borderColor: "text.primary",
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    {t("common.import", "Importar")}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownloadIcon sx={{ fontSize: 16 }} />}
                    onClick={onOpenExport}
                    data-testid="export-stats-button"
                    sx={{
                      borderColor: "divider",
                      color: "inherit",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "11px",
                      letterSpacing: ".06em",
                      borderRadius: "10px",
                      py: 0.8,
                      px: 1.5,
                      textTransform: "uppercase",
                      "&:hover": {
                        borderColor: "text.primary",
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    {t("common.export", "Exportar")}
                  </Button>
                </>
              )}

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

        {/* Two-column Layout */}
        <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
          {/* Left Column: Metric Tabs + Podium + Table */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
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

            <StatsPodiumCard
              title={`ARTILHARIA · TEMPORADA ${year}`}
              first={first}
              second={second}
              third={third}
              getDisplayValue={(p) => (p ? getMetricValue(p) : 0)}
              variant="desktop"
            />

            {/* Full Ranking Table */}
            <Box
              sx={{
                bgcolor: "background.paper",
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
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
                    data-testid="stats-player-row"
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

          {/* Right Column */}
          <Box sx={{ width: 340, flexShrink: 0 }}>
            <WeeklyPresenceChartCard
              weeklyPresence={weeklyPresence}
              presenceMax={presenceMax}
              presenceWeeksAvg={presenceWeeksAvg}
              worstWeek={worstWeek}
              variant="desktop"
            />
            <SeasonHighlightsCard items={highlights} variant="desktop" />
            {myStat && (
              <YourSeasonSummaryCard
                myStat={myStat}
                myRank={myRank}
                totalPlayers={stats.length}
              />
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
