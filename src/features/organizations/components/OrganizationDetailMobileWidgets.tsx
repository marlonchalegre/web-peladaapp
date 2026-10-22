import { useMemo } from "react";
import { Avatar, Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import type {
  OrganizationPlayerStats,
  Pelada,
  PeladaHistoryEntry,
  Player,
  User,
} from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { getInitials } from "../../../shared/utils/initials";
import { AVATAR_BG_COLORS } from "../../peladas/utils/playerUtils";
import {
  daysUntil,
  formatDayMonth,
  formatTime,
  formatWeekday,
  formatMonth,
  compactActionBtnSx,
  clickableRowSx,
} from "../utils/organizationDetailUtils";

/* -------------------------------------------------- */
/* 1. MobileNextPeladaCard                            */
/* -------------------------------------------------- */

interface MobileNextPeladaCardProps {
  activePelada: Pelada;
  nowTs: number;
}

export function MobileNextPeladaCard({
  activePelada,
  nowTs,
}: MobileNextPeladaCardProps) {
  const navigate = useNavigate();

  return (
    <Box sx={{ px: 2.5, pt: 2.5 }}>
      <Typography
        sx={{
          font: "700 9.5px/1 Archivo,sans-serif",
          letterSpacing: ".18em",
          color: "text.secondary",
          mb: 1.25,
        }}
      >
        PRÓXIMA PELADA
      </Typography>
      <Box
        data-testid="member-next-pelada-card"
        onClick={() => navigate(`/peladas/${activePelada.id}/attendance`)}
        sx={{
          bgcolor: "background.paper",
          border: (theme) =>
            theme.palette.mode === "dark"
              ? `1px solid ${theme.palette.divider}`
              : theme.palette.brutalist?.border ||
                `2px solid ${theme.palette.divider}`,
          borderRadius: "18px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "transform 0.12s ease",
          "&:hover": {
            transform: "translateY(-1px)",
          },
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 4px 20px rgba(0,0,0,0.5)"
              : theme.palette.brutalist?.shadow ||
                `5px 5px 0 ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            bgcolor: "primary.main",
            px: 2,
            py: 1.1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              font: "800 11px/1 Archivo,sans-serif",
              letterSpacing: ".1em",
              color: "primary.contrastText",
            }}
          >
            LISTA ABERTA
          </Typography>
          <Typography
            sx={{
              font: "700 11px/1 Archivo,sans-serif",
              color: "primary.contrastText",
            }}
          >
            {daysUntil(activePelada.scheduled_at, nowTs) === 0
              ? "fecha hoje"
              : `fecha em ${daysUntil(activePelada.scheduled_at, nowTs)} dia${
                  (daysUntil(activePelada.scheduled_at, nowTs) || 0) > 1
                    ? "s"
                    : ""
                }`}
          </Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 1.5,
            }}
          >
            <Typography
              sx={{
                font: "700 58px/0.82 'Archivo Narrow',Archivo,sans-serif",
                letterSpacing: "-.03em",
                color: "text.primary",
              }}
            >
              {activePelada.scheduled_at
                ? new Date(activePelada.scheduled_at).getDate()
                : "—"}
            </Typography>
            <Box sx={{ pb: 0.6 }}>
              <Typography
                sx={{
                  font: "800 13.5px/1.1 Archivo,sans-serif",
                  color: "text.primary",
                }}
              >
                {formatWeekday(activePelada.scheduled_at)}
              </Typography>
              <Typography
                sx={{
                  font: "600 12.5px/1.3 Archivo,sans-serif",
                  color: "text.secondary",
                }}
              >
                {formatMonth(activePelada.scheduled_at)} ·{" "}
                {formatTime(activePelada.scheduled_at)}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mt: 1.75,
              pt: 1.5,
              borderTop: "1.5px dashed",
              borderColor: "divider",
            }}
          >
            <Box sx={{ display: "flex" }}>
              {(activePelada.confirmed_preview || "")
                .split("|")
                .filter(Boolean)
                .slice(0, 3)
                .map((name, idx) => (
                  <Avatar
                    key={`${name}-${idx}`}
                    sx={{
                      width: 28,
                      height: 28,
                      border: (theme) =>
                        `2px solid ${theme.palette.background.paper}`,
                      ml: idx === 0 ? 0 : "-8px",
                      bgcolor: AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length],
                      color: "text.primary",
                      font: "800 9.5px Archivo,sans-serif",
                    }}
                  >
                    {getInitials(name)}
                  </Avatar>
                ))}
              {Math.max(
                0,
                (activePelada.confirmed_count || 0) -
                  (activePelada.confirmed_preview || "")
                    .split("|")
                    .filter(Boolean)
                    .slice(0, 3).length,
              ) > 0 && (
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    border: (theme) =>
                      `2px solid ${theme.palette.background.paper}`,
                    ml: "-8px",
                    bgcolor: "action.hover",
                    color: "text.primary",
                    font: "800 9px Archivo,sans-serif",
                  }}
                >
                  +
                  {Math.max(
                    0,
                    (activePelada.confirmed_count || 0) -
                      (activePelada.confirmed_preview || "")
                        .split("|")
                        .filter(Boolean)
                        .slice(0, 3).length,
                  )}
                </Avatar>
              )}
            </Box>
            <Typography
              sx={{
                font: "700 12px/1.3 Archivo,sans-serif",
                color: "text.primary",
              }}
            >
              {activePelada.confirmed_count || 0}{" "}
              <Box
                component="span"
                sx={{ color: "text.secondary", fontWeight: 600 }}
              >
                de {activePelada.max_players || "—"} na lista
              </Box>
            </Typography>
          </Box>

          <Button
            component={RouterLink}
            to={`/peladas/${activePelada.id}/attendance`}
            fullWidth
            data-testid="member-next-pelada-cta"
            sx={{
              mt: 2,
              borderRadius: "14px",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              py: 2,
              font: "800 17px/1 Archivo,sans-serif",
              letterSpacing: ".04em",
              boxShadow: (theme) => `0 3px 0 ${theme.palette.primary.dark}`,
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            BORA PRO JOGO
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

/* -------------------------------------------------- */
/* 2. MobileSeasonPodiumCard                          */
/* -------------------------------------------------- */

interface MobileSeasonPodiumCardProps {
  orgId: string;
  memberStats: OrganizationPlayerStats[];
  currentUser?: User | null;
}

export function MobileSeasonPodiumCard({
  orgId,
  memberStats,
  currentUser,
}: MobileSeasonPodiumCardProps) {
  const { topScorer, topAssister, myStat, myBest } = useMemo(() => {
    const scorer = [...memberStats].sort(
      (a, b) => (b.goal || 0) - (a.goal || 0),
    )[0];
    const assister = [...memberStats].sort(
      (a, b) => (b.assist || 0) - (a.assist || 0),
    )[0];

    const mine = memberStats.find(
      (s) =>
        (currentUser?.id && s.user_id === currentUser.id) ||
        (currentUser?.id && s.player_id === currentUser.id),
    );

    const rankOf = (
      stat: OrganizationPlayerStats | undefined,
      key: "goal" | "assist" | "peladas_played" | "avg_rating",
    ) => {
      if (!stat) return null;
      const sorted = [...memberStats].sort(
        (a, b) => ((b[key] as number) || 0) - ((a[key] as number) || 0),
      );
      const idx = sorted.findIndex((s) => s.player_id === stat.player_id);
      return idx >= 0 ? idx + 1 : null;
    };

    const highlights = [
      {
        key: "goal",
        value: mine?.goal || 0,
        rank: rankOf(mine, "goal"),
        label: "artilheiro",
      },
      {
        key: "assist",
        value: mine?.assist || 0,
        rank: rankOf(mine, "assist"),
        label: "garçom",
      },
      {
        key: "peladas_played",
        value: mine?.peladas_played || 0,
        rank: rankOf(mine, "peladas_played"),
        label: "em presença",
      },
      {
        key: "avg_rating",
        value: Number((mine?.avg_rating || 0).toFixed(1)),
        rank: rankOf(mine, "avg_rating"),
        label: "em nota",
      },
    ]
      .filter((h) => h.rank !== null && h.value > 0)
      .sort((a, b) => (a.rank || 0) - (b.rank || 0));

    return {
      topScorer: scorer,
      topAssister: assister,
      myStat: mine,
      myBest: mine ? highlights[0] : undefined,
    };
  }, [memberStats, currentUser?.id]);

  return (
    <Box sx={{ px: 2.5, pt: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          mb: 1.5,
        }}
      >
        <Typography
          sx={{
            font: "700 9.5px/1 Archivo,sans-serif",
            letterSpacing: ".18em",
            color: "text.secondary",
          }}
        >
          PÓDIO DA TEMPORADA
        </Typography>
        <Typography
          component={RouterLink}
          to={`/organizations/${orgId}/statistics`}
          sx={{
            font: "700 11px/1 Archivo,sans-serif",
            color: "primary.main",
            textDecoration: "none",
          }}
        >
          Ver tudo →
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        {topScorer && (
          <Box
            sx={{
              flex: 1,
              bgcolor: "background.paper",
              border: "1.5px solid",
              borderColor: "divider",
              borderRadius: "14px",
              p: "12px 11px",
            }}
          >
            <Typography
              sx={{
                font: "700 8.5px/1 Archivo,sans-serif",
                letterSpacing: ".12em",
                color: "text.secondary",
              }}
            >
              ARTILHEIRO
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 1.25,
              }}
            >
              <SecureAvatar
                userId={topScorer.user_id}
                filename={topScorer.avatar_filename}
                fallbackText={getInitials(topScorer.player_name)}
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: AVATAR_BG_COLORS[0],
                  color: "text.primary",
                  font: "800 9.5px Archivo,sans-serif",
                }}
              />
              <Typography
                sx={{
                  font: "700 25px/1 'Archivo Narrow',Archivo,sans-serif",
                  color: "text.primary",
                }}
              >
                {topScorer.goal || 0}
              </Typography>
            </Box>
            <Typography
              noWrap
              sx={{
                font: "700 11px/1.3 Archivo,sans-serif",
                color: "text.primary",
                mt: 1,
              }}
            >
              {topScorer.player_name}
            </Typography>
          </Box>
        )}

        {topAssister && (
          <Box
            sx={{
              flex: 1,
              bgcolor: "background.paper",
              border: "1.5px solid",
              borderColor: "divider",
              borderRadius: "14px",
              p: "12px 11px",
            }}
          >
            <Typography
              sx={{
                font: "700 8.5px/1 Archivo,sans-serif",
                letterSpacing: ".12em",
                color: "text.secondary",
              }}
            >
              GARÇOM
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 1.25,
              }}
            >
              <SecureAvatar
                userId={topAssister.user_id}
                filename={topAssister.avatar_filename}
                fallbackText={getInitials(topAssister.player_name)}
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: AVATAR_BG_COLORS[1 % AVATAR_BG_COLORS.length],
                  color: "text.primary",
                  font: "800 9.5px Archivo,sans-serif",
                }}
              />
              <Typography
                sx={{
                  font: "700 25px/1 'Archivo Narrow',Archivo,sans-serif",
                  color: "text.primary",
                }}
              >
                {topAssister.assist || 0}
              </Typography>
            </Box>
            <Typography
              noWrap
              sx={{
                font: "700 11px/1.3 Archivo,sans-serif",
                color: "text.primary",
                mt: 1,
              }}
            >
              {topAssister.player_name}
            </Typography>
          </Box>
        )}

        {myBest && myStat && (
          <Box
            data-testid="member-podium-you"
            sx={{
              flex: 1,
              bgcolor: (theme) =>
                theme.palette.status?.paid?.bg || "action.hover",
              border: "2px solid",
              borderColor: "primary.main",
              borderRadius: "14px",
              p: "12px 11px",
            }}
          >
            <Typography
              sx={{
                font: "700 8.5px/1 Archivo,sans-serif",
                letterSpacing: ".12em",
                color: "primary.main",
              }}
            >
              VOCÊ
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 1.25,
              }}
            >
              <SecureAvatar
                userId={myStat.user_id}
                filename={myStat.avatar_filename}
                fallbackText={getInitials(myStat.player_name)}
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  font: "800 9.5px Archivo,sans-serif",
                }}
              />
              <Typography
                sx={{
                  font: "700 25px/1 'Archivo Narrow',Archivo,sans-serif",
                  color: "text.primary",
                }}
              >
                {myBest.value}
              </Typography>
            </Box>
            <Typography
              noWrap
              sx={{
                font: "700 11px/1.3 Archivo,sans-serif",
                color: "text.primary",
                mt: 1,
              }}
            >
              {myBest.rank}º {myBest.label}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* -------------------------------------------------- */
/* 3. MobileRosterCard                                */
/* -------------------------------------------------- */

interface MobileRosterCardProps {
  players: Player[];
  onOpenRosterDialog: () => void;
}

export function MobileRosterCard({
  players,
  onOpenRosterDialog,
}: MobileRosterCardProps) {
  const rosterPreview = players.slice(0, 7);
  const rosterOverflow = Math.max(0, players.length - rosterPreview.length);

  return (
    <Box sx={{ px: 2.5, pt: 2.5 }}>
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
            justifyContent: "space-between",
            alignItems: "center",
            p: "14px 16px 10px",
          }}
        >
          <Box>
            <Typography
              sx={{
                font: "700 9.5px/1 Archivo,sans-serif",
                letterSpacing: ".14em",
                color: "text.secondary",
              }}
            >
              ELENCO · {players.length}
            </Typography>
            <Typography
              sx={{
                font: "800 13px/1.2 Archivo,sans-serif",
                color: "text.primary",
                mt: 0.5,
              }}
            >
              {players.length} atletas cadastrados
            </Typography>
          </Box>
          <Typography
            component="button"
            onClick={onOpenRosterDialog}
            sx={{
              ...compactActionBtnSx,
              border: "none",
              bgcolor: "transparent",
              color: "primary.main",
              p: 0,
              font: "700 11px/1 Archivo,sans-serif",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Ver todos →
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            pb: 2,
            pt: 0.5,
          }}
        >
          {rosterPreview.map((p, idx) => (
            <SecureAvatar
              key={p.id}
              userId={p.user_id}
              filename={p.user_avatar_filename}
              fallbackText={getInitials(p.user_name || "")}
              sx={{
                width: 32,
                height: 32,
                border: (theme) =>
                  `2px solid ${theme.palette.background.paper}`,
                ml: idx === 0 ? 0 : "-8px",
                bgcolor: AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length],
                color: "text.primary",
                font: "800 10.5px Archivo,sans-serif",
              }}
            />
          ))}
          {rosterOverflow > 0 && (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                border: (theme) =>
                  `2px solid ${theme.palette.background.paper}`,
                ml: "-8px",
                bgcolor: "action.hover",
                color: "text.primary",
                font: "800 10px Archivo,sans-serif",
              }}
            >
              +{rosterOverflow}
            </Avatar>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* -------------------------------------------------- */
/* 4. MobileGroupHistoryCard                          */
/* -------------------------------------------------- */

interface MobileGroupHistoryCardProps {
  historyEntries: PeladaHistoryEntry[];
  totalPeladas: number;
}

export function MobileGroupHistoryCard({
  historyEntries,
  totalPeladas,
}: MobileGroupHistoryCardProps) {
  const navigate = useNavigate();

  return (
    <Box sx={{ px: 2.5, pt: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          mb: 1.25,
        }}
      >
        <Typography
          sx={{
            font: "700 9.5px/1 Archivo,sans-serif",
            letterSpacing: ".18em",
            color: "text.secondary",
          }}
        >
          HISTÓRICO DO GRUPO
        </Typography>
        <Typography
          sx={{
            font: "700 11px/1 Archivo,sans-serif",
            color: "text.secondary",
          }}
        >
          {totalPeladas} peladas
        </Typography>
      </Box>

      <Box
        sx={{
          bgcolor: "background.paper",
          border: "1.5px solid",
          borderColor: "divider",
          borderRadius: "16px",
          px: 1.75,
        }}
      >
        {historyEntries.map((entry, idx) => {
          const line = entry.user;
          const badge = !line
            ? { label: "FALTA", color: "text.secondary", isTitle: false }
            : line.team_position === 1
              ? { label: "TÍTULO", color: "primary.main", isTitle: true }
              : line.team_position
                ? {
                    label: `${line.team_position}º`,
                    color: "text.secondary",
                    isTitle: false,
                  }
                : null;
          const subtitle = line
            ? [
                line.is_mvp ? "MVP: você" : null,
                `você: ${line.goals} gol${line.goals === 1 ? "" : "s"}`,
                line.assists > 0 ? `${line.assists} assist.` : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : "Você não foi";

          return (
            <Box
              key={entry.id}
              data-testid="history-row"
              onClick={() => navigate(`/peladas/${entry.id}`)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                py: "13px",
                borderBottom:
                  idx === historyEntries.length - 1 ? "none" : "1.5px solid",
                borderBottomColor: "divider",
                ...clickableRowSx,
              }}
            >
              <Typography
                sx={{
                  width: 46,
                  flexShrink: 0,
                  font: "700 13px/1.2 'Archivo Narrow',Archivo,sans-serif",
                  color: "text.primary",
                }}
              >
                {formatDayMonth(entry.scheduled_at)}
              </Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    font: "700 12.5px/1.2 Archivo,sans-serif",
                    color: "text.primary",
                  }}
                >
                  {entry.matches_count} partida
                  {entry.matches_count === 1 ? "" : "s"} · {entry.players_count}{" "}
                  jogadores
                </Typography>
                <Typography
                  sx={{
                    font: "600 10.5px/1.3 Archivo,sans-serif",
                    color: "text.secondary",
                    mt: 0.25,
                  }}
                >
                  {subtitle}
                </Typography>
              </Box>
              {badge && (
                <Box
                  sx={{
                    flexShrink: 0,
                    font: "700 9px/1 Archivo,sans-serif",
                    letterSpacing: ".06em",
                    color: badge.isTitle ? "primary.main" : badge.color,
                    border: "1.5px solid",
                    borderColor: badge.isTitle ? "primary.main" : "divider",
                    borderRadius: "6px",
                    p: "4px 6px",
                  }}
                >
                  {badge.label}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/* -------------------------------------------------- */
/* 6. OrganizationMobileActionTiles                   */
/* -------------------------------------------------- */

interface OrganizationMobileActionTilesProps {
  orgId: string;
  statsEnabled: boolean;
  onOpenRoster: () => void;
}

export function OrganizationMobileActionTiles({
  orgId,
  statsEnabled,
  onOpenRoster,
}: OrganizationMobileActionTilesProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
      <Box
        {...(statsEnabled
          ? {
              component: RouterLink,
              to: `/organizations/${orgId}/statistics`,
            }
          : { component: "button", disabled: true })}
        data-testid="org-statistics-button"
        data-analytics-id="view-org-statistics-btn"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 1.1,
          bgcolor: statsEnabled
            ? (theme) =>
                theme.palette.mode === "dark" ? "action.hover" : "text.primary"
            : "action.disabledBackground",
          borderRadius: "13px",
          p: "11px 13px",
          cursor: statsEnabled ? "pointer" : "not-allowed",
          textDecoration: "none",
          border: 0,
          opacity: statsEnabled ? 1 : 0.6,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: "2px",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 3.5,
              height: 8,
              bgcolor: (theme) =>
                theme.palette.gold?.main || theme.palette.primary.main,
              borderRadius: "1px",
            }}
          />
          <Box
            sx={{
              width: 3.5,
              height: 13,
              bgcolor: (theme) =>
                theme.palette.gold?.main || theme.palette.primary.main,
              borderRadius: "1px",
            }}
          />
          <Box
            sx={{
              width: 3.5,
              height: 17,
              bgcolor: (theme) =>
                theme.palette.gold?.main || theme.palette.primary.main,
              borderRadius: "1px",
            }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              font: "800 11px/1 Archivo,sans-serif",
              letterSpacing: ".04em",
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? "text.primary"
                  : "background.paper",
            }}
          >
            {t("organizations.detail.button.statistics", "ESTATÍSTICAS")}
          </Typography>
          <Typography
            sx={{
              font: "600 9.5px/1.2 Archivo,sans-serif",
              color: "text.secondary",
              mt: 0.35,
            }}
          >
            artilharia, presença, títulos
          </Typography>
        </Box>
        <Typography
          sx={{
            font: "700 15px/1 Archivo,sans-serif",
            color: "text.secondary",
          }}
        >
          ›
        </Typography>
      </Box>

      <Box
        component="button"
        onClick={onOpenRoster}
        data-testid="org-roster-button"
        sx={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          border: "1.5px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          borderRadius: "13px",
          p: "10px 13px",
          cursor: "pointer",
        }}
      >
        <Box
          sx={{
            width: 15,
            height: 15,
            borderRadius: "50%",
            border: (theme) => `2px solid ${theme.palette.text.primary}`,
          }}
        />
        <Typography
          sx={{
            font: "800 8.5px/1 Archivo,sans-serif",
            letterSpacing: ".06em",
            color: "text.primary",
          }}
        >
          ELENCO
        </Typography>
      </Box>
    </Box>
  );
}
export {
  MobileAdminAgendaCard,
  type MobileAdminAgendaCardProps,
} from "./OrganizationAdminAgendaCard";
