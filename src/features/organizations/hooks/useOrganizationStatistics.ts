import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import { createApi, type Organization } from "../../../shared/api/endpoints";

const endpoints = createApi(api);

export type PlayerStats = {
  player_id: number;
  player_name: string;
  peladas_played: number;
  goal: number;
  assist: number;
  own_goal: number;
};

type Order = "asc" | "desc";

export function useOrganizationStatistics(orgId: number) {
  const { t } = useTranslation();
  const [org, setOrg] = useState<Organization | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<keyof PlayerStats>("goal");
  const [order, setOrder] = useState<Order>("desc");

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [minPeladas, setMinPeladas] = useState<string>("");
  const [minGoals, setMinGoals] = useState<string>("");
  const [minAssists, setMinAssists] = useState<string>("");
  const [minOwnGoals, setMinOwnGoals] = useState<string>("");

  useEffect(() => {
    if (!orgId) return;
    endpoints
      .getOrganization(orgId)
      .then(setOrg)
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : t("organizations.stats.error.load_org_failed");
        setError(message);
      });
  }, [orgId, t]);

  const fetchStats = useCallback(async () => {
    if (!orgId) return;
    try {
      const response = await endpoints.getOrganizationStatistics(orgId, year);
      setStats(response);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("organizations.stats.error.load_stats_failed");
      setError(message);
    }
  }, [orgId, year, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  const handleRequestSort = (property: keyof PlayerStats) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredStats = useMemo(() => {
    return stats.filter((row) => {
      const matchesName = row.player_name
        .toLowerCase()
        .includes(nameFilter.toLowerCase());
      const matchesPeladas =
        minPeladas === "" || row.peladas_played >= Number(minPeladas);
      const matchesGoals = minGoals === "" || row.goal >= Number(minGoals);
      const matchesAssists =
        minAssists === "" || row.assist >= Number(minAssists);
      const matchesOwnGoals =
        minOwnGoals === "" || row.own_goal >= Number(minOwnGoals);
      return (
        matchesName &&
        matchesPeladas &&
        matchesGoals &&
        matchesAssists &&
        matchesOwnGoals
      );
    });
  }, [stats, nameFilter, minPeladas, minGoals, minAssists, minOwnGoals]);

  const sortedStats = useMemo(() => {
    return [...filteredStats].sort((a, b) => {
      const valA = a[orderBy];
      const valB = b[orderBy];

      if (typeof valA === "string" && typeof valB === "string") {
        return order === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      const numA = valA as number;
      const numB = valB as number;

      if (numA < numB) {
        return order === "asc" ? -1 : 1;
      }
      if (numA > numB) {
        return order === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredStats, order, orderBy]);

  return {
    org,
    year,
    setYear,
    error,
    orderBy,
    order,
    sortedStats,
    handleRequestSort,
    // Filter states and setters
    nameFilter,
    setNameFilter,
    minPeladas,
    setMinPeladas,
    minGoals,
    setMinGoals,
    minAssists,
    setMinAssists,
    minOwnGoals,
    setMinOwnGoals,
  };
}
