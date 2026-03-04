import type { Player, Team, User } from "../../../shared/api/endpoints";

type PlayerWithUser = Player & { user: User; is_goalkeeper?: boolean };

export function generateExportText(
  teams: Team[],
  teamPlayers: Record<number, PlayerWithUser[]>,
  scores: Record<number, number>,
): string {
  let text = "";

  // Calculate max name length for alignment
  let maxNameLength = 0;
  Object.values(teamPlayers).forEach((players) => {
    players.forEach((p) => {
      const name = p.user?.name || "Unknown";
      if (name.length > maxNameLength) maxNameLength = name.length;
    });
  });

  // Cap max name length for sanity and add a small buffer
  const nameWidth = Math.min(Math.max(maxNameLength, 15), 30) + 2;

  teams.forEach((team, index) => {
    const players = teamPlayers[team.id] || [];

    // Sort players: Goalkeeper (0), Defender (1), Midfielder (2), Striker (3)
    const sortedPlayers = [...players].sort((a, b) => {
      if (a.is_goalkeeper && !b.is_goalkeeper) return -1;
      if (!a.is_goalkeeper && b.is_goalkeeper) return 1;

      const order: Record<string, number> = {
        Goalkeeper: 0,
        Defender: 1,
        Midfielder: 2,
        Striker: 3,
      };
      const posA = order[a.user?.position || ""] ?? 4;
      const posB = order[b.user?.position || ""] ?? 4;
      return posA - posB;
    });

    const vals = players
      .map((p) => (typeof scores[p.id] === "number" ? scores[p.id] : p.grade))
      .filter((g): g is number => typeof g === "number");

    const avg =
      vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

    const teamName = team.name.toUpperCase();
    const avgStr = avg.toFixed(2).replace(".", ",");

    // Header: TEAM NAME (padded) MÉDIA AVG
    text += `${teamName.padEnd(nameWidth + 3)} MÉDIA  ${avgStr}\n`;

    sortedPlayers.forEach((p, i) => {
      const score = scores[p.id] ?? p.grade;
      const scoreStr =
        typeof score === "number" ? score.toFixed(2).replace(".", ",") : "-";

      const posMap: Record<string, string> = {
        Defender: "Z",
        Midfielder: "M",
        Striker: "A",
        Goalkeeper: "G",
      };
      const pos = p.is_goalkeeper ? "G" : posMap[p.user?.position || ""] || "?";

      const indexStr = `${i + 1}`.padEnd(3);
      const nameStr = (p.user?.name || "Unknown").padEnd(nameWidth);

      // Row: 1  Name (padded) POS  Score
      text += `${indexStr}${nameStr}${pos.padEnd(3)}${scoreStr}\n`;
    });

    if (index < teams.length - 1) {
      text += "\n\n";
    }
  });

  return "```\n" + text.trim() + "\n```";
}

export function generateAnnouncementText(
  teams: Team[],
  teamPlayers: Record<number, PlayerWithUser[]>,
): string {
  let text = "*ESCALAÇÃO DA PELADA*\n\n";

  teams.forEach((team, index) => {
    const players = teamPlayers[team.id] || [];

    // Sort players: Goalkeeper (0), Defender (1), Midfielder (2), Striker (3)
    const sortedPlayers = [...players].sort((a, b) => {
      if (a.is_goalkeeper && !b.is_goalkeeper) return -1;
      if (!a.is_goalkeeper && b.is_goalkeeper) return 1;

      const order: Record<string, number> = {
        Goalkeeper: 0,
        Defender: 1,
        Midfielder: 2,
        Striker: 3,
      };
      const posA = order[a.user?.position || ""] ?? 4;
      const posB = order[b.user?.position || ""] ?? 4;
      return posA - posB;
    });

    text += `*${team.name.toUpperCase()}*\n`;

    sortedPlayers.forEach((p) => {
      const posMap: Record<string, string> = {
        Defender: "Z",
        Midfielder: "M",
        Striker: "A",
        Goalkeeper: "G",
      };
      const pos = p.is_goalkeeper ? "G" : posMap[p.user?.position || ""] || "?";

      text += `• ${p.user?.name || "Unknown"} - ${pos}\n`;
    });

    if (index < teams.length - 1) {
      text += "\n";
    }
  });

  return text;
}

export function generateExportCsv(
  teams: Team[],
  teamPlayers: Record<number, PlayerWithUser[]>,
  scores: Record<number, number>,
): string {
  // BOM for Excel to recognize UTF-8
  let csv = "\uFEFF";
  csv += "Time;Nome;Posição;Nota\n";

  teams.forEach((team) => {
    const players = teamPlayers[team.id] || [];

    const sortedPlayers = [...players].sort((a, b) => {
      if (a.is_goalkeeper && !b.is_goalkeeper) return -1;
      if (!a.is_goalkeeper && b.is_goalkeeper) return 1;

      const order: Record<string, number> = {
        Goalkeeper: 0,
        Defender: 1,
        Midfielder: 2,
        Striker: 3,
      };
      const posA = order[a.user?.position || ""] ?? 4;
      const posB = order[b.user?.position || ""] ?? 4;
      return posA - posB;
    });

    sortedPlayers.forEach((p) => {
      const score = scores[p.id] ?? p.grade;
      const scoreStr =
        typeof score === "number" ? score.toFixed(2).replace(".", ",") : "-";

      const posMap: Record<string, string> = {
        Defender: "Z",
        Midfielder: "M",
        Striker: "A",
        Goalkeeper: "G",
      };
      const pos = p.is_goalkeeper ? "G" : posMap[p.user?.position || ""] || "?";

      csv += `${team.name};${p.user?.name || "Unknown"};${pos};${scoreStr}\n`;
    });
  });

  return csv;
}

export function downloadFile(
  filename: string,
  content: string,
  type = "text/plain",
) {
  const element = document.createElement("a");
  const file = new Blob([content], { type });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy text: ", err);
    return false;
  }
}
