import { Paper, Typography, Box, Stack, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { Dispatch, SetStateAction } from 'react'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz' // For substitution icon
import type { Match, TeamPlayer, Player } from '../../../shared/api/endpoints'

// Reusing types from MatchDetails if possible, or redefining locally if simple
export type ActionKey = { key: string; type: 'assist' | 'goal' | 'own_goal' } | null
type SelectMenuState = { teamId: number; forPlayerId?: number } | null

type Props = {
  match: Match
  homeTeamName: string
  awayTeamName: string
  homePlayers: TeamPlayer[]
  awayPlayers: TeamPlayer[]
  orgPlayerIdToUserId: Record<number, number>
  userIdToName: Record<number, string>
  statsMap: Record<number, { goals: number; assists: number; ownGoals: number }>
  benchPlayers: Player[]
  finished: boolean
  updating: boolean
  selectMenu: SelectMenuState
  setSelectMenu: Dispatch<SetStateAction<SelectMenuState>>
  // Actions
  recordEvent: (matchId: number, playerId: number, type: 'assist' | 'goal' | 'own_goal') => Promise<void>
  deleteEventAndRefresh: (matchId: number, playerId: number, type: 'assist' | 'goal' | 'own_goal') => Promise<void>
  adjustScore: (match: Match, team: 'home' | 'away', delta: 1 | -1) => Promise<void>
  replacePlayerOnTeam: (teamId: number, outPlayerId: number, inPlayerId: number) => Promise<void>
}

export default function ActiveMatchDashboard(props: Props) {
  const {
    match,
    homeTeamName,
    awayTeamName,
    homePlayers,
    awayPlayers,
    orgPlayerIdToUserId,
    userIdToName,
    statsMap,
    benchPlayers,
    finished,
    updating,
    selectMenu,
    setSelectMenu,
    recordEvent,
    deleteEventAndRefresh,
    adjustScore,
    replacePlayerOnTeam,
  } = props

  // Combine players for the list? Or show two sections?
  // The design shows a single list. Let's try to combine but maybe indicate team.
  // Actually, for a single match view, usually you want to see both teams.
  // I'll render a single table with a "Team" column or just grouping.
  // Let's group by team in the table to be clear.

  const allPlayersInMatch = [
    ...homePlayers.map(p => ({ ...p, side: 'home' as const, teamId: match.home_team_id })),
    ...awayPlayers.map(p => ({ ...p, side: 'away' as const, teamId: match.away_team_id }))
  ]

  const getPlayerName = (pid: number) => {
    const uid = orgPlayerIdToUserId[pid]
    return (uid && userIdToName[uid]) ? userIdToName[uid] : `Player #${pid}`
  }

  // Handle substitution selection
  const handleSubClick = (teamId: number, playerId: number) => {
    if (finished) return
    if (selectMenu?.teamId === teamId && selectMenu?.forPlayerId === playerId) {
      setSelectMenu(null)
    } else {
      setSelectMenu({ teamId, forPlayerId: playerId })
    }
  }

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      {/* Header / Scoreboard */}
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2, border: 'none' }}>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>Seq {match.sequence}: {homeTeamName}</Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1, px: 4 }}>
          <Typography variant="h5" fontWeight="bold">{homeTeamName}</Typography>
          <Typography variant="h3" fontWeight="bold">
            {match.home_score ?? 0} x {match.away_score ?? 0}
          </Typography>
          <Typography variant="h5" fontWeight="bold">{awayTeamName}</Typography>
        </Stack>
      </Paper>

      {/* Player Data Entry */}
      <Paper variant="outlined" sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ p: 2, pb: 1 }}>Player Data Entry</Typography>
        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell align="center">Sub</TableCell>
                <TableCell align="center">Gols</TableCell>
                <TableCell align="center">Assistências</TableCell>
                <TableCell align="center">Gols Contra</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allPlayersInMatch.map((tp) => {
                const stats = statsMap[tp.player_id] || { goals: 0, assists: 0, ownGoals: 0 }
                const isSubMenuOpen = selectMenu?.teamId === tp.teamId && selectMenu?.forPlayerId === tp.player_id
                
                return (
                  <TableRow key={`${tp.side}-${tp.player_id}`} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 4, height: 24, bgcolor: tp.side === 'home' ? 'primary.main' : 'secondary.main', borderRadius: 1 }} />
                        <Typography variant="body2">{getPlayerName(tp.player_id)}</Typography>
                      </Stack>
                      {/* Sub Menu Overlay or Inline */}
                      {isSubMenuOpen && (
                        <Paper elevation={3} sx={{ position: 'absolute', zIndex: 10, mt: 1, p: 1, maxHeight: 200, overflow: 'auto' }}>
                           <Typography variant="caption" display="block" sx={{ mb: 1 }}>Substituir por:</Typography>
                           {benchPlayers.map(bp => (
                             <Box 
                               key={bp.id} 
                               sx={{ p: 0.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                               onClick={() => replacePlayerOnTeam(tp.teamId, tp.player_id, bp.id)}
                             >
                               {getPlayerName(bp.id)}
                             </Box>
                           ))}
                           <Box sx={{ p: 0.5, cursor: 'pointer', color: 'error.main', mt: 1 }} onClick={() => setSelectMenu(null)}>Cancelar</Box>
                        </Paper>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleSubClick(tp.teamId, tp.player_id)} disabled={finished}>
                        <SwapHorizIcon color={isSubMenuOpen ? 'primary' : 'inherit'} />
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                        <Typography sx={{ minWidth: 20, textAlign: 'center' }}>{stats.goals}</Typography>
                        {!finished && (
                            <Stack direction="column">
                                <IconButton size="small" sx={{ p: 0.2 }} disabled={updating} onClick={async () => { await recordEvent(match.id, tp.player_id, 'goal'); await adjustScore(match, tp.side, 1) }}>
                                    <AddIcon fontSize="inherit" />
                                </IconButton>
                                <IconButton size="small" sx={{ p: 0.2 }} disabled={updating || stats.goals <= 0} onClick={async () => { await deleteEventAndRefresh(match.id, tp.player_id, 'goal'); await adjustScore(match, tp.side, -1) }}>
                                    <RemoveIcon fontSize="inherit" />
                                </IconButton>
                            </Stack>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                        <Typography sx={{ minWidth: 20, textAlign: 'center' }}>{stats.assists}</Typography>
                        {!finished && (
                            <Stack direction="column">
                                <IconButton size="small" sx={{ p: 0.2 }} disabled={updating} onClick={() => recordEvent(match.id, tp.player_id, 'assist')}>
                                    <AddIcon fontSize="inherit" />
                                </IconButton>
                                <IconButton size="small" sx={{ p: 0.2 }} disabled={updating || stats.assists <= 0} onClick={() => deleteEventAndRefresh(match.id, tp.player_id, 'assist')}>
                                    <RemoveIcon fontSize="inherit" />
                                </IconButton>
                            </Stack>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                        <Typography sx={{ minWidth: 20, textAlign: 'center' }}>{stats.ownGoals}</Typography>
                        {!finished && (
                            <Stack direction="column">
                                <IconButton size="small" sx={{ p: 0.2 }} disabled={updating} onClick={async () => { await recordEvent(match.id, tp.player_id, 'own_goal'); await adjustScore(match, tp.side === 'home' ? 'away' : 'home', 1) }}>
                                    <AddIcon fontSize="inherit" />
                                </IconButton>
                                <IconButton size="small" sx={{ p: 0.2 }} disabled={updating || stats.ownGoals <= 0} onClick={async () => { await deleteEventAndRefresh(match.id, tp.player_id, 'own_goal'); await adjustScore(match, tp.side === 'home' ? 'away' : 'home', -1) }}>
                                    <RemoveIcon fontSize="inherit" />
                                </IconButton>
                            </Stack>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  )
}
