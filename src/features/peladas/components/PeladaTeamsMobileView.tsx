import { useState, useMemo, useCallback } from "react";
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
    ? pDate.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase()
    : "QUA";
  const timeStr = !isNaN(pDate.getHours())
    ? pDate.toLocaleTimeString("pt-BR", {
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

  const avatarColors = [
    "#146b3a",
    "#dcd3bd",
    "#c9d9cd",
    "#d8d2c4",
    "#cfd8cd",
    "#cdd6e0",
    "#d3cfc4",
    "#e2cfc7",
  ];

  const getInitials = (name?: string) => {
    if (!name) return "JG";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatPosition = (pos?: string) => {
    if (!pos) return "meia";
    switch (pos.toLowerCase()) {
      case "goalkeeper":
      case "goleiro":
        return "goleiro";
      case "defender":
      case "zagueiro":
        return "zagueiro";
      case "midfielder":
      case "meio-campo":
        return "meia";
      case "striker":
      case "atacante":
        return "atacante";
      default:
        return pos.toLowerCase();
    }
  };

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
        bgcolor: "#f6f4ee",
        minHeight: "100vh",
        pb: 6,
        px: { xs: 1.5, sm: 2.5 },
        pt: 1.5,
      }}
    >
      {/* 1. Header Section */}
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: "9.5px",
            letterSpacing: ".16em",
            color: "#6b675c",
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
            {pelada.organization_name || "PELADA"} · {weekdayStr} {dayStr}/
            {monthStr} · {timeStr}
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
                  color: "#146b3a",
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
            fontSize: "24px",
            lineHeight: 1.1,
            color: "#17181a",
            mt: 0.75,
          }}
        >
          Sorteio de times
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
              bgcolor: "#ffffff",
              borderColor: "#ddd8cc",
              color: "#17181a",
              borderRadius: "11px",
              py: 1,
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "11px",
              letterSpacing: ".04em",
              textTransform: "uppercase",
              "&:hover": { borderColor: "#17181a", bgcolor: "#f6f4ee" },
            }}
          >
            MANDAR NO ZAP
          </Button>

          {isAdmin && (
            <Button
              variant="contained"
              onClick={onStartClick}
              startIcon={<PlayArrowIcon />}
              sx={{
                flex: 1,
                minWidth: 130,
                bgcolor: "#17181a",
                color: "#ffffff",
                borderRadius: "11px",
                py: 1,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: ".04em",
                textTransform: "uppercase",
                "&:hover": { bgcolor: "#2e2f31" },
              }}
            >
              INICIAR PELADA
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="outlined"
              onClick={() => setShowDrawConfig((prev) => !prev)}
              startIcon={<CasinoIcon />}
              sx={{
                bgcolor: showDrawConfig ? "#17181a" : "#ffffff",
                color: showDrawConfig ? "#ffffff" : "#17181a",
                borderColor: "#17181a",
                borderRadius: "11px",
                py: 1,
                px: 1.5,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: ".04em",
                textTransform: "uppercase",
                "&:hover": {
                  bgcolor: showDrawConfig ? "#2e2f31" : "#f6f4ee",
                },
              }}
            >
              {showDrawConfig ? "FECHAR PAINEL" : "SORTEAR"}
            </Button>
          )}
        </Box>
      </Box>

      {/* 2. COMO SORTEAR Panel (Mobile Draw Settings) */}
      {isAdmin && (showDrawConfig || teams.length === 0) && (
        <Box
          sx={{
            bgcolor: "#ffffff",
            border: "2px solid #17181a",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "4px 4px 0 #17181a",
            mb: 2.5,
          }}
        >
          <Box
            sx={{
              bgcolor: "#17181a",
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
                color: "#ffffff",
                textTransform: "uppercase",
              }}
            >
              COMO SORTEAR
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: ".06em",
                color: "#9a958a",
                textTransform: "uppercase",
              }}
            >
              {totalConfirmed} CONFIRMADOS
            </Typography>
          </Box>

          <Box sx={{ p: 2 }}>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.4,
                color: "#6b675c",
                mb: 1.75,
              }}
            >
              Escolha o algoritmo de divisão dos times.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {/* Option 1: Clássico */}
              <Box
                onClick={() => setSelectedAlgorithm("classic")}
                sx={{
                  border:
                    selectedAlgorithm === "classic"
                      ? "2px solid #146b3a"
                      : "1.5px solid #ddd8cc",
                  bgcolor:
                    selectedAlgorithm === "classic" ? "#f4f8f5" : "#ffffff",
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
                          ? "5px solid #146b3a"
                          : "2px solid #c9c4b6",
                      bgcolor: "#ffffff",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "12.5px",
                      color: "#17181a",
                      flex: 1,
                    }}
                  >
                    Clássico
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "8.5px",
                      letterSpacing: ".08em",
                      color: "#146b3a",
                      border: "1.5px solid #146b3a",
                      borderRadius: "5px",
                      px: 0.6,
                      py: 0.25,
                    }}
                  >
                    PADRÃO
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "#6b675c",
                    mt: 0.75,
                    pl: 3.2,
                  }}
                >
                  Equilibra nota e posição sem histórico.
                </Typography>
              </Box>

              {/* Option 2: Equilíbrio Tático (Gemini) */}
              <Box
                onClick={() => setSelectedAlgorithm("gemini")}
                sx={{
                  border:
                    selectedAlgorithm === "gemini"
                      ? "2px solid #146b3a"
                      : "1.5px solid #ddd8cc",
                  bgcolor:
                    selectedAlgorithm === "gemini" ? "#f4f8f5" : "#ffffff",
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
                          ? "5px solid #146b3a"
                          : "2px solid #c9c4b6",
                      bgcolor: "#ffffff",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: selectedAlgorithm === "gemini" ? 800 : 700,
                      fontSize: "12.5px",
                      color: "#17181a",
                      flex: 1,
                    }}
                  >
                    Equilíbrio tático
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "8.5px",
                      letterSpacing: ".08em",
                      color: "#146b3a",
                      border: "1.5px solid #146b3a",
                      borderRadius: "5px",
                      px: 0.6,
                      py: 0.25,
                    }}
                  >
                    IA · GEMINI
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "#6b675c",
                    mt: 0.75,
                    pl: 3.2,
                  }}
                >
                  Equilibra força geral, defesa e ataque com notas, votos e
                  estatísticas. Separa panelinhas vencedoras.
                </Typography>
              </Box>

              {/* Option 3: Por regras (GPT) */}
              <Box
                onClick={() => setSelectedAlgorithm("gpt")}
                sx={{
                  border:
                    selectedAlgorithm === "gpt"
                      ? "2px solid #146b3a"
                      : "1.5px solid #ddd8cc",
                  bgcolor: selectedAlgorithm === "gpt" ? "#f4f8f5" : "#ffffff",
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
                          ? "5px solid #146b3a"
                          : "2px solid #c9c4b6",
                      bgcolor: "#ffffff",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: selectedAlgorithm === "gpt" ? 800 : 700,
                      fontSize: "12.5px",
                      color: "#17181a",
                      flex: 1,
                    }}
                  >
                    Por regras
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "8.5px",
                      letterSpacing: ".08em",
                      color: "#8a5800",
                      border: "1.5px solid #f2a100",
                      borderRadius: "5px",
                      px: 0.6,
                      py: 0.25,
                    }}
                  >
                    IA · GPT
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "#6b675c",
                    mt: 0.75,
                    pl: 3.2,
                  }}
                >
                  Segue restrições explícitas de nível, posição e duplas que não
                  podem cair juntas.
                </Typography>
              </Box>
            </Box>

            {/* Formato do sorteio: número de times e jogadores por time */}
            <Box
              sx={{
                mt: 2,
                pt: 1.5,
                borderTop: "1.5px dashed #ddd8cc",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9px",
                  letterSpacing: ".14em",
                  color: "#6b675c",
                  textTransform: "uppercase",
                }}
              >
                FORMATO DO SORTEIO
              </Typography>

              <Box sx={{ display: "flex", gap: 1, mt: 1.25 }}>
                <Box
                  sx={{
                    flex: 1,
                    border: "1.5px solid #ddd8cc",
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
                      color: "#6b675c",
                      textTransform: "uppercase",
                    }}
                  >
                    TIMES
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
                        color: "#17181a",
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
                    border: "1.5px solid #ddd8cc",
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
                      color: "#6b675c",
                      textTransform: "uppercase",
                    }}
                  >
                    POR TIME
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
                        color: "#17181a",
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
                borderTop: "1.5px dashed #ddd8cc",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "11.5px",
                    color:
                      selectedAlgorithm === "classic" ? "#9a958a" : "#17181a",
                  }}
                >
                  Usar sinais históricos
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "10.5px",
                    color: "#6b675c",
                  }}
                >
                  {selectedAlgorithm === "classic"
                    ? "indisponível no clássico"
                    : "evita repetir formações recentes"}
                </Typography>
              </Box>
              <Switch
                checked={useHistory && selectedAlgorithm !== "classic"}
                disabled={selectedAlgorithm === "classic"}
                onChange={(e) => setUseHistory(e.target.checked)}
                size="small"
                slotProps={{
                  input: { "aria-label": "Usar sinais históricos" },
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
                borderTop: "1.5px dashed #ddd8cc",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "11.5px",
                    color: "#17181a",
                  }}
                >
                  Goleiros fixos
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "10.5px",
                    color: "#6b675c",
                  }}
                >
                  {pelada.fixed_goalkeepers
                    ? "goleiros travados em times opostos"
                    : "goleiros entram no sorteio comum"}
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
                slotProps={{ input: { "aria-label": "Goleiros fixos" } }}
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
                bgcolor: "#146b3a",
                color: "#ffffff",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "14px",
                letterSpacing: ".06em",
                borderRadius: "12px",
                boxShadow: "0 3px 0 #0d4526",
                "&:hover": { bgcolor: "#0e5c31" },
              }}
            >
              {processing ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "SORTEAR"
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
              color: "#6b675c",
              textTransform: "uppercase",
            }}
          >
            TIMES · {playersPerTeam} POR LADO
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 600,
              fontSize: "11px",
              color: "#6b675c",
            }}
          >
            toque em ⋯ para mover
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
                ? "COLETE VERDE"
                : idx === 1
                  ? "SEM COLETE"
                  : `TIME ${idx + 1}`;

            return (
              <Box
                key={team.id}
                sx={{
                  bgcolor: "#ffffff",
                  border: "2px solid #17181a",
                  borderRadius: "18px",
                  overflow: "hidden",
                  boxShadow: "4px 4px 0 #17181a",
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
                    borderBottom: "1.5px solid #eae6db",
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "14px",
                        lineHeight: 1.1,
                        color: "#17181a",
                      }}
                    >
                      {team.name || `TIME ${idx + 1}`}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "9px",
                        letterSpacing: ".1em",
                        color: openSlots > 0 ? "#a8452a" : "#6b675c",
                        mt: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {openSlots > 0
                        ? `FALTA ${openSlots} JOGADOR${openSlots > 1 ? "ES" : ""}`
                        : teamVestLabel}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "10px",
                        color: "#ffffff",
                        bgcolor: openSlots > 0 ? "#6b675c" : "#146b3a",
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
                          color: "#a8452a",
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
                    const color = avatarColors[pIdx % avatarColors.length];

                    return (
                      <Box
                        key={player.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.2,
                          border: isYou
                            ? "2px solid #146b3a"
                            : "1.5px solid #eae6db",
                          bgcolor: isYou ? "#f4f8f5" : "#ffffff",
                          borderRadius: "11px",
                          p: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            bgcolor: isYou ? "#146b3a" : color,
                            color: isYou ? "#ffffff" : "#17181a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "9.5px",
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(player.user?.name)}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 700,
                              fontSize: "12px",
                              lineHeight: 1.2,
                              color: "#17181a",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {player.user?.name || "Jogador"}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 600,
                              fontSize: "9.5px",
                              lineHeight: 1.2,
                              color: isYou ? "#146b3a" : "#6b675c",
                              mt: 0.25,
                            }}
                          >
                            {formatPosition(player.user?.position)}
                            {isYou ? " · você" : ""}
                            {diarista ? " · diarista" : ""}
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
                              bgcolor: isPaid ? "#f4f8f5" : "#fff5f2",
                              border: isPaid
                                ? "1px solid #146b3a"
                                : "1px solid #a8452a",
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
                                color: isPaid ? "#146b3a" : "#a8452a",
                              }}
                            >
                              {isPaid ? "PAGO" : "PENDENTE"}
                            </Typography>
                          </Box>
                        )}

                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "11px",
                            color: "#146b3a",
                            pr: 0.5,
                          }}
                        >
                          {pScore.toFixed(1)}
                        </Typography>

                        {isAdmin && (
                          <Button
                            size="small"
                            aria-label="Ações do jogador"
                            onClick={(e) =>
                              handleOpenPlayerMenu(e, player, team.id)
                            }
                            sx={{
                              minWidth: 28,
                              p: 0.25,
                              color: "#6b675c",
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
                        border: "1.5px dashed #c9c4b6",
                        borderRadius: "11px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "#f6f4ee",
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "10px",
                        letterSpacing: ".06em",
                        color: "#6b675c",
                      }}
                    >
                      VAGA LIVRE
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
                border: "1.5px dashed #c9c4b6",
                borderRadius: "14px",
                color: "#6b675c",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: ".04em",
                bgcolor: "#ffffff",
                "&:hover": {
                  borderColor: "#17181a",
                  color: "#17181a",
                  bgcolor: "#f6f4ee",
                },
              }}
            >
              ADICIONAR TIME
            </Button>
          )}
        </Box>
      </Box>

      {/* 5. Banco de Reservas Section */}
      <Box
        sx={{
          bgcolor: "#ffffff",
          border: "1.5px solid #eae6db",
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
              color: "#6b675c",
              textTransform: "uppercase",
            }}
          >
            BANCO · {benchPlayers.length} FORA DOS TIMES
          </Typography>
        </Box>

        {benchPlayers.length === 0 ? (
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 600,
              fontSize: "11.5px",
              color: "#9a958a",
              py: 1,
            }}
          >
            Nenhum jogador no banco no momento.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {benchPlayers.map((player, pIdx) => {
              const pScore = getPlayerScore(player);
              const color = avatarColors[pIdx % avatarColors.length];

              return (
                <Box
                  key={player.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    border: "1.5px solid #ddd8cc",
                    bgcolor: "#f6f4ee",
                    borderRadius: "11px",
                    p: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: color,
                      color: "#17181a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "9.5px",
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(player.user?.name)}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "12px",
                        lineHeight: 1.2,
                        color: "#17181a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {player.user?.name || "Jogador"}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "9.5px",
                        color: "#6b675c",
                      }}
                    >
                      {formatPosition(player.user?.position)} · no banco
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "11px",
                      color: "#6b675c",
                      pr: 0.5,
                    }}
                  >
                    {pScore.toFixed(1)}
                  </Typography>

                  {isAdmin && (
                    <Button
                      size="small"
                      aria-label="Ações do jogador"
                      onClick={(e) => handleOpenPlayerMenu(e, player, null)}
                      sx={{
                        minWidth: 28,
                        p: 0.25,
                        color: "#6b675c",
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
              border: "1.5px solid #eae6db",
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
              color: "#17181a",
            }}
          >
            {selectedPlayer?.player.user?.name}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 600,
              fontSize: "10px",
              color: "#6b675c",
            }}
          >
            Mover jogador para:
          </Typography>
        </Box>
        <Divider />

        {/* Move to Teams */}
        {teams.map((t, idx) => {
          if (t.id === selectedPlayer?.currentTeamId) return null;
          return (
            <MenuItem
              key={t.id}
              onClick={() => {
                if (selectedPlayer) {
                  onMoveToTeam(selectedPlayer.player.id, t.id);
                }
                handleClosePlayerMenu();
              }}
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "12px",
                color: "#17181a",
              }}
            >
              {t.name || `Time ${idx + 1}`}
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
              color: "#a8452a",
            }}
          >
            Enviar para o banco
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
