import { Box, Typography, alpha, useTheme } from "@mui/material";
import type {
  ProfileGroupStat,
  ProfilePresenceWeek,
} from "../../../shared/api/endpoints";
import {
  formatSkill,
  type ProfileSkillRow,
  type RecentMatchRow,
} from "../utils/profileFormat";
import { UserGroupStatsGrid } from "./UserGroupStatsGrid";

type ProfileSkillsCardProps = {
  skillRows: ProfileSkillRow[];
  skillAverage: number | null;
  ratingsCount?: number;
  variant: "desktop" | "mobile";
};

export function ProfileSkillsCard({
  skillRows,
  skillAverage,
  ratingsCount = 0,
  variant,
}: ProfileSkillsCardProps) {
  if (skillAverage === null) return null;
  const isDesktop = variant === "desktop";

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: (theme) =>
          `2px solid ${theme.palette.mode === "dark" ? theme.palette.divider : theme.palette.grey[900]}`,
        borderRadius: isDesktop ? "20px" : "18px",
        p: 2.5,
        boxShadow: (theme) =>
          `${isDesktop ? "6px 6px" : "5px 5px"} 0 ${theme.palette.mode === "dark" ? theme.palette.common.black : theme.palette.grey[900]}`,
        mb: isDesktop ? 0 : 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          mb: isDesktop ? 0 : 2,
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
          FICHA DE HABILIDADES
        </Typography>
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: isDesktop ? "11px" : "10.5px",
            lineHeight: isDesktop ? undefined : 1,
            color: "text.secondary",
          }}
        >
          {isDesktop
            ? `média ${formatSkill(skillAverage)} · ${ratingsCount} avaliações`
            : `média ${formatSkill(skillAverage)}`}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: isDesktop ? 1.4 : 1.5,
          mt: isDesktop ? 2 : 0,
        }}
      >
        {skillRows.map((skill) => {
          const pct = skill.value == null ? 0 : (skill.value / 5) * 100;
          return (
            <Box
              key={skill.label}
              sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
            >
              <Typography
                sx={{
                  width: isDesktop ? 92 : 80,
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: isDesktop ? "11px" : "10.5px",
                  lineHeight: isDesktop ? undefined : 1,
                  letterSpacing: ".04em",
                  color: "text.primary",
                }}
              >
                {skill.label}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: isDesktop ? 10 : 9,
                  borderRadius: "5px",
                  bgcolor: "divider",
                  display: "flex",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${pct}%`,
                    bgcolor:
                      (skill.value ?? 0) < 3
                        ? "secondary.main"
                        : "primary.main",
                  }}
                />
              </Box>
              <Typography
                sx={{
                  width: isDesktop ? 26 : 24,
                  textAlign: "right",
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: isDesktop ? "13px" : "11px",
                  color: "text.primary",
                  lineHeight: 1,
                }}
              >
                {formatSkill(skill.value)}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {isDesktop && (
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 600,
            fontSize: "11.5px",
            lineHeight: 1.45,
            color: "text.secondary",
            mt: 2,
            pt: 1.75,
            borderTop: (theme) => `1.5px dashed ${theme.palette.divider}`,
          }}
        >
          Notas dadas pelos companheiros depois das peladas.
        </Typography>
      )}
    </Box>
  );
}

type ProfileRecentMatchesCardProps = {
  recentMatches: RecentMatchRow[];
  variant: "desktop" | "mobile";
};

export function ProfileRecentMatchesCard({
  recentMatches,
  variant,
}: ProfileRecentMatchesCardProps) {
  const isDesktop = variant === "desktop";
  if (!isDesktop && recentMatches.length === 0) return null;

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1.5px solid",
        borderColor: "divider",
        borderRadius: "16px",
        overflow: "hidden",
        mt: isDesktop ? 2 : 0,
        mb: isDesktop ? 0 : 3,
      }}
    >
      {isDesktop ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: "13px 16px",
            borderBottom: "1.5px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "9.5px",
              letterSpacing: ".16em",
              color: "text.secondary",
              textTransform: "uppercase",
            }}
          >
            ÚLTIMAS PELADAS
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "11px",
              color: "primary.main",
              cursor: "pointer",
            }}
          >
            Histórico completo →
          </Typography>
        </Box>
      ) : (
        <Typography
          sx={{
            font: "700 9.5px/1 Archivo,sans-serif",
            letterSpacing: ".16em",
            color: "text.secondary",
            textTransform: "uppercase",
            p: "14px 16px 10px",
          }}
        >
          ÚLTIMAS PELADAS
        </Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {recentMatches.map((match, mIdx) => (
          <Box
            key={mIdx}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: isDesktop ? 1.75 : 1.5,
              p: isDesktop ? "13px 16px" : "12px 16px",
              borderTop: isDesktop ? undefined : "1.5px solid",
              borderBottom: isDesktop
                ? mIdx < recentMatches.length - 1
                  ? (theme) => `1.5px solid ${theme.palette.divider}`
                  : "none"
                : undefined,
              borderColor: "divider",
            }}
          >
            <Box sx={{ width: isDesktop ? 70 : 56, flexShrink: 0 }}>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: isDesktop ? "14px" : "13px",
                  color: "text.primary",
                  lineHeight: 1,
                }}
              >
                {match.date}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: isDesktop ? "10px" : "9px",
                  color: "text.secondary",
                  mt: 0.5,
                  lineHeight: 1,
                }}
              >
                {match.group}
              </Typography>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: isDesktop ? "12px" : "11.5px",
                  lineHeight: 1.3,
                  color: "text.primary",
                }}
              >
                {match.desc}
              </Typography>
              {(isDesktop || match.sub) && (
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: isDesktop ? "10.5px" : "10px",
                    lineHeight: 1.3,
                    color: "text.secondary",
                    mt: isDesktop ? 0.3 : 0.25,
                  }}
                >
                  {match.sub}
                </Typography>
              )}
            </Box>

            {match.badge && (
              <Box
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: isDesktop ? "9px" : "8.5px",
                  letterSpacing: isDesktop ? ".08em" : ".06em",
                  color: "gold.contrastText",
                  bgcolor: "gold.main",
                  borderRadius: "6px",
                  px: isDesktop ? 0.9 : 0.8,
                  py: isDesktop ? 0.6 : 0.5,
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                {match.badge}
              </Box>
            )}

            <Typography
              sx={{
                width: isDesktop ? 40 : 30,
                flexShrink: 0,
                textAlign: "right",
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: isDesktop ? "18px" : "16px",
                lineHeight: 1,
                color: "text.primary",
              }}
            >
              {match.score}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

type ProfilePresenceCardProps = {
  presenceWeeks: ProfilePresenceWeek[];
  streak?: number;
  absentCount?: number;
  variant: "desktop" | "mobile";
};

export function ProfilePresenceCard({
  presenceWeeks,
  streak = 0,
  absentCount = 0,
  variant,
}: ProfilePresenceCardProps) {
  const theme = useTheme();
  const isDesktop = variant === "desktop";
  const inactivePresenceColor = theme.palette.divider;

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1.5px solid",
        borderColor: "divider",
        borderRadius: "16px",
        p: isDesktop ? 2.25 : 2.5,
        mb: isDesktop ? 0 : 3,
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
          mb: isDesktop ? 0 : 2,
        }}
      >
        {isDesktop ? "PRESENÇA · 12 SEMANAS" : "PRESENÇA · ÚLTIMAS 12 SEMANAS"}
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: isDesktop ? 0.6 : "6px",
          alignItems: "flex-end",
          mt: isDesktop ? 2 : 0,
          height: isDesktop ? 44 : 40,
        }}
      >
        {presenceWeeks.map((week, idx) => {
          const color =
            week.status === "present"
              ? "primary.main"
              : week.status === "absent"
                ? "secondary.main"
                : inactivePresenceColor;
          return (
            <Box
              key={idx}
              sx={{
                flex: 1,
                height:
                  week.status === "no_game"
                    ? isDesktop
                      ? 18
                      : 14
                    : isDesktop
                      ? 44
                      : 34,
                borderRadius: isDesktop ? "5px" : "4px",
                bgcolor: color,
              }}
            />
          );
        })}
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: isDesktop ? 1.75 : 2,
          mt: 1.5,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "presente", color: "primary.main" },
          { label: "faltou", color: "secondary.main" },
          { label: "sem jogo", color: "divider" },
        ].map((item) => (
          <Box
            key={item.label}
            sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
          >
            <Box
              sx={{
                width: isDesktop ? 9 : 8,
                height: isDesktop ? 9 : 8,
                borderRadius: "2px",
                bgcolor: item.color,
              }}
            />
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: isDesktop ? "11px" : "10.5px",
                lineHeight: isDesktop ? undefined : 1,
                color: "text.secondary",
              }}
            >
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {isDesktop && (
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 600,
            fontSize: "11.5px",
            lineHeight: 1.4,
            color: "text.secondary",
            mt: 1.6,
            pt: 1.5,
            borderTop: (theme) => `1.5px dashed ${theme.palette.divider}`,
          }}
        >
          Maior sequência:{" "}
          <Box
            component="strong"
            sx={{ color: "text.primary", fontWeight: 800 }}
          >
            {streak} {streak === 1 ? "jogo" : "jogos"}
          </Box>
          {` · ${absentCount} ${absentCount === 1 ? "falta" : "faltas"} em ${presenceWeeks.length} semanas`}
        </Typography>
      )}
    </Box>
  );
}

type ProfileGroupCardsListProps = {
  groups: ProfileGroupStat[];
  year?: number;
  variant: "desktop" | "mobile";
};

export function ProfileGroupCardsList({
  groups,
  year,
  variant,
}: ProfileGroupCardsListProps) {
  const isDesktop = variant === "desktop";
  if (!isDesktop && groups.length === 0) return null;

  const cards = groups.map((group) => (
    <Box
      key={group.organization_id}
      sx={{
        border: "1.5px solid",
        borderColor: "divider",
        borderRadius: "16px",
        overflow: "hidden",
        bgcolor: "background.paper",
        mt: isDesktop ? 1.75 : 0,
        mb: isDesktop ? 0 : 1.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: "11px 14px",
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.mode === "dark" ? 0.12 : 0.08,
            ),
          borderBottom: "1.5px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            width: 9,
            height: 9,
            borderRadius: "2px",
            bgcolor: "primary.main",
          }}
        />
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "11px",
            lineHeight: isDesktop ? undefined : 1,
            color: "text.primary",
          }}
        >
          {group.organization_name}
        </Typography>
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: "9.5px",
            lineHeight: isDesktop ? undefined : 1,
            letterSpacing: ".1em",
            color: "text.secondary",
            textTransform: "uppercase",
          }}
        >
          FUTEBOL
        </Typography>
      </Box>

      <UserGroupStatsGrid
        peladasPlayed={group.peladas_played}
        goals={group.goals}
        assists={group.assists}
        titles={group.titles}
      />
    </Box>
  ));

  if (isDesktop) {
    return <>{cards}</>;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        sx={{
          font: "700 9.5px/1 Archivo,sans-serif",
          letterSpacing: ".18em",
          color: "text.secondary",
          textTransform: "uppercase",
          mb: 1.5,
        }}
      >
        POR GRUPO · {year ?? new Date().getFullYear()}
      </Typography>
      {cards}
    </Box>
  );
}
