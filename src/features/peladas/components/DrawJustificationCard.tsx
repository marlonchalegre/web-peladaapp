import { useMemo, type ReactNode } from "react";
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

function MetricStat({
  label,
  value,
  color = "text.primary",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
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
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: "'Archivo Narrow', Archivo, sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          color,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function JustificationBullet({
  color = "primary.main",
  children,
}: {
  color?: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1.2 }}>
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: color,
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
        {children}
      </Typography>
    </Box>
  );
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

  const { minAvg, maxAvg, diffAvg } = useMemo(() => {
    if (!hasAverages) {
      return { minAvg: "—", maxAvg: "—", diffAvg: formatDecimal(0, 1) };
    }
    const avgs = teamAverages.map((item) => item.avg);
    const min = Math.min(...avgs);
    const max = Math.max(...avgs);
    return {
      minAvg: formatDecimal(min, 1),
      maxAvg: formatDecimal(max, 1),
      diffAvg: formatDecimal(teamAverages.length > 1 ? max - min : 0, 1),
    };
  }, [hasAverages, teamAverages]);

  const algorithm = justification?.algorithm;
  const isAi = algorithm === "gpt" || algorithm === "gemini";

  const { topChampionPair, topAssistLink, topWinner, firstTimePair } = useMemo(
    () => ({
      topChampionPair: justification?.teams
        ?.flatMap((team) => team.champion_pairs || [])
        .sort((a, b) => (b.titles_together || 0) - (a.titles_together || 0))[0],
      topAssistLink:
        justification?.algorithm === "gpt"
          ? (justification.teams as DrawTacticalTeam[])
              .flatMap((team) => team.assist_links || [])
              .sort((a, b) => (b.count || 0) - (a.count || 0))[0]
          : undefined,
      topWinner:
        justification?.algorithm === "gemini"
          ? (justification.teams as DrawChemistryTeam[])
              .map((team) => team.top_winner)
              .filter((w): w is { name: string; titles: number } =>
                Boolean(w && w.name),
              )
              .sort((a, b) => (b.titles || 0) - (a.titles || 0))[0]
          : undefined,
      firstTimePair:
        justification?.algorithm === "gemini"
          ? (justification.teams as DrawChemistryTeam[]).flatMap(
              (team) => team.new_pairs || [],
            )[0]
          : undefined,
    }),
    [justification],
  );

  const benchedNames = useMemo(
    () => justification?.benched?.map((b) => b.name).join(", ") ?? "",
    [justification?.benched],
  );

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1.5px solid",
        borderColor: "divider",
        borderRadius: "16px",
        p: 2,
        mt: 2,
        boxShadow: (theme) =>
          theme.customShadows?.subtle || "0 2px 4px rgba(0,0,0,0.03)",
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
                theme.palette.gold?.subtleBg || "rgba(242, 161, 0, 0.15)",
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
          <MetricStat
            label={t("peladas.draw.justification.squad_mean", "MÉDIA ELENCO")}
            value={formatDecimal(justification.metrics.squad_mean)}
          />
          <MetricStat
            label={t("peladas.draw.justification.gap_overall", "GAP GERAL")}
            value={
              justification.algorithm === "gpt"
                ? formatDecimal(justification.metrics.team_mean_gap, 3)
                : formatDecimal(justification.metrics.overall_gap, 3)
            }
            color="primary.main"
          />
          {justification.algorithm === "gemini" && (
            <>
              <MetricStat
                label={t(
                  "peladas.draw.justification.gap_defense",
                  "GAP DEFESA",
                )}
                value={formatDecimal(justification.metrics.defense_gap, 3)}
              />
              <MetricStat
                label={t("peladas.draw.justification.gap_attack", "GAP ATAQUE")}
                value={formatDecimal(justification.metrics.offense_gap, 3)}
              />
            </>
          )}
          {justification.algorithm === "gpt" && (
            <MetricStat
              label={t("peladas.draw.justification.gap_sector", "GAP SETORIAL")}
              value={formatDecimal(justification.metrics.sector_gap, 3)}
            />
          )}
        </Box>
      )}

      {/* Explanatory bullet points */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
        {hasAverages && (
          <JustificationBullet>
            {t("peladas.draw.justification.team_avg_balance", {
              min: minAvg,
              max: maxAvg,
              diff: diffAvg,
              defaultValue: `Média por time entre ${minAvg} e ${maxAvg} — diferença de ${diffAvg}.`,
            })}
          </JustificationBullet>
        )}

        {justification && (
          <JustificationBullet>
            {justification.algorithm === "gpt"
              ? t(
                  "peladas.draw.justification.rule_summary_gpt",
                  "Sorteio por regras e restrições: notas e posições equilibradas sem concentração técnica.",
                )
              : t(
                  "peladas.draw.justification.rule_summary_gemini",
                  "Sorteio com equilíbrio tático: duplas campeãs separadas e entrosamento distribuído.",
                )}
          </JustificationBullet>
        )}

        {topChampionPair ? (
          <JustificationBullet>
            {t("peladas.draw.justification.champion_pair_text", {
              players: topChampionPair.players.join(" e "),
              titles: topChampionPair.titles_together,
              defaultValue: `Dupla campeã ${topChampionPair.players.join(" e ")} (${topChampionPair.titles_together} títulos juntos).`,
            })}
          </JustificationBullet>
        ) : (
          justification?.teams &&
          justification.teams.some(
            (team) => team.champion_pairs && team.champion_pairs.length > 0,
          ) && (
            <JustificationBullet>
              {t(
                "peladas.draw.justification.pairs_balanced",
                "Duplas frequentes e campeãs balanceadas entre os times para manter competitividade.",
              )}
            </JustificationBullet>
          )
        )}

        {topAssistLink && (
          <JustificationBullet>
            {t("peladas.draw.justification.assist_link_text", {
              from: topAssistLink.from,
              to: topAssistLink.to,
              count: topAssistLink.count,
              defaultValue: `Conexão: ${topAssistLink.from} → ${topAssistLink.to} (${topAssistLink.count} assistências).`,
            })}
          </JustificationBullet>
        )}

        {topWinner && (
          <JustificationBullet>
            {t("peladas.draw.justification.top_winner_text", {
              name: topWinner.name.trim(),
              titles: topWinner.titles,
              defaultValue: `Maior vencedor recente: ${topWinner.name.trim()} (${topWinner.titles} títulos).`,
            })}
          </JustificationBullet>
        )}

        {firstTimePair && (
          <JustificationBullet>
            {t("peladas.draw.justification.first_time_pair_text", {
              players: firstTimePair.players.join(" e "),
              defaultValue: `Parceria inédita: ${firstTimePair.players.join(" e ")}.`,
            })}
          </JustificationBullet>
        )}

        {justification?.history?.moves &&
          justification.history.moves.length > 0 && (
            <JustificationBullet>
              {t("peladas.draw.justification.history_moves_text", {
                count: justification.history.moves.length,
                defaultValue: `${justification.history.moves.length} jogador(es) trocado(s) de time para evitar repetição de formações recentes.`,
              })}
            </JustificationBullet>
          )}

        {homeGkName && awayGkName && (
          <JustificationBullet>
            {t("peladas.draw.justification.fixed_gk_text", {
              home: homeGkName,
              away: awayGkName,
              defaultValue: `Goleiros fixos ${homeGkName} e ${awayGkName} divididos entre Time 1 e Time 2.`,
            })}
          </JustificationBullet>
        )}

        {justification?.benched && justification.benched.length > 0 && (
          <JustificationBullet color="secondary.main">
            {t("peladas.draw.justification.benched_text", {
              count: justification.benched.length,
              names: benchedNames,
              defaultValue: `${justification.benched.length} jogador(es) no banco aguardando vaga (${benchedNames}).`,
            })}
          </JustificationBullet>
        )}

        {teamAverages.some((team) => team.count < playersPerTeam) && (
          <JustificationBullet color="secondary.main">
            {t(
              "peladas.draw.justification.incomplete_teams",
              "Há times incompletos: arraste jogadores do banco para preencher as vagas livres.",
            )}
          </JustificationBullet>
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
