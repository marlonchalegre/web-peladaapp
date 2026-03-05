import { type StandingRow } from "../components/StandingsPanel";
import { type PlayerStatRow } from "../components/PlayerStatsPanel";

export function formatPeladaSummary(
  date: string | null,
  standings: StandingRow[],
  playerStats: PlayerStatRow[],
): string {
  const formattedDate = date
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }).format(new Date(date))
    : "";

  let text = `Resumo da rodada ${formattedDate}\n\nClassificacao:\n`;

  // Calculate max name length for alignment
  let maxNameLength = 0;
  standings.forEach((s) => {
    if (s.name.length > maxNameLength) maxNameLength = s.name.length;
  });
  playerStats.forEach((p) => {
    if (p.name.length > maxNameLength) maxNameLength = p.name.length;
  });

  const nameWidth = Math.min(Math.max(maxNameLength, 15), 30) + 2;

  // Sort standings by points (calculated: wins * 3 + draws)
  const sortedStandings = [...standings].sort((a, b) => {
    const ptsA = a.wins * 3 + a.draws;
    const ptsB = b.wins * 3 + b.draws;
    return ptsB - ptsA;
  });

  sortedStandings.forEach((s) => {
    const pts = s.wins * 3 + s.draws;
    const nameStr = s.name.padEnd(nameWidth);
    const sgStr = (s.goalDifference > 0 ? "+" : "") + s.goalDifference;
    text += `${nameStr} ${pts} pts (${s.wins}V ${s.draws}E ${s.losses}D) GP:${s.goalsFor} SG:${sgStr}\n`;
  });

  // Top scorers (goals > 0)
  const topScorers = playerStats
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));

  if (topScorers.length > 0) {
    text += `\nGols:\n`;
    topScorers.forEach((p) => {
      const nameStr = p.name.padEnd(nameWidth);
      text += `${nameStr} ${p.goals}\n`;
    });
  }

  // Top assisters (assists > 0)
  const topAssisters = playerStats
    .filter((p) => p.assists > 0)
    .sort((a, b) => b.assists - a.assists || a.name.localeCompare(b.name));

  if (topAssisters.length > 0) {
    text += `\nAssistencias:\n`;
    topAssisters.forEach((p) => {
      const nameStr = p.name.padEnd(nameWidth);
      text += `${nameStr} ${p.assists}\n`;
    });
  }

  // Goalkeepers (goalsConceded !== undefined)
  const goalkeepers = playerStats
    .filter((p) => p.goalsConceded !== undefined)
    .sort(
      (a, b) =>
        (a.goalsConceded || 0) - (b.goalsConceded || 0) ||
        a.name.localeCompare(b.name),
    );

  if (goalkeepers.length > 0) {
    text += `\nGols sofridos:\n`;
    goalkeepers.forEach((p) => {
      const nameStr = p.name.padEnd(nameWidth);
      text += `${nameStr} ${p.goalsConceded}\n`;
    });
  }

  return "```\n" + text.trim() + "\n```";
}
