import { useMemo } from "react";
import { Box, Typography, Chip, Button } from "@mui/material";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type {
  Organization,
  Pelada,
  PeladaHistoryEntry,
  Player,
  MonthlyWaitlistStatus,
  OrganizationFeatureFlags,
} from "../../../shared/api/endpoints";
import GroupTabsBar from "./GroupTabsBar";
import OrganizationQuickPeladaCard from "./OrganizationQuickPeladaCard";
import OrganizationAgendaTable from "./OrganizationAgendaTable";
import { isMensalista } from "../../peladas/utils/playerUtils";

interface OrganizationDetailDesktopViewProps {
  org: Organization;
  peladas: Pelada[];
  totalPeladas: number;
  isAdmin: boolean;
  playersCount: number;
  waitlistCount: number;
  historyByPelada?: Record<string, PeladaHistoryEntry>;
  currentPlayer?: Player | null;
  waitlistStatus?: MonthlyWaitlistStatus | null;
  waitlistLoading?: boolean;
  featureFlags?: OrganizationFeatureFlags | null;
  onJoinWaitlist?: () => void;
  onLeaveWaitlist?: () => void;
  onLeaveOrg?: () => void;
  onCreatePeladaSuccess: () => void;
  onCreatePeladaQuick?: (data: {
    date: string;
    time: string;
    maxPlayers: number;
    location: string;
  }) => Promise<void>;
}

const isCandidate = (memberType?: string) => !isMensalista(memberType);

export default function OrganizationDetailDesktopView({
  org,
  peladas,
  totalPeladas,
  isAdmin,
  playersCount,
  waitlistCount,
  historyByPelada = {},
  currentPlayer,
  waitlistStatus,
  waitlistLoading,
  featureFlags,
  onJoinWaitlist,
  onLeaveWaitlist,
  onLeaveOrg,
  onCreatePeladaSuccess,
  onCreatePeladaQuick,
}: OrganizationDetailDesktopViewProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const orgInitials = org.name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .substring(0, 4)
    .toUpperCase();

  const { historyEntries, avgPresence } = useMemo(() => {
    const entries = Object.values(historyByPelada);
    const avg = entries.length
      ? Math.round(
          entries.reduce((acc, e) => acc + (e.players_count || 0), 0) /
            entries.length,
        )
      : null;
    return { historyEntries: entries, avgPresence: avg };
  }, [historyByPelada]);
  const peladasCount = historyEntries.length || totalPeladas;

  return (
    <>
      <GroupTabsBar
        orgId={org.id}
        orgName={org.name}
        active="agenda"
        playersCount={playersCount}
        isAdmin={isAdmin}
        featureFlags={featureFlags}
      />
      <Box
        sx={{
          width: "100%",
          maxWidth: 1124,
          mx: "auto",
          px: { xs: 2, md: 4 },
          pb: 5,
        }}
      >
        {/* 2. Group header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.8,
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              bgcolor: "primary.main",
              border: (theme) =>
                theme.palette.mode === "dark"
                  ? `2.5px solid ${theme.palette.divider}`
                  : theme.palette.brutalist?.border ||
                    `2.5px solid ${theme.palette.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "13px",
              color: "primary.contrastText",
              flexShrink: 0,
            }}
          >
            {orgInitials}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "24px",
                lineHeight: 1.1,
                color: "text.primary",
              }}
            >
              {org.name}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "9.5px",
                letterSpacing: ".14em",
                color: "text.secondary",
                mt: 0.6,
                textTransform: "uppercase",
              }}
            >
              FUTEBOL · {isAdmin ? "ADMIN" : "MEMBRO"} · {playersCount || 24}{" "}
              JOGADORES · TODA QUARTA 19:00
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {isAdmin ? (
              <>
                <Box
                  component="button"
                  onClick={() =>
                    navigate(
                      `/organizations/${org.id}/management?tab=invitations`,
                    )
                  }
                  sx={{
                    border: "1.5px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    borderRadius: "11px",
                    px: 1.8,
                    py: 1.2,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "11px",
                    letterSpacing: ".04em",
                    color: "text.primary",
                    cursor: "pointer",
                    "&:hover": { borderColor: "text.primary" },
                  }}
                >
                  {t("organizations.management.tabs.invitations", "CONVIDAR")}
                </Box>
                <Box
                  component="button"
                  data-testid="org-management-button"
                  onClick={() =>
                    navigate(`/organizations/${org.id}/management`)
                  }
                  sx={{
                    border: "1.5px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    borderRadius: "11px",
                    px: 1.8,
                    py: 1.2,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "11px",
                    letterSpacing: ".04em",
                    color: "text.primary",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: "text.primary",
                    },
                  }}
                >
                  {t("organizations.detail.button.management", "GERENCIAMENTO")}
                </Box>
              </>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {currentPlayer &&
                  isCandidate(currentPlayer.member_type) &&
                  waitlistStatus !== null &&
                  waitlistStatus !== undefined &&
                  (waitlistStatus.in_queue ? (
                    <>
                      <Chip
                        icon={<HourglassTopIcon />}
                        label={t(
                          "organizations.detail.waitlist.in_queue_badge",
                        )}
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
                  ))}
                {onLeaveOrg && (
                  <Box
                    component="button"
                    data-testid="leave-org-button"
                    onClick={onLeaveOrg}
                    sx={{
                      border: "1.5px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      borderRadius: "11px",
                      px: 1.8,
                      py: 1.2,
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "11px",
                      letterSpacing: ".04em",
                      color: "error.main",
                      cursor: "pointer",
                      "&:hover": { borderColor: "error.main" },
                    }}
                  >
                    {t(
                      "organizations.detail.button.leave",
                      "SAIR DA ORGANIZAÇÃO",
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* 3. 4 metric cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1.4,
            mb: 3,
          }}
        >
          <Box
            sx={{
              bgcolor: "background.paper",
              border: "1.5px solid",
              borderColor: "divider",
              borderRadius: "14px",
              p: "14px 15px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                lineHeight: 1,
                color: "text.primary",
              }}
            >
              {peladasCount}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                letterSpacing: ".1em",
                color: "text.secondary",
                mt: 0.6,
                textTransform: "uppercase",
              }}
            >
              {t("organizations.detail.peladas_count", "PELADAS")}
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "background.paper",
              border: "1.5px solid",
              borderColor: "divider",
              borderRadius: "14px",
              p: "14px 15px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                lineHeight: 1,
                color: "text.primary",
              }}
            >
              {avgPresence == null ? "—" : avgPresence}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                letterSpacing: ".1em",
                color: "text.secondary",
                mt: 0.6,
                textTransform: "uppercase",
              }}
            >
              {t("organizations.detail.avg_attendance", "MÉDIA DE PRESENÇA")}
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "background.paper",
              border: "1.5px solid",
              borderColor: "divider",
              borderRadius: "14px",
              p: "14px 15px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                lineHeight: 1,
                color: "secondary.main",
              }}
            >
              —
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                letterSpacing: ".1em",
                color: "text.secondary",
                mt: 0.6,
                textTransform: "uppercase",
              }}
            >
              {t("organizations.tabs.finance", "FINANCEIRO")}
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "background.paper",
              border: "1.5px solid",
              borderColor: "divider",
              borderRadius: "14px",
              p: "14px 15px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                lineHeight: 1,
                color: "text.primary",
              }}
            >
              {waitlistCount}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                letterSpacing: ".1em",
                color: "text.secondary",
                mt: 0.6,
                textTransform: "uppercase",
              }}
            >
              {t("organizations.detail.in_waitlist", "NA FILA DE ESPERA")}
            </Typography>
          </Box>
        </Box>

        {/* 4. NOVA PELADA Form (Inline Desktop 4b) */}
        {isAdmin && !org.is_blocked && (
          <OrganizationQuickPeladaCard
            org={org}
            onCreatePeladaSuccess={onCreatePeladaSuccess}
            onCreatePeladaQuick={onCreatePeladaQuick}
          />
        )}

        <OrganizationAgendaTable
          peladas={peladas}
          totalPeladas={totalPeladas}
          isAdmin={isAdmin}
          historyByPelada={historyByPelada}
        />
      </Box>
    </>
  );
}
