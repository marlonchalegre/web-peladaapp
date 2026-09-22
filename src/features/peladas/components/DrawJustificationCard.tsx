import { Box, Typography, Button, Chip } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PsychologyIcon from "@mui/icons-material/Psychology";
import type {
  DrawJustification,
  DrawTacticalTeam,
  DrawChemistryTeam,
} from "../../../shared/api/endpoints";
import { formatDecimal } from "../utils/formatNumber";

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
  const minAvg =
    teamAverages.length > 0
      ? Math.min(...teamAverages.map((t) => t.avg)).toFixed(1)
      : "7.0";
  const maxAvg =
    teamAverages.length > 0
      ? Math.max(...teamAverages.map((t) => t.avg)).toFixed(1)
      : "7.5";
  const diffAvg =
    teamAverages.length > 1
      ? (
          Math.max(...teamAverages.map((t) => t.avg)) -
          Math.min(...teamAverages.map((t) => t.avg))
        ).toFixed(1)
      : "0.0";

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
        bgcolor: "#ffffff",
        border: "1.5px solid #eae6db",
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
            color: "#6b675c",
            textTransform: "uppercase",
          }}
        >
          POR QUE FICOU ASSIM
        </Typography>

        {algorithm === "gemini" && (
          <Chip
            size="small"
            icon={
              <AutoAwesomeIcon
                sx={{ "&&": { fontSize: "13px", color: "#146b3a" } }}
              />
            }
            label="EQUILÍBRIO TÁTICO · GEMINI"
            sx={{
              bgcolor: "#f4f8f5",
              border: "1px solid #146b3a",
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "9px",
              letterSpacing: ".06em",
              color: "#146b3a",
              height: 22,
            }}
          />
        )}
        {algorithm === "gpt" && (
          <Chip
            size="small"
            icon={
              <PsychologyIcon
                sx={{ "&&": { fontSize: "13px", color: "#8a5800" } }}
              />
            }
            label="POR REGRAS · GPT"
            sx={{
              bgcolor: "#fff8eb",
              border: "1px solid #f2a100",
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "9px",
              letterSpacing: ".06em",
              color: "#8a5800",
              height: 22,
            }}
          />
        )}
        {!isAi && (
          <Chip
            size="small"
            label="CLÁSSICO"
            sx={{
              bgcolor: "#f6f4ee",
              border: "1px solid #ddd8cc",
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "9px",
              letterSpacing: ".06em",
              color: "#6b675c",
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
            bgcolor: "#f6f4ee",
            borderRadius: "10px",
            border: "1px solid #eae6db",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                color: "#6b675c",
                letterSpacing: ".08em",
                textTransform: "uppercase",
              }}
            >
              MÉDIA ELENCO
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                color: "#17181a",
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
                color: "#6b675c",
                letterSpacing: ".08em",
                textTransform: "uppercase",
              }}
            >
              GAP GERAL
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                color: "#146b3a",
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
                    color: "#6b675c",
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  GAP DEFESA
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "#17181a",
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
                    color: "#6b675c",
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  GAP ATAQUE
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "#17181a",
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
                  color: "#6b675c",
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                }}
              >
                GAP SETORIAL
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "#17181a",
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
        <Box sx={{ display: "flex", gap: 1.2 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: "#146b3a",
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
              color: "#4a4740",
            }}
          >
            Média por time entre {minAvg} e {maxAvg} — diferença de {diffAvg}.
          </Typography>
        </Box>

        {/* AI Tactical or Chemistry summary */}
        {justification && (
          <Box sx={{ display: "flex", gap: 1.2 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "#146b3a",
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
                color: "#4a4740",
              }}
            >
              {justification.algorithm === "gpt"
                ? "Sorteio por regras e restrições: notas e posições equilibradas sem concentração técnica."
                : "Sorteio com equilíbrio tático: duplas campeãs separadas e entrosamento distribuído."}
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
                bgcolor: "#146b3a",
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
                color: "#4a4740",
              }}
            >
              Dupla campeã {topChampionPair.players.join(" e ")} (
              {topChampionPair.titles_together} títulos juntos).
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
                  bgcolor: "#146b3a",
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
                  color: "#4a4740",
                }}
              >
                Duplas frequentes e campeãs balanceadas entre os times para
                manter competitividade.
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
                bgcolor: "#146b3a",
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
                color: "#4a4740",
              }}
            >
              Conexão: {topAssistLink.from} → {topAssistLink.to} (
              {topAssistLink.count} assistências).
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
                bgcolor: "#146b3a",
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
                color: "#4a4740",
              }}
            >
              Maior vencedor recente: {topWinner.name.trim()} (
              {topWinner.titles} títulos).
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
                bgcolor: "#146b3a",
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
                color: "#4a4740",
              }}
            >
              Parceria inédita: {firstTimePair.players.join(" e ")}.
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
                  bgcolor: "#146b3a",
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
                  color: "#4a4740",
                }}
              >
                {justification.history.moves.length} jogador(es) trocado(s) de
                time para evitar repetição de formações recentes.
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
                bgcolor: "#146b3a",
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
                color: "#4a4740",
              }}
            >
              Goleiros fixos {homeGkName} e {awayGkName} divididos entre Time 1
              e Time 2.
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
                bgcolor: "#a8452a",
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
                color: "#4a4740",
              }}
            >
              {justification.benched.length} jogador(es) no banco aguardando
              vaga ({justification.benched.map((b) => b.name).join(", ")}).
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
                bgcolor: "#a8452a",
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
                color: "#4a4740",
              }}
            >
              Há times incompletos: arraste jogadores do banco para preencher as
              vagas livres.
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
          color: "#6b675c",
          mt: 1.5,
          pt: 1.25,
          borderTop: "1.5px dashed #ddd8cc",
        }}
      >
        Isso é preferência heurística, não previsão: nota equilibrada não
        garante jogo equilibrado.
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
            borderColor: "#17181a",
            color: "#17181a",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "11px",
            letterSpacing: ".04em",
            borderRadius: "10px",
            py: 0.75,
            textTransform: "uppercase",
            "&:hover": {
              bgcolor: "#17181a",
              color: "#ffffff",
              borderColor: "#17181a",
            },
          }}
        >
          VER JUSTIFICATIVA COMPLETA
        </Button>
      )}
    </Box>
  );
}
