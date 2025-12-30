import { Fragment, useEffect, useMemo, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Button, Box, Stack, Typography, Alert } from '@mui/material'
import Grid from '@mui/material/Grid'
import { api } from '../../../shared/api/client'
import { createApi, type Match, type Team, type Pelada, type TeamPlayer, type Player, type MatchEvent, type PlayerStats } from '../../../shared/api/endpoints'
import StandingsPanel from '../components/StandingsPanel'
import PlayerStatsPanel, { type PlayerStatRow } from '../components/PlayerStatsPanel'
import MatchDetails, { type ActionKey } from '../components/MatchDetails'

const endpoints = createApi(api)

type PlayerStatCounts = { goals: number; assists: number; ownGoals: number }

function aggregateStatsFromEvents(events: MatchEvent[]): Record<number, PlayerStatCounts> {
  const counts: Record<number, PlayerStatCounts> = {}
  for (const evt of events) {
    const current = counts[evt.player_id] ?? { goals: 0, assists: 0, ownGoals: 0 }
    if (evt.event_type === 'goal') current.goals += 1
    else if (evt.event_type === 'assist') current.assists += 1
    else if (evt.event_type === 'own_goal') current.ownGoals += 1
    counts[evt.player_id] = current
  }
  return counts
}

function statsMapFromApi(stats: PlayerStats[] | null): Record<number, PlayerStatCounts> {
  const map: Record<number, PlayerStatCounts> = {}
  if (!stats) return map
  for (const s of stats) {
    map[s.player_id] = { goals: s.goals, assists: s.assists, ownGoals: s.own_goals }
  }
  return map
}

function buildRowsFromStatMap(
  statMap: Record<number, PlayerStatCounts>,
  relMap: Record<number, number>,
  nameMap: Record<number, string>,
): PlayerStatRow[] {
  return Object.entries(statMap).map(([playerIdStr, counts]) => {
    const playerId = Number(playerIdStr)
    const userId = relMap[playerId]
    const name = (userId !== undefined && nameMap[userId]) ? nameMap[userId] : `Player #${playerId}`
    return { playerId, name, goals: counts.goals, assists: counts.assists, ownGoals: counts.ownGoals }
  })
}

export default function PeladaMatchesPage() {
  const { id } = useParams()
  const peladaId = Number(id)
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [pelada, setPelada] = useState<Pelada | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<Record<number, TeamPlayer[]>>({})
  const [lineupsByMatch, setLineupsByMatch] = useState<Record<number, Record<number, TeamPlayer[]>>>({})
  const [orgPlayerIdToUserId, setOrgPlayerIdToUserId] = useState<Record<number, number>>({})
  const [userIdToName, setUserIdToName] = useState<Record<number, string>>({})
  const [orgPlayerIdToPlayer, setOrgPlayerIdToPlayer] = useState<Record<number, Player>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const [exp, setExp] = useState<Set<number>>(() => new Set<number>())
  const [updatingScore, setUpdatingScore] = useState<Record<number, boolean>>({})
  const [statsMap, setStatsMap] = useState<Record<number, PlayerStatCounts>>({})
  const [statsRows, setStatsRows] = useState<PlayerStatRow[]>([])
  const [loadedPeladaId, setLoadedPeladaId] = useState<number | null>(null)
  const [openAction, setOpenAction] = useState<ActionKey>(null)
  const [playerSort, setPlayerSort] = useState<{ by: 'default' | 'goals' | 'assists'; dir: 'asc' | 'desc' }>({ by: 'default', dir: 'desc' })
  const [selectMenu, setSelectMenu] = useState<{ teamId: number; forPlayerId?: number } | null>(null)

  const teamNameById = useMemo(() => {
    const m: Record<number, string> = {}
    for (const t of teams) m[t.id] = t.name
    return m
  }, [teams])

  const isPeladaClosed = (pelada?.status || '').toLowerCase() === 'closed'

  useEffect(() => {
    if (!peladaId) return
    if (loadedPeladaId === peladaId) return
    setLoadedPeladaId(peladaId)
    setLoading(true)
    endpoints.getPeladaDashboardData(peladaId)
      .then((data) => {
        setPelada(data.pelada)
        setMatches(data.matches)
        setTeams(data.teams)

        const nameMap: Record<number, string> = {}
        for (const u of data.users) nameMap[u.id] = u.name
        setUserIdToName(nameMap)

        const relMap: Record<number, number> = {}
        const playerMap: Record<number, Player> = {}
        for (const pl of data.organization_players || []) { relMap[pl.id] = pl.user_id; playerMap[pl.id] = pl }
        setOrgPlayerIdToUserId(relMap)
        setOrgPlayerIdToPlayer(playerMap)

        let sm = statsMapFromApi(data.player_stats)
        if (Object.keys(sm).length === 0 && data.match_events.length > 0) {
          sm = aggregateStatsFromEvents(data.match_events)
        }
        setStatsMap(sm)
        setStatsRows(buildRowsFromStatMap(sm, relMap, nameMap))

        const asTeamPlayers: Record<number, TeamPlayer[]> = {}
        for (const [teamIdStr, arr] of Object.entries(data.team_players_map || {})) {
          asTeamPlayers[Number(teamIdStr)] = (arr || []).map((e) => ({ team_id: e.team_id, player_id: e.player_id }))
        }
        setTeamPlayers(asTeamPlayers)

        const luMap: Record<number, Record<number, TeamPlayer[]>> = {}
        for (const [midStr, teamPlayersGroup] of Object.entries(data.match_lineups_map || {})) {
          const mid = Number(midStr)
          const asTeamPlayersForMatch: Record<number, TeamPlayer[]> = {}
          for (const [teamIdStr, arr] of Object.entries(teamPlayersGroup || {})) {
            asTeamPlayersForMatch[Number(teamIdStr)] = (arr || []).map((e) => ({ team_id: e.team_id, player_id: e.player_id }))
          }
          luMap[mid] = asTeamPlayersForMatch
        }
        setLineupsByMatch(luMap)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Erro ao carregar partidas'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [peladaId, loadedPeladaId])

  function toggleExpand(matchId: number) {
    setExp((prev) => {
      const next = new Set(prev)
      if (next.has(matchId)) next.delete(matchId)
      else next.add(matchId)
      return next
    })
  }

  const standings = useMemo(() => {
    const table: Record<number, { teamId: number; wins: number; draws: number; losses: number; goalsFor: number; name: string }> = {}
    for (const t of teams) table[t.id] = { teamId: t.id, wins: 0, draws: 0, losses: 0, goalsFor: 0, name: t.name }
    for (const m of matches) {
      const hs = m.home_score ?? 0
      const as = m.away_score ?? 0
      if (!(m.home_team_id in table) || !(m.away_team_id in table)) continue
      // Only consider finished matches for standings
      const isFinished = ((m.status || '').toLowerCase() === 'finished')
      if (!isFinished) continue
      table[m.home_team_id].goalsFor += hs
      table[m.away_team_id].goalsFor += as
      if (hs === as) {
        table[m.home_team_id].draws += 1
        table[m.away_team_id].draws += 1
      } else if (hs > as) {
        table[m.home_team_id].wins += 1
        table[m.away_team_id].losses += 1
      } else {
        table[m.home_team_id].losses += 1
        table[m.away_team_id].wins += 1
      }
    }
    return Object.values(table).sort((a, b) =>
      (b.wins - a.wins) || (b.draws - a.draws) || (b.goalsFor - a.goalsFor)
    )
  }, [teams, matches])

  const playerStats = useMemo<PlayerStatRow[]>(() => {
    // Only players that are in this pelada: currently on some team OR have stats/events in this pelada
    const participatingIds = new Set<number>()
    for (const list of Object.values(teamPlayers)) {
      for (const tp of list || []) participatingIds.add(tp.player_id)
    }
    for (const pidStr of Object.keys(statsMap)) participatingIds.add(Number(pidStr))

    const stats: PlayerStatRow[] = []
    for (const playerId of participatingIds) {
      const userId = orgPlayerIdToUserId[playerId]
      const name = (userId !== undefined && userIdToName[userId]) ? userIdToName[userId] : `Player #${playerId}`
      const base = statsMap[playerId]
      stats.push({ playerId, name, goals: base?.goals || 0, assists: base?.assists || 0, ownGoals: base?.ownGoals || 0 })
    }
    // If stats computed above is empty but we have API rows, use them directly
    const arr = (stats.length === 0 && statsRows.length > 0) ? statsRows.slice() : stats
    const dirMul = playerSort.dir === 'desc' ? -1 : 1
    if (playerSort.by === 'goals') {
      arr.sort((a, b) => {
        if (a.goals !== b.goals) return (a.goals - b.goals) * dirMul
        if (a.assists !== b.assists) return (a.assists - b.assists) * -1 // prefer higher assists as tie-breaker
        return a.name.localeCompare(b.name)
      })
    } else if (playerSort.by === 'assists') {
      arr.sort((a, b) => {
        if (a.assists !== b.assists) return (a.assists - b.assists) * dirMul
        if (a.goals !== b.goals) return (a.goals - b.goals) * -1
        return a.name.localeCompare(b.name)
      })
    } else {
      arr.sort((a, b) => (b.goals + b.assists - b.ownGoals) - (a.goals + a.assists - a.ownGoals))
    }
    return arr
  }, [statsMap, statsRows, teamPlayers, orgPlayerIdToUserId, userIdToName, playerSort])

  function togglePlayerSort(by: 'goals' | 'assists') {
    setPlayerSort((prev) =>
      prev.by === by ? { by, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { by, dir: 'desc' }
    )
  }

  const allOrgPlayers = useMemo(() => Object.values(orgPlayerIdToPlayer), [orgPlayerIdToPlayer])

  async function assignPlayerToMatchTeam(matchId: number, teamId: number, playerId: number) {
    try {
      await endpoints.addMatchLineupPlayer(matchId, teamId, playerId)
      await refreshStats() 
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao adicionar jogador na partida'
      setError(message)
    } finally {
      setSelectMenu(null)
    }
  }

  async function replacePlayerOnMatchTeam(matchId: number, teamId: number, outPlayerId: number, inPlayerId: number) {
    try {
      await endpoints.replaceMatchLineupPlayer(matchId, teamId, outPlayerId, inPlayerId)
      await refreshStats()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao trocar jogador na partida'
      setError(message)
    } finally {
      setSelectMenu(null)
    }
  }

  async function adjustScore(match: Match, team: 'home' | 'away', delta: 1 | -1 = 1) {
    const currentHome = match.home_score ?? 0
    const currentAway = match.away_score ?? 0
    const newHome = team === 'home' ? currentHome + delta : currentHome
    const newAway = team === 'away' ? currentAway + delta : currentAway
    if (newHome < 0 || newAway < 0) {
      setError('Placar não pode ficar negativo')
      throw new Error('NEGATIVE_SCORE')
    }
    const status = (newHome + newAway) > 0 ? 'running' : 'scheduled'
    setUpdatingScore((prev) => ({ ...prev, [match.id]: true }))
    try {
      await endpoints.updateMatchScore(match.id, newHome, newAway, status)
      setMatches((prev) => prev.map((m) => (m.id === match.id ? { ...m, home_score: newHome, away_score: newAway, status: status === 'scheduled' ? m.status : status } : m)))
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar placar'
      setError(message)
      throw error
    } finally {
      setUpdatingScore((prev) => ({ ...prev, [match.id]: false }))
    }
  }

  async function finishMatch(match: Match) {
    try {
      await endpoints.updateMatchScore(match.id, match.home_score, match.away_score, 'finished')
      setMatches((prev) => prev.map((m) => (m.id === match.id ? { ...m, status: 'finished' } : m)))
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao finalizar partida'
      setError(message)
    }
  }

  async function refreshStats() {
    if (!peladaId) return
    try {
      const data = await endpoints.getPeladaDashboardData(peladaId) // Fetch all dashboard data again
      let sm = statsMapFromApi(data.player_stats)
      if (Object.keys(sm).length === 0 && data.match_events.length > 0) {
        sm = aggregateStatsFromEvents(data.match_events)
      }
      // Re-build relMap and nameMap from the fresh data for buildRowsFromStatMap
      const nameMap: Record<number, string> = {}
      for (const u of data.users) nameMap[u.id] = u.name
      const relMap: Record<number, number> = {}
      for (const pl of data.organization_players) { relMap[pl.id] = pl.user_id }

      setStatsMap(sm)
      setStatsRows(buildRowsFromStatMap(sm, relMap, nameMap))
    } catch (error: unknown) {
      // keep UI; show error once
      setError((prev) => prev || (error instanceof Error ? error.message : 'Erro ao carregar estatísticas'))
    }
  }

  async function deleteEventAndRefresh(matchId: number, playerId: number, type: 'assist' | 'goal' | 'own_goal') {
    await endpoints.deleteMatchEvent(matchId, playerId, type)
    await refreshStats()
  }

  async function recordEvent(matchId: number, playerId: number, type: 'assist' | 'goal' | 'own_goal') {
    try {
      await endpoints.createMatchEvent(matchId, playerId, type)
      await refreshStats()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao registrar evento'
      setError(message)
    }
  }

  if (loading) return <Typography>Carregando partidas...</Typography>
  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <div>
      <Typography variant="h4" gutterBottom>Partidas da Pelada #{peladaId}</Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button component={RouterLink} to={`/peladas/${peladaId}`}>Voltar para a pelada</Button>
        <Box sx={{ ml: 'auto' }}>
          {isPeladaClosed ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>Pelada encerrada</Typography>
          ) : (
            <Button variant="contained" color="error"
              onClick={async () => {
                if (!peladaId || isPeladaClosed) return
                setClosing(true)
                try {
                  await endpoints.closePelada(peladaId)
                  const [updatedPelada, updatedMatches] = await Promise.all([
                    endpoints.getPelada(peladaId),
                    endpoints.listMatchesByPelada(peladaId),
                  ])
                  setPelada(updatedPelada)
                  setMatches(updatedMatches)
                  setExp(new Set())
                } catch (error: unknown) {
                  const message = error instanceof Error ? error.message : 'Erro ao encerrar pelada'
                  setError(message)
                } finally {
                  setClosing(false)
                }
              }}
              disabled={closing}
            >{closing ? 'Encerrando...' : 'Encerrar pelada'}</Button>
          )}
        </Box>
      </Stack>
      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={{ xs: 12, md: 8 }}>
          {matches.length === 0 ? (
            <Typography>Nenhuma partida agendada.</Typography>
          ) : (
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Seq</TableCell>
                      <TableCell>Mandante</TableCell>
                      <TableCell>Placar</TableCell>
                      <TableCell>Visitante</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matches.map((m) => {
                      const expanded = exp.has(m.id)
                      const lu = lineupsByMatch[m.id] || {}
                      const homePlayers = lu[m.home_team_id] || teamPlayers[m.home_team_id] || []
                      const awayPlayers = lu[m.away_team_id] || teamPlayers[m.away_team_id] || []
                      const lineupIds = new Set([...(homePlayers || []), ...(awayPlayers || [])].map(p => p.player_id))
                      const benchPlayers = allOrgPlayers.filter((p) => !lineupIds.has(p.id))
                      const finished = (m.status || '').toLowerCase() === 'finished'
                      return (
                        <Fragment key={m.id}>
                          <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => toggleExpand(m.id)}>
                            <TableCell>{m.sequence}</TableCell>
                            <TableCell>{teamNameById[m.home_team_id] || `Time ${m.home_team_id}`}</TableCell>
                            <TableCell>{(m.home_score ?? 0)} x {(m.away_score ?? 0)}</TableCell>
                            <TableCell>{teamNameById[m.away_team_id] || `Time ${m.away_team_id}`}</TableCell>
                          </TableRow>
                          {expanded && (
                            <TableRow key={`expanded-${m.id}`}>
                              <TableCell colSpan={4} sx={{ p: 0 }}>
                                <Box sx={{ m: 1 }}>
                                  {!isPeladaClosed && (
                                    <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mb: 1 }}>
                                      <Button variant="contained" size="small" onClick={(e) => { e.stopPropagation(); finishMatch(m) }} disabled={finished}>
                                        {finished ? 'Finalizada' : 'Finalizar partida'}
                                      </Button>
                                    </Stack>
                                  )}
                                  <MatchDetails
                                    match={m}
                                    finished={finished}
                                    homePlayers={homePlayers}
                                    awayPlayers={awayPlayers}
                                    orgPlayerIdToUserId={orgPlayerIdToUserId}
                                    userIdToName={userIdToName}
                                    benchPlayers={benchPlayers}
                                    playersPerTeam={pelada?.players_per_team}
                                    openAction={openAction}
                                    setOpenAction={setOpenAction}
                                    selectMenu={selectMenu}
                                    setSelectMenu={setSelectMenu}
                                    updating={!!updatingScore[m.id]}
                                    recordEvent={recordEvent}
                                    deleteEventAndRefresh={deleteEventAndRefresh}
                                    adjustScore={adjustScore}
                                    assignPlayerToTeam={(teamId, playerId) => assignPlayerToMatchTeam(m.id, teamId, playerId)}
                                    replacePlayerOnTeam={(teamId, outId, inId) => replacePlayerOnMatchTeam(m.id, teamId, outId, inId)}
                                  />
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StandingsPanel standings={standings} />
          <PlayerStatsPanel playerStats={playerStats} playerSort={playerSort} onToggleSort={togglePlayerSort} />
        </Grid>
      </Grid>
    </div>
  )
}
