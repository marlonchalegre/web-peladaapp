import { List, ListItem, ListItemText, Stack, IconButton, Tooltip, Paper } from '@mui/material'
import type { Dispatch, SetStateAction } from 'react'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople'
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred'
import type { Match, TeamPlayer, Player } from '../../../shared/api/endpoints'

export type ActionKey = { key: string; type: 'assist' | 'goal' | 'own_goal' } | null

type SelectMenuState = { teamId: number; forPlayerId?: number } | null

type Props = {
  match: Match
  finished: boolean
  homePlayers: TeamPlayer[]
  awayPlayers: TeamPlayer[]
  orgPlayerIdToUserId: Record<number, number>
  userIdToName: Record<number, string>
  benchPlayers: Player[]
  playersPerTeam?: number | null
  openAction: ActionKey
  setOpenAction: Dispatch<SetStateAction<ActionKey>>
  selectMenu: SelectMenuState
  setSelectMenu: Dispatch<SetStateAction<SelectMenuState>>
  updating: boolean
  recordEvent: (matchId: number, playerId: number, type: 'assist' | 'goal' | 'own_goal') => Promise<void>
  deleteEventAndRefresh: (matchId: number, playerId: number, type: 'assist' | 'goal' | 'own_goal') => Promise<void>
  adjustScore: (match: Match, team: 'home' | 'away', delta: 1 | -1) => Promise<void>
  assignPlayerToTeam: (teamId: number, playerId: number) => Promise<void>
  replacePlayerOnTeam: (teamId: number, outPlayerId: number, inPlayerId: number) => Promise<void>
}

export default function MatchDetails(props: Props) {
  const {
    match: m,
    finished,
    homePlayers,
    awayPlayers,
    orgPlayerIdToUserId,
    userIdToName,
    benchPlayers,
    playersPerTeam,
    openAction,
    setOpenAction,
    selectMenu,
    setSelectMenu,
    updating,
    recordEvent,
    deleteEventAndRefresh,
    adjustScore,
    assignPlayerToTeam,
    replacePlayerOnTeam,
  } = props

  function renderTeamList(teamId: number, players: TeamPlayer[], side: 'home' | 'away') {
    return (
      <List sx={{ mt: 1 }}>
        {players.map((tp) => {
          const userId = orgPlayerIdToUserId[tp.player_id]
          const name = userIdToName[userId] ?? `Player #${tp.player_id}`
          const actionKey = `${m.id}-${tp.player_id}`
          return (
            <ListItem key={`${side}-${tp.player_id}`} divider sx={{ gap: 1 }}>
              {side === 'home' ? (
                <>
                  <Tooltip title={`Assistência de ${name}`}>
                    <span>
                      <IconButton size="small" disabled={finished} onClick={(e) => { e.stopPropagation(); if (finished) return; setOpenAction((prev) => (prev && prev.key === actionKey && prev.type === 'assist') ? null : { key: actionKey, type: 'assist' }) }}>
                        <EmojiPeopleIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {openAction?.key === actionKey && openAction?.type === 'assist' && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton size="small" disabled={finished} onClick={async (e) => { e.stopPropagation(); if (finished) return; await deleteEventAndRefresh(m.id, tp.player_id, 'assist') }}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" disabled={finished} onClick={async (e) => { e.stopPropagation(); if (finished) return; await recordEvent(m.id, tp.player_id, 'assist') }}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
                  <Tooltip title={`Gol de ${name}`}>
                    <span>
                      <IconButton size="small" disabled={finished || updating} onClick={(e) => { e.stopPropagation(); setOpenAction((prev) => (prev && prev.key === actionKey && prev.type === 'goal') ? null : { key: actionKey, type: 'goal' }) }}>
                        <SportsSoccerIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {openAction?.key === actionKey && openAction?.type === 'goal' && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton size="small" disabled={finished || updating} onClick={async (e) => { e.stopPropagation(); if (finished) return; await deleteEventAndRefresh(m.id, tp.player_id, 'goal'); await adjustScore(m, 'home', -1) }}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" disabled={finished || updating} onClick={async (e) => { e.stopPropagation(); if (finished) return; await recordEvent(m.id, tp.player_id, 'goal'); await adjustScore(m, 'home', 1) }}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
                  <Tooltip title={`Gol contra de ${name}`}>
                    <span>
                      <IconButton size="small" disabled={finished || updating} onClick={(e) => { e.stopPropagation(); setOpenAction((prev) => (prev && prev.key === actionKey && prev.type === 'own_goal') ? null : { key: actionKey, type: 'own_goal' }) }}>
                        <ReportGmailerrorredIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {openAction?.key === actionKey && openAction?.type === 'own_goal' && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton size="small" disabled={finished || updating} onClick={async (e) => { e.stopPropagation(); if (finished) return; await deleteEventAndRefresh(m.id, tp.player_id, 'own_goal'); await adjustScore(m, 'away', -1) }}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" disabled={finished || updating} onClick={async (e) => { e.stopPropagation(); if (finished) return; await recordEvent(m.id, tp.player_id, 'own_goal'); await adjustScore(m, 'away', 1) }}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
                  <ListItemText sx={{ mx: 1 }} primaryTypographyProps={{ sx: { cursor: finished ? 'not-allowed' : 'pointer', opacity: finished ? 0.6 : 1 } }} onClick={(e) => { e.stopPropagation(); if (finished) return; setSelectMenu({ teamId, forPlayerId: tp.player_id }) }} primary={name} />
                </>
              ) : (
                <>
                  <ListItemText sx={{ mx: 1 }} primaryTypographyProps={{ sx: { cursor: finished ? 'not-allowed' : 'pointer', opacity: finished ? 0.6 : 1 } }} onClick={(e) => { e.stopPropagation(); if (finished) return; setSelectMenu({ teamId, forPlayerId: tp.player_id }) }} primary={name} />
                  <Tooltip title={`Assistência de ${name}`}>
                    <span>
                      <IconButton size="small" disabled={finished} onClick={(e) => { e.stopPropagation(); if (finished) return; setOpenAction((prev) => (prev && prev.key === actionKey && prev.type === 'assist') ? null : { key: actionKey, type: 'assist' }) }}>
                        <EmojiPeopleIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {openAction?.key === actionKey && openAction?.type === 'assist' && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton size="small" disabled={finished} onClick={async (e) => { e.stopPropagation(); if (finished) return; await deleteEventAndRefresh(m.id, tp.player_id, 'assist') }}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" disabled={finished} onClick={async (e) => { e.stopPropagation(); if (finished) return; await recordEvent(m.id, tp.player_id, 'assist') }}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
                  <Tooltip title={`Gol de ${name}`}>
                    <span>
                      <IconButton size="small" disabled={finished || updating} onClick={(e) => { e.stopPropagation(); setOpenAction((prev) => (prev && prev.key === actionKey && prev.type === 'goal') ? null : { key: actionKey, type: 'goal' }) }}>
                        <SportsSoccerIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {openAction?.key === actionKey && openAction?.type === 'goal' && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton size="small" disabled={finished || updating} onClick={async (e) => { e.stopPropagation(); if (finished) return; await deleteEventAndRefresh(m.id, tp.player_id, 'goal'); await adjustScore(m, 'away', -1) }}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" disabled={finished || updating} onClick={async (e) => { e.stopPropagation(); if (finished) return; await recordEvent(m.id, tp.player_id, 'goal'); await adjustScore(m, 'away', 1) }}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
                  <Tooltip title={`Gol contra de ${name}`}>
                    <span>
                      <IconButton size="small" disabled={finished || updating} onClick={(e) => { e.stopPropagation(); setOpenAction((prev) => (prev && prev.key === actionKey && prev.type === 'own_goal') ? null : { key: actionKey, type: 'own_goal' }) }}>
                        <ReportGmailerrorredIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {openAction?.key === actionKey && openAction?.type === 'own_goal' && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton size="small" disabled={finished || updating} onClick={async (e) => { e.stopPropagation(); if (finished) return; await deleteEventAndRefresh(m.id, tp.player_id, 'own_goal'); await adjustScore(m, 'home', -1) }}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" disabled={finished || updating} onClick={async (e) => { e.stopPropagation(); if (finished) return; await recordEvent(m.id, tp.player_id, 'own_goal'); await adjustScore(m, 'home', 1) }}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
                </>
              )}
              {selectMenu?.teamId === teamId && selectMenu?.forPlayerId === tp.player_id && (
                <Paper sx={{ position: 'relative', zIndex: 1, p: 1 }}>
                  <Stack>
                    {benchPlayers.map((p) => (
                      <IconButton key={`sel-${side}-${p.id}`} disabled={finished} onClick={async (e) => { e.stopPropagation(); if (finished) return; await replacePlayerOnTeam(teamId, tp.player_id, p.id) }}>
                        <ListItemText primary={(userIdToName[p.user_id] ?? `Player #${p.id}`)} />
                      </IconButton>
                    ))}
                    <IconButton onClick={(e) => { e.stopPropagation(); setSelectMenu(null) }}>
                      <ListItemText primary="Cancelar" />
                    </IconButton>
                  </Stack>
                </Paper>
              )}
            </ListItem>
          )
        })}
        {(() => {
          const maxSlots = typeof playersPerTeam === 'number' ? Math.max(playersPerTeam || 0, 0) : 0
          const empty = Math.max(0, maxSlots - players.length)
          return Array.from({ length: empty }).map((_, idx) => (
            <ListItem key={`${side}-empty-${idx}`} sx={{ gap: 1, color: '#888' }}>
              {side === 'home' ? (
                <>
                  <IconButton size="small" disabled={finished} onClick={(e) => { e.stopPropagation(); if (finished) return; setSelectMenu({ teamId }) }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                  <ListItemText primaryTypographyProps={{ sx: { cursor: finished ? 'not-allowed' : 'pointer', opacity: finished ? 0.6 : 1 } }} onClick={(e) => { e.stopPropagation(); if (finished) return; setSelectMenu({ teamId }) }} primary="Vazio" />
                </>
              ) : (
                <>
                  <ListItemText primaryTypographyProps={{ sx: { cursor: finished ? 'not-allowed' : 'pointer', opacity: finished ? 0.6 : 1 } }} onClick={(e) => { e.stopPropagation(); if (finished) return; setSelectMenu({ teamId }) }} primary="Vazio" />
                  <IconButton size="small" disabled={finished} onClick={(e) => { e.stopPropagation(); if (finished) return; setSelectMenu({ teamId }) }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </>
              )}
              {selectMenu?.teamId === teamId && !selectMenu?.forPlayerId && (
                <Paper sx={{ position: 'relative', zIndex: 1, p: 1 }}>
                  <Stack>
                    {benchPlayers.map((p) => (
                      <IconButton key={`add-${side}-${p.id}`} disabled={finished} onClick={async (e) => { e.stopPropagation(); if (finished) return; await assignPlayerToTeam(teamId, p.id) }}>
                        <ListItemText primary={(userIdToName[p.user_id] ?? `Player #${p.id}`)} />
                      </IconButton>
                    ))}
                    <IconButton onClick={(e) => { e.stopPropagation(); setSelectMenu(null) }}>
                      <ListItemText primary="Cancelar" />
                    </IconButton>
                  </Stack>
                </Paper>
              )}
            </ListItem>
          ))
        })()}
      </List>
    )
  }

  return (
    <Paper sx={{ p: 2, m: 1 }}>
      <Stack direction="row" spacing={3}>
        <div style={{ flex: 1 }}>{renderTeamList(m.home_team_id, homePlayers, 'home')}</div>
        <div style={{ flex: 1 }}>{renderTeamList(m.away_team_id, awayPlayers, 'away')}</div>
      </Stack>
    </Paper>
  )
}
