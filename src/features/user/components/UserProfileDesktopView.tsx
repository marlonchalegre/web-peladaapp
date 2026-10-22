import { useState, useMemo } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { User, UserProfileDashboard } from "../../../shared/api/endpoints";
import {
  formatRating,
  toRecentMatchRows,
  buildProfileSkillRows,
  calculateSkillAverage,
} from "../utils/profileFormat";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import {
  ProfileGroupCardsList,
  ProfilePresenceCard,
  ProfileRecentMatchesCard,
  ProfileSkillsCard,
} from "./UserProfileWidgets";

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
  const { skillRows, skillAverage } = useMemo(() => {
    const rows = buildProfileSkillRows(skills, t);
    return {
      skillRows: rows,
      skillAverage: calculateSkillAverage(rows),
    };
  }, [skills, t]);

  const streak = useMemo(() => {
    let count = 0;
    for (const pelada of dashboard?.recent_peladas ?? []) {
      if (pelada.user) count += 1;
      else break;
    }
    return count;
  }, [dashboard?.recent_peladas]);

  const presenceWeeks = dashboard?.presence ?? [];
  const absentCount = presenceWeeks.filter(
    (week) => week.status === "absent",
  ).length;

  const recentMatches = useMemo(
    () => toRecentMatchRows(dashboard?.recent_peladas, t),
    [dashboard?.recent_peladas, t],
  );

  const displayName = name || user?.name || t("common.player", "Jogador");
  const displayUsername =
    username || user?.username || t("common.player", "jogador").toLowerCase();
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
          {/* Left Column */}
          <Box sx={{ flex: 1.35, minWidth: 0 }}>
            <ProfileSkillsCard
              skillRows={skillRows}
              skillAverage={skillAverage}
              ratingsCount={skills?.ratings_count ?? 0}
              variant="desktop"
            />
            <ProfileRecentMatchesCard
              recentMatches={recentMatches}
              variant="desktop"
            />
          </Box>

          {/* Right Column */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <ProfilePresenceCard
              presenceWeeks={presenceWeeks}
              streak={streak}
              absentCount={absentCount}
              variant="desktop"
            />

            <ProfileGroupCardsList
              groups={dashboard?.groups ?? []}
              variant="desktop"
            />

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
