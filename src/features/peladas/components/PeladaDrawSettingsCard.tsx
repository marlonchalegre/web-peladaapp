import type { DragEvent } from "react";
import { Box, Button, IconButton, Switch, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useTranslation } from "react-i18next";
import type { DrawAlgorithm, Pelada } from "../../../shared/api/endpoints";
import type { PlayerWithUser } from "./TeamsSection";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { getPlayerAvatarProps } from "../utils/playerUtils";

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

type DesktopDrawSettingsCardProps = {
  pelada: Pelada;
  totalConfirmed: number;
  algorithm: DrawAlgorithm;
  setAlgorithm: (algo: DrawAlgorithm) => void;
  useHistory: boolean;
  setUseHistory: (v: boolean) => void;
  numTeams: number;
  playersPerTeam: number;
  isAdmin: boolean;
  processing: boolean;
  homeGk: PlayerWithUser | null;
  awayGk: PlayerWithUser | null;
  onUpdateNumTeams?: (count: number) => void;
  onUpdatePlayersPerTeam?: (count: number) => void;
  onToggleFixedGk: (enabled: boolean) => void;
  dropToFixedGk: (e: DragEvent<HTMLElement>, side: "home" | "away") => void;
  removeFixedGk: (side: "home" | "away") => void;
  onRandomizeClick: () => void;
};

export function DesktopDrawSettingsCard({
  pelada,
  totalConfirmed,
  algorithm,
  setAlgorithm,
  useHistory,
  setUseHistory,
  numTeams,
  playersPerTeam,
  isAdmin,
  processing,
  homeGk,
  awayGk,
  onUpdateNumTeams,
  onUpdatePlayersPerTeam,
  onToggleFixedGk,
  dropToFixedGk,
  removeFixedGk,
  onRandomizeClick,
}: DesktopDrawSettingsCardProps) {
  const { t } = useTranslation();

  return (
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
              theme.palette.brutalist?.cardHeaderText || "background.paper",
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
          {totalConfirmed} {t("peladas.teams.confirmed_players", "CONFIRMADOS")}
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
              borderColor: algorithm === "classic" ? "primary.main" : "divider",
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border:
                    algorithm === "classic"
                      ? (theme) => `5px solid ${theme.palette.primary.main}`
                      : "2px solid",
                  borderColor:
                    algorithm === "classic" ? "primary.main" : "divider",
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
                {t("peladas.detail.draw.algorithm.classic.name", "Clássico")}
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

          {/* Gemini */}
          <Box
            onClick={() => setAlgorithm("gemini")}
            data-testid="algo-gemini"
            sx={{
              border:
                algorithm === "gemini"
                  ? (theme) => `2px solid ${theme.palette.primary.main}`
                  : "1.5px solid",
              borderColor: algorithm === "gemini" ? "primary.main" : "divider",
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border:
                    algorithm === "gemini"
                      ? (theme) => `5px solid ${theme.palette.primary.main}`
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
                {t("peladas.detail.draw.algorithm.gemini.name", "Gemini")}
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
                {t("peladas.detail.draw.algorithm.gemini.tag", "Química")}
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

          {/* GPT */}
          <Box
            onClick={() => setAlgorithm("gpt")}
            data-testid="algo-gpt"
            sx={{
              border:
                algorithm === "gpt"
                  ? (theme) => `2px solid ${theme.palette.primary.main}`
                  : "1.5px solid",
              borderColor: algorithm === "gpt" ? "primary.main" : "divider",
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border:
                    algorithm === "gpt"
                      ? (theme) => `5px solid ${theme.palette.primary.main}`
                      : "2px solid",
                  borderColor: algorithm === "gpt" ? "primary.main" : "divider",
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
                    onClick={() => onUpdatePlayersPerTeam?.(playersPerTeam - 1)}
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
                    onClick={() => onUpdatePlayersPerTeam?.(playersPerTeam + 1)}
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
                  algorithm === "classic" ? "text.secondary" : "text.primary",
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

        <Button
          fullWidth
          onClick={onRandomizeClick}
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
  );
}

export {
  MobileDrawSettingsCard,
  type MobileDrawSettingsCardProps,
} from "./PeladaDrawSettingsMobileCard";
