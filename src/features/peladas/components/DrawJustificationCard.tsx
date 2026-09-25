import { Box, Typography, Button, Chip } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PsychologyIcon from "@mui/icons-material/Psychology";
import type {
  DrawJustification,
  DrawTacticalTeam,
  DrawChemistryTeam,
} from "../../../shared/api/endpoints";
import { formatDecimal } from "../utils/formatNumber";
import { useTranslation } from "react-i18next";

export interface DrawJustificationCardProps {
  justification: DrawJustification | null;
  teamAverages?: {
    teamName?: string;
    name?: string;
    avg: number;
    count: number;
  }[];
  playersPerTeam?: number;
  homeGkName?: string;
  awayGkName?: string;
  onOpenDialog?: () => void;
}

export default function DrawJustificationCard({
  justification,
  teamAverages = [],
  playersPerTeam = 5,
  homeGkName,
  awayGkName,
  onOpenDialog,
}: DrawJustificationCardProps) {
  const { t } = useTranslation();
  const hasAverages = teamAverages.length > 0;
  const minAvg = hasAverages
    ? formatDecimal(Math.min(...teamAverages.map((t) => t.avg)), 1)
    : "—";
  const maxAvg = hasAverages
    ? formatDecimal(Math.max(...teamAverages.map((t) => t.avg)), 1)
    : "—";
  const diffAvg =
    teamAverages.length > 1
      ? formatDecimal(
          Math.max(...teamAverages.map((t) => t.avg)) -
            Math.min(...teamAverages.map((t) => t.avg)),
          1,
        )
      : formatDecimal(0, 1);

  const algorithm = justification?.algorithm;
  const isAi = algorithm === "gpt" || algorithm === "gemini";

  const topChampionPair = justification?.teams
    ?.flatMap((t) => t.champion_pairs || [])
    .sort((a, b) => (b.titles_together || 0) - (a.titles_together || 0))[0];

  const topAssistLink =
    justification?.algorithm === "gpt"
      ? (justification.teams as DrawTacticalTeam[])
          .flatMap((t) => t.assist_links || [])
          .sort((a, b) => (b.count || 0) - (a.count || 0))[0]
      : undefined;

  const topWinner =
    justification?.algorithm === "gemini"
      ? (justification.teams as DrawChemistryTeam[])
          .map((t) => t.top_winner)
          .filter((w): w is { name: string; titles: number } =>
            Boolean(w && w.name),
          )
          .sort((a, b) => (b.titles || 0) - (a.titles || 0))[0]
      : undefined;

  const firstTimePair =
    justification?.algorithm === "gemini"
      ? (justification.teams as DrawChemistryTeam[]).flatMap(
          (t) => t.new_pairs || [],
        )[0]
      : undefined;

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1.5px solid",
        borderColor: "divider",
        borderRadius: "16px",
        p: 2,
        mt: 2,
        boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: "9.5px",
            letterSpacing: ".14em",
            color: "text.secondary",
            textTransform: "uppercase",
          }}
        >
          {t("peladas.draw.justification.title", "POR QUE FICOU ASSIM")}
        </Typography>

        {algorithm === "gemini" && (
          <Chip
            size="small"
            icon={
              <AutoAwesomeIcon
                sx={{ "&&": { fontSize: "13px", color: "primary.main" } }}
              />
            }
            label={t(
              "peladas.draw.justification.chip_gemini",
              "EQUILÍBRIO TÁTICO · GEMINI",
            )}
            sx={{
              bgcolor: (theme) =>
                theme.palette.status?.paid?.bg || "action.hover",
              border: (theme) => `1px solid ${theme.palette.primary.main}`,
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "9px",
              letterSpacing: ".06em",
              color: "primary.main",
              height: 22,
            }}
          />
        )}
        {algorithm === "gpt" && (
          <Chip
            size="small"
            icon={
              <PsychologyIcon
                sx={{ "&&": { fontSize: "13px", color: "gold.main" } }}
              />
            }
            label={t("peladas.draw.justification.chip_gpt", "POR REGRAS · GPT")}
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(242, 161, 0, 0.15)"
                  : theme.palette.gold?.light || "rgba(242, 161, 0, 0.15)",
              border: (theme) =>
                `1px solid ${theme.palette.gold?.main || theme.palette.primary.main}`,
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "9px",
              letterSpacing: ".06em",
              color: (theme) =>
                theme.palette.gold?.subtleText || theme.palette.text.secondary,
              height: 22,
            }}
          />
        )}
        {!isAi && (
          <Chip
            size="small"
            label={t("peladas.draw.justification.chip_classic", "CLÁSSICO")}
            sx={{
              bgcolor: "background.default",
              border: "1px solid",
              borderColor: "divider",
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "9px",
              letterSpacing: ".06em",
              color: "text.secondary",
              height: 22,
            }}
          />
        )}
      </Box>

      {/* AI Metrics summary bar if available */}
      {justification && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
            gap: 1,
            mb: 1.75,
            p: 1.25,
            bgcolor: "background.default",
            borderRadius: "10px",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                color: "text.secondary",
                letterSpacing: ".08em",
                textTransform: "uppercase",
              }}
            >
              {t("peladas.draw.justification.squad_mean", "MÉDIA ELENCO")}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                color: "text.primary",
              }}
            >
              {formatDecimal(justification.metrics.squad_mean)}
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                color: "text.secondary",
                letterSpacing: ".08em",
                textTransform: "uppercase",
              }}
            >
              {t("peladas.draw.justification.gap_overall", "GAP GERAL")}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                color: "primary.main",
              }}
            >
              {justification.algorithm === "gpt"
                ? formatDecimal(justification.metrics.team_mean_gap, 3)
                : formatDecimal(justification.metrics.overall_gap, 3)}
            </Typography>
          </Box>

          {justification.algorithm === "gemini" && (
            <>
              <Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "8.5px",
                    color: "text.secondary",
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  {t("peladas.draw.justification.gap_defense", "GAP DEFESA")}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "text.primary",
                  }}
                >
                  {formatDecimal(justification.metrics.defense_gap, 3)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "8.5px",
                    color: "text.secondary",
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  {t("peladas.draw.justification.gap_attack", "GAP ATAQUE")}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "text.primary",
                  }}
                >
                  {formatDecimal(justification.metrics.offense_gap, 3)}
                </Typography>
              </Box>
            </>
          )}

          {justification.algorithm === "gpt" && (
            <Box>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  color: "text.secondary",
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                }}
              >
                {t("peladas.draw.justification.gap_sector", "GAP SETORIAL")}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "text.primary",
                }}
              >
                {formatDecimal(justification.metrics.sector_gap, 3)}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Explanatory bullet points */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
        {/* Balance */}
        {hasAverages && (
          <Box sx={{ display: "flex", gap: 1.2 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "primary.main",
                flexShrink: 0,
                mt: 0.6,
              }}
            />
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.4,
                color: "text.secondary",
              }}
            >
              {t("peladas.draw.justification.team_avg_balance", {
                min: minAvg,
                max: maxAvg,
                diff: diffAvg,
                defaultValue: `Média por time entre ${minAvg} e ${maxAvg} — diferença de ${diffAvg}.`,
              })}
            </Typography>
          </Box>
        )}

        {/* AI Tactical or Chemistry summary */}
        {justification && (
          <Box sx={{ display: "flex", gap: 1.2 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "primary.main",
                flexShrink: 0,
                mt: 0.6,
              }}
            />
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.4,
                color: "text.secondary",
              }}
            >
              {justification.algorithm === "gpt"
                ? t(
                    "peladas.draw.justification.rule_summary_gpt",
                    "Sorteio por regras e restrições: notas e posições equilibradas sem concentração técnica.",
                  )
                : t(
                    "peladas.draw.justification.rule_summary_gemini",
                    "Sorteio com equilíbrio tático: duplas campeãs separadas e entrosamento distribuído.",
                  )}
            </Typography>
          </Box>
        )}

        {/* Tactical / Chemistry pairs evidence */}
        {topChampionPair ? (
          <Box sx={{ display: "flex", gap: 1.2 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "primary.main",
                flexShrink: 0,
                mt: 0.6,
              }}
            />
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.4,
                color: "text.secondary",
              }}
            >
              {t("peladas.draw.justification.champion_pair_text", {
                players: topChampionPair.players.join(" e "),
                titles: topChampionPair.titles_together,
                defaultValue: `Dupla campeã ${topChampionPair.players.join(" e ")} (${topChampionPair.titles_together} títulos juntos).`,
              })}
            </Typography>
          </Box>
        ) : (
          justification?.teams &&
          justification.teams.some(
            (t) => t.champion_pairs && t.champion_pairs.length > 0,
          ) && (
            <Box sx={{ display: "flex", gap: 1.2 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  flexShrink: 0,
                  mt: 0.6,
                }}
              />
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "11.5px",
                  lineHeight: 1.4,
                  color: "text.secondary",
                }}
              >
                {t(
                  "peladas.draw.justification.pairs_balanced",
                  "Duplas frequentes e campeãs balanceadas entre os times para manter competitividade.",
                )}
              </Typography>
            </Box>
          )
        )}

        {/* Assist link evidence */}
        {topAssistLink && (
          <Box sx={{ display: "flex", gap: 1.2 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "primary.main",
                flexShrink: 0,
                mt: 0.6,
              }}
            />
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.4,
                color: "text.secondary",
              }}
            >
              {t("peladas.draw.justification.assist_link_text", {
                from: topAssistLink.from,
                to: topAssistLink.to,
                count: topAssistLink.count,
                defaultValue: `Conexão: ${topAssistLink.from} → ${topAssistLink.to} (${topAssistLink.count} assistências).`,
              })}
            </Typography>
          </Box>
        )}

        {/* Top winner */}
        {topWinner && (
          <Box sx={{ display: "flex", gap: 1.2 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "primary.main",
                flexShrink: 0,
                mt: 0.6,
              }}
            />
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.4,
                color: "text.secondary",
              }}
            >
              {t("peladas.draw.justification.top_winner_text", {
                name: topWinner.name.trim(),
                titles: topWinner.titles,
                defaultValue: `Maior vencedor recente: ${topWinner.name.trim()} (${topWinner.titles} títulos).`,
              })}
            </Typography>
          </Box>
        )}

        {/* First time pair */}
        {firstTimePair && (
          <Box sx={{ display: "flex", gap: 1.2 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "primary.main",
                flexShrink: 0,
                mt: 0.6,
              }}
            />
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.4,
                color: "text.secondary",
              }}
            >
              {t("peladas.draw.justification.first_time_pair_text", {
                players: firstTimePair.players.join(" e "),
                defaultValue: `Parceria inédita: ${firstTimePair.players.join(" e ")}.`,
              })}
            </Typography>
          </Box>
        )}

        {/* History moves */}
        {justification?.history?.moves &&
          justification.history.moves.length > 0 && (
            <Box sx={{ display: "flex", gap: 1.2 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  flexShrink: 0,
                  mt: 0.6,
                }}
              />
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "11.5px",
                  lineHeight: 1.4,
                  color: "text.secondary",
                }}
              >
                {t("peladas.draw.justification.history_moves_text", {
                  count: justification.history.moves.length,
                  defaultValue: `${justification.history.moves.length} jogador(es) trocado(s) de time para evitar repetição de formações recentes.`,
                })}
              </Typography>
            </Box>
          )}

        {/* Fixed Goalkeepers */}
        {homeGkName && awayGkName && (
          <Box sx={{ display: "flex", gap: 1.2 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "primary.main",
                flexShrink: 0,
                mt: 0.6,
              }}
            />
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.4,
                color: "text.secondary",
              }}
            >
              {t("peladas.draw.justification.fixed_gk_text", {
                home: homeGkName,
                away: awayGkName,
                defaultValue: `Goleiros fixos ${homeGkName} e ${awayGkName} divididos entre Time 1 e Time 2.`,
              })}
            </Typography>
          </Box>
        )}

        {/* Benched players */}
        {justification?.benched && justification.benched.length > 0 && (
          <Box sx={{ display: "flex", gap: 1.2 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "secondary.main",
                flexShrink: 0,
                mt: 0.6,
              }}
            />
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.4,
                color: "text.secondary",
              }}
            >
              {t("peladas.draw.justification.benched_text", {
                count: justification.benched.length,
                names: justification.benched.map((b) => b.name).join(", "),
                defaultValue: `${justification.benched.length} jogador(es) no banco aguardando vaga (${justification.benched.map((b) => b.name).join(", ")}).`,
              })}
            </Typography>
          </Box>
        )}

        {/* Incomplete teams */}
        {teamAverages.some((t) => t.count < playersPerTeam) && (
          <Box sx={{ display: "flex", gap: 1.2 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "secondary.main",
                flexShrink: 0,
                mt: 0.6,
              }}
            />
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.4,
                color: "text.secondary",
              }}
            >
              {t(
                "peladas.draw.justification.incomplete_teams",
                "Há times incompletos: arraste jogadores do banco para preencher as vagas livres.",
              )}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Heuristic footer disclaimer matching redesign reference */}
      <Typography
        sx={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 600,
          fontSize: "10.5px",
          lineHeight: 1.45,
          color: "text.secondary",
          mt: 1.5,
          pt: 1.25,
          borderTop: (theme) => `1.5px dashed ${theme.palette.divider}`,
        }}
      >
        {t(
          "peladas.draw.justification.heuristic_caveat",
          "Isso é preferência heurística, não previsão: nota equilibrada não garante jogo equilibrado.",
        )}
      </Typography>

      {/* Button to view full justification dialog */}
      {justification && onOpenDialog && (
        <Button
          fullWidth
          variant="outlined"
          size="small"
          onClick={onOpenDialog}
          sx={{
            mt: 1.75,
            borderColor: "divider",
            color: "text.primary",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "11px",
            letterSpacing: ".04em",
            borderRadius: "10px",
            py: 0.75,
            textTransform: "uppercase",
            "&:hover": {
              bgcolor: "action.hover",
              borderColor: "text.primary",
            },
          }}
        >
          {t(
            "peladas.draw.justification.view_full",
            "VER JUSTIFICATIVA COMPLETA",
          )}
        </Button>
      )}
    </Box>
  );
}
