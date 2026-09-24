import { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { User, UserProfileDashboard } from "../../../shared/api/endpoints";
import {
  formatRating,
  formatSkill,
  toRecentMatchRows,
} from "../utils/profileFormat";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";

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

  const recentMatches = toRecentMatchRows(dashboard?.recent_peladas);

  const displayName = name || user?.name || "Jogador";
  const displayUsername = username || user?.username || "jogador";
  const displayPosition = position
    ? t(`common.positions.${position.toLowerCase()}`).toUpperCase()
    : "MEIO-CAMPO";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f4ee", pb: 6 }}>
      {/* Top Dark Banner */}
      <Box
        sx={{ bgcolor: "#17181a", px: { xs: 2, md: 4, lg: 5 }, pt: 1, pb: 3.5 }}
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
              bgcolor: "#d8d2c4",
              border: "3px solid #f6f4ee",
              flexShrink: 0,
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "28px",
              color: "#17181a",
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
                color: "#f6f4ee",
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
                color: "#9a958a",
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
                    bgcolor: "#f2a100",
                    color: "#17181a",
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
                    border: "1.5px solid #3a3b3e",
                    color: "#f6f4ee",
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
                    border: "1.5px solid #3a3b3e",
                    color: "#f6f4ee",
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
                    border: "1.5px solid #3a3b3e",
                    color: "#f6f4ee",
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
              borderLeft: "1px solid #2e2f31",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "40px",
                  lineHeight: 1,
                  color: "#f6f4ee",
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
                  color: "#9a958a",
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
                  color: "#f6f4ee",
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
                  color: "#9a958a",
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
                  color: "#f2a100",
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
                  color: "#9a958a",
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
                  color: "#f6f4ee",
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
                  color: "#9a958a",
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
              border: "1.5px solid #3a3b3e",
              borderRadius: "11px",
              py: 1.25,
              px: 1.75,
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "11px",
              letterSpacing: ".04em",
              color: "#f6f4ee",
              textTransform: "uppercase",
              "&:hover": { bgcolor: "#242628" },
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
          bgcolor: "#fff",
          borderBottom: "1.5px solid #eae6db",
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
                  activeTab === tab.id ? "3px solid #17181a" : "none",
                fontFamily: "Archivo, sans-serif",
                fontWeight: activeTab === tab.id ? 800 : 700,
                fontSize: "12px",
                letterSpacing: ".04em",
                color: activeTab === tab.id ? "#17181a" : "#6b675c",
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
                  bgcolor: "#fff",
                  border: "2px solid #17181a",
                  borderRadius: "20px",
                  p: 2.5,
                  boxShadow: "6px 6px 0 #17181a",
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
                      color: "#6b675c",
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
                      color: "#6b675c",
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
                            color: "#17181a",
                          }}
                        >
                          {skill.label}
                        </Typography>
                        <Box
                          sx={{
                            flex: 1,
                            height: 10,
                            borderRadius: "5px",
                            bgcolor: "#eae6db",
                            display: "flex",
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              width: `${pct}%`,
                              bgcolor:
                                (skill.value ?? 0) < 3 ? "#a8452a" : "#146b3a",
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
                            color: "#17181a",
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
                    color: "#6b675c",
                    mt: 2,
                    pt: 1.75,
                    borderTop: "1.5px dashed #ddd8cc",
                  }}
                >
                  Notas dadas pelos companheiros depois das peladas.
                </Typography>
              </Box>
            )}

            {/* Últimas Peladas Card */}
            <Box
              sx={{
                bgcolor: "#fff",
                border: "1.5px solid #eae6db",
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
                  borderBottom: "1.5px solid #f2efe7",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "9.5px",
                    letterSpacing: ".16em",
                    color: "#6b675c",
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
                    color: "#146b3a",
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
                          ? "1.5px solid #f2efe7"
                          : "none",
                    }}
                  >
                    <Box sx={{ width: 70, flexShrink: 0 }}>
                      <Typography
                        sx={{
                          fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "14px",
                          color: "#17181a",
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
                          color: "#6b675c",
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
                          color: "#17181a",
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
                          color: "#6b675c",
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
                          color: "#17181a",
                          bgcolor: "#f2a100",
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
                        color: "#17181a",
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
                bgcolor: "#fff",
                border: "1.5px solid #eae6db",
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
                  color: "#6b675c",
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
                      ? "#146b3a"
                      : week.status === "absent"
                        ? "#a8452a"
                        : "#eae6db";
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
                      bgcolor: "#146b3a",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "11px",
                      color: "#6b675c",
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
                      bgcolor: "#a8452a",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "11px",
                      color: "#6b675c",
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
                      bgcolor: "#eae6db",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "11px",
                      color: "#6b675c",
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
                  color: "#6b675c",
                  mt: 1.6,
                  pt: 1.5,
                  borderTop: "1.5px dashed #ddd8cc",
                }}
              >
                Maior sequência:{" "}
                <Box
                  component="strong"
                  sx={{ color: "#17181a", fontWeight: 800 }}
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
                  border: "1.5px solid #eae6db",
                  borderRadius: "16px",
                  overflow: "hidden",
                  bgcolor: "#fff",
                  mt: 1.75,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: "11px 14px",
                    bgcolor: "#f4f8f5",
                    borderBottom: "1.5px solid #eae6db",
                  }}
                >
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: "2px",
                      bgcolor: "#146b3a",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "11px",
                      color: "#17181a",
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
                      color: "#6b675c",
                      textTransform: "uppercase",
                    }}
                  >
                    FUTEBOL
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "1px",
                    bgcolor: "#eae6db",
                  }}
                >
                  {[
                    {
                      label: "JOGOS",
                      val: group.peladas_played,
                      color: "#17181a",
                    },
                    { label: "GOLS", val: group.goals, color: "#17181a" },
                    {
                      label: "ASSIST.",
                      val: group.assists,
                      color: "#146b3a",
                    },
                    { label: "TÍTULOS", val: group.titles, color: "#17181a" },
                  ].map((item) => (
                    <Box
                      key={item.label}
                      sx={{ bgcolor: "#fff", p: "12px 9px" }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "23px",
                          lineHeight: 1,
                          color: item.color,
                        }}
                      >
                        {item.val}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "8px",
                          lineHeight: 1.2,
                          letterSpacing: ".08em",
                          color: "#6b675c",
                          mt: 0.5,
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}

            {/* Pagamentos Dark Card */}
            <Box
              sx={{
                bgcolor: "#17181a",
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
                  color: "#9a958a",
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
                  color: "#f6f4ee",
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
                  color: "#f2a100",
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
