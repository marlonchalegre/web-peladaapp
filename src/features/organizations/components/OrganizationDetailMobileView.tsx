import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import SettingsIcon from "@mui/icons-material/Settings";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type {
  Organization,
  OrganizationFeatureFlags,
  OrganizationPlayerStats,
  Pelada,
  PeladaHistoryEntry,
  Player,
  MonthlyWaitlistStatus,
  User,
} from "../../../shared/api/endpoints";
import CreatePeladaForm, { type CreatePeladaPayload } from "./CreatePeladaForm";
import OrganizationRosterDialog from "./OrganizationRosterDialog";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { getInitials } from "../../../shared/utils/initials";

interface OrganizationDetailMobileViewProps {
  org: Organization;
  peladas: Pelada[];
  totalPeladas: number;
  historyByPelada: Record<string, PeladaHistoryEntry>;
  players: Player[];
  isAdmin: boolean;
  featureFlags: OrganizationFeatureFlags | null;
  waitlistStatus: MonthlyWaitlistStatus | null;
  waitlistLoading: boolean;
  currentPlayer: Player | null;
  currentUser?: User | null;
  memberStats: OrganizationPlayerStats[];
  onJoinWaitlist: () => void;
  onLeaveWaitlist: () => void;
  onCreatePelada: (payload: CreatePeladaPayload) => Promise<void>;
  onDeletePelada: (pelada: Pelada) => void;
  onLeaveOrg: () => void;
  onLoadMore: () => void;
}

const AVATAR_BG_COLORS = [
  "#c9d9cd",
  "#dcd3bd",
  "#cdd6e0",
  "#e2cfc7",
  "#d3cfc4",
  "#d8d2c4",
  "#cfd8cd",
];

const formatMemberType = (memberType?: string) => {
  switch (memberType) {
    case "mensalista":
      return "MENSALISTA";
    case "mensalista_temporario":
      return "MENSALISTA TEMPORÁRIO";
    case "diarista":
      return "DIARISTA";
    case "diarista_temporario":
      return "DIARISTA TEMPORÁRIO";
    case "convidado":
      return "CONVIDADO";
    default:
      return "MEMBRO";
  }
};

const isCandidate = (memberType?: string) =>
  memberType !== "mensalista" && memberType !== "mensalista_temporario";

const daysUntil = (dateStr: string | null | undefined, nowTs: number) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - nowTs;
  if (Number.isNaN(diff)) return null;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const formatDayMonth = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
};

const formatTime = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatWeekday = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { weekday: "long" }).toUpperCase();
};

const formatMonth = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { month: "long" });
};

export default function OrganizationDetailMobileView({
  org,
  peladas,
  totalPeladas,
  historyByPelada,
  players,
  isAdmin,
  featureFlags,
  waitlistStatus,
  waitlistLoading,
  currentPlayer,
  currentUser,
  memberStats,
  onJoinWaitlist,
  onLeaveWaitlist,
  onCreatePelada,
  onDeletePelada,
  onLeaveOrg,
  onLoadMore,
}: OrganizationDetailMobileViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [nowTs, setNowTs] = useState(0);

  useEffect(() => {
    setNowTs(Date.now());
  }, []);

  const words = org.name.split(" ").filter(Boolean);
  const orgInitials =
    words.length > 1
      ? words
          .map((w) => w[0])
          .slice(0, 3)
          .join("")
          .toUpperCase()
      : org.name.slice(0, 4).toUpperCase();

  const statsEnabled = featureFlags?.org_statistics !== false;

  const openPeladas = peladas.filter(
    (p) => p.status === "attendance" || p.status === "open",
  );
  const closedPeladas = peladas.filter(
    (p) => p.status !== "attendance" && p.status !== "open",
  );
  const activePelada = openPeladas[0];

  const handleCloseMenu = () => setMenuAnchor(null);

  // Member podium data
  const topScorer = [...memberStats].sort(
    (a, b) => (b.goal || 0) - (a.goal || 0),
  )[0];
  const topAssister = [...memberStats].sort(
    (a, b) => (b.assist || 0) - (a.assist || 0),
  )[0];

  const myStat = memberStats.find(
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

  const myHighlights = [
    {
      key: "goal",
      value: myStat?.goal || 0,
      rank: rankOf(myStat, "goal"),
      label: "artilheiro",
    },
    {
      key: "assist",
      value: myStat?.assist || 0,
      rank: rankOf(myStat, "assist"),
      label: "garçom",
    },
    {
      key: "peladas_played",
      value: myStat?.peladas_played || 0,
      rank: rankOf(myStat, "peladas_played"),
      label: "em presença",
    },
    {
      key: "avg_rating",
      value: Number((myStat?.avg_rating || 0).toFixed(1)),
      rank: rankOf(myStat, "avg_rating"),
      label: "em nota",
    },
  ]
    .filter((h) => h.rank !== null && h.value > 0)
    .sort((a, b) => (a.rank || 0) - (b.rank || 0));

  const myBest = myStat ? myHighlights[0] : undefined;

  const historyEntries = Object.values(historyByPelada)
    .filter((h) => h.scheduled_at)
    .sort(
      (a, b) =>
        new Date(b.scheduled_at || 0).getTime() -
        new Date(a.scheduled_at || 0).getTime(),
    )
    .slice(0, 4);

  const rosterPreview = players.slice(0, 7);
  const rosterOverflow = Math.max(0, players.length - rosterPreview.length);

  const visiblePeladas = [...openPeladas, ...closedPeladas];
  const rangeStart = visiblePeladas.length === 0 ? 0 : 1;
  const rangeEnd = visiblePeladas.length;
  const hasMore = rangeEnd < totalPeladas;

  const scheduleSuggestion = (() => {
    const weekdays: Record<string, number> = {};
    const times: Record<string, number> = {};
    peladas.forEach((p) => {
      if (!p.scheduled_at) return;
      const date = new Date(p.scheduled_at);
      if (Number.isNaN(date.getTime())) return;
      const weekday = date
        .toLocaleDateString("pt-BR", { weekday: "long" })
        .split("-")[0];
      weekdays[weekday] = (weekdays[weekday] || 0) + 1;
      const time = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      times[time] = (times[time] || 0) + 1;
    });
    const top = (counts: Record<string, number>) =>
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const weekday = top(weekdays);
    const time = top(times);
    if (!weekday) return "TODA SEMANA";
    const prefix =
      weekday === "sábado" || weekday === "domingo" ? "TODO" : "TODA";
    return `${prefix} ${weekday.toUpperCase()}${time ? `, ${time}` : ""}`;
  })();

  const renderTiles = () => (
    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
      <Box
        {...(statsEnabled
          ? {
              component: RouterLink,
              to: `/organizations/${org.id}/statistics`,
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
            ? (theme) => (theme.palette.mode === "dark" ? "#242628" : "#17181a")
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
              bgcolor: "#f2a100",
              borderRadius: "1px",
            }}
          />
          <Box
            sx={{
              width: 3.5,
              height: 13,
              bgcolor: "#f2a100",
              borderRadius: "1px",
            }}
          />
          <Box
            sx={{
              width: 3.5,
              height: 17,
              bgcolor: "#f2a100",
              borderRadius: "1px",
            }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              font: "800 11px/1 Archivo,sans-serif",
              letterSpacing: ".04em",
              color: "#ffffff",
            }}
          >
            {t("organizations.detail.button.statistics", "ESTATÍSTICAS")}
          </Typography>
          <Typography
            sx={{
              font: "600 9.5px/1.2 Archivo,sans-serif",
              color: "#9a958a",
              mt: 0.35,
            }}
          >
            artilharia, presença, títulos
          </Typography>
        </Box>
        <Typography
          sx={{ font: "700 15px/1 Archivo,sans-serif", color: "#9a958a" }}
        >
          ›
        </Typography>
      </Box>

      <Box
        component="button"
        onClick={() => setRosterOpen(true)}
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
            border: (theme) =>
              theme.palette.mode === "dark"
                ? "2px solid #ffffff"
                : "2px solid #17181a",
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

  const renderOpenPeladaCard = (pelada: Pelada) => {
    const confirmed = pelada.confirmed_count ?? 0;
    const max = pelada.max_players ?? 0;
    const progress = max > 0 ? Math.min(100, (confirmed / max) * 100) : 0;

    return (
      <Box
        key={pelada.id}
        data-testid={`mobile-open-pelada-${pelada.id}`}
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(20, 107, 58, 0.15)"
              : "#f4f8f5",
          border: "2px solid #146b3a",
          borderRadius: "16px",
          p: "13px 14px",
          mb: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography
            sx={{
              font: "700 13px/1 'Archivo Narrow',Archivo,sans-serif",
              color: "text.primary",
            }}
          >
            {formatDayMonth(pelada.scheduled_at)} ·{" "}
            {formatWeekday(pelada.scheduled_at).slice(0, 3)} ·{" "}
            {formatTime(pelada.scheduled_at)}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {isAdmin && (
              <IconButton
                aria-label={t("organizations.peladas.aria.delete")}
                onClick={() => onDeletePelada(pelada)}
                size="small"
                sx={{ color: "#a8452a", p: 0.5 }}
              >
                <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            <Box
              sx={{
                font: "800 9px/1 Archivo,sans-serif",
                letterSpacing: ".08em",
                color: "#ffffff",
                bgcolor: "#146b3a",
                borderRadius: "6px",
                p: "5px 7px",
                flexShrink: 0,
              }}
            >
              LISTA ABERTA
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            mt: 1.25,
          }}
        >
          <Box
            sx={{
              flex: 1,
              height: 6,
              borderRadius: 4,
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.12)"
                  : "#dfe8e1",
              overflow: "hidden",
              display: "flex",
            }}
          >
            <Box sx={{ width: `${progress}%`, bgcolor: "#146b3a" }} />
          </Box>
          <Typography
            sx={{
              font: "700 11.5px/1 Archivo,sans-serif",
              color: "text.primary",
            }}
          >
            {confirmed}/{max || "—"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
          <Box
            component="button"
            onClick={() => navigate(`/peladas/${pelada.id}/attendance`)}
            data-testid={`mobile-close-pelada-${pelada.id}`}
            sx={{
              flex: 1,
              border: 0,
              borderRadius: "11px",
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "#2d3035" : "#17181a",
              color: "#ffffff",
              p: "11px 0",
              font: "800 11px/1 Archivo,sans-serif",
              letterSpacing: ".06em",
              cursor: "pointer",
              "&:hover": {
                bgcolor: (theme) =>
                  theme.palette.mode === "dark" ? "#3b3f46" : "#000000",
              },
            }}
          >
            FECHAR E SORTEAR
          </Box>
          <Box
            component="button"
            onClick={() => navigate(`/peladas/${pelada.id}/attendance`)}
            sx={{
              flexShrink: 0,
              border: "1.5px solid",
              borderColor: "divider",
              borderRadius: "11px",
              bgcolor: "background.paper",
              color: "text.primary",
              p: "11px 13px",
              font: "800 11px/1 Archivo,sans-serif",
              letterSpacing: ".06em",
              cursor: "pointer",
              "&:hover": { borderColor: "text.primary" },
            }}
          >
            COBRAR
          </Box>
        </Box>
      </Box>
    );
  };

  const renderClosedPeladaRow = (pelada: Pelada) => {
    const history = historyByPelada[pelada.id];
    const matches = history?.matches_count;
    const playersCount = history?.players_count;

    return (
      <Box
        key={pelada.id}
        data-testid="pelada-row"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          py: "13px",
          borderBottom: "1.5px solid",
          borderColor: "divider",
          "&:last-of-type": { borderBottom: "none" },
        }}
      >
        <Box sx={{ width: 46, flexShrink: 0 }}>
          <Typography
            sx={{
              font: "700 13px/1.2 'Archivo Narrow',Archivo,sans-serif",
              color: "text.primary",
            }}
          >
            {formatDayMonth(pelada.scheduled_at)}
          </Typography>
          <Typography
            sx={{
              font: "600 10px/1.3 Archivo,sans-serif",
              color: "text.secondary",
              mt: 0.25,
            }}
          >
            {formatTime(pelada.scheduled_at)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              font: "700 12.5px/1.2 Archivo,sans-serif",
              color: "text.primary",
            }}
          >
            {matches !== undefined
              ? `Encerrada · ${matches} partida${matches === 1 ? "" : "s"}`
              : "Encerrada"}
          </Typography>
          <Typography
            sx={{
              font: "600 10.5px/1.3 Archivo,sans-serif",
              color: "text.secondary",
              mt: 0.25,
            }}
          >
            {playersCount !== undefined
              ? `${playersCount} jogadores`
              : "Sem dados"}
            {history?.champion_team_name
              ? ` · Campeão: ${history.champion_team_name}`
              : ""}
          </Typography>
        </Box>
        {isAdmin && (
          <IconButton
            aria-label={t("organizations.peladas.aria.delete")}
            onClick={() => onDeletePelada(pelada)}
            size="small"
            sx={{ color: "#a8452a", p: 0.5 }}
          >
            <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        <Box
          component="button"
          onClick={() => navigate(`/peladas/${pelada.id}`)}
          sx={{
            flexShrink: 0,
            border: "1.5px solid",
            borderColor: "divider",
            borderRadius: "6px",
            bgcolor: "background.paper",
            color: "text.secondary",
            p: "4px 6px",
            font: "700 9px/1 Archivo,sans-serif",
            letterSpacing: ".06em",
            cursor: "pointer",
            "&:hover": { borderColor: "text.primary", color: "text.primary" },
          }}
        >
          SÚMULA
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 3 }}>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 1, pb: 2 }}>
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
              color: "text.secondary",
              cursor: "pointer",
            }}
          >
            ‹
          </Box>
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: "#146b3a",
              border: (theme) =>
                theme.palette.mode === "dark"
                  ? "2.5px solid #2d3035"
                  : "2.5px solid #17181a",
              font: "800 11px Archivo,sans-serif",
              color: "#ffffff",
            }}
          >
            {orgInitials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                font: "800 15px/1.15 Archivo,sans-serif",
                color: "text.primary",
              }}
            >
              {org.name}
            </Typography>
            <Typography
              sx={{
                font: "700 9.5px/1 Archivo,sans-serif",
                letterSpacing: ".14em",
                color: "text.secondary",
                mt: 0.4,
              }}
            >
              FUTEBOL ·{" "}
              {isAdmin
                ? "ADMIN"
                : currentPlayer
                  ? formatMemberType(currentPlayer.member_type)
                  : "MEMBRO"}{" "}
              · {players.length || 24} JOGADORES
            </Typography>
          </Box>
          <IconButton
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            data-testid="org-menu-button"
            aria-label="Opções da organização"
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              border: "1.5px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              color: "text.secondary",
            }}
          >
            <MoreHorizIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleCloseMenu}
          slotProps={{
            paper: {
              sx: {
                minWidth: 230,
                borderRadius: "12px",
                border: "1.5px solid",
                borderColor: "divider",
              },
            },
          }}
        >
          {isAdmin && (
            <MenuItem
              component={RouterLink}
              to={`/organizations/${org.id}/management`}
              onClick={handleCloseMenu}
              data-testid="org-management-button"
              sx={{ font: "700 13px Archivo,sans-serif", py: 1.25 }}
            >
              <SettingsIcon sx={{ fontSize: 18, mr: 1.25 }} />
              {t("organizations.detail.button.management", "GERENCIAMENTO")}
            </MenuItem>
          )}
          {!isAdmin && (
            <MenuItem
              onClick={() => {
                handleCloseMenu();
                onLeaveOrg();
              }}
              data-testid="leave-org-button"
              sx={{
                font: "700 13px Archivo,sans-serif",
                py: 1.25,
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#e06c50" : "#a8452a",
              }}
            >
              <ExitToAppIcon sx={{ fontSize: 18, mr: 1.25 }} />
              {t("organizations.detail.button.leave", "SAIR DA ORGANIZAÇÃO")}
            </MenuItem>
          )}
        </Menu>

        {/* Monthly waitlist candidacy (non-mensalistas) */}
        {currentPlayer &&
          isCandidate(currentPlayer.member_type) &&
          waitlistStatus !== null && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 1.5,
              }}
            >
              {waitlistStatus.in_queue ? (
                <>
                  <Chip
                    icon={<HourglassTopIcon />}
                    label={t("organizations.detail.waitlist.in_queue_badge")}
                    color="primary"
                    variant="outlined"
                    size="small"
                    data-testid="waitlist-in-queue-badge"
                    sx={{ font: "700 11px Archivo,sans-serif" }}
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={onLeaveWaitlist}
                    disabled={waitlistLoading}
                    data-testid="leave-waitlist-button"
                    sx={{
                      textTransform: "none",
                      font: "700 11px Archivo,sans-serif",
                    }}
                  >
                    {t("organizations.detail.waitlist.leave_button")}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={onJoinWaitlist}
                  disabled={waitlistLoading}
                  data-testid="join-waitlist-button"
                  sx={{
                    textTransform: "none",
                    font: "800 11px Archivo,sans-serif",
                    borderRadius: "10px",
                  }}
                >
                  {t("organizations.detail.waitlist.candidate_button")}
                </Button>
              )}
            </Box>
          )}

        {renderTiles()}

        {/* Admin counters */}
        {isAdmin && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
              mt: 1.25,
            }}
          >
            <Box
              sx={{
                bgcolor: "background.paper",
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "13px",
                p: "10px 11px",
              }}
            >
              <Typography
                sx={{
                  font: "700 20px/1 'Archivo Narrow',Archivo,sans-serif",
                  color: "text.primary",
                }}
              >
                {totalPeladas}
              </Typography>
              <Typography
                sx={{
                  font: "700 8px/1.2 Archivo,sans-serif",
                  letterSpacing: ".08em",
                  color: "text.secondary",
                  mt: 0.5,
                }}
              >
                PELADAS
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: "background.paper",
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "13px",
                p: "10px 11px",
              }}
            >
              <Typography
                sx={{
                  font: "700 20px/1 'Archivo Narrow',Archivo,sans-serif",
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#e06c50" : "#a8452a",
                }}
              >
                0
              </Typography>
              <Typography
                sx={{
                  font: "700 8px/1.2 Archivo,sans-serif",
                  letterSpacing: ".08em",
                  color: "text.secondary",
                  mt: 0.5,
                }}
              >
                A RECEBER
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: "background.paper",
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "13px",
                p: "10px 11px",
              }}
            >
              <Typography
                sx={{
                  font: "700 20px/1 'Archivo Narrow',Archivo,sans-serif",
                  color: "text.primary",
                }}
              >
                {waitlistStatus?.in_queue ? 1 : 0}
              </Typography>
              <Typography
                sx={{
                  font: "700 8px/1.2 Archivo,sans-serif",
                  letterSpacing: ".08em",
                  color: "text.secondary",
                  mt: 0.5,
                }}
              >
                NA FILA
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* NOVA PELADA (admin) */}
      {isAdmin && !org.is_blocked && (
        <Box
          sx={{
            bgcolor: "background.paper",
            borderTop: "2px solid",
            borderBottom: "2px solid",
            borderColor: (theme) =>
              theme.palette.mode === "dark" ? "divider" : "#17181a",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "#242628" : "#17181a",
              px: 2.5,
              py: 1.4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                font: "800 11px/1 Archivo,sans-serif",
                letterSpacing: ".1em",
                color: "#ffffff",
                textTransform: "uppercase",
              }}
            >
              {t("organizations.detail.section.new_pelada")}
            </Typography>
            <Typography
              sx={{
                font: "700 10px/1 Archivo,sans-serif",
                letterSpacing: ".06em",
                color: "#9a958a",
              }}
            >
              {scheduleSuggestion}
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <CreatePeladaForm
              organizationId={org.id}
              defaultMaxPlayers={org.default_max_players}
              defaultLocation={org.default_location}
              onCreate={onCreatePelada}
            />
          </Box>
        </Box>
      )}

      {/* PRÓXIMA PELADA (member) */}
      {!isAdmin && activePelada && (
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
            sx={{
              bgcolor: "background.paper",
              border: "2px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark" ? "divider" : "#17181a",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "5px 5px 0 #000000"
                  : "5px 5px 0 #17181a",
            }}
          >
            <Box
              sx={{
                bgcolor: "#146b3a",
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
                  color: "#ffffff",
                }}
              >
                LISTA ABERTA
              </Typography>
              <Typography
                sx={{
                  font: "700 11px/1 Archivo,sans-serif",
                  color: "#bfe6ce",
                }}
              >
                {daysUntil(activePelada.scheduled_at, nowTs) === 0
                  ? "fecha hoje"
                  : `fecha em ${daysUntil(
                      activePelada.scheduled_at,
                      nowTs,
                    )} dia${
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
                            theme.palette.mode === "dark"
                              ? "2px solid #242628"
                              : "2px solid #ffffff",
                          ml: idx === 0 ? 0 : "-8px",
                          bgcolor:
                            AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length],
                          color: "#17181a",
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
                          theme.palette.mode === "dark"
                            ? "2px solid #242628"
                            : "2px solid #ffffff",
                        ml: "-8px",
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark" ? "#2d3035" : "#17181a",
                        color: "#ffffff",
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
                  bgcolor: "#146b3a",
                  color: "#ffffff",
                  py: 2,
                  font: "800 17px/1 Archivo,sans-serif",
                  letterSpacing: ".04em",
                  boxShadow: "0 3px 0 #0d4526",
                  "&:hover": { bgcolor: "#0e5c31" },
                }}
              >
                BORA PRO JOGO
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* PÓDIO DA TEMPORADA (member) */}
      {!isAdmin && statsEnabled && memberStats.length > 0 && (
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
              to={`/organizations/${org.id}/statistics`}
              sx={{
                font: "700 11px/1 Archivo,sans-serif",
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#34a853" : "#146b3a",
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
                      bgcolor: "#dcd3bd",
                      color: "#17181a",
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
                      bgcolor: "#cdd6e0",
                      color: "#17181a",
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
                    theme.palette.mode === "dark"
                      ? "rgba(20, 107, 58, 0.15)"
                      : "#f4f8f5",
                  border: "2px solid #146b3a",
                  borderRadius: "14px",
                  p: "12px 11px",
                }}
              >
                <Typography
                  sx={{
                    font: "700 8.5px/1 Archivo,sans-serif",
                    letterSpacing: ".12em",
                    color: "#146b3a",
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
                      bgcolor: "#146b3a",
                      color: "#ffffff",
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
      )}

      {/* ELENCO card (member) */}
      {!isAdmin && players.length > 0 && (
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
                p: "11px 14px",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.04)"
                    : "#f6f4ee",
                borderBottom: "1.5px solid",
                borderColor: "divider",
              }}
            >
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
                component="button"
                onClick={() => setRosterOpen(true)}
                sx={{
                  border: 0,
                  bgcolor: "transparent",
                  p: 0,
                  font: "700 10.5px/1 Archivo,sans-serif",
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#34a853" : "#146b3a",
                  cursor: "pointer",
                }}
              >
                Ver todos
              </Typography>
            </Box>
            <Box
              sx={{
                p: "13px 14px",
                display: "flex",
                flexWrap: "wrap",
                gap: "7px",
              }}
            >
              {rosterPreview.map((player, idx) => (
                <SecureAvatar
                  key={player.id}
                  userId={player.user_id}
                  filename={player.user_avatar_filename}
                  fallbackText={getInitials(player.user_name)}
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length],
                    color: "#17181a",
                    font: "800 10px Archivo,sans-serif",
                  }}
                />
              ))}
              {rosterOverflow > 0 && (
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark" ? "#2d3035" : "#17181a",
                    color: "#ffffff",
                    font: "800 9.5px Archivo,sans-serif",
                  }}
                >
                  +{rosterOverflow}
                </Avatar>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* HISTÓRICO DO GRUPO (member) */}
      {!isAdmin && historyEntries.length > 0 && (
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
                  ? { label: "TÍTULO", color: "#146b3a", isTitle: true }
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
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    py: "13px",
                    borderBottom:
                      idx === historyEntries.length - 1
                        ? "none"
                        : "1.5px solid",
                    borderBottomColor: "divider",
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
                      {entry.matches_count === 1 ? "" : "s"} ·{" "}
                      {entry.players_count} jogadores
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
                        color: badge.isTitle
                          ? (theme) =>
                              theme.palette.mode === "dark"
                                ? "#34a853"
                                : "#146b3a"
                          : badge.color,
                        border: "1.5px solid",
                        borderColor: badge.isTitle
                          ? (theme) =>
                              theme.palette.mode === "dark"
                                ? "#34a853"
                                : "#146b3a"
                          : "divider",
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
      )}

      {/* AGENDA DO GRUPO (admin) */}
      {isAdmin && (
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
              AGENDA DO GRUPO
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

          {visiblePeladas.length === 0 ? (
            <Box
              sx={{
                bgcolor: "background.paper",
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "16px",
                p: 3,
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  font: "600 12px/1.4 Archivo,sans-serif",
                  color: "text.secondary",
                }}
              >
                Nenhuma pelada encontrada.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                bgcolor: "background.paper",
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "16px",
                px: 1.75,
                py: 0.5,
              }}
            >
              {openPeladas.map(renderOpenPeladaCard)}
              {closedPeladas.map(renderClosedPeladaRow)}
            </Box>
          )}

          {visiblePeladas.length > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                pt: 1.5,
              }}
            >
              <Typography
                sx={{
                  font: "700 11.5px/1 Archivo,sans-serif",
                  color: "text.secondary",
                }}
              >
                {rangeStart}–{rangeEnd} de {totalPeladas}
              </Typography>
              {hasMore && (
                <Typography
                  component="button"
                  onClick={onLoadMore}
                  data-testid="load-more-peladas"
                  sx={{
                    border: 0,
                    bgcolor: "transparent",
                    font: "800 11.5px/1 Archivo,sans-serif",
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#34a853" : "#146b3a",
                    cursor: "pointer",
                  }}
                >
                  · ver mais
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}

      <OrganizationRosterDialog
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        orgName={org.name}
        players={players}
      />
    </Box>
  );
}
