import { useState, type DragEvent } from "react";
import { Box, Typography, Switch, IconButton, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useTranslation } from "react-i18next";
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
  getInitials,
  formatPosition,
} from "../utils/playerUtils";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";

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
  onCopyAnnouncement: () => void;
  onToggleFixedGk: (enabled: boolean) => void;
  onOpenJustificationDialog?: () => void;
  currentUser?: User | null;
  peladaTransactions?: Transaction[];
  onMarkPaid?: (playerId: string, amount: number) => void;
  onReversePayment?: (playerId: string) => void;
}

const VEST_LABELS = [
  "COLETE VERDE",
  "SEM COLETE",
  "COLETE AZUL",
  "COLETE LARANJA",
  "COLETE BRANCO",
  "COLETE PRETO",
];

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
}: PeladaTeamsDesktopViewProps) {
  const { t } = useTranslation();
  const [algorithm, setAlgorithm] = useState<DrawAlgorithm>("classic");
  const [useHistory, setUseHistory] = useState(true);

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
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", "")
        .toUpperCase()
    : "QUA";
  const timeStr = !isNaN(peladaDate.getTime())
    ? peladaDate.toLocaleTimeString("pt-BR", {
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
  }[] = teams.map((team) => {
    const pList = teamPlayers[team.id] || [];
    const vals = pList
      .map((p) => (typeof scores[p.id] === "number" ? scores[p.id] : p.grade))
      .filter((g): g is number => typeof g === "number");
    const avg =
      vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { teamId: team.id, name: team.name, avg, count: pList.length };
  });

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
                {pelada.organization_name || "ORGANIZAÇÃO"} · {weekday} {dayStr}
                /{monthStr} · {timeStr}
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
                fontSize: "26px",
                lineHeight: 1.1,
                color: "#17181a",
                mt: 1,
              }}
            >
              Sorteio de times
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.3,
                color: "#6b675c",
                textAlign: "right",
              }}
            >
              sorteado às {timeStr}
              <br />
              por você
            </Typography>
            <Button
              onClick={onCopyAnnouncement}
              data-testid="desktop-zap-button"
              sx={{
                border: "1.5px solid #ddd8cc",
                bgcolor: "#fff",
                borderRadius: "11px",
                py: 1.25,
                px: 1.75,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: ".04em",
                color: "#17181a",
                textTransform: "none",
                "&:hover": { bgcolor: "#f6f4ee" },
              }}
            >
              MANDAR NO ZAP
            </Button>
            <Button
              onClick={onStartClick}
              data-testid="desktop-save-button"
              sx={{
                borderRadius: "11px",
                bgcolor: "#17181a",
                py: 1.25,
                px: 2,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: ".04em",
                color: "#fff",
                textTransform: "none",
                "&:hover": { bgcolor: "#242628" },
              }}
            >
              SALVAR TIMES
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
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "2px solid #17181a",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 4px 20px rgba(0,0,0,0.5)"
                    : "5px 5px 0 #17181a",
              }}
            >
              <Box
                sx={{
                  bgcolor: "#17181a",
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
                    color: "#fff",
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
                    lineHeight: 1.45,
                    color: "#6b675c",
                  }}
                >
                  Escolha como os confirmados serão divididos. O sorteio
                  substitui os times atuais.
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
                          ? "2px solid #146b3a"
                          : "1.5px solid #ddd8cc",
                      bgcolor: algorithm === "classic" ? "#f4f8f5" : "#fff",
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
                              ? "5px solid #146b3a"
                              : "2px solid #c9c4b6",
                          bgcolor: "#fff",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: algorithm === "classic" ? 800 : 700,
                          fontSize: "12.5px",
                          color: "#17181a",
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
                          color: "#146b3a",
                          border: "1.5px solid #146b3a",
                          borderRadius: "5px",
                          px: 0.6,
                          py: 0.3,
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
                        lineHeight: 1.4,
                        color: "#6b675c",
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
                          ? "2px solid #146b3a"
                          : "1.5px solid #ddd8cc",
                      bgcolor: algorithm === "gemini" ? "#f4f8f5" : "#fff",
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
                              ? "5px solid #146b3a"
                              : "2px solid #c9c4b6",
                          bgcolor: "#fff",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: algorithm === "gemini" ? 800 : 700,
                          fontSize: "12.5px",
                          color: "#17181a",
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
                          color: "#6b675c",
                          border: "1.5px solid #ddd8cc",
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
                        color: "#6b675c",
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
                          ? "2px solid #146b3a"
                          : "1.5px solid #ddd8cc",
                      bgcolor: algorithm === "gpt" ? "#f4f8f5" : "#fff",
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
                              ? "5px solid #146b3a"
                              : "2px solid #c9c4b6",
                          bgcolor: "#fff",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: algorithm === "gpt" ? 800 : 700,
                          fontSize: "12.5px",
                          color: "#17181a",
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
                          color: "#6b675c",
                          border: "1.5px solid #ddd8cc",
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
                        color: "#6b675c",
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
                              color: "#17181a",
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
                            data-testid="players-per-team-decrement"
                            sx={{ p: 0.25 }}
                          >
                            <RemoveIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                          <Typography
                            data-testid="players-per-team-value"
                            sx={{
                              fontFamily:
                                "'Archivo Narrow', Archivo, sans-serif",
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
                    borderTop: "1.5px dashed #ddd8cc",
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
                        color: algorithm === "classic" ? "#6b675c" : "#17181a",
                      }}
                    >
                      Usar sinais históricos
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "10.5px",
                        lineHeight: 1.35,
                        color: "#6b675c",
                        mt: 0.5,
                      }}
                    >
                      {algorithm === "classic"
                        ? "indisponível no clássico — a contagem não olha histórico"
                        : "analisa histórico de jogos, entrosamento e votos"}
                    </Typography>
                  </Box>
                </Box>

                {/* Fixed Goalkeepers */}
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
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
                    GOLEIROS FIXOS
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, mt: 1.25 }}>
                    {/* Home GK */}
                    <Box
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => dropToFixedGk(e, "home")}
                      sx={{
                        flex: 1,
                        border: "1.5px solid #ddd8cc",
                        borderRadius: "12px",
                        p: "10px 11px",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,
                        bgcolor: homeGk ? "#fff" : "#f6f4ee",
                        minHeight: 46,
                      }}
                    >
                      {homeGk ? (
                        <>
                          <SecureAvatar
                            userId={homeGk.user?.id}
                            filename={homeGk.user?.avatar_filename}
                            fallbackText={getInitials(homeGk.user?.name)}
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: "#dcd3bd",
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 800,
                              fontSize: "9.5px",
                              color: "#17181a",
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 700,
                                fontSize: "11px",
                                lineHeight: 1.2,
                                color: "#17181a",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {homeGk.user?.name || "Goleiro 1"}
                            </Typography>
                            <Typography
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 600,
                                fontSize: "9.5px",
                                lineHeight: 1.2,
                                color: "#6b675c",
                                mt: 0.25,
                              }}
                            >
                              time 1
                            </Typography>
                          </Box>
                          {isAdmin && (
                            <IconButton
                              size="small"
                              onClick={() => removeFixedGk("home")}
                              sx={{ p: 0.25, color: "#6b675c" }}
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
                            fontSize: "10.5px",
                            color: "#9a958a",
                            textAlign: "center",
                            width: "100%",
                          }}
                        >
                          Arraste o Goleiro 1
                        </Typography>
                      )}
                    </Box>

                    {/* Away GK */}
                    <Box
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => dropToFixedGk(e, "away")}
                      sx={{
                        flex: 1,
                        border: "1.5px solid #ddd8cc",
                        borderRadius: "12px",
                        p: "10px 11px",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,
                        bgcolor: awayGk ? "#fff" : "#f6f4ee",
                        minHeight: 46,
                      }}
                    >
                      {awayGk ? (
                        <>
                          <SecureAvatar
                            userId={awayGk.user?.id}
                            filename={awayGk.user?.avatar_filename}
                            fallbackText={getInitials(awayGk.user?.name)}
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: "#cdd6e0",
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 800,
                              fontSize: "9.5px",
                              color: "#17181a",
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 700,
                                fontSize: "11px",
                                lineHeight: 1.2,
                                color: "#17181a",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {awayGk.user?.name || "Goleiro 2"}
                            </Typography>
                            <Typography
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 600,
                                fontSize: "9.5px",
                                lineHeight: 1.2,
                                color: "#6b675c",
                                mt: 0.25,
                              }}
                            >
                              time 2
                            </Typography>
                          </Box>
                          {isAdmin && (
                            <IconButton
                              size="small"
                              onClick={() => removeFixedGk("away")}
                              sx={{ p: 0.25, color: "#6b675c" }}
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
                            fontSize: "10.5px",
                            color: "#9a958a",
                            textAlign: "center",
                            width: "100%",
                          }}
                        >
                          Arraste o Goleiro 2
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "10.5px",
                      lineHeight: 1.4,
                      color: "#6b675c",
                      mt: 1.25,
                    }}
                  >
                    Goleiros travados nos times. As outras posições são
                    embaralhadas e equilibradas por nível.
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
                    bgcolor: "#146b3a",
                    color: "#fff",
                    py: 2,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "15px",
                    letterSpacing: ".06em",
                    mt: 2,
                    boxShadow: "0 3px 0 #0d4526",
                    "&:hover": { bgcolor: "#0e5c31" },
                  }}
                >
                  SORTEAR
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
                  color: "#6b675c",
                  textTransform: "uppercase",
                }}
              >
                TIMES · {playersPerTeam} POR LADO
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11.5px",
                    color: "#6b675c",
                  }}
                >
                  arraste um jogador para trocar de time
                </Typography>
                {isAdmin && (
                  <Box
                    component="button"
                    onClick={handleAddTeam}
                    data-testid="desktop-add-team-button"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: (theme) =>
                        theme.palette.mode === "dark"
                          ? "1.5px dashed rgba(255,255,255,0.15)"
                          : "1.5px dashed #c9c4b6",
                      bgcolor: "background.paper",
                      borderRadius: "10px",
                      p: "7px 12px",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "10.5px",
                      letterSpacing: ".04em",
                      color: "text.secondary",
                      cursor: "pointer",
                      "&:hover": {
                        borderColor: "#146b3a",
                        color: "#146b3a",
                      },
                    }}
                  >
                    + ADICIONAR TIME
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
                const vals = players
                  .map((p) =>
                    typeof scores[p.id] === "number" ? scores[p.id] : p.grade,
                  )
                  .filter((g): g is number => typeof g === "number");
                const avg =
                  vals.length > 0
                    ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                    : "-";
                const isUnderfilled = players.length < playersPerTeam;
                const vestLabel =
                  VEST_LABELS[idx % VEST_LABELS.length] || "COLETE";

                return (
                  <Box
                    key={team.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => dropToTeam(e, team.id)}
                    data-testid={`team-card-${team.id}`}
                    sx={{
                      bgcolor: "background.paper",
                      border: (theme) =>
                        isUnderfilled
                          ? theme.palette.mode === "dark"
                            ? "2px dashed rgba(255,255,255,0.2)"
                            : "2px dashed #c9c4b6"
                          : theme.palette.mode === "dark"
                            ? "1px solid rgba(255,255,255,0.12)"
                            : "2px solid #17181a",
                      borderRadius: "18px",
                      overflow: "hidden",
                    }}
                  >
                    {/* Team Header */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: "12px 14px",
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
                            color: isUnderfilled ? "#a8452a" : "#6b675c",
                            mt: 0.6,
                            textTransform: "uppercase",
                          }}
                        >
                          {isUnderfilled
                            ? `FALTA ${playersPerTeam - players.length} JOGADOR${
                                playersPerTeam - players.length > 1 ? "ES" : ""
                              }`
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
                            color: "#fff",
                            bgcolor: isUnderfilled ? "#6b675c" : "#146b3a",
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
                            sx={{ p: 0.25, color: "#6b675c" }}
                            aria-label={`Excluir ${team.name}`}
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
                      {players.map((p, pIdx) => {
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
                            draggable
                            onDragStart={(e) =>
                              onDragStartPlayer(e, p.id, team.id)
                            }
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.2,
                              border: isYou
                                ? "2px solid #146b3a"
                                : "1.5px solid #eae6db",
                              bgcolor: isYou
                                ? "#f4f8f5"
                                : isGk
                                  ? "#f6f4ee"
                                  : "#fff",
                              borderRadius: "11px",
                              p: isYou ? "7px 8px" : "8px 9px",
                              cursor: "grab",
                              "&:active": { cursor: "grabbing" },
                            }}
                          >
                            <SecureAvatar
                              userId={p.user?.id}
                              filename={p.user?.avatar_filename}
                              fallbackText={getInitials(p.user?.name)}
                              sx={{
                                width: 26,
                                height: 26,
                                bgcolor: isYou ? "#146b3a" : avatarBg,
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 800,
                                fontSize: "9px",
                                color: isYou ? "#fff" : "#17181a",
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
                                  color: "#17181a",
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
                                  color: isYou ? "#146b3a" : "#6b675c",
                                  mt: 0.25,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {p.position || "meia"}
                                {isGk ? " · fixo" : ""}
                                {isYou ? " · você" : ""}
                                {p.member_type === "diarista"
                                  ? " · diarista"
                                  : ""}
                              </Typography>
                            </Box>

                            <Typography
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 800,
                                fontSize: "11px",
                                color: "#146b3a",
                              }}
                            >
                              {gradeVal}
                            </Typography>
                          </Box>
                        );
                      })}

                      {/* Open Slots (VAGA LIVRE) */}
                      {Array.from({
                        length: Math.max(0, playersPerTeam - players.length),
                      }).map((_, emptyIdx) => (
                        <Box
                          key={`empty-${emptyIdx}`}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => dropToTeam(e, team.id)}
                          sx={{
                            height: 42,
                            border: (theme) =>
                              theme.palette.mode === "dark"
                                ? "1.5px dashed rgba(255,255,255,0.15)"
                                : "1.5px dashed #c9c4b6",
                            borderRadius: "11px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "10.5px",
                            letterSpacing: ".06em",
                            color: "text.secondary",
                            bgcolor: (theme) =>
                              theme.palette.mode === "dark"
                                ? "rgba(255,255,255,0.03)"
                                : "#f6f4ee",
                          }}
                        >
                          VAGA LIVRE
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Banco Card */}
            <Box
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => dropToBench(e)}
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
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "#6b675c",
                  }}
                >
                  arraste para dentro de um time
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
                {benchPlayers.map((bp, bIdx) => (
                  <Box
                    key={bp.id}
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
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.03)"
                          : "#f6f4ee",
                      cursor: "grab",
                      "&:active": { cursor: "grabbing" },
                    }}
                  >
                    <SecureAvatar
                      userId={bp.user?.id}
                      filename={bp.user?.avatar_filename}
                      fallbackText={getInitials(bp.user?.name)}
                      sx={{
                        width: 26,
                        height: 26,
                        bgcolor:
                          AVATAR_BG_COLORS[bIdx % AVATAR_BG_COLORS.length],
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "9px",
                        color: "#17181a",
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
                        {formatPosition(bp.position || bp.user?.position)} · no
                        banco
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
