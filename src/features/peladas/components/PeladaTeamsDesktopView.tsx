import { useState, useMemo, type DragEvent } from "react";
import {
  Box,
  Typography,
  Switch,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import GroupsIcon from "@mui/icons-material/Groups";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SecurityIcon from "@mui/icons-material/Security";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useTranslation } from "react-i18next";
import AddPlayersButton from "./AddPlayersButton";
import { copyToClipboard } from "../utils/exportUtils";
import type {
  Pelada,
  Team,
  User,
  Transaction,
  DrawAlgorithm,
  DrawJustification,
} from "../../../shared/api/endpoints";
import type { PlayerWithUser } from "./TeamsSection";
import PeladaTabsBar from "./PeladaTabsBar";
import DrawJustificationCard from "./DrawJustificationCard";
import LocationDisplay from "../../../shared/components/LocationDisplay";
import {
  AVATAR_BG_COLORS,
  formatPlayerPosition,
  sortPlayersByPosition,
  getPlayerAvatarProps,
} from "../utils/playerUtils";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { useCopyFeedback } from "../../../shared/hooks/useCopyFeedback";

export interface PeladaTeamsDesktopViewProps {
  pelada: Pelada;
  teams: Team[];
  teamPlayers: Record<string, PlayerWithUser[]>;
  benchPlayers: PlayerWithUser[];
  homeGk: PlayerWithUser | null;
  awayGk: PlayerWithUser | null;
  scores: Record<string, number>;
  isAdmin: boolean;
  processing: boolean;
  onDragStartPlayer: (
    e: DragEvent<HTMLElement>,
    playerId: string,
    sourceTeamId: string | null,
  ) => void;
  dropToTeam: (
    e: DragEvent<HTMLElement>,
    targetTeamId: string,
  ) => Promise<void>;
  dropToBench: (e: DragEvent<HTMLElement>) => void;
  dropToFixedGk: (e: DragEvent<HTMLElement>, side: "home" | "away") => void;
  removeFixedGk: (side: "home" | "away") => void;
  onMoveToTeam: (playerId: string, targetTeamId: string) => void;
  onSendToBench: (playerId: string) => void;
  onMoveToFixedGk: (playerId: string, side: "home" | "away") => void;
  onRandomizeTeams: (options: {
    algorithm: DrawAlgorithm;
    useHistory: boolean;
  }) => void;
  onUpdatePlayersPerTeam?: (count: number) => void;
  onUpdateNumTeams?: (count: number) => void;
  drawJustification: DrawJustification | null;
  onCreateTeam: (name: string) => Promise<void>;
  onDeleteTeam: (teamId: string) => Promise<void>;
  onStartClick: () => void;
  onCopyAnnouncement: () => Promise<boolean | void> | boolean | void;
  onToggleFixedGk: (enabled: boolean) => void;
  onOpenJustificationDialog?: () => void;
  currentUser?: User | null;
  peladaTransactions?: Transaction[];
  onMarkPaid?: (playerId: string, amount: number) => void;
  onReversePayment?: (playerId: string) => void;
  onAddPlayersClick?: () => void;
}

const VEST_KEYS = [
  "vest_green",
  "vest_none",
  "vest_blue",
  "vest_orange",
  "vest_white",
  "vest_black",
];

interface FixedGkSlotProps {
  side: "home" | "away";
  gk: PlayerWithUser | null;
  isAdmin: boolean;
  onDrop: (e: DragEvent<HTMLElement>, side: "home" | "away") => void;
  onRemove: (side: "home" | "away") => void;
}

function FixedGkSlot({
  side,
  gk,
  isAdmin,
  onDrop,
  onRemove,
}: FixedGkSlotProps) {
  const { t } = useTranslation();
  const isHome = side === "home";
  const teamNum = isHome ? 1 : 2;

  return (
    <Box
      data-testid={`gk-slot-${side}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(e, side);
      }}
      sx={{
        flex: 1,
        minWidth: 0,
        border: "1.5px solid",
        borderColor: "divider",
        borderRadius: "12px",
        p: "8px 9px",
        display: "flex",
        alignItems: "center",
        gap: 1,
        bgcolor: gk ? "background.paper" : "action.hover",
        minHeight: 46,
        overflow: "hidden",
      }}
    >
      {gk ? (
        <>
          <SecureAvatar
            {...getPlayerAvatarProps(gk, "G")}
            sx={{
              width: 26,
              height: 26,
              bgcolor: "action.hover",
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "9px",
              color: "text.primary",
              flexShrink: 0,
            }}
          />
          <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <Typography
              title={gk.user?.name}
              noWrap
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "11px",
                lineHeight: 1.2,
                color: "text.primary",
              }}
            >
              {gk.user?.name ||
                t(
                  isHome
                    ? "peladas.teams.home_goalkeeper"
                    : "peladas.teams.away_goalkeeper",
                  `Goleiro ${teamNum}`,
                )}
            </Typography>
            <Typography
              noWrap
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "9.5px",
                lineHeight: 1.2,
                color: "text.secondary",
                mt: 0.25,
              }}
            >
              {t(`peladas.teams.team_${teamNum}`, `time ${teamNum}`)}
            </Typography>
          </Box>
          {isAdmin && (
            <IconButton
              size="small"
              onClick={() => onRemove(side)}
              sx={{
                p: 0.25,
                color: "text.secondary",
                flexShrink: 0,
              }}
            >
              <CloseIcon sx={{ fontSize: 13 }} />
            </IconButton>
          )}
        </>
      ) : (
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 600,
            fontSize: "10px",
            lineHeight: 1.2,
            color: "text.secondary",
            textAlign: "center",
            width: "100%",
            px: 0.5,
          }}
        >
          {t(
            isHome ? "peladas.teams.drag_gk_1" : "peladas.teams.drag_gk_2",
            `Arraste o Goleiro ${teamNum}`,
          )}
        </Typography>
      )}
    </Box>
  );
}

export default function PeladaTeamsDesktopView({
  pelada,
  teams,
  teamPlayers,
  benchPlayers,
  homeGk,
  awayGk,
  scores,
  isAdmin,
  processing,
  onDragStartPlayer,
  dropToTeam,
  dropToBench,
  dropToFixedGk,
  removeFixedGk,
  onMoveToTeam,
  onSendToBench,
  onMoveToFixedGk,
  onToggleFixedGk,
  onRandomizeTeams,
  onUpdatePlayersPerTeam,
  onUpdateNumTeams,
  drawJustification,
  onOpenJustificationDialog,
  onCreateTeam,
  onDeleteTeam,
  onStartClick,
  onCopyAnnouncement,
  currentUser,
  onAddPlayersClick,
}: PeladaTeamsDesktopViewProps) {
  const { t } = useTranslation();
  const [algorithm, setAlgorithm] = useState<DrawAlgorithm>("classic");
  const [useHistory, setUseHistory] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [activePlayerForMenu, setActivePlayerForMenu] = useState<{
    player: PlayerWithUser;
    sourceTeamId: string | null;
  } | null>(null);

  const handleOpenPlayerMenu = (
    e: React.MouseEvent<HTMLElement>,
    player: PlayerWithUser,
    sourceTeamId: string | null,
  ) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setActivePlayerForMenu({ player, sourceTeamId });
  };

  const handleClosePlayerMenu = () => {
    setMenuAnchor(null);
    setActivePlayerForMenu(null);
  };

  const { copied: copiedZap, triggerCopy: handleCopyZap } =
    useCopyFeedback(onCopyAnnouncement);

  const handleCopyBenchPlayers = async () => {
    const text = benchPlayers
      .map(
        (bp, idx) =>
          `${idx + 1}. ${bp.user.name} (${formatPlayerPosition(bp)})`,
      )
      .join("\n");
    if (!text) return;
    const success = await copyToClipboard(text);
    if (success) {
      alert(t("common.actions.copy_success", "Copied to clipboard!"));
    }
  };

  const playersPerTeam = pelada.players_per_team || 5;
  const numTeams = pelada.num_teams || teams.length || 2;

  // Total confirmed players count
  const allTeamPlayers = Object.values(teamPlayers).flat();
  const totalPlayersInTeams = allTeamPlayers.length;
  const totalBench = benchPlayers.length;
  const totalConfirmed = totalPlayersInTeams + totalBench;

  // Format date
  const rawDate =
    pelada.scheduled_at ||
    pelada.when ||
    (pelada as unknown as { date?: string }).date;
  const peladaDate = rawDate ? new Date(rawDate) : new Date();
  const dayStr = String(peladaDate.getDate()).padStart(2, "0");
  const monthStr = String(peladaDate.getMonth() + 1).padStart(2, "0");
  const weekday = !isNaN(peladaDate.getTime())
    ? peladaDate
        .toLocaleDateString(t("common.locale_code", "pt-BR"), {
          weekday: "short",
        })
        .replace(".", "")
        .toUpperCase()
    : "QUA";
  const timeStr = !isNaN(peladaDate.getTime())
    ? peladaDate.toLocaleTimeString(t("common.locale_code", "pt-BR"), {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "19:00";

  // Calculate team stats for justifications
  const teamAverages: {
    teamId: string;
    name: string;
    avg: number;
    count: number;
  }[] = useMemo(() => {
    return teams.map((team) => {
      const pList = teamPlayers[team.id] || [];
      const vals = pList
        .map((p) => (typeof scores[p.id] === "number" ? scores[p.id] : p.grade))
        .filter((g): g is number => typeof g === "number");
      const avg =
        vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { teamId: team.id, name: team.name, avg, count: pList.length };
    });
  }, [teams, teamPlayers, scores]);

  const sortedTeamPlayers = useMemo(() => {
    const result: Record<string, PlayerWithUser[]> = {};
    for (const team of teams) {
      const players = teamPlayers[team.id];
      result[team.id] = players ? sortPlayersByPosition(players) : [];
    }
    return result;
  }, [teams, teamPlayers]);

  const handleRandomizeClick = () => {
    onRandomizeTeams({
      algorithm,
      useHistory: algorithm !== "classic" && useHistory,
    });
  };

  const handleAddTeam = async () => {
    let nextNum = teams.length + 1;
    while (
      teams.some(
        (team) =>
          team.name.toLowerCase() === `time ${nextNum}`.toLowerCase() ||
          team.name.toLowerCase() === `team ${nextNum}`.toLowerCase(),
      )
    ) {
      nextNum++;
    }
    await onCreateTeam(
      t("peladas.teams.default_name", { number: nextNum }) || `Time ${nextNum}`,
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 6 }}>
      {/* Sub-nav tabs bar */}
      <PeladaTabsBar
        peladaId={pelada.id}
        dateStr={`${dayStr}/${monthStr}`}
        totalConfirmed={totalConfirmed}
        status={pelada.status}
        active="teams"
      />

      {/* Main Container */}
      <Box
        sx={{
          maxWidth: 1124,
          mx: "auto",
          pt: 3.5,
          px: 4,
          boxSizing: "border-box",
        }}
      >
        {/* Top Header & Actions */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "9.5px",
                letterSpacing: ".16em",
                color: "text.secondary",
                textTransform: "uppercase",
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontFamily: "inherit",
                  fontWeight: "inherit",
                  fontSize: "inherit",
                  letterSpacing: "inherit",
                  color: "inherit",
                  textTransform: "inherit",
                }}
              >
                {pelada.organization_name ||
                  t("common.organization", "ORGANIZAÇÃO")}{" "}
                · {weekday} {dayStr}/{monthStr} · {timeStr}
              </Typography>
              {pelada.location && (
                <>
                  <Typography
                    component="span"
                    sx={{
                      mx: 0.5,
                      fontFamily: "inherit",
                      fontWeight: "inherit",
                      fontSize: "inherit",
                      color: "inherit",
                    }}
                  >
                    ·
                  </Typography>
                  <LocationDisplay
                    location={pelada.location}
                    textSx={{
                      fontFamily: "inherit",
                      fontWeight: "inherit",
                      fontSize: "inherit",
                      letterSpacing: "inherit",
                      color: "primary.main",
                      textTransform: "inherit",
                    }}
                  />
                </>
              )}
            </Box>
            <Typography
              variant="h1"
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "26px",
                lineHeight: 1.1,
                color: "text.primary",
                mt: 1,
              }}
            >
              {t("peladas.teams.draw_title", "Sorteio de times")}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.3,
                color: "text.secondary",
                textAlign: "right",
              }}
            >
              {t("peladas.teams.drawn_at", "sorteado às")} {timeStr}
              <br />
              {t("peladas.teams.drawn_by_you", "por você")}
            </Typography>
            <Button
              onClick={handleCopyZap}
              data-testid="desktop-zap-button"
              sx={{
                border: "1.5px solid",
                borderColor: copiedZap ? "success.main" : "divider",
                bgcolor: copiedZap ? "action.hover" : "background.paper",
                borderRadius: "11px",
                py: 1.25,
                px: 1.75,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: ".04em",
                color: copiedZap ? "success.main" : "text.primary",
                textTransform: "none",
                "&:hover": {
                  bgcolor: "action.hover",
                  borderColor: "text.primary",
                },
              }}
            >
              {copiedZap
                ? t("common.copied", "COPIADO!").toUpperCase()
                : t("peladas.teams.send_whatsapp", "COPIAR P/ O ZAP")}
            </Button>
            {isAdmin && (
              <Button
                component={RouterLink}
                to={`/peladas/${pelada.id}/build-schedule`}
                data-testid={
                  pelada.has_schedule_plan
                    ? "build-schedule-button-edit"
                    : "build-schedule-button"
                }
                sx={{
                  border: "1.5px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  borderRadius: "11px",
                  py: 1.25,
                  px: 1.75,
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: ".04em",
                  color: "text.primary",
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: "action.hover",
                    borderColor: "text.primary",
                  },
                }}
              >
                {pelada.has_schedule_plan
                  ? t("peladas.detail.button.edit_schedule", "EDITAR PARTIDAS")
                  : t("peladas.detail.button.build_schedule", "GERAR PARTIDAS")}
              </Button>
            )}
            <Button
              onClick={onStartClick}
              data-testid={
                pelada.has_schedule_plan
                  ? "start-pelada-button"
                  : "desktop-save-button"
              }
              sx={{
                borderRadius: "11px",
                bgcolor: "text.primary",
                py: 1.25,
                px: 2,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: ".04em",
                color: "background.paper",
                textTransform: "none",
                "&:hover": {
                  opacity: 0.9,
                },
              }}
            >
              {pelada.has_schedule_plan
                ? t("peladas.admin.start.title", "INICIAR PELADA")
                : t("peladas.teams.save_teams", "SALVAR TIMES")}
            </Button>
          </Box>
        </Box>

        {/* 2-Column Draw Layout */}
        <Box
          sx={{
            display: "flex",
            gap: 2.5,
            mt: 2.75,
            alignItems: "flex-start",
          }}
        >
          {/* Left Column (318px) */}
          <Box sx={{ width: 318, flexShrink: 0 }}>
            {/* Como Sortear Card */}
            <Box
              sx={{
                bgcolor: "background.paper",
                border: (theme) =>
                  theme.palette.brutalist?.border ||
                  `2px solid ${theme.palette.divider}`,
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: (theme) =>
                  theme.palette.brutalist?.shadow ||
                  `5px 5px 0 ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  bgcolor: (theme) =>
                    theme.palette.brutalist?.cardHeaderBg || "text.primary",
                  py: 1.4,
                  px: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "11px",
                    letterSpacing: ".1em",
                    color: (theme) =>
                      theme.palette.brutalist?.cardHeaderText ||
                      "background.paper",
                  }}
                >
                  {t("peladas.teams.how_to_draw", "COMO SORTEAR")}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "10px",
                    letterSpacing: ".06em",
                    color: "text.secondary",
                  }}
                >
                  {totalConfirmed}{" "}
                  {t("peladas.teams.confirmed_players", "CONFIRMADOS")}
                </Typography>
              </Box>

              <Box sx={{ p: 2 }}>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11.5px",
                    lineHeight: 1.45,
                    color: "text.secondary",
                  }}
                >
                  {t(
                    "peladas.teams.draw_description",
                    "Escolha como os confirmados serão divididos. O sorteio substitui os times atuais.",
                  )}
                </Typography>

                {/* Algorithm Radio Options */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    mt: 1.75,
                  }}
                >
                  {/* Classic */}
                  <Box
                    onClick={() => setAlgorithm("classic")}
                    data-testid="algo-classic"
                    sx={{
                      border:
                        algorithm === "classic"
                          ? (theme) => `2px solid ${theme.palette.primary.main}`
                          : "1.5px solid",
                      borderColor:
                        algorithm === "classic" ? "primary.main" : "divider",
                      bgcolor: (theme) =>
                        algorithm === "classic"
                          ? theme.palette.status?.paid?.bg || "action.hover"
                          : "background.paper",
                      borderRadius: "14px",
                      p: 1.5,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border:
                            algorithm === "classic"
                              ? (theme) =>
                                  `5px solid ${theme.palette.primary.main}`
                              : "2px solid",
                          borderColor:
                            algorithm === "classic"
                              ? "primary.main"
                              : "divider",
                          bgcolor: "background.paper",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: algorithm === "classic" ? 800 : 700,
                          fontSize: "12.5px",
                          color: "text.primary",
                          flex: 1,
                        }}
                      >
                        {t(
                          "peladas.detail.draw.algorithm.classic.name",
                          "Clássico",
                        )}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "8.5px",
                          letterSpacing: ".08em",
                          color: "primary.main",
                          border: "1.5px solid",
                          borderColor: "primary.main",
                          borderRadius: "5px",
                          px: 0.6,
                          py: 0.3,
                        }}
                      >
                        {t("peladas.teams.default_badge", "PADRÃO")}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "11px",
                        lineHeight: 1.4,
                        color: "text.secondary",
                        mt: 1,
                        pl: 3.25,
                      }}
                    >
                      {t(
                        "peladas.detail.draw.algorithm.classic.description",
                        "A conta de sempre: equilibra nota e posição, sem olhar histórico.",
                      )}
                    </Typography>
                  </Box>

                  {/* Gemini / Equilíbrio tático */}
                  <Box
                    onClick={() => setAlgorithm("gemini")}
                    data-testid="algo-gemini"
                    sx={{
                      border:
                        algorithm === "gemini"
                          ? (theme) => `2px solid ${theme.palette.primary.main}`
                          : "1.5px solid",
                      borderColor:
                        algorithm === "gemini" ? "primary.main" : "divider",
                      bgcolor: (theme) =>
                        algorithm === "gemini"
                          ? theme.palette.status?.paid?.bg || "action.hover"
                          : "background.paper",
                      borderRadius: "14px",
                      p: 1.5,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border:
                            algorithm === "gemini"
                              ? (theme) =>
                                  `5px solid ${theme.palette.primary.main}`
                              : "2px solid",
                          borderColor:
                            algorithm === "gemini" ? "primary.main" : "divider",
                          bgcolor: "background.paper",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: algorithm === "gemini" ? 800 : 700,
                          fontSize: "12.5px",
                          color: "text.primary",
                          flex: 1,
                        }}
                      >
                        {t(
                          "peladas.detail.draw.algorithm.gemini.name",
                          "Gemini",
                        )}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "8.5px",
                          letterSpacing: ".08em",
                          color: "text.secondary",
                          border: "1.5px solid",
                          borderColor: "divider",
                          borderRadius: "5px",
                          px: 0.6,
                          py: 0.3,
                        }}
                      >
                        {t(
                          "peladas.detail.draw.algorithm.gemini.tag",
                          "Química",
                        )}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "11px",
                        lineHeight: 1.4,
                        color: "text.secondary",
                        mt: 1,
                        pl: 3.25,
                      }}
                    >
                      {t(
                        "peladas.detail.draw.algorithm.gemini.description",
                        "Equilibra os times usando nota, votos e estatísticas, separando panelas e estimulando duplas inéditas.",
                      )}
                    </Typography>
                  </Box>

                  {/* GPT / Por regras */}
                  <Box
                    onClick={() => setAlgorithm("gpt")}
                    data-testid="algo-gpt"
                    sx={{
                      border:
                        algorithm === "gpt"
                          ? (theme) => `2px solid ${theme.palette.primary.main}`
                          : "1.5px solid",
                      borderColor:
                        algorithm === "gpt" ? "primary.main" : "divider",
                      bgcolor: (theme) =>
                        algorithm === "gpt"
                          ? theme.palette.status?.paid?.bg || "action.hover"
                          : "background.paper",
                      borderRadius: "14px",
                      p: 1.5,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border:
                            algorithm === "gpt"
                              ? (theme) =>
                                  `5px solid ${theme.palette.primary.main}`
                              : "2px solid",
                          borderColor:
                            algorithm === "gpt" ? "primary.main" : "divider",
                          bgcolor: "background.paper",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: algorithm === "gpt" ? 800 : 700,
                          fontSize: "12.5px",
                          color: "text.primary",
                          flex: 1,
                        }}
                      >
                        {t("peladas.detail.draw.algorithm.gpt.name", "ChatGPT")}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "8.5px",
                          letterSpacing: ".08em",
                          color: "text.secondary",
                          border: "1.5px solid",
                          borderColor: "divider",
                          borderRadius: "5px",
                          px: 0.6,
                          py: 0.3,
                        }}
                      >
                        {t(
                          "peladas.detail.draw.algorithm.gpt.tag",
                          "Equilíbrio Tático",
                        )}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "11px",
                        lineHeight: 1.4,
                        color: "text.secondary",
                        mt: 1,
                        pl: 3.25,
                      }}
                    >
                      {t(
                        "peladas.detail.draw.algorithm.gpt.description",
                        "Aplica regras em ordem: uma referência por time, média equilibrada, distribui quem tem poucas noites e nivela o meio-campo.",
                      )}
                    </Typography>
                  </Box>
                </Box>

                {/* Formato do sorteio: número de times e jogadores por time */}
                {isAdmin && (
                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: "1.5px dashed",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "9px",
                        letterSpacing: ".14em",
                        color: "text.secondary",
                        textTransform: "uppercase",
                      }}
                    >
                      {t("peladas.teams.draw_format", "FORMATO DO SORTEIO")}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1, mt: 1.25 }}>
                      <Box
                        sx={{
                          flex: 1,
                          border: "1.5px solid",
                          borderColor: "divider",
                          borderRadius: "12px",
                          p: "9px 10px",
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "9px",
                            letterSpacing: ".08em",
                            color: "text.secondary",
                            textTransform: "uppercase",
                          }}
                        >
                          {t("peladas.teams.teams_label", "TIMES")}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mt: 0.75,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => onUpdateNumTeams?.(numTeams - 1)}
                            disabled={processing || numTeams <= 2}
                            data-testid="num-teams-decrement"
                            sx={{ p: 0.25 }}
                          >
                            <RemoveIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                          <Typography
                            data-testid="num-teams-value"
                            sx={{
                              fontFamily:
                                "'Archivo Narrow', Archivo, sans-serif",
                              fontWeight: 700,
                              fontSize: "20px",
                              lineHeight: 1,
                              color: "text.primary",
                            }}
                          >
                            {numTeams}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => onUpdateNumTeams?.(numTeams + 1)}
                            disabled={processing || numTeams >= 8}
                            data-testid="num-teams-increment"
                            sx={{ p: 0.25 }}
                          >
                            <AddIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          flex: 1,
                          border: "1.5px solid",
                          borderColor: "divider",
                          borderRadius: "12px",
                          p: "9px 10px",
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "9px",
                            letterSpacing: ".08em",
                            color: "text.secondary",
                            textTransform: "uppercase",
                          }}
                        >
                          {t("peladas.teams.per_team", "POR TIME")}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mt: 0.75,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() =>
                              onUpdatePlayersPerTeam?.(playersPerTeam - 1)
                            }
                            disabled={processing || playersPerTeam <= 1}
                            data-testid="players-per-team-decrement"
                            sx={{ p: 0.25 }}
                          >
                            <RemoveIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                          <Typography
                            component="h6"
                            data-testid="players-per-team-value"
                            sx={{
                              fontFamily:
                                "'Archivo Narrow', Archivo, sans-serif",
                              fontWeight: 700,
                              fontSize: "20px",
                              lineHeight: 1,
                              color: "text.primary",
                            }}
                          >
                            {playersPerTeam}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() =>
                              onUpdatePlayersPerTeam?.(playersPerTeam + 1)
                            }
                            disabled={processing || playersPerTeam >= 11}
                            data-testid="players-per-team-increment"
                            sx={{ p: 0.25 }}
                          >
                            <AddIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Sinais históricos toggle */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mt: 2,
                    pt: 2,
                    borderTop: "1.5px dashed",
                    borderColor: "divider",
                  }}
                >
                  <Switch
                    checked={algorithm !== "classic" && useHistory}
                    onChange={(e) => setUseHistory(e.target.checked)}
                    disabled={algorithm === "classic"}
                    color="primary"
                    size="small"
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "11.5px",
                        lineHeight: 1.2,
                        color:
                          algorithm === "classic"
                            ? "text.secondary"
                            : "text.primary",
                      }}
                    >
                      {t("peladas.teams.use_history", "Usar sinais históricos")}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "10.5px",
                        lineHeight: 1.35,
                        color: "text.secondary",
                        mt: 0.5,
                      }}
                    >
                      {algorithm === "classic"
                        ? t(
                            "peladas.teams.history_unavailable",
                            "indisponível no clássico — a contagem não olha histórico",
                          )
                        : t(
                            "peladas.teams.history_hint",
                            "analisa histórico de jogos, entrosamento e votos",
                          )}
                    </Typography>
                  </Box>
                </Box>

                {/* Fixed Goalkeepers */}
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: "1.5px dashed",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      data-testid="fixed-goalkeepers-title"
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "9px",
                        letterSpacing: ".14em",
                        color: "text.secondary",
                        textTransform: "uppercase",
                      }}
                    >
                      {t("peladas.teams.fixed_goalkeepers", "GOLEIROS FIXOS")}
                    </Typography>
                    <Switch
                      checked={Boolean(pelada.fixed_goalkeepers)}
                      onChange={(e, checked) =>
                        onToggleFixedGk?.(
                          checked !== undefined ? checked : e.target.checked,
                        )
                      }
                      size="small"
                      slotProps={{
                        input: {
                          "aria-label": t(
                            "peladas.teams.fixed_goalkeepers",
                            "Goleiros Fixos",
                          ),
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, mt: 1.25 }}>
                    <FixedGkSlot
                      side="home"
                      gk={homeGk}
                      isAdmin={isAdmin}
                      onDrop={dropToFixedGk}
                      onRemove={removeFixedGk}
                    />
                    <FixedGkSlot
                      side="away"
                      gk={awayGk}
                      isAdmin={isAdmin}
                      onDrop={dropToFixedGk}
                      onRemove={removeFixedGk}
                    />
                  </Box>

                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "10.5px",
                      lineHeight: 1.35,
                      color: "text.secondary",
                      mt: 1.2,
                    }}
                  >
                    {t(
                      "peladas.teams.gk_locked_hint",
                      "Goleiros travados nos times. As outras posições são embaralhadas e equilibradas por nível.",
                    )}
                  </Typography>
                </Box>

                {/* Big Action Button */}
                <Button
                  fullWidth
                  onClick={handleRandomizeClick}
                  disabled={processing}
                  data-testid="draw-again-button"
                  sx={{
                    borderRadius: "14px",
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    py: 2,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "15px",
                    letterSpacing: ".06em",
                    mt: 2,
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                >
                  {t("peladas.teams.draw_button", "SORTEAR")}
                </Button>
              </Box>
            </Box>

            {/* Por Que Ficou Assim Card */}
            <Box sx={{ mt: 1.75 }}>
              <DrawJustificationCard
                justification={drawJustification}
                teamAverages={teamAverages}
                playersPerTeam={playersPerTeam}
                homeGkName={homeGk?.user?.name}
                awayGkName={awayGk?.user?.name}
                onOpenDialog={onOpenJustificationDialog}
              />
            </Box>
          </Box>

          {/* Right Column: Teams Grid & Bench */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
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
                {t("peladas.teams.teams_per_side", {
                  count: playersPerTeam,
                  defaultValue: `TIMES · ${playersPerTeam} POR LADO`,
                })}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11.5px",
                    color: "text.secondary",
                  }}
                >
                  {t(
                    "peladas.teams.drag_to_swap",
                    "arraste um jogador para trocar de time",
                  )}
                </Typography>
                {isAdmin && (
                  <Box
                    component="button"
                    onClick={handleAddTeam}
                    disabled={processing}
                    data-testid="desktop-add-team-button"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: (theme) =>
                        `1.5px dashed ${theme.palette.divider}`,
                      bgcolor: "background.paper",
                      borderRadius: "10px",
                      p: "7px 12px",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "10.5px",
                      letterSpacing: ".04em",
                      color: "text.secondary",
                      cursor: processing ? "not-allowed" : "pointer",
                      opacity: processing ? 0.6 : 1,
                      "&:hover": {
                        borderColor: "primary.main",
                        color: "primary.main",
                      },
                    }}
                  >
                    + {t("peladas.teams.add_team", "ADICIONAR TIME")}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Teams Grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(auto-fit, minmax(220px, 1fr))",
                  lg: "repeat(3, 1fr)",
                },
                gap: 1.5,
                mt: 1.4,
              }}
            >
              {teams.map((team, idx) => {
                const players = teamPlayers[team.id] || [];
                const sortedPlayers = sortedTeamPlayers[team.id] || [];
                const teamAvg = teamAverages.find(
                  (t) => t.teamId === team.id,
                )?.avg;
                const avg = teamAvg && teamAvg > 0 ? teamAvg.toFixed(1) : "-";
                const isUnderfilled = players.length < playersPerTeam;
                const vestKey =
                  VEST_KEYS[idx % VEST_KEYS.length] || "vest_default";
                const vestLabel = t(`peladas.teams.${vestKey}`, "COLETE");

                return (
                  <Box
                    key={team.id}
                    data-testid="team-card"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dropToTeam(e, team.id);
                    }}
                    sx={{
                      bgcolor: "background.paper",
                      border: (theme) =>
                        isUnderfilled
                          ? `2px dashed ${theme.palette.divider}`
                          : theme.palette.brutalist?.border ||
                            `2px solid ${theme.palette.divider}`,
                      borderRadius: "18px",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      data-testid={`team-card-${team.id}`}
                      sx={{ width: "100%", height: "100%" }}
                    >
                      {/* Team Header */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: "12px 14px",
                          borderBottom: "1.5px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Box>
                          <Typography
                            data-testid="team-card-name"
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 800,
                              fontSize: "14px",
                              lineHeight: 1.1,
                              color: "text.primary",
                              textTransform: "uppercase",
                            }}
                          >
                            {team.name}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 700,
                              fontSize: "9px",
                              letterSpacing: ".1em",
                              color: isUnderfilled
                                ? "secondary.main"
                                : "text.secondary",
                              mt: 0.6,
                              textTransform: "uppercase",
                            }}
                          >
                            {isUnderfilled
                              ? playersPerTeam - players.length > 1
                                ? t("peladas.teams.missing_players_plural", {
                                    count: playersPerTeam - players.length,
                                    defaultValue: `FALTA ${playersPerTeam - players.length} JOGADORES`,
                                  })
                                : t("peladas.teams.missing_players", {
                                    count: 1,
                                    defaultValue: "FALTA 1 JOGADOR",
                                  })
                              : vestLabel}
                          </Typography>
                        </Box>

                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 800,
                              fontSize: "10px",
                              lineHeight: 1,
                              color: isUnderfilled
                                ? "text.secondary"
                                : "primary.contrastText",
                              bgcolor: isUnderfilled
                                ? "action.hover"
                                : "primary.main",
                              borderRadius: "6px",
                              p: "5px 7px",
                            }}
                          >
                            {avg}
                          </Box>
                          {isAdmin && (
                            <IconButton
                              size="small"
                              onClick={() => onDeleteTeam(team.id)}
                              sx={{ p: 0.25, color: "text.secondary" }}
                              aria-label={t(
                                "peladas.team_card.delete",
                                `Excluir ${team.name}`,
                                { name: team.name },
                              )}
                            >
                              <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          )}
                        </Box>
                      </Box>

                      {/* Players List */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.75,
                          p: 1.5,
                        }}
                      >
                        {sortedPlayers.map((p, pIdx) => {
                          const isYou =
                            currentUser && p.user?.id === currentUser.id;
                          const isGk =
                            p.id === homeGk?.id ||
                            p.id === awayGk?.id ||
                            p.is_goalkeeper;
                          const gradeVal =
                            typeof scores[p.id] === "number"
                              ? scores[p.id].toFixed(1)
                              : typeof p.grade === "number"
                                ? p.grade.toFixed(1)
                                : "-";
                          const avatarBg =
                            AVATAR_BG_COLORS[pIdx % AVATAR_BG_COLORS.length];

                          return (
                            <Box
                              key={p.id}
                              data-testid="player-row"
                              draggable
                              onDragStart={(e) =>
                                onDragStartPlayer(e, p.id, team.id)
                              }
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.2,
                                border: isYou
                                  ? (theme) =>
                                      `2px solid ${theme.palette.primary.main}`
                                  : "1.5px solid",
                                borderColor: isYou ? "primary.main" : "divider",
                                bgcolor: isYou
                                  ? (theme) =>
                                      theme.palette.status?.paid?.bg ||
                                      "action.hover"
                                  : isGk
                                    ? "action.hover"
                                    : "background.paper",
                                borderRadius: "11px",
                                p: isYou ? "7px 8px" : "8px 9px",
                                cursor: "grab",
                                "&:active": { cursor: "grabbing" },
                              }}
                            >
                              <SecureAvatar
                                {...getPlayerAvatarProps(p)}
                                sx={{
                                  width: 26,
                                  height: 26,
                                  bgcolor: isYou ? "primary.main" : avatarBg,
                                  fontFamily: "Archivo, sans-serif",
                                  fontWeight: 800,
                                  fontSize: "9px",
                                  color: isYou
                                    ? "primary.contrastText"
                                    : "text.primary",
                                  flexShrink: 0,
                                }}
                              />

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  sx={{
                                    fontFamily: "Archivo, sans-serif",
                                    fontWeight: 700,
                                    fontSize: "11.5px",
                                    lineHeight: 1.2,
                                    color: "text.primary",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {p.user?.name}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontFamily: "Archivo, sans-serif",
                                    fontWeight: 600,
                                    fontSize: "9.5px",
                                    lineHeight: 1.2,
                                    color: isYou
                                      ? "primary.main"
                                      : "text.secondary",
                                    mt: 0.25,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {formatPlayerPosition(p)}
                                  {isGk
                                    ? ` · ${t("peladas.teams.fixed_label", "fixo")}`
                                    : ""}
                                  {isYou
                                    ? ` · ${t("peladas.teams.you_label", "você")}`
                                    : ""}
                                  {p.member_type === "diarista"
                                    ? ` · ${t("common.member_types.diarista", "diarista").toLowerCase()}`
                                    : ""}
                                </Typography>
                              </Box>

                              <Typography
                                sx={{
                                  fontFamily: "Archivo, sans-serif",
                                  fontWeight: 800,
                                  fontSize: "11px",
                                  color: "primary.main",
                                }}
                              >
                                {gradeVal}
                              </Typography>
                              {isAdmin && (
                                <IconButton
                                  size="small"
                                  onClick={(e) =>
                                    handleOpenPlayerMenu(e, p, team.id)
                                  }
                                  sx={{
                                    p: 0.25,
                                    color: "text.secondary",
                                    "&:hover": { color: "primary.main" },
                                  }}
                                >
                                  <SwapHorizIcon sx={{ fontSize: "1.2rem" }} />
                                </IconButton>
                              )}
                            </Box>
                          );
                        })}

                        {/* Open Slots (VAGA LIVRE) */}
                        {Array.from({
                          length: Math.max(0, playersPerTeam - players.length),
                        }).map((_, emptyIdx) => (
                          <Box
                            key={`empty-${emptyIdx}`}
                            sx={{
                              height: 42,
                              border: (theme) =>
                                `1.5px dashed ${theme.palette.divider}`,
                              borderRadius: "11px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 700,
                              fontSize: "10.5px",
                              letterSpacing: ".06em",
                              color: "text.secondary",
                              bgcolor: "action.hover",
                            }}
                          >
                            {t("peladas.teams.empty_slot", "VAGA LIVRE")}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Banco Card */}
            <Box
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dropToBench(e);
              }}
              sx={{
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
                borderRadius: "16px",
                p: "14px 16px",
                mt: 1.75,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
                    {t(
                      "peladas.teams.bench_title_count",
                      "BANCO · {{count}} FORA DOS TIMES",
                      { count: benchPlayers.length },
                    )}
                  </Typography>
                  {isAdmin && (
                    <>
                      <AddPlayersButton
                        onClick={onAddPlayersClick}
                        disabled={processing}
                      />
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
                        onClick={handleCopyBenchPlayers}
                        disabled={benchPlayers.length === 0}
                        data-testid="copy-players-button"
                        sx={{
                          textTransform: "none",
                          color: "text.secondary",
                          fontWeight: 700,
                          fontSize: "11px",
                          fontFamily: "Archivo, sans-serif",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t(
                          "peladas.available.button.copy_list",
                          "Copiar lista",
                        )}
                      </Button>
                    </>
                  )}
                </Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "text.secondary",
                  }}
                >
                  {t(
                    "peladas.teams.drag_to_team",
                    "arraste para dentro de um time",
                  )}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 1.2,
                  mt: 1.5,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {benchPlayers.length === 0 ? (
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "11.5px",
                      color: "text.secondary",
                      py: 1,
                    }}
                  >
                    {t(
                      "peladas.teams.no_bench_players",
                      "Nenhum jogador no banco no momento.",
                    )}
                  </Typography>
                ) : (
                  benchPlayers.map((bp, bIdx) => (
                    <Box
                      key={bp.id}
                      data-testid="player-row"
                      draggable
                      onDragStart={(e) => onDragStartPlayer(e, bp.id, null)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: "12px",
                        p: "8px 12px 8px 9px",
                        bgcolor: "action.hover",
                        cursor: "grab",
                        "&:active": { cursor: "grabbing" },
                      }}
                    >
                      <SecureAvatar
                        {...getPlayerAvatarProps(bp)}
                        sx={{
                          width: 26,
                          height: 26,
                          bgcolor:
                            AVATAR_BG_COLORS[bIdx % AVATAR_BG_COLORS.length],
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "9px",
                          color: "text.primary",
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "11.5px",
                            lineHeight: 1.2,
                            color: "text.primary",
                          }}
                        >
                          {bp.user?.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 600,
                            fontSize: "9.5px",
                            lineHeight: 1.2,
                            color: "text.secondary",
                            mt: 0.25,
                          }}
                        >
                          {formatPlayerPosition(bp)} ·{" "}
                          {t("peladas.teams.on_bench", "no banco")}
                        </Typography>
                      </Box>
                      {isAdmin && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenPlayerMenu(e, bp, null)}
                          sx={{
                            p: 0.25,
                            ml: "auto",
                            color: "text.secondary",
                            "&:hover": { color: "primary.main" },
                          }}
                        >
                          <SwapHorizIcon sx={{ fontSize: "1.2rem" }} />
                        </IconButton>
                      )}
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Player Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor && activePlayerForMenu)}
        onClose={handleClosePlayerMenu}
      >
        {activePlayerForMenu?.sourceTeamId && (
          <MenuItem
            onClick={() => {
              onSendToBench?.(activePlayerForMenu.player.id);
              handleClosePlayerMenu();
            }}
          >
            <ListItemIcon>
              <ArrowDownwardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {t("peladas.teams.menu.send_to_bench", "Enviar para o Banco")}
            </ListItemText>
          </MenuItem>
        )}
        {teams
          .filter((t) => t.id !== activePlayerForMenu?.sourceTeamId)
          .map((targetTeam) => (
            <MenuItem
              key={targetTeam.id}
              onClick={() => {
                if (activePlayerForMenu) {
                  onMoveToTeam?.(activePlayerForMenu.player.id, targetTeam.id);
                }
                handleClosePlayerMenu();
              }}
            >
              <ListItemIcon>
                <GroupsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {t("peladas.teams.menu.move_to", {
                  name: targetTeam.name,
                  defaultValue: `Mover para ${targetTeam.name}`,
                })}
              </ListItemText>
            </MenuItem>
          ))}
        {Boolean(pelada.fixed_goalkeepers) && [
          <MenuItem
            key="home-gk"
            data-testid="move-to-home-gk-item"
            onClick={() => {
              if (activePlayerForMenu) {
                onMoveToFixedGk?.(activePlayerForMenu.player.id, "home");
              }
              handleClosePlayerMenu();
            }}
          >
            <ListItemIcon>
              <SecurityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {t("peladas.teams.menu.move_to_home_gk", "Goleiro Time 1")}
            </ListItemText>
          </MenuItem>,
          <MenuItem
            key="away-gk"
            data-testid="move-to-away-gk-item"
            onClick={() => {
              if (activePlayerForMenu) {
                onMoveToFixedGk?.(activePlayerForMenu.player.id, "away");
              }
              handleClosePlayerMenu();
            }}
          >
            <ListItemIcon>
              <SecurityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {t("peladas.teams.menu.move_to_away_gk", "Goleiro Time 2")}
            </ListItemText>
          </MenuItem>,
        ]}
      </Menu>
    </Box>
  );
}
