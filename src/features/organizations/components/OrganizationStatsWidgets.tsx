import { Box, Typography, useTheme } from "@mui/material";
import type {
  OrganizationPlayerStats,
  WeeklyPresence,
} from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { getInitials } from "../../../shared/utils/initials";
import { AVATAR_BG_COLORS } from "../../peladas/utils/playerUtils";
import { type MetricType } from "../utils/organizationStatsUtils";

export type { MetricType };

const monthLabel = (iso: string) =>
  new Date(iso)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");

const dayMonth = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

type StatsPodiumCardProps = {
  title: string;
  first?: OrganizationPlayerStats;
  second?: OrganizationPlayerStats;
  third?: OrganizationPlayerStats;
  getDisplayValue: (item?: OrganizationPlayerStats) => string | number;
  variant: "desktop" | "mobile";
};

export function StatsPodiumCard({
  title,
  first,
  second,
  third,
  getDisplayValue,
  variant,
}: StatsPodiumCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isDesktop = variant === "desktop";

  const renderSlot = (
    player: OrganizationPlayerStats | undefined,
    position: 1 | 2 | 3,
  ) => {
    const isFirst = position === 1;
    const bg =
      position === 1
        ? AVATAR_BG_COLORS[0] || "warning.light"
        : position === 2
          ? AVATAR_BG_COLORS[4] || "secondary.light"
          : AVATAR_BG_COLORS[6] || "info.light";

    return (
      <Box sx={{ flex: 1, textAlign: "center" }}>
        <SecureAvatar
          userId={player?.user_id}
          filename={player?.avatar_filename}
          fallbackText={getInitials(player?.player_name || "")}
          sx={{
            width: isDesktop ? (isFirst ? 58 : 48) : isFirst ? 48 : 40,
            height: isDesktop ? (isFirst ? 58 : 48) : isFirst ? 48 : 40,
            mx: "auto",
            bgcolor: bg,
            border: isFirst
              ? (th) =>
                  `${isDesktop ? "3px" : "2.5px"} solid ${th.palette.gold?.main || th.palette.primary.main}`
              : "none",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: isDesktop
              ? isFirst
                ? "17px"
                : "14px"
              : isFirst
                ? "14px"
                : "12px",
            color: "text.primary",
          }}
        />
        <Box
          sx={{
            bgcolor: isFirst
              ? (th) => th.palette.gold?.main || th.palette.primary.main
              : "action.hover",
            borderRadius: isDesktop ? "11px 11px 0 0" : "9px 9px 0 0",
            mt: isDesktop ? 1.4 : 1.1,
            pt: isDesktop
              ? isFirst
                ? 2.2
                : position === 2
                  ? 1.6
                  : 1.4
              : isFirst
                ? 1.6
                : 1.1,
            pb: isDesktop
              ? isFirst
                ? 1.8
                : position === 2
                  ? 1.4
                  : 1.2
              : isFirst
                ? 1.6
                : 1.1,
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Archivo Narrow', Archivo, sans-serif",
              fontWeight: 700,
              fontSize: isDesktop
                ? isFirst
                  ? "40px"
                  : position === 2
                    ? "28px"
                    : "26px"
                : isFirst
                  ? "30px"
                  : "22px",
              lineHeight: 1,
              color: isFirst ? "primary.contrastText" : "text.primary",
            }}
          >
            {getDisplayValue(player)}
          </Typography>
          <Typography
            noWrap={!isDesktop}
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: isDesktop
                ? isFirst
                  ? "12px"
                  : "11px"
                : isFirst
                  ? "9.5px"
                  : "9px",
              lineHeight: isDesktop ? undefined : 1.2,
              color: isFirst ? "primary.contrastText" : "text.secondary",
              mt: isDesktop ? 0.6 : 0.5,
              px: isDesktop ? 0 : 0.5,
            }}
          >
            {player?.player_name || (isDesktop ? "" : "—")}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: isDesktop
                ? isFirst
                  ? "14px"
                  : "13px"
                : isFirst
                  ? "13px"
                  : "12px",
              lineHeight: isDesktop ? undefined : 1,
              color: isFirst ? "primary.contrastText" : "text.secondary",
              mt: isDesktop ? 1 : 0.75,
            }}
          >
            {position}º
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: (th) =>
          th.palette.brutalist?.border || `2px solid ${th.palette.divider}`,
        borderRadius: isDesktop ? "20px" : "18px",
        p: isDesktop ? "20px" : 2,
        boxShadow: (th) =>
          th.palette.brutalist?.shadow ||
          (isDark
            ? "0 4px 20px rgba(0,0,0,0.5)"
            : `${isDesktop ? "6px 6px" : "5px 5px"} 0 ${th.palette.divider}`),
        mb: isDesktop ? 2 : 0,
      }}
    >
      <Typography
        sx={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 700,
          fontSize: "9.5px",
          lineHeight: isDesktop ? undefined : 1,
          letterSpacing: ".18em",
          color: "text.secondary",
          textTransform: "uppercase",
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: isDesktop ? 1.8 : 1.25,
          mt: isDesktop ? 2 : 1.75,
        }}
      >
        {renderSlot(second, 2)}
        {renderSlot(first, 1)}
        {renderSlot(third, 3)}
      </Box>
    </Box>
  );
}

type WeeklyPresenceChartCardProps = {
  weeklyPresence: WeeklyPresence[];
  presenceMax: number;
  presenceWeeksAvg: number;
  worstWeek?: WeeklyPresence;
  variant: "desktop" | "mobile";
};

export function WeeklyPresenceChartCard({
  weeklyPresence,
  presenceMax,
  presenceWeeksAvg,
  worstWeek,
  variant,
}: WeeklyPresenceChartCardProps) {
  const isDesktop = variant === "desktop";

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: isDesktop ? "1.5px solid" : 1,
        borderColor: "divider",
        borderRadius: "16px",
        p: isDesktop ? 2 : 1.75,
      }}
    >
      {isDesktop && (
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
      )}

      {(isDesktop || weeklyPresence.length > 0) && (
        <Box
          sx={{
            display: "flex",
            gap: isDesktop ? 0.6 : "4px",
            alignItems: "flex-end",
            height: isDesktop ? 90 : 64,
            mt: isDesktop ? 2 : 0,
          }}
        >
          {weeklyPresence.map((w, bIdx) => (
            <Box
              key={isDesktop ? bIdx : w.week_start}
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
      )}

      {weeklyPresence.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: isDesktop ? 1.1 : 1,
            fontFamily: "Archivo, sans-serif",
            fontWeight: 600,
            fontSize: "10px",
            lineHeight: isDesktop ? undefined : 1,
            color: "text.secondary",
          }}
        >
          <Box component="span">{monthLabel(weeklyPresence[0].week_start)}</Box>
          <Box component="span">
            {monthLabel(weeklyPresence[weeklyPresence.length - 1].week_start)}
          </Box>
        </Box>
      )}

      <Box
        data-testid={isDesktop ? undefined : "presence-summary"}
        sx={{
          mt: isDesktop ? 1.6 : 1.5,
          pt: isDesktop ? 1.6 : 1.5,
          borderTop: isDesktop ? "1.5px dashed" : "1px dashed",
          borderColor: "divider",
          fontFamily: "Archivo, sans-serif",
          fontWeight: 600,
          fontSize: "11.5px",
          lineHeight: isDesktop ? 1.45 : 1.4,
          color: "text.secondary",
        }}
      >
        {weeklyPresence.length > 0 ? (
          <>
            Média de{" "}
            <Box
              component="strong"
              sx={{ color: "text.primary", fontWeight: 700 }}
            >
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
  );
}

export type HighlightItem = {
  key: string;
  player?: OrganizationPlayerStats;
  color: string;
  label: string;
};

type SeasonHighlightsCardProps = {
  items: HighlightItem[];
  variant: "desktop" | "mobile";
};

export function SeasonHighlightsCard({
  items,
  variant,
}: SeasonHighlightsCardProps) {
  const isDesktop = variant === "desktop";

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: isDesktop ? "1.5px solid" : 1,
        borderColor: "divider",
        borderRadius: "16px",
        overflow: "hidden",
        mt: isDesktop ? 1.8 : 0,
      }}
    >
      <Box
        sx={{
          p: isDesktop ? "13px 16px" : "12px 14px",
          borderBottom: isDesktop ? "1.5px solid" : 1,
          borderColor: "divider",
          fontFamily: "Archivo, sans-serif",
          fontWeight: 700,
          fontSize: "9.5px",
          lineHeight: isDesktop ? undefined : 1,
          letterSpacing: ".16em",
          color: "text.secondary",
        }}
      >
        DESTAQUES DA TEMPORADA
      </Box>

      {items.map((h, i) => (
        <Box
          key={h.key}
          data-testid={isDesktop ? undefined : `stats-highlight-${h.key}`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.4,
            p: isDesktop ? "13px 16px" : "12px 14px",
            borderBottom: i < items.length - 1 ? "1.5px solid" : "none",
            borderColor: "divider",
          }}
        >
          <SecureAvatar
            userId={h.player?.user_id}
            filename={h.player?.avatar_filename}
            fallbackText={getInitials(h.player?.player_name)}
            sx={{
              width: isDesktop ? 32 : 30,
              height: isDesktop ? 32 : 30,
              bgcolor: h.color,
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "10px",
              color: "text.primary",
              flexShrink: 0,
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap={!isDesktop}
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: isDesktop ? "12.5px" : "12px",
                lineHeight: isDesktop ? undefined : 1.2,
                color: "text.primary",
              }}
            >
              {h.player?.player_name || "—"}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: isDesktop ? "11px" : "10.5px",
                lineHeight: isDesktop ? undefined : 1.3,
                color: "text.secondary",
                mt: isDesktop ? 0.3 : 0.25,
              }}
            >
              {h.label}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

type YourSeasonSummaryCardProps = {
  myStat: OrganizationPlayerStats;
  myRank: number;
  totalPlayers: number;
};

export function YourSeasonSummaryCard({
  myStat,
  myRank,
  totalPlayers,
}: YourSeasonSummaryCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
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
            color: (th) => th.palette.gold?.main || th.palette.primary.main,
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
          {totalPlayers} jogadores
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
  );
}
