import { useState } from "react";
import { Box, Typography, Button, useTheme, alpha } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { User, UserProfileDashboard } from "../../../shared/api/endpoints";
import {
  formatRating,
  formatSkill,
  toRecentMatchRows,
} from "../utils/profileFormat";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { UserGroupStatsGrid } from "./UserGroupStatsGrid";

export interface UserProfileDesktopViewProps {
  user: User | null;
  name: string;
  username: string;
  position: string;
  userInitials: string;
  avatarFilename?: string | null;
  dashboard?: UserProfileDashboard | null;
  onEditClick: () => void;
}

export default function UserProfileDesktopView({
  user,
  name,
  username,
  position,
  userInitials,
  avatarFilename,
  dashboard,
  onEditClick,
}: UserProfileDesktopViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<"overview" | "history">(
    "overview",
  );

  const summary = dashboard?.summary;
  const skills = dashboard?.skills;
  const skillRows = [
    { label: "PASSE", value: skills?.passing },
    { label: "DOMÍNIO", value: skills?.ball_control },
    { label: "VELOCIDADE", value: skills?.velocity },
    { label: "CHUTE", value: skills?.shooting },
    { label: "DRIBLE", value: skills?.dribbling },
    { label: "MARCAÇÃO", value: skills?.defending },
  ];
  const skillValues = skillRows
    .map((s) => s.value)
    .filter((v): v is number => v != null);
  const skillAverage = skillValues.length
    ? skillValues.reduce((a, b) => a + b, 0) / skillValues.length
    : null;

  const streak = (() => {
    let count = 0;
    for (const pelada of dashboard?.recent_peladas ?? []) {
      if (pelada.user) count += 1;
      else break;
    }
    return count;
  })();

  const presenceWeeks = dashboard?.presence ?? [];
  const absentCount = presenceWeeks.filter(
    (week) => week.status === "absent",
  ).length;
  const inactivePresenceColor = theme.palette.divider;

  const recentMatches = toRecentMatchRows(dashboard?.recent_peladas);

  const displayName = name || user?.name || "Jogador";
  const displayUsername = username || user?.username || "jogador";
  const displayPosition = position
    ? t(`common.positions.${position.toLowerCase()}`).toUpperCase()
    : "MEIO-CAMPO";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 6 }}>
      {/* Top Dark Banner */}
      <Box
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "background.paper" : "grey.900",
          borderBottom: (theme) =>
            theme.palette.mode === "dark" ? "1px solid" : "none",
          borderColor: "divider",
          px: { xs: 2, md: 4, lg: 5 },
          pt: 1,
          pb: 3.5,
        }}
      >
        <Box
          sx={{
            maxWidth: 1124,
            mx: "auto",
            display: "flex",
            alignItems: "center",
            gap: 2.75,
          }}
        >
          <SecureAvatar
            userId={user?.id}
            filename={avatarFilename ?? user?.avatar_filename}
            fallbackText={userInitials}
            sx={{
              width: 88,
              height: 88,
              bgcolor: "grey.300",
              border: (theme) =>
                `3px solid ${theme.palette.mode === "dark" ? theme.palette.divider : theme.palette.grey[100]}`,
              flexShrink: 0,
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "28px",
              color: "grey.900",
            }}
          />

          {/* User Info & Badges */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h1"
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "32px",
                lineHeight: 1.1,
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.text.primary
                    : theme.palette.grey[100],
              }}
            >
              {displayName}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: ".14em",
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.text.secondary
                    : theme.palette.grey[500],
                mt: 1,
                textTransform: "uppercase",
              }}
            >
              @{displayUsername} · {displayPosition}
            </Typography>

            <Box sx={{ display: "flex", gap: 0.9, mt: 1.75, flexWrap: "wrap" }}>
              {(summary?.titles ?? 0) > 0 && (
                <Box
                  sx={{
                    bgcolor: "gold.main",
                    color: "gold.contrastText",
                    borderRadius: "7px",
                    px: 1.1,
                    py: 0.75,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "9.5px",
                    letterSpacing: ".06em",
                  }}
                >
                  {summary?.titles} TÍTULOS
                </Box>
              )}
              {(summary?.mvp_count ?? 0) > 0 && (
                <Box
                  sx={{
                    border: (theme) =>
                      `1.5px solid ${theme.palette.mode === "dark" ? theme.palette.divider : theme.palette.grey[800]}`,
                    color: (theme) =>
                      theme.palette.mode === "dark"
                        ? theme.palette.text.primary
                        : theme.palette.grey[100],
                    borderRadius: "7px",
                    px: 1.1,
                    py: 0.6,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "9.5px",
                    letterSpacing: ".06em",
                  }}
                >
                  {summary?.mvp_count}× MVP
                </Box>
              )}
              {(summary?.garcom_count ?? 0) > 0 && (
                <Box
                  sx={{
                    border: (theme) =>
                      `1.5px solid ${theme.palette.mode === "dark" ? theme.palette.divider : theme.palette.grey[800]}`,
                    color: (theme) =>
                      theme.palette.mode === "dark"
                        ? theme.palette.text.primary
                        : theme.palette.grey[100],
                    borderRadius: "7px",
                    px: 1.1,
                    py: 0.6,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "9.5px",
                    letterSpacing: ".06em",
                  }}
                >
                  {summary?.garcom_count}× GARÇOM
                </Box>
              )}
              {streak > 1 && (
                <Box
                  sx={{
                    border: (theme) =>
                      `1.5px solid ${theme.palette.mode === "dark" ? theme.palette.divider : theme.palette.grey[800]}`,
                    color: (theme) =>
                      theme.palette.mode === "dark"
                        ? theme.palette.text.primary
                        : theme.palette.grey[100],
                    borderRadius: "7px",
                    px: 1.1,
                    py: 0.6,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "9.5px",
                    letterSpacing: ".06em",
                  }}
                >
                  SEQUÊNCIA DE {streak}
                </Box>
              )}
            </Box>
          </Box>

          {/* Stat Metrics */}
          <Box
            sx={{
              display: "flex",
              gap: 4,
              flexShrink: 0,
              pl: 3.25,
              borderLeft: (theme) =>
                `1px solid ${theme.palette.mode === "dark" ? theme.palette.divider : theme.palette.grey[800]}`,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "40px",
                  lineHeight: 1,
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.primary
                      : theme.palette.grey[100],
                }}
              >
                {formatRating(summary?.avg_rating)}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  lineHeight: 1.2,
                  letterSpacing: ".1em",
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.secondary
                      : theme.palette.grey[500],
                  mt: 0.6,
                }}
              >
                NOTA MÉDIA
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "40px",
                  lineHeight: 1,
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.primary
                      : theme.palette.grey[100],
                }}
              >
                {summary?.matches_played ?? 0}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  lineHeight: 1.2,
                  letterSpacing: ".1em",
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.secondary
                      : theme.palette.grey[500],
                  mt: 0.6,
                }}
              >
                JOGOS EM 2026
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "40px",
                  lineHeight: 1,
                  color: "gold.main",
                }}
              >
                {summary?.attendance_rate == null
                  ? "—"
                  : `${Math.round(summary.attendance_rate)}%`}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  lineHeight: 1.2,
                  letterSpacing: ".1em",
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.secondary
                      : theme.palette.grey[500],
                  mt: 0.6,
                }}
              >
                PRESENÇA
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "40px",
                  lineHeight: 1,
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.primary
                      : theme.palette.grey[100],
                }}
              >
                {summary?.titles ?? 0}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  lineHeight: 1.2,
                  letterSpacing: ".1em",
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.secondary
                      : theme.palette.grey[500],
                  mt: 0.6,
                }}
              >
                TÍTULOS
              </Typography>
            </Box>
          </Box>

          {/* Edit Button */}
          <Button
            onClick={onEditClick}
            data-testid="edit-profile-button"
            sx={{
              flexShrink: 0,
              border: (theme) =>
                `1.5px solid ${theme.palette.mode === "dark" ? theme.palette.divider : theme.palette.grey[800]}`,
              borderRadius: "11px",
              py: 1.25,
              px: 1.75,
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "11px",
              letterSpacing: ".04em",
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.text.primary
                  : theme.palette.grey[100],
              textTransform: "uppercase",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            EDITAR
          </Button>
        </Box>
      </Box>

      {/* Sub-nav Tabs Bar */}
      <Box
        sx={{
          width: "100%",
          bgcolor: "background.paper",
          borderBottom: "1.5px solid",
          borderColor: "divider",
          px: { xs: 2, md: 4, lg: 5 },
        }}
      >
        <Box sx={{ maxWidth: 1124, mx: "auto", display: "flex", gap: 0 }}>
          {[
            { id: "overview", label: "VISÃO GERAL" },
            { id: "history", label: "HISTÓRICO DE JOGOS" },
          ].map((tab) => (
            <Box
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              sx={{
                py: 1.75,
                px: 2,
                cursor: "pointer",
                borderBottom:
                  activeTab === tab.id
                    ? (theme) => `3px solid ${theme.palette.text.primary}`
                    : "none",
                fontFamily: "Archivo, sans-serif",
                fontWeight: activeTab === tab.id ? 800 : 700,
                fontSize: "12px",
                letterSpacing: ".04em",
                color: activeTab === tab.id ? "text.primary" : "text.secondary",
                lineHeight: 1,
                mb: activeTab === tab.id ? "-1.5px" : 0,
              }}
            >
              {tab.label}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Main 2-Column Content */}
      <Box sx={{ px: { xs: 2, md: 4, lg: 5 }, pt: 3.25, pb: 4 }}>
        <Box
          sx={{
            maxWidth: 1124,
            mx: "auto",
            display: "flex",
            gap: 2.25,
            alignItems: "flex-start",
          }}
        >
          {/* Left Column: Ficha de Habilidades + Últimas Peladas */}
          <Box sx={{ flex: 1.35, minWidth: 0 }}>
            {/* Ficha de Habilidades Card (omitted when the player has no ratings) */}
            {skillValues.length > 0 && (
              <Box
                sx={{
                  bgcolor: "background.paper",
                  border: (theme) =>
                    `2px solid ${theme.palette.mode === "dark" ? theme.palette.divider : theme.palette.grey[900]}`,
                  borderRadius: "20px",
                  p: 2.5,
                  boxShadow: (theme) =>
                    `6px 6px 0 ${theme.palette.mode === "dark" ? theme.palette.common.black : theme.palette.grey[900]}`,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
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
                    FICHA DE HABILIDADES
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 700,
                      fontSize: "11px",
                      color: "text.secondary",
                    }}
                  >
                    {skillAverage == null
                      ? "sem avaliações"
                      : `média ${formatSkill(skillAverage)} · ${skills?.ratings_count ?? 0} avaliações`}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.4,
                    mt: 2,
                  }}
                >
                  {skillRows.map((skill) => {
                    const pct =
                      skill.value == null ? 0 : (skill.value / 5) * 100;
                    return (
                      <Box
                        key={skill.label}
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Typography
                          sx={{
                            width: 92,
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "11px",
                            letterSpacing: ".04em",
                            color: "text.primary",
                          }}
                        >
                          {skill.label}
                        </Typography>
                        <Box
                          sx={{
                            flex: 1,
                            height: 10,
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
                            width: 26,
                            textAlign: "right",
                            fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "13px",
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

                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11.5px",
                    lineHeight: 1.45,
                    color: "text.secondary",
                    mt: 2,
                    pt: 1.75,
                    borderTop: (theme) =>
                      `1.5px dashed ${theme.palette.divider}`,
                  }}
                >
                  Notas dadas pelos companheiros depois das peladas.
                </Typography>
              </Box>
            )}

            {/* Últimas Peladas Card */}
            <Box
              sx={{
                bgcolor: "background.paper",
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "16px",
                overflow: "hidden",
                mt: 2,
              }}
            >
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

              {/* Match Rows */}
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {recentMatches.map((match, mIdx) => (
                  <Box
                    key={mIdx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.75,
                      p: "13px 16px",
                      borderBottom:
                        mIdx < recentMatches.length - 1
                          ? (theme) => `1.5px solid ${theme.palette.divider}`
                          : "none",
                    }}
                  >
                    <Box sx={{ width: 70, flexShrink: 0 }}>
                      <Typography
                        sx={{
                          fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "14px",
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
                          fontSize: "10px",
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
                          fontSize: "12px",
                          lineHeight: 1.3,
                          color: "text.primary",
                        }}
                      >
                        {match.desc}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 600,
                          fontSize: "10.5px",
                          lineHeight: 1.3,
                          color: "text.secondary",
                          mt: 0.3,
                        }}
                      >
                        {match.sub}
                      </Typography>
                    </Box>

                    {match.badge && (
                      <Box
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "9px",
                          letterSpacing: ".08em",
                          color: "gold.contrastText",
                          bgcolor: "gold.main",
                          borderRadius: "6px",
                          px: 0.9,
                          py: 0.6,
                          flexShrink: 0,
                          lineHeight: 1,
                        }}
                      >
                        {match.badge}
                      </Box>
                    )}

                    <Typography
                      sx={{
                        width: 40,
                        flexShrink: 0,
                        textAlign: "right",
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "18px",
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
          </Box>

          {/* Right Column: Presença + Group stats + Pagamentos */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Presença · 12 Semanas Card */}
            <Box
              sx={{
                bgcolor: "background.paper",
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "16px",
                p: 2.25,
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
                PRESENÇA · 12 SEMANAS
              </Typography>

              {/* 12 Bars */}
              <Box
                sx={{
                  display: "flex",
                  gap: 0.6,
                  alignItems: "flex-end",
                  mt: 2,
                  height: 44,
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
                        height: week.status === "no_game" ? 18 : 44,
                        borderRadius: "5px",
                        bgcolor: color,
                      }}
                    />
                  );
                })}
              </Box>

              {/* Legend */}
              <Box
                sx={{ display: "flex", gap: 1.75, mt: 1.5, flexWrap: "wrap" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
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
                      fontWeight: 600,
                      fontSize: "11px",
                      color: "text.secondary",
                    }}
                  >
                    presente
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: "2px",
                      bgcolor: "secondary.main",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "11px",
                      color: "text.secondary",
                    }}
                  >
                    faltou
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: "2px",
                      bgcolor: "divider",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "11px",
                      color: "text.secondary",
                    }}
                  >
                    sem jogo
                  </Typography>
                </Box>
              </Box>

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
            </Box>

            {/* Group Stats (per organization, real data) */}
            {(dashboard?.groups ?? []).map((group) => (
              <Box
                key={group.organization_id}
                sx={{
                  border: "1.5px solid",
                  borderColor: "divider",
                  borderRadius: "16px",
                  overflow: "hidden",
                  bgcolor: "background.paper",
                  mt: 1.75,
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
            ))}

            {/* Pagamentos Dark Card */}
            <Box
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "background.paper"
                    : "grey.900",
                border: (theme) =>
                  theme.palette.mode === "dark"
                    ? `1.5px solid ${theme.palette.divider}`
                    : "none",
                borderRadius: "16px",
                p: 2,
                mt: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.5px",
                  letterSpacing: ".16em",
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.secondary
                      : theme.palette.grey[500],
                  textTransform: "uppercase",
                }}
              >
                PAGAMENTOS
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  lineHeight: 1.5,
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.primary
                      : theme.palette.grey[100],
                  mt: 1.4,
                }}
              >
                Abra a tela do grupo para ver mensalidades e diárias.
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "11.5px",
                  color: "gold.main",
                  mt: 1.6,
                  cursor: "pointer",
                }}
              >
                Ver extrato →
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
