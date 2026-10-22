import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Switch,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useTranslation } from "react-i18next";
import type { DrawAlgorithm, Pelada } from "../../../shared/api/endpoints";

export interface MobileDrawSettingsCardProps {
  pelada: Pelada;
  totalConfirmed: number;
  selectedAlgorithm: DrawAlgorithm;
  setSelectedAlgorithm: (algo: DrawAlgorithm) => void;
  useHistory: boolean;
  setUseHistory: (val: boolean) => void;
  numTeams: number;
  playersPerTeam: number;
  processing: boolean;
  onUpdateNumTeams?: (num: number) => void;
  onUpdatePlayersPerTeam?: (num: number) => void;
  onToggleFixedGk: (val: boolean) => void;
  onExecuteDraw: () => void;
}

export function MobileDrawSettingsCard({
  pelada,
  totalConfirmed,
  selectedAlgorithm,
  setSelectedAlgorithm,
  useHistory,
  setUseHistory,
  numTeams,
  playersPerTeam,
  processing,
  onUpdateNumTeams,
  onUpdatePlayersPerTeam,
  onToggleFixedGk,
  onExecuteDraw,
}: MobileDrawSettingsCardProps) {
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
          `4px 4px 0 ${theme.palette.divider}`,
        mb: 2.5,
      }}
    >
      <Box
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "background.paper" : "text.primary",
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
                selectedAlgorithm === "classic" ? "primary.main" : "divider",
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
                {t("peladas.teams.native_tag", "NATIVO")}
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
                    selectedAlgorithm === "gemini" ? "primary.main" : "divider",
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
                    selectedAlgorithm === "gpt" ? "primary.main" : "divider",
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
                  onClick={() => onUpdatePlayersPerTeam?.(playersPerTeam - 1)}
                  disabled={processing || playersPerTeam <= 1}
                  data-testid="mobile-players-per-team-decrement"
                  sx={{ p: 0.25 }}
                >
                  <RemoveIcon sx={{ fontSize: 15 }} />
                </IconButton>
                <Typography
                  component="h6"
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
                  onClick={() => onUpdatePlayersPerTeam?.(playersPerTeam + 1)}
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
          onClick={onExecuteDraw}
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
  );
}
