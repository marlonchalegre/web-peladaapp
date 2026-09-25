import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Button,
  Switch,
  Menu,
  MenuItem,
  CircularProgress,
  Divider,
  IconButton,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CasinoIcon from "@mui/icons-material/Casino";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import type {
  Pelada,
  Team,
  User,
  Transaction,
  DrawAlgorithm,
  DrawJustification,
} from "../../../shared/api/endpoints";
import type { PlayerWithUser } from "./TeamsSection";
import DrawJustificationCard from "./DrawJustificationCard";
import LocationDisplay from "../../../shared/components/LocationDisplay";
import {
  getInitials,
  formatPosition,
  AVATAR_BG_COLORS,
} from "../utils/playerUtils";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";

export interface PeladaTeamsMobileViewProps {
  pelada: Pelada;
  teams: Team[];
  teamPlayers: Record<string, PlayerWithUser[]>;
  benchPlayers: PlayerWithUser[];
  homeGk: PlayerWithUser | null;
  awayGk: PlayerWithUser | null;
  scores: Record<string, number>;
  isAdmin: boolean;
  processing: boolean;
  onMoveToTeam: (playerId: string, teamId: string) => void;
  onSendToBench: (playerId: string) => void;
  onMoveToFixedGk: (playerId: string, role: "home" | "away") => void;
  onRemoveFixedGk: (role: "home" | "away") => void;
  onRandomizeTeams: (options: {
    algorithm: DrawAlgorithm;
    useHistory: boolean;
  }) => void;
  onUpdatePlayersPerTeam?: (count: number) => void;
  onUpdateNumTeams?: (count: number) => void;
  drawJustification: DrawJustification | null;
  onOpenJustificationDialog?: () => void;
  onCreateTeam?: (name: string) => Promise<void> | void;
  onDeleteTeam?: (teamId: string) => Promise<void> | void;
  onStartClick: () => void;
  onCopyAnnouncement: () => void;
  onToggleFixedGk: (enabled: boolean) => void;
  dropToTeam?: (
    e: React.DragEvent<HTMLElement>,
    teamId: string,
  ) => Promise<void> | void;
  dropToBench?: (e: React.DragEvent<HTMLElement>) => Promise<void> | void;
  dropToFixedGk?: (
    e: React.DragEvent<HTMLElement>,
    side: "home" | "away",
  ) => Promise<void> | void;
  currentUser?: User | null;
  peladaTransactions?: Transaction[];
  onMarkPaid?: (playerId: string, amount: number) => void;
  onReversePayment?: (playerId: string) => void;
}

export default function PeladaTeamsMobileView({
  pelada,
  teams,
  teamPlayers,
  benchPlayers,
  homeGk,
  awayGk,
  scores,
  isAdmin,
  processing,
  onMoveToTeam,
  onSendToBench,
  onRandomizeTeams,
  onUpdatePlayersPerTeam,
  onUpdateNumTeams,
  drawJustification,
  onOpenJustificationDialog,
  onCreateTeam,
  onDeleteTeam,
  onStartClick,
  onCopyAnnouncement,
  onToggleFixedGk,
  currentUser,
  peladaTransactions = [],
  onMarkPaid,
  onReversePayment,
}: PeladaTeamsMobileViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Local draw options state
  const [selectedAlgorithm, setSelectedAlgorithm] =
    useState<DrawAlgorithm>("classic");
  const [useHistory, setUseHistory] = useState(true);
  const [showDrawConfig, setShowDrawConfig] = useState(false);

  // Player action menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<{
    player: PlayerWithUser;
    currentTeamId: string | null;
  } | null>(null);

  const handleOpenPlayerMenu = (
    event: React.MouseEvent<HTMLElement>,
    player: PlayerWithUser,
    currentTeamId: string | null,
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedPlayer({ player, currentTeamId });
  };

  const handleClosePlayerMenu = () => {
    setMenuAnchorEl(null);
    setSelectedPlayer(null);
  };

  // Date parsing
  const rawDate =
    pelada.scheduled_at ||
    pelada.when ||
    (pelada as unknown as { date?: string }).date;
  const pDate = rawDate ? new Date(rawDate) : new Date();
  const dayStr = !isNaN(pDate.getDate())
    ? String(pDate.getDate()).padStart(2, "0")
    : "16";
  const monthStr = !isNaN(pDate.getMonth())
    ? String(pDate.getMonth() + 1).padStart(2, "0")
    : "09";
  const weekdayStr = !isNaN(pDate.getDay())
    ? pDate
        .toLocaleDateString(t("common.locale_code", "pt-BR"), {
          weekday: "short",
        })
        .toUpperCase()
    : "QUA";
  const timeStr = !isNaN(pDate.getHours())
    ? pDate.toLocaleTimeString(t("common.locale_code", "pt-BR"), {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "19:00";

  const totalConfirmed =
    Object.values(teamPlayers).flat().length + benchPlayers.length;
  const playersPerTeam = pelada.players_per_team || 5;
  const numTeams = pelada.num_teams || teams.length || 2;

  // Paid set
  const paidPlayerIds = useMemo(
    () =>
      new Set(
        peladaTransactions
          .filter(
            (tx) =>
              tx.type === "income" &&
              tx.category === "diarista_fee" &&
              tx.status === "paid",
          )
          .map((tx) => tx.player_id),
      ),
    [peladaTransactions],
  );

  const getPlayerScore = useCallback(
    (player: PlayerWithUser) => {
      if (scores[player.id] !== undefined) return scores[player.id];
      if (player.user_id && scores[player.user_id] !== undefined) {
        return scores[player.user_id];
      }
      return 7.0;
    },
    [scores],
  );

  const teamAverages = useMemo(() => {
    return teams.map((team, idx) => {
      const players = teamPlayers[team.id] || [];
      const sum = players.reduce((acc, p) => acc + getPlayerScore(p), 0);
      const avg = players.length > 0 ? sum / players.length : 0;
      return {
        teamName: team.name || `Time ${idx + 1}`,
        avg,
        count: players.length,
      };
    });
  }, [teams, teamPlayers, getPlayerScore]);

  const isDiarista = (memberType?: string) =>
    memberType === "diarista" ||
    memberType === "diarista_temporario" ||
    memberType === "convidado";

  const handleExecuteDraw = () => {
    onRandomizeTeams({
      algorithm: selectedAlgorithm,
      useHistory: selectedAlgorithm !== "classic" && useHistory,
    });
  };

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        pb: 6,
        px: { xs: 1.5, sm: 2.5 },
        pt: 1.5,
      }}
    >
      {/* 1. Header Section */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <IconButton
            onClick={() => {
              if (pelada.organization_id) {
                navigate(`/organizations/${pelada.organization_id}`);
              } else {
                navigate(-1);
              }
            }}
            size="small"
            aria-label={t("peladas.teams.back", "Voltar")}
            data-testid="back-to-org-button"
            sx={{
              color: "text.primary",
              p: 0.5,
              ml: -0.5,
              "&:hover": {
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
              },
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
          </IconButton>
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
              {pelada.organization_name || t("common.pelada", "PELADA")} ·{" "}
              {weekdayStr} {dayStr}/{monthStr} · {timeStr}
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
        </Box>

        <Typography
          variant="h1"
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "24px",
            lineHeight: 1.1,
            color: "text.primary",
            mt: 0.75,
          }}
        >
          {t("peladas.teams.draw_title", "Sorteio de times")}
        </Typography>

        {/* Action buttons row */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: 1.75,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Button
            variant="outlined"
            onClick={onCopyAnnouncement}
            startIcon={<WhatsAppIcon />}
            sx={{
              flex: 1,
              minWidth: 130,
              bgcolor: "background.paper",
              borderColor: "divider",
              color: "text.primary",
              borderRadius: "11px",
              py: 1,
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "11px",
              letterSpacing: ".04em",
              textTransform: "uppercase",
              "&:hover": {
                borderColor: "text.primary",
                bgcolor: "action.hover",
              },
            }}
          >
            {t("peladas.teams.send_whatsapp", "MANDAR NO ZAP")}
          </Button>

          {isAdmin && (
            <Button
              variant="contained"
              onClick={onStartClick}
              startIcon={<PlayArrowIcon />}
              sx={{
                flex: 1,
                minWidth: 130,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "primary.main"
                    : "text.primary",
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? "primary.contrastText"
                    : "background.paper",
                borderRadius: "11px",
                py: 1,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: ".04em",
                textTransform: "uppercase",
                "&:hover": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "primary.light"
                      : "text.primary",
                },
              }}
            >
              {t("peladas.teams.start_pelada", "INICIAR PELADA")}
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="outlined"
              onClick={() => setShowDrawConfig((prev) => !prev)}
              startIcon={<CasinoIcon />}
              sx={{
                bgcolor: (theme) =>
                  showDrawConfig
                    ? theme.palette.mode === "dark"
                      ? "primary.main"
                      : "text.primary"
                    : "background.paper",
                color: (theme) =>
                  showDrawConfig
                    ? theme.palette.mode === "dark"
                      ? "primary.contrastText"
                      : "background.paper"
                    : "text.primary",
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "primary.main"
                    : "text.primary",
                borderRadius: "11px",
                py: 1,
                px: 1.5,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: ".04em",
                textTransform: "uppercase",
                "&:hover": {
                  bgcolor: (theme) =>
                    showDrawConfig
                      ? theme.palette.mode === "dark"
                        ? "primary.light"
                        : "text.primary"
                      : "action.hover",
                },
              }}
            >
              {showDrawConfig
                ? t("peladas.teams.close_panel", "FECHAR PAINEL")
                : t("peladas.teams.draw_button", "SORTEAR")}
            </Button>
          )}
        </Box>
      </Box>

      {/* 2. COMO SORTEAR Panel (Mobile Draw Settings) */}
      {isAdmin && (showDrawConfig || teams.length === 0) && (
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
              `4px 4px 0 ${theme.palette.divider}`,
            mb: 2.5,
          }}
        >
          <Box
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "background.paper"
                  : "text.primary",
              px: 2,
              py: 1.25,
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
                  theme.palette.mode === "dark"
                    ? "text.primary"
                    : "background.paper",
                textTransform: "uppercase",
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
                textTransform: "uppercase",
              }}
            >
              {t("peladas.teams.confirmed_count", "{{count}} CONFIRMADOS", {
                count: totalConfirmed,
              })}
            </Typography>
          </Box>

          <Box sx={{ p: 2 }}>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.4,
                color: "text.secondary",
                mb: 1.75,
              }}
            >
              {t(
                "peladas.teams.choose_algorithm",
                "Escolha o algoritmo de divisão dos times.",
              )}
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {/* Option 1: Clássico */}
              <Box
                onClick={() => setSelectedAlgorithm("classic")}
                sx={{
                  border:
                    selectedAlgorithm === "classic"
                      ? (theme) => `2px solid ${theme.palette.primary.main}`
                      : "1.5px solid",
                  borderColor:
                    selectedAlgorithm === "classic"
                      ? "primary.main"
                      : "divider",
                  bgcolor: (theme) =>
                    selectedAlgorithm === "classic"
                      ? theme.palette.status?.paid?.bg || "action.hover"
                      : "background.paper",
                  borderRadius: "12px",
                  p: 1.5,
                  cursor: "pointer",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border:
                        selectedAlgorithm === "classic"
                          ? (theme) => `5px solid ${theme.palette.primary.main}`
                          : "2px solid",
                      borderColor:
                        selectedAlgorithm === "classic"
                          ? "primary.main"
                          : "divider",
                      bgcolor: "background.paper",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "12.5px",
                      color: "text.primary",
                      flex: 1,
                    }}
                  >
                    {t("peladas.teams.classic", "Clássico")}
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
                      py: 0.25,
                    }}
                  >
                    {t("peladas.teams.default", "PADRÃO")}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "text.secondary",
                    mt: 0.75,
                    pl: 3.2,
                  }}
                >
                  {t(
                    "peladas.teams.classic_desc",
                    "Equilibra nota e posição sem histórico.",
                  )}
                </Typography>
              </Box>

              {/* Option 2: Equilíbrio Tático (Gemini) */}
              <Box
                onClick={() => setSelectedAlgorithm("gemini")}
                sx={{
                  border:
                    selectedAlgorithm === "gemini"
                      ? (theme) => `2px solid ${theme.palette.primary.main}`
                      : "1.5px solid",
                  borderColor:
                    selectedAlgorithm === "gemini" ? "primary.main" : "divider",
                  bgcolor: (theme) =>
                    selectedAlgorithm === "gemini"
                      ? theme.palette.status?.paid?.bg || "action.hover"
                      : "background.paper",
                  borderRadius: "12px",
                  p: 1.5,
                  cursor: "pointer",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border:
                        selectedAlgorithm === "gemini"
                          ? (theme) => `5px solid ${theme.palette.primary.main}`
                          : "2px solid",
                      borderColor:
                        selectedAlgorithm === "gemini"
                          ? "primary.main"
                          : "divider",
                      bgcolor: "background.paper",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: selectedAlgorithm === "gemini" ? 800 : 700,
                      fontSize: "12.5px",
                      color: "text.primary",
                      flex: 1,
                    }}
                  >
                    {t("peladas.teams.tactical_balance", "Equilíbrio tático")}
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
                      py: 0.25,
                    }}
                  >
                    {t("peladas.teams.ai_gemini", "IA · GEMINI")}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "text.secondary",
                    mt: 0.75,
                    pl: 3.2,
                  }}
                >
                  {t(
                    "peladas.teams.tactical_desc",
                    "Equilibra força geral, defesa e ataque com notas, votos e estatísticas. Separa panelinhas vencedoras.",
                  )}
                </Typography>
              </Box>

              {/* Option 3: Por regras (GPT) */}
              <Box
                onClick={() => setSelectedAlgorithm("gpt")}
                sx={{
                  border:
                    selectedAlgorithm === "gpt"
                      ? (theme) => `2px solid ${theme.palette.primary.main}`
                      : "1.5px solid",
                  borderColor:
                    selectedAlgorithm === "gpt" ? "primary.main" : "divider",
                  bgcolor: (theme) =>
                    selectedAlgorithm === "gpt"
                      ? theme.palette.status?.paid?.bg || "action.hover"
                      : "background.paper",
                  borderRadius: "12px",
                  p: 1.5,
                  cursor: "pointer",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border:
                        selectedAlgorithm === "gpt"
                          ? (theme) => `5px solid ${theme.palette.primary.main}`
                          : "2px solid",
                      borderColor:
                        selectedAlgorithm === "gpt"
                          ? "primary.main"
                          : "divider",
                      bgcolor: "background.paper",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: selectedAlgorithm === "gpt" ? 800 : 700,
                      fontSize: "12.5px",
                      color: "text.primary",
                      flex: 1,
                    }}
                  >
                    {t("peladas.teams.by_rules", "Por regras")}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "8.5px",
                      letterSpacing: ".08em",
                      color: (theme) =>
                        theme.palette.gold?.subtleText ||
                        theme.palette.primary.main,
                      border: "1.5px solid",
                      borderColor: (theme) =>
                        theme.palette.gold?.main || theme.palette.primary.main,
                      borderRadius: "5px",
                      px: 0.6,
                      py: 0.25,
                    }}
                  >
                    {t("peladas.teams.ai_gpt", "IA · GPT")}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "text.secondary",
                    mt: 0.75,
                    pl: 3.2,
                  }}
                >
                  {t(
                    "peladas.teams.by_rules_desc",
                    "Segue restrições explícitas de nível, posição e duplas que não podem cair juntas.",
                  )}
                </Typography>
              </Box>
            </Box>

            {/* Formato do sorteio: número de times e jogadores por time */}
            <Box
              sx={{
                mt: 2,
                pt: 1.5,
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
                      data-testid="mobile-num-teams-decrement"
                      sx={{ p: 0.25 }}
                    >
                      <RemoveIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                    <Typography
                      data-testid="mobile-num-teams-value"
                      sx={{
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
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
                      data-testid="mobile-num-teams-increment"
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
                    {t("peladas.teams.per_team_label", "POR TIME")}
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
                      disabled={processing || playersPerTeam <= 2}
                      data-testid="mobile-players-per-team-decrement"
                      sx={{ p: 0.25 }}
                    >
                      <RemoveIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                    <Typography
                      data-testid="mobile-players-per-team-value"
                      sx={{
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
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
                      data-testid="mobile-players-per-team-increment"
                      sx={{ p: 0.25 }}
                    >
                      <AddIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Historical signals toggle */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mt: 2,
                pt: 1.5,
                borderTop: "1.5px dashed",
                borderColor: "divider",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "11.5px",
                    color:
                      selectedAlgorithm === "classic"
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
                    color: "text.secondary",
                  }}
                >
                  {selectedAlgorithm === "classic"
                    ? t(
                        "peladas.teams.unavailable_classic",
                        "indisponível no clássico",
                      )
                    : t(
                        "peladas.teams.avoid_recent_formations",
                        "evita repetir formações recentes",
                      )}
                </Typography>
              </Box>
              <Switch
                checked={useHistory && selectedAlgorithm !== "classic"}
                disabled={selectedAlgorithm === "classic"}
                onChange={(e) => setUseHistory(e.target.checked)}
                size="small"
                slotProps={{
                  input: {
                    "aria-label": t(
                      "peladas.teams.use_history",
                      "Usar sinais históricos",
                    ),
                  },
                }}
              />
            </Box>

            {/* Fixed Goalkeepers toggle */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mt: 1.5,
                pt: 1.5,
                borderTop: "1.5px dashed",
                borderColor: "divider",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "11.5px",
                    color: "text.primary",
                  }}
                >
                  {t("peladas.teams.fixed_goalkeepers", "Goleiros fixos")}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "10.5px",
                    color: "text.secondary",
                  }}
                >
                  {pelada.fixed_goalkeepers
                    ? t(
                        "peladas.teams.gk_locked_opposed",
                        "goleiros travados em times opostos",
                      )
                    : t(
                        "peladas.teams.gk_common_draw",
                        "goleiros entram no sorteio comum",
                      )}
                </Typography>
              </Box>
              <Switch
                checked={Boolean(pelada.fixed_goalkeepers)}
                onChange={(e, checked) =>
                  onToggleFixedGk(
                    checked !== undefined ? checked : e.target.checked,
                  )
                }
                size="small"
                slotProps={{
                  input: {
                    "aria-label": t(
                      "peladas.teams.fixed_goalkeepers",
                      "Goleiros fixos",
                    ),
                  },
                }}
              />
            </Box>

            {/* Run draw button */}
            <Button
              fullWidth
              variant="contained"
              disabled={processing}
              onClick={handleExecuteDraw}
              data-testid="draw-teams-button"
              sx={{
                mt: 2,
                py: 1.5,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "14px",
                letterSpacing: ".06em",
                borderRadius: "12px",
                boxShadow: (theme) => `0 3px 0 ${theme.palette.primary.dark}`,
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              {processing ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                t("peladas.teams.draw_button", "SORTEAR")
              )}
            </Button>
          </Box>
        </Box>
      )}

      {/* 3. POR QUE FICOU ASSIM Justification Card */}
      {(drawJustification || teams.length > 0) && (
        <Box sx={{ mb: 2.5 }}>
          <DrawJustificationCard
            justification={drawJustification}
            teamAverages={teamAverages}
            playersPerTeam={playersPerTeam}
            homeGkName={homeGk?.user?.name}
            awayGkName={awayGk?.user?.name}
            onOpenDialog={onOpenJustificationDialog}
          />
        </Box>
      )}

      {/* 4. Tabuleiro de Times */}
      <Box sx={{ mb: 3 }}>
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
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "9.5px",
              letterSpacing: ".18em",
              color: "text.secondary",
              textTransform: "uppercase",
            }}
          >
            {t("peladas.teams.teams_per_side", "TIMES · {{count}} POR LADO", {
              count: playersPerTeam,
            })}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 600,
              fontSize: "11px",
              color: "text.secondary",
            }}
          >
            {t("peladas.teams.tap_to_move", "toque em ⋯ para mover")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {teams.map((team, idx) => {
            const players = teamPlayers[team.id] || [];
            const avg =
              teamAverages.find((t) => t.teamName === team.name)?.avg ?? 7.0;
            const openSlots = Math.max(0, playersPerTeam - players.length);
            const teamVestLabel =
              idx === 0
                ? t("peladas.teams.vest_green", "COLETE VERDE")
                : idx === 1
                  ? t("peladas.teams.vest_none", "SEM COLETE")
                  : t("peladas.teams.team_n", "TIME {{n}}", { n: idx + 1 });

            return (
              <Box
                key={team.id}
                sx={{
                  bgcolor: "background.paper",
                  border: (theme) =>
                    theme.palette.mode === "dark"
                      ? `1px solid ${theme.palette.divider}`
                      : theme.palette.brutalist?.border ||
                        `2px solid ${theme.palette.divider}`,
                  borderRadius: "18px",
                  overflow: "hidden",
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 4px 20px rgba(0,0,0,0.5)"
                      : theme.palette.brutalist?.shadow ||
                        `4px 4px 0 ${theme.palette.divider}`,
                }}
              >
                {/* Team Card Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 2,
                    py: 1.25,
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "14px",
                        lineHeight: 1.1,
                        color: "text.primary",
                      }}
                    >
                      {team.name ||
                        t("peladas.teams.team_n", "TIME {{n}}", {
                          n: idx + 1,
                        })}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "9px",
                        letterSpacing: ".1em",
                        color:
                          openSlots > 0 ? "secondary.main" : "text.secondary",
                        mt: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {openSlots > 0
                        ? t(
                            "peladas.teams.missing_players",
                            "FALTA {{count}} JOGADOR{{plural}}",
                            {
                              count: openSlots,
                              plural: openSlots > 1 ? "ES" : "",
                            },
                          )
                        : teamVestLabel}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "10px",
                        color:
                          openSlots > 0
                            ? "text.secondary"
                            : "primary.contrastText",
                        bgcolor:
                          openSlots > 0 ? "action.hover" : "primary.main",
                        borderRadius: "6px",
                        px: 0.9,
                        py: 0.5,
                      }}
                    >
                      {avg.toFixed(1)}
                    </Box>

                    {isAdmin && teams.length > 2 && (
                      <Button
                        size="small"
                        onClick={() => onDeleteTeam?.(team.id)}
                        sx={{
                          minWidth: 28,
                          p: 0.25,
                          color: "secondary.main",
                          fontSize: "10px",
                          fontWeight: 700,
                        }}
                      >
                        ✕
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Team Players List */}
                <Box
                  sx={{
                    p: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.75,
                  }}
                >
                  {players.map((player, pIdx) => {
                    const isYou = player.user_id === currentUser?.id;
                    const pScore = getPlayerScore(player);
                    const isPaid = paidPlayerIds.has(player.id);
                    const diarista = isDiarista(player.member_type);
                    const color =
                      AVATAR_BG_COLORS[pIdx % AVATAR_BG_COLORS.length];

                    return (
                      <Box
                        key={player.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.2,
                          border: isYou ? 2 : 1,
                          borderColor: isYou ? "primary.main" : "divider",
                          bgcolor: (theme) =>
                            isYou
                              ? theme.palette.status?.paid?.bg || "action.hover"
                              : "background.paper",
                          borderRadius: "11px",
                          p: 1,
                        }}
                      >
                        <SecureAvatar
                          userId={player.user?.id}
                          filename={player.user?.avatar_filename}
                          fallbackText={getInitials(player.user?.name)}
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: isYou ? "primary.main" : color,
                            color: isYou
                              ? "primary.contrastText"
                              : "text.primary",
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "9.5px",
                            flexShrink: 0,
                          }}
                        />

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 700,
                              fontSize: "12px",
                              lineHeight: 1.2,
                              color: "text.primary",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {player.user?.name ||
                              t("peladas.teams.player_fallback", "Jogador")}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 600,
                              fontSize: "9.5px",
                              lineHeight: 1.2,
                              color: isYou ? "primary.main" : "text.secondary",
                              mt: 0.25,
                            }}
                          >
                            {formatPosition(player.user?.position)}
                            {isYou
                              ? ` · ${t("peladas.teams.you", "você")}`
                              : ""}
                            {diarista
                              ? ` · ${t("peladas.attendance.diarista", "diarista")}`
                              : ""}
                          </Typography>
                        </Box>

                        {/* Diarista payment badge */}
                        {diarista && (
                          <Box
                            onClick={() => {
                              if (!isAdmin) return;
                              if (isPaid) {
                                onReversePayment?.(player.id);
                              } else {
                                onMarkPaid?.(player.id, 0);
                              }
                            }}
                            sx={{
                              cursor: isAdmin ? "pointer" : "default",
                              px: 0.75,
                              py: 0.25,
                              borderRadius: "6px",
                              bgcolor: (theme) =>
                                isPaid
                                  ? theme.palette.status?.paid?.bg ||
                                    "action.hover"
                                  : theme.palette.status?.unpaid?.bg ||
                                    "action.hover",
                              border: "1px solid",
                              borderColor: (theme) =>
                                isPaid
                                  ? theme.palette.status?.paid?.color ||
                                    "primary.main"
                                  : theme.palette.status?.unpaid?.color ||
                                    "secondary.main",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 800,
                                fontSize: "8.5px",
                                color: (theme) =>
                                  isPaid
                                    ? theme.palette.status?.paid?.color ||
                                      "primary.main"
                                    : theme.palette.status?.unpaid?.color ||
                                      "secondary.main",
                              }}
                            >
                              {isPaid
                                ? t("peladas.attendance.paid", "PAGO")
                                : t("peladas.attendance.pending", "PENDENTE")}
                            </Typography>
                          </Box>
                        )}

                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "11px",
                            color: "primary.main",
                            pr: 0.5,
                          }}
                        >
                          {pScore.toFixed(1)}
                        </Typography>

                        {isAdmin && (
                          <Button
                            size="small"
                            aria-label={t(
                              "peladas.teams.player_actions_label",
                              "Ações do jogador",
                            )}
                            onClick={(e) =>
                              handleOpenPlayerMenu(e, player, team.id)
                            }
                            sx={{
                              minWidth: 28,
                              p: 0.25,
                              color: "text.secondary",
                            }}
                          >
                            <MoreVertIcon sx={{ fontSize: "16px" }} />
                          </Button>
                        )}
                      </Box>
                    );
                  })}

                  {/* Free slots */}
                  {Array.from({ length: openSlots }).map((_, slotIdx) => (
                    <Box
                      key={`slot-${slotIdx}`}
                      sx={{
                        height: 40,
                        border: (theme) =>
                          `1.5px dashed ${theme.palette.divider}`,
                        borderRadius: "11px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "action.hover",
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "10px",
                        letterSpacing: ".06em",
                        color: "text.secondary",
                      }}
                    >
                      {t("peladas.teams.free_slot", "VAGA LIVRE")}
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })}

          {/* Add Team Button */}
          {isAdmin && (
            <Button
              fullWidth
              variant="outlined"
              onClick={async () => {
                if (!onCreateTeam) return;
                let nextNum = teams.length + 1;
                while (teams.some((t) => t.name === `Time ${nextNum}`)) {
                  nextNum++;
                }
                await onCreateTeam(`Time ${nextNum}`);
              }}
              startIcon={<AddIcon />}
              sx={{
                py: 1.5,
                border: (theme) => `1.5px dashed ${theme.palette.divider}`,
                borderRadius: "14px",
                color: "text.secondary",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: ".04em",
                bgcolor: "background.paper",
                "&:hover": {
                  borderColor: "text.primary",
                  color: "text.primary",
                  bgcolor: "action.hover",
                },
              }}
            >
              {t("peladas.teams.add_team", "ADICIONAR TIME")}
            </Button>
          )}
        </Box>
      </Box>

      {/* 5. Banco de Reservas Section */}
      <Box
        sx={{
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: "16px",
          p: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
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
            {t(
              "peladas.teams.bench_title_count",
              "BANCO · {{count}} FORA DOS TIMES",
              { count: benchPlayers.length },
            )}
          </Typography>
        </Box>

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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {benchPlayers.map((player, pIdx) => {
              const pScore = getPlayerScore(player);
              const color = AVATAR_BG_COLORS[pIdx % AVATAR_BG_COLORS.length];

              return (
                <Box
                  key={player.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "action.hover",
                    borderRadius: "11px",
                    p: 1,
                  }}
                >
                  <SecureAvatar
                    userId={player.user?.id}
                    filename={player.user?.avatar_filename}
                    fallbackText={getInitials(player.user?.name)}
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: color,
                      color: "text.primary",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "9.5px",
                      flexShrink: 0,
                    }}
                  />

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "12px",
                        lineHeight: 1.2,
                        color: "text.primary",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {player.user?.name ||
                        t("peladas.teams.player_fallback", "Jogador")}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "9.5px",
                        color: "text.secondary",
                      }}
                    >
                      {formatPosition(player.user?.position)} ·{" "}
                      {t("peladas.teams.on_bench", "no banco")}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "11px",
                      color: "text.secondary",
                      pr: 0.5,
                    }}
                  >
                    {pScore.toFixed(1)}
                  </Typography>

                  {isAdmin && (
                    <Button
                      size="small"
                      aria-label={t(
                        "peladas.teams.player_actions_label",
                        "Ações do jogador",
                      )}
                      onClick={(e) => handleOpenPlayerMenu(e, player, null)}
                      sx={{
                        minWidth: 28,
                        p: 0.25,
                        color: "text.secondary",
                      }}
                    >
                      <MoreVertIcon sx={{ fontSize: "16px" }} />
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Player Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleClosePlayerMenu}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "14px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              border: "1.5px solid",
              borderColor: "divider",
              minWidth: 200,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "12px",
              color: "text.primary",
            }}
          >
            {selectedPlayer?.player.user?.name}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 600,
              fontSize: "10px",
              color: "text.secondary",
            }}
          >
            {t("peladas.teams.move_player_to", "Mover jogador para:")}
          </Typography>
        </Box>
        <Divider />

        {/* Move to Teams */}
        {teams.map((tItem, idx) => {
          if (tItem.id === selectedPlayer?.currentTeamId) return null;
          return (
            <MenuItem
              key={tItem.id}
              onClick={() => {
                if (selectedPlayer) {
                  onMoveToTeam(selectedPlayer.player.id, tItem.id);
                }
                handleClosePlayerMenu();
              }}
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "12px",
                color: "text.primary",
              }}
            >
              {tItem.name ||
                t("peladas.teams.team_n_mixed", "Time {{n}}", {
                  n: idx + 1,
                })}
            </MenuItem>
          );
        })}

        {/* Move to Bench if currently in a team */}
        {selectedPlayer?.currentTeamId !== null && (
          <MenuItem
            onClick={() => {
              if (selectedPlayer) {
                onSendToBench(selectedPlayer.player.id);
              }
              handleClosePlayerMenu();
            }}
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "12px",
              color: "secondary.main",
            }}
          >
            {t("peladas.teams.send_to_bench", "Enviar para o banco")}
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
