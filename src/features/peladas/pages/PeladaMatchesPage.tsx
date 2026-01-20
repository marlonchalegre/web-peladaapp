import { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Paper,
  Button,
  Box,
  Stack,
  Typography,
  Alert,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid";
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
import StandingsPanel from "../components/StandingsPanel";
import PlayerStatsPanel, {
  type PlayerStatRow,
} from "../components/PlayerStatsPanel";
import ActiveMatchDashboard from "../components/ActiveMatchDashboard";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";

const endpoints = createApi(api);

type PlayerStatCounts = { goals: number; assists: number; ownGoals: number };

function aggregateStatsFromEvents(
  events: MatchEvent[],
): Record<number, PlayerStatCounts> {
  const counts: Record<number, PlayerStatCounts> = {};
  for (const evt of events) {
    const current = counts[evt.player_id] ?? {
      goals: 0,
      assists: 0,
      ownGoals: 0,
    };
    if (evt.event_type === "goal") current.goals += 1;
    else if (evt.event_type === "assist") current.assists += 1;
    else if (evt.event_type === "own_goal") current.ownGoals += 1;
    counts[evt.player_id] = current;
  }
  return counts;
}

function statsMapFromApi(
  stats: PlayerStats[] | null,
): Record<number, PlayerStatCounts> {
  const map: Record<number, PlayerStatCounts> = {};
  if (!stats) return map;
  for (const s of stats) {
    map[s.player_id] = {
      goals: s.goals,
      assists: s.assists,
      ownGoals: s.own_goals,
    };
  }
  return map;
}

function buildRowsFromStatMap(
  statMap: Record<number, PlayerStatCounts>,
  relMap: Record<number, number>,
  nameMap: Record<number, string>,
): PlayerStatRow[] {
  return Object.entries(statMap).map(([playerIdStr, counts]) => {
    const playerId = Number(playerIdStr);
    const userId = relMap[playerId];
    const name =
      userId !== undefined && nameMap[userId]
        ? nameMap[userId]
        : `Player #${playerId}`;
    return {
      playerId,
      name,
      goals: counts.goals,
      assists: counts.assists,
      ownGoals: counts.ownGoals,
    };
  });
}

export default function PeladaMatchesPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const peladaId = Number(id);
  const [matches, setMatches] = useState<Match[]>([]);
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
  const [closing, setClosing] = useState(false);

  // New state for selection
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  const [updatingScore, setUpdatingScore] = useState<Record<number, boolean>>(
    {},
  );
  const [statsMap, setStatsMap] = useState<Record<number, PlayerStatCounts>>(
    {},
  );
  const [statsRows, setStatsRows] = useState<PlayerStatRow[]>([]);
  const [loadedPeladaId, setLoadedPeladaId] = useState<number | null>(null);

  const [playerSort, setPlayerSort] = useState<{
    by: "default" | "goals" | "assists";
    dir: "asc" | "desc";
  }>({ by: "default", dir: "desc" });
  const [selectMenu, setSelectMenu] = useState<{
    teamId: number;
    forPlayerId?: number;
    type: "replace" | "add";
  } | null>(null);

  const teamNameById = useMemo(() => {
    const m: Record<number, string> = {};
    for (const t of teams) m[t.id] = t.name;
    return m;
  }, [teams]);

  const isPeladaClosed = (pelada?.status || "").toLowerCase() === "closed";

  useEffect(() => {
    if (!peladaId) return;
    if (loadedPeladaId === peladaId) return;
    setLoadedPeladaId(peladaId);
    setLoading(true);
    endpoints
      .getPeladaDashboardData(peladaId)
      .then((data) => {
        if (data.pelada.status === "attendance") {
          navigate(`/peladas/${peladaId}/attendance`);
          return;
        }

        setPelada(data.pelada);
        setMatches(data.matches);
        setTeams(data.teams);

        // Select first match if none selected
        if (data.matches.length > 0) {
          setSelectedMatchId((prev) => prev ?? data.matches[0].id);
        }

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

        let sm = statsMapFromApi(data.player_stats);
        if (Object.keys(sm).length === 0 && data.match_events.length > 0) {
          sm = aggregateStatsFromEvents(data.match_events);
        }
        setStatsMap(sm);
        setStatsRows(buildRowsFromStatMap(sm, relMap, nameMap));

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
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : t("peladas.matches.error.load_failed");
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [peladaId, loadedPeladaId, navigate, t]);

  const standings = useMemo(() => {
    const table: Record<
      number,
      {
        teamId: number;
        wins: number;
        draws: number;
        losses: number;
        goalsFor: number;
        name: string;
      }
    > = {};
    for (const t of teams)
      table[t.id] = {
        teamId: t.id,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        name: t.name,
      };
    for (const m of matches) {
      const hs = m.home_score ?? 0;
      const as = m.away_score ?? 0;
      if (!(m.home_team_id in table) || !(m.away_team_id in table)) continue;
      // Only consider finished matches for standings
      const isFinished = (m.status || "").toLowerCase() === "finished";
      if (!isFinished) continue;
      table[m.home_team_id].goalsFor += hs;
      table[m.away_team_id].goalsFor += as;
      if (hs === as) {
        table[m.home_team_id].draws += 1;
        table[m.away_team_id].draws += 1;
      } else if (hs > as) {
        table[m.home_team_id].wins += 1;
        table[m.away_team_id].losses += 1;
      } else {
        table[m.home_team_id].losses += 1;
        table[m.away_team_id].wins += 1;
      }
    }
    return Object.values(table).sort(
      (a, b) => b.wins - a.wins || b.draws - a.draws || b.goalsFor - a.goalsFor,
    );
  }, [teams, matches]);

  const playerStats = useMemo<PlayerStatRow[]>(() => {
    // Only players that are in this pelada: currently on some team OR have stats/events in this pelada
    const participatingIds = new Set<number>();
    for (const list of Object.values(teamPlayers)) {
      for (const tp of list || []) participatingIds.add(tp.player_id);
    }
    for (const pidStr of Object.keys(statsMap))
      participatingIds.add(Number(pidStr));

    // Calculate matches played for each player (only finished matches)
    const matchesPlayedMap: Record<number, number> = {};
    for (const m of matches) {
      if ((m.status || "").toLowerCase() !== "finished") continue;
      const lu = lineupsByMatch[m.id];
      if (!lu) continue;
      const playersInMatch = new Set<number>();
      for (const list of Object.values(lu)) {
        for (const tp of list) playersInMatch.add(tp.player_id);
      }
      for (const pid of playersInMatch) {
        matchesPlayedMap[pid] = (matchesPlayedMap[pid] || 0) + 1;
      }
    }

    const stats: PlayerStatRow[] = [];
    for (const playerId of participatingIds) {
      const userId = orgPlayerIdToUserId[playerId];
      const name =
        userId !== undefined && userIdToName[userId]
          ? userIdToName[userId]
          : `Player #${playerId}`;
      const base = statsMap[playerId];
      stats.push({
        playerId,
        name,
        goals: base?.goals || 0,
        assists: base?.assists || 0,
        ownGoals: base?.ownGoals || 0,
        matchesPlayed: matchesPlayedMap[playerId] || 0,
      });
    }
    // If stats computed above is empty but we have API rows, use them directly
    const arr =
      stats.length === 0 && statsRows.length > 0 ? statsRows.slice() : stats;
    const dirMul = playerSort.dir === "desc" ? -1 : 1;
    if (playerSort.by === "goals") {
      arr.sort((a, b) => {
        if (a.goals !== b.goals) return (a.goals - b.goals) * dirMul;
        if (a.assists !== b.assists) return (a.assists - b.assists) * -1; // prefer higher assists as tie-breaker
        return a.name.localeCompare(b.name);
      });
    } else if (playerSort.by === "assists") {
      arr.sort((a, b) => {
        if (a.assists !== b.assists) return (a.assists - b.assists) * dirMul;
        if (a.goals !== b.goals) return (a.goals - b.goals) * -1;
        return a.name.localeCompare(b.name);
      });
    } else {
      arr.sort(
        (a, b) =>
          b.goals + b.assists - b.ownGoals - (a.goals + a.assists - a.ownGoals),
      );
    }
    return arr;
  }, [
    statsMap,
    statsRows,
    teamPlayers,
    orgPlayerIdToUserId,
    userIdToName,
    playerSort,
    matches,
    lineupsByMatch,
  ]);

  function togglePlayerSort(by: "goals" | "assists") {
    setPlayerSort((prev) =>
      prev.by === by
        ? { by, dir: prev.dir === "desc" ? "asc" : "desc" }
        : { by, dir: "desc" },
    );
  }

  const allOrgPlayers = useMemo(
    () => Object.values(orgPlayerIdToPlayer),
    [orgPlayerIdToPlayer],
  );

  async function replacePlayerOnMatchTeam(
    matchId: number,
    teamId: number,
    outPlayerId: number,
    inPlayerId: number,
  ) {
    try {
      await endpoints.replaceMatchLineupPlayer(
        matchId,
        teamId,
        outPlayerId,
        inPlayerId,
      );
      await refreshStats();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.matches.error.replace_player_failed");
      setError(message);
    } finally {
      setSelectMenu(null);
    }
  }

  async function adjustScore(
    match: Match,
    team: "home" | "away",
    delta: 1 | -1 = 1,
  ) {
    const currentHome = match.home_score ?? 0;
    const currentAway = match.away_score ?? 0;
    const newHome = team === "home" ? currentHome + delta : currentHome;
    const newAway = team === "away" ? currentAway + delta : currentAway;
    if (newHome < 0 || newAway < 0) {
      setError(t("peladas.matches.error.negative_score"));
      throw new Error("NEGATIVE_SCORE");
    }
    const status = newHome + newAway > 0 ? "running" : "scheduled";
    setUpdatingScore((prev) => ({ ...prev, [match.id]: true }));
    try {
      await endpoints.updateMatchScore(match.id, newHome, newAway, status);
      setMatches((prev) =>
        prev.map((m) =>
          m.id === match.id
            ? {
                ...m,
                home_score: newHome,
                away_score: newAway,
                status: status === "scheduled" ? m.status : status,
              }
            : m,
        ),
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.matches.error.update_score_failed");
      setError(message);
      throw error;
    } finally {
      setUpdatingScore((prev) => ({ ...prev, [match.id]: false }));
    }
  }

  async function refreshStats() {
    if (!peladaId) return;
    try {
      const data = await endpoints.getPeladaDashboardData(peladaId); // Fetch all dashboard data again

      // Update matches and lineups to reflect potential lineup changes
      setMatches(data.matches);
      const luMap: Record<number, Record<number, TeamPlayer[]>> = {};
      for (const [midStr, teamPlayersGroup] of Object.entries(
        data.match_lineups_map || {},
      )) {
        const mid = Number(midStr);
        const asTeamPlayersForMatch: Record<number, TeamPlayer[]> = {};
        for (const [teamIdStr, arr] of Object.entries(teamPlayersGroup || {})) {
          asTeamPlayersForMatch[Number(teamIdStr)] = (arr || []).map((e) => ({
            team_id: e.team_id,
            player_id: e.player_id,
          }));
        }
        luMap[mid] = asTeamPlayersForMatch;
      }
      setLineupsByMatch(luMap);

      let sm = statsMapFromApi(data.player_stats);
      if (Object.keys(sm).length === 0 && data.match_events.length > 0) {
        sm = aggregateStatsFromEvents(data.match_events);
      }
      // Re-build relMap and nameMap from the fresh data for buildRowsFromStatMap
      const nameMap: Record<number, string> = {};
      for (const u of data.users) nameMap[u.id] = u.name;
      const relMap: Record<number, number> = {};
      for (const pl of data.organization_players) {
        relMap[pl.id] = pl.user_id;
      }

      setStatsMap(sm);
      setStatsRows(buildRowsFromStatMap(sm, relMap, nameMap));
    } catch (error: unknown) {
      // keep UI; show error once
      setError(
        (prev) =>
          prev ||
          (error instanceof Error
            ? error.message
            : t("peladas.matches.error.load_stats_failed")),
      );
    }
  }

  async function deleteEventAndRefresh(
    matchId: number,
    playerId: number,
    type: "assist" | "goal" | "own_goal",
  ) {
    await endpoints.deleteMatchEvent(matchId, playerId, type);
    await refreshStats();
  }

  async function recordEvent(
    matchId: number,
    playerId: number,
    type: "assist" | "goal" | "own_goal",
  ) {
    try {
      await endpoints.createMatchEvent(matchId, playerId, type);
      await refreshStats();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.matches.error.record_event_failed");
      setError(message);
    }
  }

  if (loading) return <Loading message={t("peladas.matches.loading")} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ mr: 2 }}>
          {t("peladas.matches.title", { id: peladaId })}
        </Typography>
        <Button component={RouterLink} to={`/peladas/${peladaId}`}>
          {t("common.back")}
        </Button>
        <Box sx={{ ml: "auto" }}>
          {isPeladaClosed ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              {t("peladas.matches.status.closed")}
            </Typography>
          ) : (
            <Button
              variant="contained"
              color="error"
              onClick={async () => {
                if (!peladaId || isPeladaClosed) return;
                setClosing(true);
                try {
                  await endpoints.closePelada(peladaId);
                  setPelada((prev) =>
                    prev ? { ...prev, status: "closed" } : null,
                  );
                } catch (error: unknown) {
                  const message =
                    error instanceof Error
                      ? error.message
                      : t("peladas.matches.error.close_failed");
                  setError(message);
                } finally {
                  setClosing(false);
                }
              }}
              disabled={closing}
            >
              {closing
                ? t("peladas.matches.button.closing")
                : t("peladas.matches.button.close_pelada")}
            </Button>
          )}
        </Box>
      </Stack>

      <Grid
        container
        spacing={3}
        sx={{ height: "calc(100vh - 150px)", minHeight: 600 }}
      >
        {/* Left Column: Match History Stream */}
        <Grid
          size={{ xs: 12, md: 2 }}
          sx={{
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            {t("peladas.matches.history_title")}
          </Typography>
          <Paper variant="outlined" sx={{ flex: 1, overflowY: "auto" }}>
            <List component="nav" disablePadding>
              {matches.length === 0 && (
                <ListItemText
                  sx={{ p: 2 }}
                  primary={t("peladas.matches.empty_history")}
                />
              )}
              {matches.map((m) => {
                const isSelected = m.id === selectedMatchId;
                return (
                  <Box key={m.id}>
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => setSelectedMatchId(m.id)}
                      sx={{
                        flexDirection: "column",
                        alignItems: "flex-start",
                        borderLeftWidth: isSelected ? 4 : 0,
                        borderLeftStyle: "solid",
                        borderLeftColor: "primary.main",
                        py: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {t("peladas.matches.history_item_title", {
                          sequence: m.sequence,
                          teamName: teamNameById[m.home_team_id] || "Time",
                        })}
                      </Typography>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        width="100%"
                        alignItems="center"
                        sx={{ mt: 1 }}
                      >
                        <Typography variant="body2" fontWeight="bold">
                          {teamNameById[m.home_team_id] ||
                            t("peladas.matches.team_fallback", {
                              id: m.home_team_id,
                            })}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ mx: 1 }}
                        >
                          {m.home_score ?? 0} x {m.away_score ?? 0}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {teamNameById[m.away_team_id] ||
                            t("peladas.matches.team_fallback", {
                              id: m.away_team_id,
                            })}
                        </Typography>
                      </Stack>
                    </ListItemButton>
                    <Divider />
                  </Box>
                );
              })}
            </List>
          </Paper>
        </Grid>

        {/* Center Column: Active Match Dashboard */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ height: "100%" }}>
          {selectedMatch ? (
            (() => {
              const lu = lineupsByMatch[selectedMatch.id] || {};
              const homePlayers =
                lu[selectedMatch.home_team_id] ||
                teamPlayers[selectedMatch.home_team_id] ||
                [];
              const awayPlayers =
                lu[selectedMatch.away_team_id] ||
                teamPlayers[selectedMatch.away_team_id] ||
                [];
              const lineupIds = new Set(
                [...(homePlayers || []), ...(awayPlayers || [])].map(
                  (p) => p.player_id,
                ),
              );
              const benchPlayers = allOrgPlayers.filter(
                (p) => !lineupIds.has(p.id),
              );
              const finished =
                (selectedMatch.status || "").toLowerCase() === "finished";

              return (
                <ActiveMatchDashboard
                  match={selectedMatch}
                  homeTeamName={
                    teamNameById[selectedMatch.home_team_id] ||
                    t("peladas.matches.team_fallback", {
                      id: selectedMatch.home_team_id,
                    })
                  }
                  awayTeamName={
                    teamNameById[selectedMatch.away_team_id] ||
                    t("peladas.matches.team_fallback", {
                      id: selectedMatch.away_team_id,
                    })
                  }
                  homePlayers={homePlayers}
                  awayPlayers={awayPlayers}
                  orgPlayerIdToUserId={orgPlayerIdToUserId}
                  userIdToName={userIdToName}
                  statsMap={statsMap}
                  benchPlayers={benchPlayers}
                  finished={finished || isPeladaClosed}
                  updating={!!updatingScore[selectedMatch.id]}
                  selectMenu={selectMenu}
                  setSelectMenu={setSelectMenu}
                  playersPerTeam={pelada?.players_per_team}
                  recordEvent={recordEvent}
                  deleteEventAndRefresh={deleteEventAndRefresh}
                  adjustScore={adjustScore}
                  replacePlayerOnTeam={(teamId, outId, inId) =>
                    replacePlayerOnMatchTeam(
                      selectedMatch.id,
                      teamId,
                      outId,
                      inId,
                    )
                  }
                  addPlayerToTeam={async (teamId, playerId) => {
                    try {
                      await endpoints.addMatchLineupPlayer(
                        selectedMatch.id,
                        teamId,
                        playerId,
                      );
                      await refreshStats();
                    } catch (error: unknown) {
                      const message =
                        error instanceof Error
                          ? error.message
                          : t("peladas.matches.error.add_player_failed");
                      setError(message);
                    } finally {
                      setSelectMenu(null);
                    }
                  }}
                  onEndMatch={async () => {
                    if (!window.confirm(t("peladas.matches.confirm_end_match")))
                      return;
                    setUpdatingScore((prev) => ({
                      ...prev,
                      [selectedMatch.id]: true,
                    }));
                    try {
                      await endpoints.updateMatchScore(
                        selectedMatch.id,
                        selectedMatch.home_score ?? 0,
                        selectedMatch.away_score ?? 0,
                        "finished",
                      );
                      setMatches((prev) =>
                        prev.map((m) =>
                          m.id === selectedMatch.id
                            ? { ...m, status: "finished" }
                            : m,
                        ),
                      );
                      await refreshStats();
                    } catch (error: unknown) {
                      const message =
                        error instanceof Error
                          ? error.message
                          : t("peladas.matches.error.end_match_failed");
                      setError(message);
                    } finally {
                      setUpdatingScore((prev) => ({
                        ...prev,
                        [selectedMatch.id]: false,
                      }));
                    }
                  }}
                />
              );
            })()
          ) : (
            <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h5" color="text.secondary">
                {t("peladas.matches.select_match_hint")}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Right Column: Session Insights */}
        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{ height: "100%", overflowY: "auto" }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            {t("peladas.matches.insights_title")}
          </Typography>
          <StandingsPanel standings={standings} />
          <PlayerStatsPanel
            playerStats={playerStats}
            onToggleSort={togglePlayerSort}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
