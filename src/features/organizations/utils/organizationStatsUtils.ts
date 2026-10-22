import type {
  OrganizationPlayerStats,
  WeeklyPresence,
} from "../../../shared/api/endpoints";

export type MetricType = "goals" | "assists" | "presence" | "titles" | "rating";

export function sortStatsByMetric(
  stats: OrganizationPlayerStats[],
  metric: MetricType,
): OrganizationPlayerStats[] {
  const copy = [...stats];
  switch (metric) {
    case "goals":
      return copy.sort((a, b) => (b.goal || 0) - (a.goal || 0));
    case "assists":
      return copy.sort((a, b) => (b.assist || 0) - (a.assist || 0));
    case "presence":
      return copy.sort(
        (a, b) => (b.peladas_played || 0) - (a.peladas_played || 0),
      );
    case "titles":
      return copy.sort((a, b) => (b.titles || 0) - (a.titles || 0));
    case "rating":
      return copy.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    default:
      return copy.sort((a, b) => (b.goal || 0) - (a.goal || 0));
  }
}

export function getMetricNumericValue(
  item: OrganizationPlayerStats | undefined,
  metric: MetricType,
): number {
  if (!item) return 0;
  switch (metric) {
    case "goals":
      return item.goal || 0;
    case "assists":
      return item.assist || 0;
    case "presence":
      return item.peladas_played || 0;
    case "titles":
      return item.titles || 0;
    case "rating":
      return item.avg_rating || 0;
    default:
      return 0;
  }
}

export function computeWeeklyPresenceSummary(weeklyPresence: WeeklyPresence[]) {
  const presenceMax = Math.max(1, ...weeklyPresence.map((w) => w.confirmed));
  const presenceWeeksAvg = weeklyPresence.length
    ? Math.round(
        weeklyPresence.reduce((acc, w) => acc + w.confirmed, 0) /
          weeklyPresence.length,
      )
    : 0;
  const worstWeek = weeklyPresence.reduce<WeeklyPresence | undefined>(
    (min, w) => (!min || w.confirmed < min.confirmed ? w : min),
    undefined,
  );
  return { presenceMax, presenceWeeksAvg, worstWeek };
}
