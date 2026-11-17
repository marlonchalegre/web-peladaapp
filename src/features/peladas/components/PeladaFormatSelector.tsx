import {
  Box,
  Typography,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import BoltIcon from "@mui/icons-material/Bolt";
import { useTranslation } from "react-i18next";
import type {
  PeladaFormat,
  PeladaFormatConfig,
  KnockoutTiebreaker,
  WinnerStaysOnDrawRule,
  WinnerStaysOnRotationMode,
  CompleteTeamRule,
} from "../../../shared/api/types";

interface PeladaFormatOption {
  id: PeladaFormat;
  minTeams: number;
  titleKey: string;
  defaultTitle: string;
  descKey: string;
  defaultDesc: string;
}

const PELADA_FORMAT_OPTIONS: PeladaFormatOption[] = [
  {
    id: "round_robin",
    minTeams: 2,
    titleKey: "peladas.formats.round_robin.title",
    defaultTitle: "Pontos Corridos / Rodízio (Padrão)",
    descKey: "peladas.formats.round_robin.desc",
    defaultDesc:
      "Todos os times jogam o mesmo número de partidas na tabela equilibrada. O 1º colocado nos pontos é o campeão.",
  },
  {
    id: "championship_final",
    minTeams: 3,
    titleKey: "peladas.formats.championship_final.title",
    defaultTitle: "Campeonato: Fase de Grupos + Final",
    descKey: "peladas.formats.championship_final.desc",
    defaultDesc:
      "Fase classificatória em pontos corridos seguida automaticamente pela Grande Final entre 1º e 2º colocados.",
  },
  {
    id: "championship_semis_final",
    minTeams: 4,
    titleKey: "peladas.formats.championship_semis_final.title",
    defaultTitle: "Campeonato: Fase de Grupos + Semifinais e Final",
    descKey: "peladas.formats.championship_semis_final.desc",
    defaultDesc:
      "Fase classificatória seguida de Semifinais (1º x 4º e 2º x 3º), disputa opcional de 3º lugar e Grande Final.",
  },
  {
    id: "winner_stays_on",
    minTeams: 2,
    titleKey: "peladas.formats.winner_stays_on.title",
    defaultTitle: "Quem Ganha Fica / Rei da Quadra",
    descKey: "peladas.formats.winner_stays_on.desc",
    defaultDesc:
      "Fila dinâmica: quem vence permanece em quadra para enfrentar o próximo da fila. Partidas criadas automaticamente.",
  },
];

export interface PeladaFormatSelectorProps {
  teamCount: number;
  format: PeladaFormat;
  formatConfig: PeladaFormatConfig;
  matchesPerTeam: number;
  onFormatChange: (format: PeladaFormat) => void;
  onFormatConfigChange: (config: PeladaFormatConfig) => void;
  onMatchesPerTeamChange: (matchesPerTeam: number) => void;
  disabled?: boolean;
  showMatchesPerTeamSelect?: boolean;
}

export default function PeladaFormatSelector({
  teamCount,
  format,
  formatConfig,
  matchesPerTeam,
  onFormatChange,
  onFormatConfigChange,
  onMatchesPerTeamChange,
  disabled = false,
  showMatchesPerTeamSelect = true,
}: PeladaFormatSelectorProps) {
  const { t } = useTranslation();

  const renderIcon = (id: PeladaFormat) => {
    switch (id) {
      case "round_robin":
        return <AutorenewIcon fontSize="small" />;
      case "championship_final":
        return <EmojiEventsIcon fontSize="small" />;
      case "championship_semis_final":
        return <AccountTreeIcon fontSize="small" />;
      case "winner_stays_on":
        return <BoltIcon fontSize="small" />;
    }
  };

  const tiebreaker: KnockoutTiebreaker =
    formatConfig.knockout_tiebreaker || "best_campaign";
  const includeThirdPlace = Boolean(formatConfig.include_third_place);
  const drawRule: WinnerStaysOnDrawRule =
    formatConfig.draw_rule || "challenger_stays";
  const maxConsecutiveWins = formatConfig.max_consecutive_wins ?? 0;
  const rotationMode: WinnerStaysOnRotationMode =
    formatConfig.rotation_mode || "team_queue";
  const completeTeamRule: CompleteTeamRule =
    formatConfig.complete_team_rule || "least_played";

  return (
    <Box data-testid="pelada-format-selector">
      <Typography
        sx={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: "11px",
          letterSpacing: ".1em",
          color: "text.secondary",
          textTransform: "uppercase",
          mb: 1.5,
        }}
      >
        {t("peladas.formats.selector_title", "MODELO DA PELADA")}
      </Typography>

      <Stack spacing={1.25}>
        {PELADA_FORMAT_OPTIONS.map((opt) => {
          const isSelected = format === opt.id;
          const isUnsupported = teamCount > 0 && teamCount < opt.minTeams;
          const isCardDisabled = disabled || isUnsupported;

          return (
            <Box
              key={opt.id}
              data-testid={`format-option-${opt.id}`}
              aria-disabled={isCardDisabled}
              onClick={() => {
                if (!isCardDisabled && !isSelected) {
                  onFormatChange(opt.id);
                }
              }}
              sx={{
                border: isSelected ? "2px solid" : "1.5px solid",
                borderColor: isSelected ? "primary.main" : "divider",
                bgcolor: isSelected ? "action.selected" : "background.paper",
                borderRadius: "14px",
                p: 1.5,
                cursor: isCardDisabled ? "not-allowed" : "pointer",
                opacity: isUnsupported ? 0.55 : 1,
                transition: "all 0.15s ease",
                "&:hover": isCardDisabled
                  ? {}
                  : {
                      borderColor: "primary.main",
                    },
              }}
            >
              <Stack
                direction="row"
                spacing={1.25}
                sx={{ alignItems: "flex-start" }}
              >
                <Box
                  sx={{
                    mt: 0.25,
                    color: isSelected ? "primary.main" : "text.secondary",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {renderIcon(opt.id)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: isSelected ? 800 : 700,
                        fontSize: "13px",
                        color: "text.primary",
                      }}
                    >
                      {t(opt.titleKey, opt.defaultTitle)}
                    </Typography>
                    <Chip
                      size="small"
                      label={
                        isUnsupported
                          ? t(
                              "peladas.formats.requires_teams",
                              "Requer {{count}}+ times",
                              { count: opt.minTeams },
                            )
                          : t(
                              "peladas.formats.min_teams_badge",
                              "{{count}}+ times",
                              { count: opt.minTeams },
                            )
                      }
                      color={
                        isUnsupported
                          ? "warning"
                          : isSelected
                            ? "primary"
                            : "default"
                      }
                      variant={isSelected ? "filled" : "outlined"}
                      sx={{
                        height: 20,
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    />
                  </Stack>
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontSize: "11.5px",
                      color: "text.secondary",
                      mt: 0.5,
                      lineHeight: 1.4,
                    }}
                  >
                    {t(opt.descKey, opt.defaultDesc)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      {/* Format-specific settings */}
      {(showMatchesPerTeamSelect || format !== "round_robin") && (
        <Box
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: "14px",
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {showMatchesPerTeamSelect &&
            format !== "winner_stays_on" &&
            (() => {
              const matchesPerTeamLabel =
                format === "round_robin"
                  ? t(
                      "peladas.detail.schedule.matches_per_team_label",
                      "Jogos por time",
                    )
                  : t(
                      "peladas.formats.group_matches_per_team_label",
                      "Jogos por time (1ª Fase / Classificatória)",
                    );
              return (
                <FormControl
                  fullWidth
                  size="small"
                  sx={{ mb: format !== "round_robin" ? 2 : 0 }}
                >
                  <InputLabel id="format-matches-per-team-label">
                    {matchesPerTeamLabel}
                  </InputLabel>
                  <Select
                    labelId="format-matches-per-team-label"
                    value={matchesPerTeam}
                    label={matchesPerTeamLabel}
                    data-testid="matches-per-team-select"
                    disabled={disabled}
                    onChange={(e) =>
                      onMatchesPerTeamChange(Number(e.target.value))
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                      <MenuItem key={n} value={n}>
                        {t("peladas.detail.schedule.matches_count", {
                          count: n,
                          defaultValue: `${n} jogos`,
                        })}{" "}
                        ({teamCount >= 2 ? Math.floor((teamCount * n) / 2) : n}{" "}
                        {t(
                          "peladas.detail.schedule.total_matches",
                          "partidas na fase",
                        )}
                        )
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            })()}

          {(format === "championship_final" ||
            format === "championship_semis_final") && (
            <Stack spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel id="knockout-tiebreaker-label">
                  {t(
                    "peladas.formats.knockout_tiebreaker_label",
                    "Critério de desempate no Mata-Mata / Final",
                  )}
                </InputLabel>
                <Select
                  labelId="knockout-tiebreaker-label"
                  value={tiebreaker}
                  label={t(
                    "peladas.formats.knockout_tiebreaker_label",
                    "Critério de desempate no Mata-Mata / Final",
                  )}
                  data-testid="knockout-tiebreaker-select"
                  disabled={disabled}
                  onChange={(e) =>
                    onFormatConfigChange({
                      ...formatConfig,
                      knockout_tiebreaker: e.target.value as KnockoutTiebreaker,
                    })
                  }
                >
                  <MenuItem value="best_campaign">
                    {t(
                      "peladas.formats.tiebreaker.best_campaign",
                      "Vantagem da melhor campanha (ou Pênaltis opcional)",
                    )}
                  </MenuItem>
                  <MenuItem value="penalties">
                    {t(
                      "peladas.formats.tiebreaker.penalties",
                      "Disputa de Pênaltis / Decisão manual em caso de empate",
                    )}
                  </MenuItem>
                </Select>
              </FormControl>

              {format === "championship_semis_final" && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeThirdPlace}
                      disabled={disabled}
                      data-testid="include-third-place-switch"
                      onChange={(e) =>
                        onFormatConfigChange({
                          ...formatConfig,
                          include_third_place: e.target.checked,
                        })
                      }
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: "12.5px", fontWeight: 600 }}>
                      {t(
                        "peladas.formats.include_third_place",
                        "Incluir disputa de 3º lugar antes da Final",
                      )}
                    </Typography>
                  }
                />
              )}
            </Stack>
          )}

          {format === "winner_stays_on" && (
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="wso-draw-rule-label">
                  {t(
                    "peladas.formats.wso.draw_rule_label",
                    "Em caso de empate",
                  )}
                </InputLabel>
                <Select
                  labelId="wso-draw-rule-label"
                  value={drawRule}
                  label={t(
                    "peladas.formats.wso.draw_rule_label",
                    "Em caso de empate",
                  )}
                  data-testid="wso-draw-rule-select"
                  disabled={disabled}
                  onChange={(e) =>
                    onFormatConfigChange({
                      ...formatConfig,
                      draw_rule: e.target.value as WinnerStaysOnDrawRule,
                    })
                  }
                >
                  <MenuItem value="challenger_stays">
                    {t(
                      "peladas.formats.wso.challenger_stays",
                      "Mais antigo sai / Desafiante fica",
                    )}
                  </MenuItem>
                  <MenuItem value="both_leave">
                    {t(
                      "peladas.formats.wso.both_leave",
                      "Ambos saem (próximos 2 da fila entram)",
                    )}
                  </MenuItem>
                  <MenuItem value="defender_stays">
                    {t(
                      "peladas.formats.wso.defender_stays",
                      "Quem estava defendendo em quadra fica",
                    )}
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="wso-max-wins-label">
                  {t(
                    "peladas.formats.wso.max_wins_label",
                    "Limite de vitórias seguidas em quadra",
                  )}
                </InputLabel>
                <Select
                  labelId="wso-max-wins-label"
                  value={maxConsecutiveWins}
                  label={t(
                    "peladas.formats.wso.max_wins_label",
                    "Limite de vitórias seguidas em quadra",
                  )}
                  data-testid="wso-max-wins-select"
                  disabled={disabled}
                  onChange={(e) =>
                    onFormatConfigChange({
                      ...formatConfig,
                      max_consecutive_wins: Number(e.target.value),
                    })
                  }
                >
                  <MenuItem value={0}>
                    {t(
                      "peladas.formats.wso.no_limit",
                      "Sem limite (Rei da Quadra livre)",
                    )}
                  </MenuItem>
                  <MenuItem value={2}>
                    {t(
                      "peladas.formats.wso.limit_2",
                      "2 jogos seguidos (depois reveza)",
                    )}
                  </MenuItem>
                  <MenuItem value={3}>
                    {t(
                      "peladas.formats.wso.limit_3",
                      "3 jogos seguidos (depois reveza)",
                    )}
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel id="wso-rotation-mode-label">
                  {t(
                    "peladas.formats.wso.rotation_mode_label",
                    "Modo de fila / rodízio",
                  )}
                </InputLabel>
                <Select
                  labelId="wso-rotation-mode-label"
                  value={rotationMode}
                  label={t(
                    "peladas.formats.wso.rotation_mode_label",
                    "Modo de fila / rodízio",
                  )}
                  data-testid="wso-rotation-mode-select"
                  disabled={disabled}
                  onChange={(e) =>
                    onFormatConfigChange({
                      ...formatConfig,
                      rotation_mode: e.target
                        .value as WinnerStaysOnRotationMode,
                    })
                  }
                >
                  <MenuItem value="team_queue">
                    {t(
                      "peladas.formats.wso.team_queue",
                      "Times Fixos + Completar se Faltar",
                    )}
                  </MenuItem>
                  <MenuItem value="player_queue">
                    {t(
                      "peladas.formats.wso.player_queue",
                      "Fila de Próximo Misturado (Banco + Quem Saiu)",
                    )}
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="wso-complete-rule-label">
                  {t(
                    "peladas.formats.wso.complete_rule_label",
                    "Como completar o time (quando faltar jogador)",
                  )}
                </InputLabel>
                <Select
                  labelId="wso-complete-rule-label"
                  value={completeTeamRule}
                  label={t(
                    "peladas.formats.wso.complete_rule_label",
                    "Como completar o time (quando faltar jogador)",
                  )}
                  data-testid="wso-complete-rule-select"
                  disabled={disabled}
                  onChange={(e) =>
                    onFormatConfigChange({
                      ...formatConfig,
                      complete_team_rule: e.target.value as CompleteTeamRule,
                    })
                  }
                >
                  <MenuItem value="least_played">
                    {t(
                      "peladas.formats.wso.least_played",
                      "Mais descansados / Menos jogos seguidos",
                    )}
                  </MenuItem>
                  <MenuItem value="balanced">
                    {t(
                      "peladas.formats.wso.balanced",
                      "Equilibrar por Nota e Posição",
                    )}
                  </MenuItem>
                  <MenuItem value="random">
                    {t(
                      "peladas.formats.wso.random",
                      "Sorteio entre os que saíram",
                    )}
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
}
