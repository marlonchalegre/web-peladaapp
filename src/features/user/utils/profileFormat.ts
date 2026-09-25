import type { TFunction } from "i18next";
import type { ProfileRecentPelada } from "../../../shared/api/endpoints";

export const formatRating = (value: number | null | undefined) =>
  value == null ? "—" : value.toFixed(1).replace(".", ",");

export const formatSkill = (value: number | null | undefined) =>
  value == null ? "—" : value.toFixed(1).replace(".", ",");

// Mirrors api-peladaapp.logic.grade/performance-from-stars so a per-pelada
// score reads on the same 0-10 scale as the average rating.
export const performanceFromStars = (stars: number) => {
  const x = stars;
  if (x <= 1) return 1;
  if (x <= 2) return 1 + 3 * (x - 1);
  if (x <= 3) return 4 + 3 * (x - 2);
  if (x <= 4) return 7 + 2 * (x - 3);
  if (x <= 5) return 9 + 1 * (x - 4);
  return 10;
};

export interface RecentMatchRow {
  date: string;
  group: string;
  desc: string;
  sub: string;
  badge: string | null;
  score: string;
}

export const toRecentMatchRows = (
  peladas: ProfileRecentPelada[] | undefined,
  t?: TFunction,
): RecentMatchRow[] =>
  (peladas ?? []).map((pelada) => {
    const when = pelada.scheduled_at ? new Date(pelada.scheduled_at) : null;
    const date =
      when && !Number.isNaN(when.getTime())
        ? `${String(when.getDate()).padStart(2, "0")}/${String(
            when.getMonth() + 1,
          ).padStart(2, "0")}`
        : "--";
    const line = pelada.user;
    const goalsLabel = t ? t("common.goals_short", "gols") : "gols";
    const assistsLabel = t ? t("common.assists_short", "assist.") : "assist.";
    const championLabel = t
      ? t(
          "user.profile.format.champion",
          `Campeão: ${pelada.champion_team_name}`,
          {
            team: pelada.champion_team_name,
          },
        )
      : `Campeão: ${pelada.champion_team_name}`;
    const notPlayedLabel = t
      ? t("user.profile.format.didnt_play", "Não jogou")
      : "Não jogou";
    const placeStr = line?.team_position
      ? t
        ? ` · ${t("user.profile.format.place", `${line.team_position}º lugar`, { place: line.team_position })}`
        : ` · ${line.team_position}º lugar`
      : "";
    const garcomLabel = t
      ? t("user.profile.format.garcom", "GARÇOM")
      : "GARÇOM";

    const desc = line
      ? `${line.goals} ${goalsLabel} · ${line.assists} ${assistsLabel}`
      : pelada.champion_team_name
        ? championLabel
        : notPlayedLabel;
    const sub = line?.team_name
      ? `${line.team_name}${placeStr}`
      : pelada.location || "";
    const badge = line?.is_mvp ? "MVP" : line?.is_garcom ? garcomLabel : null;
    const score =
      line?.avg_stars != null
        ? formatRating(performanceFromStars(line.avg_stars))
        : "—";
    return { date, group: pelada.organization_name, desc, sub, badge, score };
  });
