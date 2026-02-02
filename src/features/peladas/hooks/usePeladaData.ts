import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Match,
  type Team,
  type Pelada,
  type TeamPlayer,
  type Player,
  type MatchEvent,
  type PlayerStats,
} from "../../../shared/api/endpoints";

const endpoints = createApi(api);

export function usePeladaData(peladaId: number) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [matches, setMatches] = useState<Match[]>([]);
  const matchesRef = useRef<Match[]>([]);

  useEffect(() => {
    matchesRef.current = matches;
  }, [matches]);

  const [teams, setTeams] = useState<Team[]>([]);
  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<Record<number, TeamPlayer[]>>(
    {},
  );
  const [lineupsByMatch, setLineupsByMatch] = useState<
    Record<number, Record<number, TeamPlayer[]>>
  >({});
  const [orgPlayerIdToUserId, setOrgPlayerIdToUserId] = useState<
    Record<number, number>
  >({});
  const [userIdToName, setUserIdToName] = useState<Record<number, string>>({});
  const [orgPlayerIdToPlayer, setOrgPlayerIdToPlayer] = useState<
    Record<number, Player>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [playerStatsFromApi, setPlayerStatsFromApi] = useState<
    PlayerStats[] | null
  >(null);
  const [loadedPeladaId, setLoadedPeladaId] = useState<number | null>(null);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!peladaId) return;
      if (!isRefresh && loadedPeladaId === peladaId) return;

      if (!isRefresh) {
        setLoadedPeladaId(peladaId);
        setLoading(true);
      }

      try {
        const data = await endpoints.getPeladaDashboardData(peladaId);
        if (data.pelada.status === "attendance") {
          navigate(`/peladas/${peladaId}/attendance`);
          return;
        }

        setPelada(data.pelada);
        setMatches(data.matches);
        matchesRef.current = data.matches;
        setTeams(data.teams);
        setMatchEvents(data.match_events);
        setPlayerStatsFromApi(data.player_stats);

        const nameMap: Record<number, string> = {};
        for (const u of data.users) nameMap[u.id] = u.name;
        setUserIdToName(nameMap);

        const relMap: Record<number, number> = {};
        const playerMap: Record<number, Player> = {};
        for (const pl of data.organization_players || []) {
          relMap[pl.id] = pl.user_id;
          playerMap[pl.id] = pl;
        }
        setOrgPlayerIdToUserId(relMap);
        setOrgPlayerIdToPlayer(playerMap);

        const asTeamPlayers: Record<number, TeamPlayer[]> = {};
        for (const [teamIdStr, arr] of Object.entries(
          data.team_players_map || {},
        )) {
          asTeamPlayers[Number(teamIdStr)] = (arr || []).map((e) => ({
            team_id: e.team_id,
            player_id: e.player_id,
          }));
        }
        setTeamPlayers(asTeamPlayers);

        const luMap: Record<number, Record<number, TeamPlayer[]>> = {};
        for (const [midStr, teamPlayersGroup] of Object.entries(
          data.match_lineups_map || {},
        )) {
          const mid = Number(midStr);
          const asTeamPlayersForMatch: Record<number, TeamPlayer[]> = {};
          for (const [teamIdStr, arr] of Object.entries(
            teamPlayersGroup || {},
          )) {
            asTeamPlayersForMatch[Number(teamIdStr)] = (arr || []).map((e) => ({
              team_id: e.team_id,
              player_id: e.player_id,
            }));
          }
          luMap[mid] = asTeamPlayersForMatch;
        }
        setLineupsByMatch(luMap);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : t("peladas.matches.error.load_failed");
        setError(message);
      } finally {
        if (!isRefresh) setLoading(false);
      }
    },
    [peladaId, loadedPeladaId, navigate, t],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    setError,
    pelada,
    setPelada,
    matches,
    setMatches,
    matchesRef,
    teams,
    teamPlayers,
    lineupsByMatch,
    setLineupsByMatch,
    orgPlayerIdToUserId,
    userIdToName,
    orgPlayerIdToPlayer,
    matchEvents,
    setMatchEvents,
    playerStatsFromApi,
    refreshData: () => fetchData(true),
  };
}