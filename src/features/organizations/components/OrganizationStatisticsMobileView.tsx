import { useMemo, useState } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  useTheme,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type {
  Organization,
  OrganizationPlayerStats,
  User,
  WeeklyPresence,
} from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { getInitials } from "../../../shared/utils/initials";
import { AVATAR_BG_COLORS } from "../../peladas/utils/playerUtils";
import {
  SeasonHighlightsCard,
  StatsPodiumCard,
  WeeklyPresenceChartCard,
  type HighlightItem,
} from "./OrganizationStatsWidgets";
import {
  computeWeeklyPresenceSummary,
  getMetricNumericValue,
  sortStatsByMetric,
  type MetricType,
} from "../utils/organizationStatsUtils";

interface OrganizationStatisticsMobileViewProps {
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

const METRIC_TABS: { key: MetricType; label: string }[] = [
  { key: "goals", label: "GOLS" },
  { key: "assists", label: "ASSIST." },
  { key: "presence", label: "PRESENÇA" },
  { key: "titles", label: "TÍTULOS" },
  { key: "rating", label: "NOTA" },
];

const PODIUM_TITLES: Record<MetricType, string> = {
  goals: "ARTILHARIA",
  assists: "GARÇOM",
  presence: "PRESENÇA",
  titles: "TÍTULOS",
  rating: "NOTA MÉDIA",
};

const formatMetricValue = (value: number, metric: MetricType) =>
  metric === "rating"
    ? value.toFixed(1).replace(".", ",")
    : String(Math.round(value));

const metricUnit = (metric: MetricType, value: number) => {
  switch (metric) {
    case "goals":
      return value === 1 ? "gol" : "gols";
    case "assists":
      return value === 1 ? "assistência" : "assistências";
    case "presence":
      return value === 1 ? "jogo" : "jogos";
    case "titles":
      return value === 1 ? "título" : "títulos";
    default:
      return value === 1 ? "ponto" : "pontos";
  }
};

export default function OrganizationStatisticsMobileView({
  org,
  stats,
  totalPeladas,
  totalGoals,
  avgGoals,
  year,
  years,
  onYearChange,
  currentUser,
  isAdmin,
  onOpenImport,
  onOpenExport,
  weeklyPresence = [],
}: OrganizationStatisticsMobileViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeMetric, setActiveMetric] = useState<MetricType>("goals");
  const [showAll, setShowAll] = useState(false);
  const [yearAnchor, setYearAnchor] = useState<null | HTMLElement>(null);

  const sortedByMetric = useMemo(
    () => sortStatsByMetric(stats, activeMetric),
    [stats, activeMetric],
  );

  const first = sortedByMetric[0];
  const second = sortedByMetric[1];
  const third = sortedByMetric[2];

  const isMe = (item: OrganizationPlayerStats) =>
    Boolean(
      currentUser &&
      (item.user_id === currentUser.id || item.player_id === currentUser.id),
    );

  const myIndex = sortedByMetric.findIndex(isMe);
  const myStat = myIndex >= 0 ? sortedByMetric[myIndex] : undefined;

  const displayedStats = useMemo(() => {
    if (showAll) return sortedByMetric.slice(3);
    const visible = sortedByMetric.slice(3, 7);
    if (myStat && !visible.some((s) => s.player_id === myStat.player_id)) {
      return [...visible, myStat];
    }
    return visible;
  }, [sortedByMetric, showAll, myStat]);

  const hiddenCount = Math.max(0, sortedByMetric.length - 7);

  const { presenceMax, presenceWeeksAvg, worstWeek } = useMemo(
    () => computeWeeklyPresenceSummary(weeklyPresence),
    [weeklyPresence],
  );

  const highlights: HighlightItem[] = useMemo(() => {
    const list: HighlightItem[] = [];
    const used = new Set<string>();

    const pick = (
      candidates: OrganizationPlayerStats[],
      eligible: (s: OrganizationPlayerStats) => boolean,
      compare: (
        a: OrganizationPlayerStats,
        b: OrganizationPlayerStats,
      ) => number,
    ) =>
      [...candidates]
        .filter((s) => eligible(s) && !used.has(s.player_id))
        .sort(compare)[0];

    const byTitles = pick(
      stats,
      (s) => (s.titles || 0) > 0,
      (a, b) => (b.titles || 0) - (a.titles || 0),
    );
    const byGames = pick(
      stats,
      (s) => (s.peladas_played || 0) > 0,
      (a, b) => (b.peladas_played || 0) - (a.peladas_played || 0),
    );

    const firstHighlight = byTitles || byGames;
    const goldColor = theme.palette.gold?.main || theme.palette.primary.main;
    if (firstHighlight) {
      used.add(firstHighlight.player_id);
      list.push(
        byTitles
          ? {
              key: "titles",
              player: firstHighlight,
              color: goldColor,
              label: `Mais títulos · ${firstHighlight.titles} noite${
                firstHighlight.titles === 1 ? "" : "s"
              }`,
            }
          : {
              key: "games",
              player: firstHighlight,
              color: goldColor,
              label: `Mais jogos · ${firstHighlight.peladas_played}`,
            },
      );
    }

    const perfect = pick(
      stats,
      (s) =>
        (s.peladas_played || 0) > 0 &&
        (s.total_peladas || totalPeladas) > 0 &&
        s.peladas_played >= (s.total_peladas || totalPeladas),
      (a, b) => (b.peladas_played || 0) - (a.peladas_played || 0),
    );
    const secondHighlight = perfect || byGames;
    if (secondHighlight) {
      used.add(secondHighlight.player_id);
      list.push(
        perfect
          ? {
              key: "perfect",
              player: secondHighlight,
              color: AVATAR_BG_COLORS[1] || "primary.light",
              label: `Presença perfeita · ${secondHighlight.peladas_played} de ${
                secondHighlight.total_peladas || totalPeladas
              }`,
            }
          : {
              key: "games",
              player: secondHighlight,
              color: AVATAR_BG_COLORS[1] || "primary.light",
              label: `Mais jogos · ${secondHighlight.peladas_played}`,
            },
      );
    }

    const byRating = pick(
      stats,
      (s) => (s.avg_rating || 0) > 0,
      (a, b) => (b.avg_rating || 0) - (a.avg_rating || 0),
    );
    if (byRating) {
      used.add(byRating.player_id);
      list.push({
        key: "rating",
        player: byRating,
        color: AVATAR_BG_COLORS[3] || "info.light",
        label: `Maior nota média · ${byRating.avg_rating
          .toFixed(1)
          .replace(".", ",")}`,
      });
    }

    return list;
  }, [stats, totalPeladas, theme]);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 3 }}>
      {/* Dark header */}
      <Box
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "action.hover" : "text.primary",
          borderBottom: (theme) =>
            theme.palette.mode === "dark"
              ? "1px solid rgba(255,255,255,0.12)"
              : "none",
          px: 2.5,
          pt: 1,
          pb: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
          <Box
            component="button"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            sx={{
              border: 0,
              bgcolor: "transparent",
              p: 0,
              font: "700 18px/1 Archivo,sans-serif",
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? "text.secondary"
                  : "background.default",
              cursor: "pointer",
            }}
          >
            ‹
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                font: "700 9.5px/1 Archivo,sans-serif",
                letterSpacing: ".16em",
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? "text.secondary"
                    : "background.default",
              }}
            >
              {org.name.toUpperCase()} · FUTEBOL
            </Typography>
            <Typography
              sx={{
                font: "800 18px/1.15 Archivo,sans-serif",
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? "text.primary"
                    : "background.paper",
                mt: 0.5,
              }}
            >
              {t("organizations.stats.title_short", "Estatísticas")}
            </Typography>
          </Box>
          {isAdmin && (
            <>
              <IconButton
                onClick={onOpenImport}
                data-testid="import-stats-button"
                aria-label={t("common.import", "Importar")}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "9px",
                  border: "1.5px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "divider"
                      : "rgba(255,255,255,0.3)",
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? "text.primary"
                      : "background.paper",
                }}
              >
                <FileUploadIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                onClick={onOpenExport}
                data-testid="export-stats-button"
                aria-label={t("common.export", "Exportar")}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "9px",
                  border: "1.5px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "divider"
                      : "rgba(255,255,255,0.3)",
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? "text.primary"
                      : "background.paper",
                }}
              >
                <FileDownloadIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </>
          )}
          <Box
            component="button"
            onClick={(e) => setYearAnchor(e.currentTarget)}
            data-testid="stats-year-button"
            sx={{
              border: "1.5px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "divider"
                  : "rgba(255,255,255,0.3)",
              borderRadius: "9px",
              bgcolor: "transparent",
              px: 1.1,
              py: 0.9,
              font: "800 10px/1 Archivo,sans-serif",
              letterSpacing: ".06em",
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? "text.primary"
                  : "background.paper",
              cursor: "pointer",
            }}
          >
            {year} ▾
          </Box>
          <Menu
            anchorEl={yearAnchor}
            open={Boolean(yearAnchor)}
            onClose={() => setYearAnchor(null)}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: "12px",
                  bgcolor: "background.paper",
                  color: "text.primary",
                },
              },
            }}
          >
            {years.map((y) => (
              <MenuItem
                key={y}
                selected={String(y) === String(year)}
                onClick={() => {
                  onYearChange(Number(y));
                  setYearAnchor(null);
                }}
                sx={{ font: "700 13px Archivo,sans-serif", py: 1.1 }}
              >
                {y}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        {/* Summary metrics */}
        <Box sx={{ display: "flex", gap: 2, mt: 2.5 }}>
          <Box>
            <Typography
              sx={{
                font: "700 28px/1 'Archivo Narrow',Archivo,sans-serif",
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? "text.primary"
                    : "background.paper",
              }}
            >
              {totalPeladas}
            </Typography>
            <Typography
              sx={{
                font: "700 8.5px/1.2 Archivo,sans-serif",
                letterSpacing: ".1em",
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? "text.secondary"
                    : "background.default",
                mt: 0.5,
              }}
            >
              PELADAS
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                font: "700 28px/1 'Archivo Narrow',Archivo,sans-serif",
                color: (theme) =>
                  theme.palette.gold?.main || theme.palette.primary.main,
              }}
            >
              {totalGoals}
            </Typography>
            <Typography
              sx={{
                font: "700 8.5px/1.2 Archivo,sans-serif",
                letterSpacing: ".1em",
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? "text.secondary"
                    : "background.default",
                mt: 0.5,
              }}
            >
              GOLS
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                font: "700 28px/1 'Archivo Narrow',Archivo,sans-serif",
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? "text.primary"
                    : "background.paper",
              }}
            >
              {avgGoals}
            </Typography>
            <Typography
              sx={{
                font: "700 8.5px/1.2 Archivo,sans-serif",
                letterSpacing: ".1em",
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? "text.secondary"
                    : "background.default",
                mt: 0.5,
              }}
            >
              MÉDIA/JOGO
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                font: "700 28px/1 'Archivo Narrow',Archivo,sans-serif",
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? "text.primary"
                    : "background.paper",
              }}
            >
              {stats.length}
            </Typography>
            <Typography
              sx={{
                font: "700 8.5px/1.2 Archivo,sans-serif",
                letterSpacing: ".1em",
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? "text.secondary"
                    : "background.default",
                mt: 0.5,
              }}
            >
              JOGADORES
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Metric chips */}
      <Box sx={{ display: "flex", gap: 0.9, flexWrap: "wrap", px: 2.5, pt: 2 }}>
        {METRIC_TABS.map((tab) => {
          const active = tab.key === activeMetric;
          return (
            <Box
              key={tab.key}
              component="button"
              onClick={() => {
                setActiveMetric(tab.key);
                setShowAll(false);
              }}
              data-testid={`stats-metric-${tab.key}`}
              sx={{
                border: active ? "none" : "1.5px solid",
                borderColor: "divider",
                bgcolor: active
                  ? (theme) =>
                      theme.palette.mode === "dark"
                        ? "primary.main"
                        : "text.primary"
                  : "background.paper",
                color: active
                  ? (theme) =>
                      theme.palette.mode === "dark"
                        ? "text.primary"
                        : "background.paper"
                  : "text.primary",
                borderRadius: "9px",
                px: 1.5,
                py: 1,
                font: active
                  ? "800 10.5px/1 Archivo,sans-serif"
                  : "700 10.5px/1 Archivo,sans-serif",
                letterSpacing: ".06em",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </Box>
          );
        })}
      </Box>

      {/* Podium */}
      {sortedByMetric.length > 0 && (
        <Box sx={{ px: 2.5, pt: 2 }}>
          <StatsPodiumCard
            title={`${PODIUM_TITLES[activeMetric]} · TEMPORADA ${year}`}
            first={first}
            second={second}
            third={third}
            getDisplayValue={(p) =>
              formatMetricValue(
                getMetricNumericValue(p, activeMetric),
                activeMetric,
              )
            }
            variant="mobile"
          />
        </Box>
      )}

      {/* Full ranking */}
      <Box sx={{ px: 2.5, pt: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            mb: 1,
          }}
        >
          <Typography
            sx={{
              font: "700 9.5px/1 Archivo,sans-serif",
              letterSpacing: ".18em",
              color: "text.secondary",
            }}
          >
            CLASSIFICAÇÃO COMPLETA
          </Typography>
          <Typography
            sx={{
              font: "700 10.5px/1 Archivo,sans-serif",
              color: "text.secondary",
            }}
          >
            {METRIC_TABS.find(
              (m) => m.key === activeMetric,
            )?.label.toLowerCase()}{" "}
            · {sortedByMetric.length} jogadores
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: "16px",
            px: 1.75,
            py: 0.5,
          }}
        >
          {displayedStats.map((item, idx) => {
            const me = isMe(item);
            const position =
              !showAll && me && myIndex >= 7 ? myIndex + 1 : idx + 4;
            const value = getMetricNumericValue(item, activeMetric);
            const games = item.peladas_played || 0;
            const perGame =
              games > 0 ? (value / games).toFixed(2).replace(".", ",") : "0,00";
            const gap =
              me && myIndex > 0
                ? getMetricNumericValue(
                    sortedByMetric[myIndex - 1],
                    activeMetric,
                  ) - value
                : 0;
            const isLast = idx === displayedStats.length - 1;
            const avatarBg = me
              ? theme.palette.primary.main
              : AVATAR_BG_COLORS[position % AVATAR_BG_COLORS.length];

            return (
              <Box
                key={item.player_id}
                data-testid={`stats-rank-row-${item.player_id}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.4,
                  py: "11px",
                  my: me ? 0.5 : 0,
                  px: me ? 1.25 : 0,
                  mx: me ? -1.25 : 0,
                  bgcolor: me ? "action.selected" : "transparent",
                  border: me ? "2px solid" : "none",
                  borderColor: me ? "primary.main" : "transparent",
                  borderRadius: me ? "13px" : 0,
                  borderBottom:
                    !me && !isLast
                      ? (theme) => `1.5px solid ${theme.palette.divider}`
                      : undefined,
                }}
              >
                <Typography
                  sx={{
                    width: 17,
                    flexShrink: 0,
                    font: "700 13px/1 'Archivo Narrow',Archivo,sans-serif",
                    color: me ? "primary.main" : "text.secondary",
                  }}
                >
                  {position}
                </Typography>
                <SecureAvatar
                  userId={item.user_id}
                  filename={item.avatar_filename}
                  fallbackText={getInitials(item.player_name)}
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: avatarBg,
                    color: me ? "primary.contrastText" : "text.primary",
                    font: "800 10px Archivo,sans-serif",
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{
                      font: "800 12.5px/1.2 Archivo,sans-serif",
                      color: "text.primary",
                    }}
                  >
                    {item.player_name}
                    {me && (
                      <Box
                        component="span"
                        sx={{
                          font: "700 9px Archivo,sans-serif",
                          letterSpacing: ".08em",
                          color: "primary.main",
                        }}
                      >
                        {" "}
                        · VOCÊ
                      </Box>
                    )}
                  </Typography>
                  <Typography
                    sx={{
                      font: "600 10.5px/1.3 Archivo,sans-serif",
                      color: me ? "primary.main" : "text.secondary",
                      mt: 0.25,
                    }}
                  >
                    {me && gap > 0
                      ? `${gap} ${metricUnit(activeMetric, gap)} para o ${
                          myIndex
                        }º lugar`
                      : activeMetric === "rating"
                        ? `${games} jogos`
                        : `${games} jogos · ${perGame} por jogo`}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    font: "700 19px/1 'Archivo Narrow',Archivo,sans-serif",
                    color: me ? "primary.main" : "text.primary",
                    flexShrink: 0,
                  }}
                >
                  {formatMetricValue(value, activeMetric)}
                </Typography>
              </Box>
            );
          })}

          {hiddenCount > 0 && (
            <Typography
              component="button"
              onClick={() => setShowAll((prev) => !prev)}
              data-testid="stats-show-all"
              sx={{
                display: "block",
                width: "100%",
                border: 0,
                bgcolor: "transparent",
                textAlign: "center",
                p: "12px 0 8px",
                font: "800 11.5px/1 Archivo,sans-serif",
                color: "primary.main",
                cursor: "pointer",
              }}
            >
              {showAll ? "Ver menos ↑" : `Ver os outros ${hiddenCount} →`}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Weekly presence */}
      <Box sx={{ px: 2.5, pt: 2.5 }}>
        <Typography
          sx={{
            font: "700 9.5px/1 Archivo,sans-serif",
            letterSpacing: ".18em",
            color: "text.secondary",
            mb: 1.25,
          }}
        >
          PRESENÇA DO GRUPO · 12 SEMANAS
        </Typography>
        <WeeklyPresenceChartCard
          weeklyPresence={weeklyPresence}
          presenceMax={presenceMax}
          presenceWeeksAvg={presenceWeeksAvg}
          worstWeek={worstWeek}
          variant="mobile"
        />
      </Box>

      {/* Season highlights */}
      {highlights.length > 0 && (
        <Box sx={{ px: 2.5, pt: 2.5 }}>
          <SeasonHighlightsCard items={highlights} variant="mobile" />
        </Box>
      )}
    </Box>
  );
}
