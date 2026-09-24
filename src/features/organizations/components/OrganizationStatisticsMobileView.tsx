import { useMemo, useState } from "react";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
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

type MetricType = "goals" | "assists" | "presence" | "titles" | "rating";

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

const AVATAR_BG_COLORS = [
  "#cdd6e0",
  "#dcd3bd",
  "#e2cfc7",
  "#d3cfc4",
  "#d8d2c4",
  "#cfd8cd",
  "#c9d9cd",
];

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

const getMetricValue = (
  item: OrganizationPlayerStats | undefined,
  metric: MetricType,
): number => {
  if (!item) return 0;
  switch (metric) {
    case "goals":
      return item.goal || 0;
    case "assists":
      return item.assist || 0;
    case "presence":
      return item.peladas_played || 0;
    case "titles":
      return item.titles || 0;
    case "rating":
      return item.avg_rating || 0;
    default:
      return 0;
  }
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

const monthLabel = (iso: string) =>
  new Date(iso)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");

const dayMonth = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

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
  const [activeMetric, setActiveMetric] = useState<MetricType>("goals");
  const [showAll, setShowAll] = useState(false);
  const [yearAnchor, setYearAnchor] = useState<null | HTMLElement>(null);

  const sortedByMetric = useMemo(() => {
    const copy = [...stats];
    switch (activeMetric) {
      case "goals":
        return copy.sort((a, b) => (b.goal || 0) - (a.goal || 0));
      case "assists":
        return copy.sort((a, b) => (b.assist || 0) - (a.assist || 0));
      case "presence":
        return copy.sort(
          (a, b) => (b.peladas_played || 0) - (a.peladas_played || 0),
        );
      case "titles":
        return copy.sort((a, b) => (b.titles || 0) - (a.titles || 0));
      case "rating":
        return copy.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
      default:
        return copy;
    }
  }, [stats, activeMetric]);

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

  // Presence chart derived values
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

  // Season highlights: one distinct player per category
  const highlights = useMemo(() => {
    const list: {
      key: string;
      player: OrganizationPlayerStats | undefined;
      color: string;
      label: string;
    }[] = [];
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

    const first = byTitles || byGames;
    if (first) {
      used.add(first.player_id);
      list.push(
        byTitles
          ? {
              key: "titles",
              player: first,
              color: "#f2a100",
              label: `Mais títulos · ${first.titles} noite${
                first.titles === 1 ? "" : "s"
              }`,
            }
          : {
              key: "games",
              player: first,
              color: "#f2a100",
              label: `Mais jogos · ${first.peladas_played}`,
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
    const second = perfect || byGames;
    if (second) {
      used.add(second.player_id);
      list.push(
        perfect
          ? {
              key: "perfect",
              player: second,
              color: "#c9d9cd",
              label: `Presença perfeita · ${second.peladas_played} de ${
                second.total_peladas || totalPeladas
              }`,
            }
          : {
              key: "games",
              player: second,
              color: "#c9d9cd",
              label: `Mais jogos · ${second.peladas_played}`,
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
        color: "#d3cfc4",
        label: `Maior nota média · ${byRating.avg_rating
          .toFixed(1)
          .replace(".", ",")}`,
      });
    }

    return list;
  }, [stats, totalPeladas]);

  const renderPodiumColumn = (
    player: OrganizationPlayerStats | undefined,
    position: 1 | 2 | 3,
  ) => {
    const isFirst = position === 1;
    const bg =
      position === 1 ? "#dcd3bd" : position === 2 ? "#cdd6e0" : "#e2cfc7";
    const baseColor = isFirst ? "#f2a100" : "#eae6db";
    const value = getMetricValue(player, activeMetric);

    return (
      <Box sx={{ flex: 1, textAlign: "center" }}>
        <SecureAvatar
          userId={player?.user_id}
          filename={player?.avatar_filename}
          fallbackText={getInitials(player?.player_name)}
          sx={{
            width: isFirst ? 48 : 40,
            height: isFirst ? 48 : 40,
            mx: "auto",
            bgcolor: bg,
            border: isFirst ? "2.5px solid #f2a100" : "none",
            color: "#17181a",
            font: isFirst
              ? "800 14px Archivo,sans-serif"
              : "800 12px Archivo,sans-serif",
          }}
        />
        <Box
          sx={{
            bgcolor: baseColor,
            borderRadius: "9px 9px 0 0",
            mt: 1.1,
            py: isFirst ? 1.6 : 1.1,
          }}
        >
          <Typography
            sx={{
              font: isFirst
                ? "700 30px/1 'Archivo Narrow',Archivo,sans-serif"
                : "700 22px/1 'Archivo Narrow',Archivo,sans-serif",
              color: "#17181a",
            }}
          >
            {formatMetricValue(value, activeMetric)}
          </Typography>
          <Typography
            noWrap
            sx={{
              font: isFirst
                ? "700 9.5px/1.2 Archivo,sans-serif"
                : "700 9px/1.2 Archivo,sans-serif",
              color: isFirst ? "#17181a" : "#6b675c",
              mt: 0.5,
              px: 0.5,
            }}
          >
            {player?.player_name || "—"}
          </Typography>
          <Typography
            sx={{
              font: isFirst
                ? "800 13px/1 Archivo,sans-serif"
                : "800 12px/1 Archivo,sans-serif",
              color: isFirst ? "#17181a" : "#6b675c",
              mt: 0.75,
            }}
          >
            {position}º
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 3 }}>
      {/* Dark header */}
      <Box sx={{ bgcolor: "#17181a", px: 2.5, pt: 1, pb: 2.5 }}>
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
              color: "#9a958a",
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
                color: "#9a958a",
              }}
            >
              {org.name.toUpperCase()} · FUTEBOL
            </Typography>
            <Typography
              sx={{
                font: "800 18px/1.15 Archivo,sans-serif",
                color: "#f6f4ee",
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
                  border: "1.5px solid #3a3b3e",
                  color: "#f6f4ee",
                }}
              >
                <FileUploadIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                onClick={onOpenExport}
                aria-label={t("common.export", "Exportar")}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "9px",
                  border: "1.5px solid #3a3b3e",
                  color: "#f6f4ee",
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
              border: "1.5px solid #3a3b3e",
              borderRadius: "9px",
              bgcolor: "transparent",
              px: 1.1,
              py: 0.9,
              font: "800 10px/1 Archivo,sans-serif",
              letterSpacing: ".06em",
              color: "#f6f4ee",
              cursor: "pointer",
            }}
          >
            {year} ▾
          </Box>
          <Menu
            anchorEl={yearAnchor}
            open={Boolean(yearAnchor)}
            onClose={() => setYearAnchor(null)}
            slotProps={{ paper: { sx: { borderRadius: "12px" } } }}
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
                color: "#f6f4ee",
              }}
            >
              {totalPeladas}
            </Typography>
            <Typography
              sx={{
                font: "700 8.5px/1.2 Archivo,sans-serif",
                letterSpacing: ".1em",
                color: "#9a958a",
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
                color: "#f2a100",
              }}
            >
              {totalGoals}
            </Typography>
            <Typography
              sx={{
                font: "700 8.5px/1.2 Archivo,sans-serif",
                letterSpacing: ".1em",
                color: "#9a958a",
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
                color: "#f6f4ee",
              }}
            >
              {avgGoals}
            </Typography>
            <Typography
              sx={{
                font: "700 8.5px/1.2 Archivo,sans-serif",
                letterSpacing: ".1em",
                color: "#9a958a",
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
                color: "#f6f4ee",
              }}
            >
              {stats.length}
            </Typography>
            <Typography
              sx={{
                font: "700 8.5px/1.2 Archivo,sans-serif",
                letterSpacing: ".1em",
                color: "#9a958a",
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
                border: active ? "none" : "1.5px solid #ddd8cc",
                bgcolor: active ? "#17181a" : "#ffffff",
                color: active ? "#ffffff" : "#17181a",
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
          <Box
            sx={{
              bgcolor: "background.paper",
              border: (theme) =>
                theme.palette.mode === "dark"
                  ? "1px solid rgba(255,255,255,0.12)"
                  : "2px solid #17181a",
              borderRadius: "18px",
              p: 2,
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "0 4px 20px rgba(0,0,0,0.5)"
                  : "5px 5px 0 #17181a",
            }}
          >
            <Typography
              sx={{
                font: "700 9.5px/1 Archivo,sans-serif",
                letterSpacing: ".18em",
                color: "#6b675c",
              }}
            >
              {PODIUM_TITLES[activeMetric]} · TEMPORADA {year}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                gap: 1.25,
                mt: 1.75,
              }}
            >
              {renderPodiumColumn(second, 2)}
              {renderPodiumColumn(first, 1)}
              {renderPodiumColumn(third, 3)}
            </Box>
          </Box>
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
              color: "#6b675c",
            }}
          >
            CLASSIFICAÇÃO COMPLETA
          </Typography>
          <Typography
            sx={{
              font: "700 10.5px/1 Archivo,sans-serif",
              color: "#6b675c",
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
            const position = showAll ? idx + 4 : idx + 4;
            const me = isMe(item);
            const value = getMetricValue(item, activeMetric);
            const games = item.peladas_played || 0;
            const perGame =
              games > 0 ? (value / games).toFixed(2).replace(".", ",") : "0,00";
            const gap =
              me && myIndex > 0
                ? getMetricValue(sortedByMetric[myIndex - 1], activeMetric) -
                  value
                : 0;
            const isLast = idx === displayedStats.length - 1;
            const avatarBg = me
              ? "#146b3a"
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
                  bgcolor: (theme) =>
                    me
                      ? theme.palette.mode === "dark"
                        ? "rgba(20, 107, 58, 0.2)"
                        : "#f4f8f5"
                      : "transparent",
                  border: me ? "2px solid #146b3a" : "none",
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
                    color: me ? "#146b3a" : "text.secondary",
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
                    color: me || avatarBg === "#146b3a" ? "#ffffff" : "#17181a",
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
                          color: "#146b3a",
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
                      color: me ? "#146b3a" : "#6b675c",
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
                    color: me ? "#146b3a" : "#17181a",
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
                color: "#146b3a",
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
            color: "#6b675c",
            mb: 1.25,
          }}
        >
          PRESENÇA DO GRUPO · 12 SEMANAS
        </Typography>
        <Box
          sx={{
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: "16px",
            p: 1.75,
          }}
        >
          {weeklyPresence.length > 0 ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  gap: "4px",
                  alignItems: "flex-end",
                  height: 64,
                }}
              >
                {weeklyPresence.map((week) => (
                  <Box
                    key={week.week_start}
                    sx={{
                      flex: 1,
                      height: `${Math.round(
                        (week.confirmed / presenceMax) * 100,
                      )}%`,
                      bgcolor:
                        week.confirmed < presenceWeeksAvg
                          ? "#a8452a"
                          : "#146b3a",
                      borderRadius: "3px",
                    }}
                  />
                ))}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 1,
                  font: "600 10px/1 Archivo,sans-serif",
                  color: "text.secondary",
                }}
              >
                <span>{monthLabel(weeklyPresence[0].week_start)}</span>
                <span>
                  {monthLabel(
                    weeklyPresence[weeklyPresence.length - 1].week_start,
                  )}
                </span>
              </Box>
              <Typography
                data-testid="presence-summary"
                sx={{
                  mt: 1.5,
                  pt: 1.5,
                  borderTop: 1,
                  borderTopStyle: "dashed",
                  borderColor: "divider",
                  font: "600 11.5px/1.4 Archivo,sans-serif",
                  color: "text.secondary",
                }}
              >
                Média de{" "}
                <Box
                  component="strong"
                  sx={{ color: "text.primary", fontWeight: 700 }}
                >
                  {presenceWeeksAvg} jogadores
                </Box>{" "}
                por pelada
                {worstWeek
                  ? ` · pior semana em ${dayMonth(
                      worstWeek.week_start,
                    )} com ${worstWeek.confirmed}`
                  : ""}
              </Typography>
            </>
          ) : (
            <Typography
              sx={{
                font: "600 11.5px/1.4 Archivo,sans-serif",
                color: "#6b675c",
              }}
            >
              Sem dados de presença.
            </Typography>
          )}
        </Box>
      </Box>

      {/* Season highlights */}
      {highlights.length > 0 && (
        <Box sx={{ px: 2.5, pt: 2.5 }}>
          <Box
            sx={{
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <Typography
              sx={{
                p: "12px 14px",
                borderBottom: 1,
                borderColor: "divider",
                font: "700 9.5px/1 Archivo,sans-serif",
                letterSpacing: ".16em",
                color: "text.secondary",
              }}
            >
              DESTAQUES DA TEMPORADA
            </Typography>
            {highlights.map((highlight, idx) => (
              <Box
                key={highlight.key}
                data-testid={`stats-highlight-${highlight.key}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.4,
                  p: "12px 14px",
                  borderBottom:
                    idx === highlights.length - 1
                      ? "none"
                      : (theme) => `1.5px solid ${theme.palette.divider}`,
                }}
              >
                <SecureAvatar
                  userId={highlight.player?.user_id}
                  filename={highlight.player?.avatar_filename}
                  fallbackText={getInitials(highlight.player?.player_name)}
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: highlight.color,
                    color: "#17181a",
                    font: "800 10px Archivo,sans-serif",
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{
                      font: "700 12px/1.2 Archivo,sans-serif",
                      color: "text.primary",
                    }}
                  >
                    {highlight.player?.player_name || "—"}
                  </Typography>
                  <Typography
                    sx={{
                      font: "600 10.5px/1.3 Archivo,sans-serif",
                      color: "#6b675c",
                      mt: 0.25,
                    }}
                  >
                    {highlight.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
