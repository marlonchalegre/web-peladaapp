import { useMemo, useState } from "react";
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
import {
  MobileNextPeladaCard,
  MobileSeasonPodiumCard,
  MobileRosterCard,
  MobileGroupHistoryCard,
  MobileAdminAgendaCard,
  OrganizationMobileActionTiles,
} from "./OrganizationDetailMobileWidgets";
import { isMensalista } from "../../peladas/utils/playerUtils";

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

const isCandidate = (memberType?: string) => !isMensalista(memberType);

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
  const [nowTs] = useState(() => Date.now());

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

  const { openPeladas, closedPeladas, visiblePeladas } = useMemo(() => {
    const open = peladas.filter(
      (p) => p.status === "attendance" || p.status === "open",
    );
    const closed = peladas.filter(
      (p) => p.status !== "attendance" && p.status !== "open",
    );
    return {
      openPeladas: open,
      closedPeladas: closed,
      visiblePeladas: [...open, ...closed],
    };
  }, [peladas]);
  const activePelada = openPeladas[0];

  const handleCloseMenu = () => setMenuAnchor(null);

  const historyEntries = useMemo(
    () =>
      Object.values(historyByPelada)
        .filter((h) => h.scheduled_at)
        .sort(
          (a, b) =>
            new Date(b.scheduled_at || 0).getTime() -
            new Date(a.scheduled_at || 0).getTime(),
        )
        .slice(0, 4),
    [historyByPelada],
  );

  const rangeStart = visiblePeladas.length === 0 ? 0 : 1;
  const rangeEnd = visiblePeladas.length;
  const hasMore = rangeEnd < totalPeladas;

  const scheduleSuggestion = useMemo(() => {
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
  }, [peladas]);

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
              bgcolor: "primary.main",
              border: (theme) =>
                theme.palette.mode === "dark"
                  ? `2.5px solid ${theme.palette.divider}`
                  : theme.palette.brutalist?.border ||
                    `2.5px solid ${theme.palette.divider}`,
              font: "800 11px Archivo,sans-serif",
              color: "primary.contrastText",
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
                color: "secondary.main",
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

        <OrganizationMobileActionTiles
          orgId={org.id}
          statsEnabled={statsEnabled}
          onOpenRoster={() => setRosterOpen(true)}
        />

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
                  color: "secondary.main",
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
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "action.hover" : "text.primary",
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
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? "text.primary"
                    : "background.paper",
                textTransform: "uppercase",
              }}
            >
              {t("organizations.detail.section.new_pelada")}
            </Typography>
            <Typography
              sx={{
                font: "700 10px/1 Archivo,sans-serif",
                letterSpacing: ".06em",
                color: "text.secondary",
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
        <MobileNextPeladaCard activePelada={activePelada} nowTs={nowTs} />
      )}

      {/* PÓDIO DA TEMPORADA (member) */}
      {!isAdmin && statsEnabled && memberStats.length > 0 && (
        <MobileSeasonPodiumCard
          orgId={org.id}
          memberStats={memberStats}
          currentUser={currentUser}
        />
      )}

      {/* ELENCO card (member) */}
      {!isAdmin && players.length > 0 && (
        <MobileRosterCard
          players={players}
          onOpenRosterDialog={() => setRosterOpen(true)}
        />
      )}

      {/* HISTÓRICO DO GRUPO (member) */}
      {!isAdmin && historyEntries.length > 0 && (
        <MobileGroupHistoryCard
          historyEntries={historyEntries}
          totalPeladas={totalPeladas}
        />
      )}

      {/* AGENDA DO GRUPO (admin) */}
      {isAdmin && (
        <MobileAdminAgendaCard
          openPeladas={openPeladas}
          closedPeladas={closedPeladas}
          visiblePeladas={visiblePeladas}
          totalPeladas={totalPeladas}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          hasMore={hasMore}
          historyByPelada={historyByPelada}
          isAdmin={isAdmin}
          onDeletePelada={onDeletePelada}
          onLoadMore={onLoadMore}
        />
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
