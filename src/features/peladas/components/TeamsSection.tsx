import { useState, useEffect, useMemo } from 'react'
import type { DragEvent } from 'react'
import { Button, Paper, Typography, Stack } from '@mui/material'
import Grid from '@mui/material/Grid'
import type { Player, Team, NormalizedScoresResponse, User } from '../../../shared/api/endpoints' // Removed TeamPlayer, added User
import { api } from '../../../shared/api/client'

// Define a type for players that include user info
type PlayerWithUser = Player & { user: User }

export type TeamsSectionProps = {
  teams: Team[]
  teamPlayers: Record<number, PlayerWithUser[]> // Updated type
  playersPerTeam?: number | null
  benchPlayers: PlayerWithUser[] // Updated type
  creatingTeam: boolean
  locked?: boolean
  onCreateTeam: (name: string) => Promise<void>
  onDeleteTeam: (teamId: number) => Promise<void>
  onDragStartPlayer: (e: DragEvent<HTMLElement>, playerId: number, sourceTeamId: number | null) => void
  dropToBench: (e: DragEvent<HTMLElement>) => Promise<void>
  dropToTeam: (e: DragEvent<HTMLElement>, targetTeamId: number) => Promise<void>
  movePlayer: (playerId: number, sourceTeamId: number | null, targetTeamId: number | null) => Promise<void>
  onRandomizeTeams: () => Promise<void>
  menu: { playerId: number; sourceTeamId: number | null } | null
  setMenu: (v: { playerId: number; sourceTeamId: number | null } | null) => void
}

export default function TeamsSection(props: TeamsSectionProps) {
  const {
    teams,
    teamPlayers,
    playersPerTeam,
    benchPlayers,
    creatingTeam,
    locked = false,
    onCreateTeam,
    onDeleteTeam,
    onDragStartPlayer,
    dropToBench,
    dropToTeam,
    movePlayer,
    onRandomizeTeams,
    menu,
    setMenu,
  } = props
  const [filling, setFilling] = useState(false)
  const [fetchedScores, setFetchedScores] = useState<Record<number, number>>({})

  const playerIdsStr = useMemo(() => {
    const ids = new Set<number>()
    benchPlayers.forEach((p) => ids.add(p.id))
    Object.values(teamPlayers).flat().forEach((p) => ids.add(p.id)) // Changed tp.player_id to p.id
    return Array.from(ids).sort().join(',')
  }, [benchPlayers, teamPlayers])

  useEffect(() => {
    if (!playerIdsStr) return
    const ids = playerIdsStr.split(',').map(Number)
    // Only fetch scores if there are actual players
    if (ids.length > 0) {
      api.post<NormalizedScoresResponse>('/api/scores/normalized', { player_ids: ids })
        .then((res) => {
          if (res.scores) setFetchedScores(res.scores)
        })
        .catch((err) => console.error('Error fetching scores:', err))
    }
  }, [playerIdsStr])

  const effectiveScores = fetchedScores

  const maxSlots = typeof playersPerTeam === 'number' ? Math.max(playersPerTeam, 0) : 0
  const openSlots = teams.reduce((sum, t) => sum + Math.max(0, maxSlots - ((teamPlayers[t.id] || []).length)), 0)
  const disabled = filling || maxSlots <= 0 || openSlots === 0 || benchPlayers.length === 0

  async function randomFillTeams() {
    if (disabled) return
    setFilling(true)
    try {
      await onRandomizeTeams()
    } finally {
      setFilling(false)
    }
  }

  return (
    <section>
      <Typography variant="h5" gutterBottom>Times</Typography>
      {!locked && (
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button variant="contained" onClick={async () => { await onCreateTeam(`Time ${teams.length + 1}`) }} disabled={creatingTeam}>
            {creatingTeam ? 'Criando...' : 'Criar time'}
          </Button>
          <Button variant="outlined" onClick={randomFillTeams} disabled={disabled}>
            {filling ? 'Preenchendo...' : 'Preencher times aleatoriamente'}
          </Button>
        </Stack>
      )}
      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={12}>
          <Grid container spacing={3} alignItems="stretch">
            {teams.map((t) => (
              <Grid key={t.id} size={{ xs: 12, sm: 6, md: 6, lg: 4, xl: 3 }} sx={{ display: 'flex' }}>
            <Paper elevation={1}
              onDragOver={locked ? undefined : (e) => e.preventDefault()}
              onDragEnter={locked ? undefined : (e) => (e.currentTarget.classList.add('droppable--over'))}
              onDragLeave={locked ? undefined : (e) => (e.currentTarget.classList.remove('droppable--over'))}
              onDrop={locked ? undefined : async (e) => {
                e.preventDefault()
                e.stopPropagation()
                const target = e.currentTarget
                try {
                  await dropToTeam(e, t.id)
                } finally {
                  target.classList.remove('droppable--over')
                }
              }}
              className={locked ? undefined : 'droppable'}
              role="listbox"
              aria-label={`Time ${t.name}`}
              sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <Typography variant="h6" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {t.name}
                  {(() => {
                    const tps = teamPlayers[t.id] || []
                    const vals = tps.map(p => (typeof effectiveScores[p.id] === 'number' ? effectiveScores[p.id] : p.grade)).filter((g): g is number => typeof g === 'number')
                    if (!vals.length) return null
                    const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                    return <span style={{ marginLeft: 8, color: '#666', fontWeight: 400 }}>(média {avg})</span>
                  })()}
                </span>
                {!locked && (
                  <Button size="small" color="error" onClick={() => onDeleteTeam(t.id)}>Excluir</Button>
                )}
              </Typography>
            <ul style={{ padding: 0, listStyle: 'none' }}>
              {(teamPlayers[t.id] || []).map((p) => ( // Changed tp to p
                <Paper
                  key={`${t.id}-${p.id}`} // Changed tp.player_id to p.id
                  component="li"
                  draggable={!locked}
                  onDragStart={locked ? undefined : (e) => onDragStartPlayer(e, p.id, t.id)} // Changed tp.player_id to p.id
                  tabIndex={0}
                  variant="outlined"
                  sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center' }}
                >
                {(() => {
                  const name = p.user?.name ?? `Player #${p.id}` // Access user.name directly
                  const score = effectiveScores[p.id]
                  const grade = p.grade
                  const val = (typeof score === 'number') ? score.toFixed(1) : (grade != null ? String(grade) : null)
                  return val ? `${name} (${val})` : name
                })()}
                  {!locked && (
                    <Button size="small" variant="text" className="inline-form" sx={{ ml: 1 }} aria-haspopup="menu" aria-expanded={menu?.playerId === p.id && menu?.sourceTeamId === t.id} onClick={() => setMenu({ playerId: p.id, sourceTeamId: t.id })}>Mover</Button> // Changed tp.player_id to p.id
                  )}
                  {!locked && menu?.playerId === p.id && menu?.sourceTeamId === t.id && ( // Changed tp.player_id to p.id
                    <Paper role="menu" aria-label={`Mover jogador #${p.id}`} sx={{ mt: 1, p: 1 }}>
                      <Stack className="stack">
                        <Button role="menuitem" onClick={() => movePlayer(p.id, t.id, null)}>Para banco</Button> // Changed tp.player_id to p.id
                        {teams.filter((x) => x.id !== t.id).map((tgt) => (
                          <Button key={tgt.id} role="menuitem" onClick={() => movePlayer(p.id, t.id, tgt.id)}>Para {tgt.name}</Button> // Changed tp.player_id to p.id
                        ))}
                        <Button role="menuitem" onClick={() => setMenu(null)}>Cancelar</Button>
                      </Stack>
                    </Paper>
                  )}
                </Paper>
              ))}
              {(() => {
                const currentCount = (teamPlayers[t.id] || []).length
                const maxSlots = typeof playersPerTeam === 'number' ? Math.max(playersPerTeam, 0) : 0
                const emptySlots = Math.max(0, maxSlots - currentCount)
                if (!emptySlots) return null
                return Array.from({ length: emptySlots }).map((_, idx) => (
                  <Paper
                    key={`empty-${t.id}-${idx}`}
                    className={locked ? undefined : 'droppable'}
                    component="li"
                    aria-label={`Vaga vazia no ${t.name}`}
                    tabIndex={0}
                    onDragOver={locked ? undefined : (e) => e.preventDefault()}
                    onDragEnter={locked ? undefined : (e) => (e.currentTarget.classList.add('droppable--over'))}
                    onDragLeave={locked ? undefined : (e) => (e.currentTarget.classList.remove('droppable--over'))}
                    onDrop={locked ? undefined : async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const target = e.currentTarget
                      try {
                        await dropToTeam(e, t.id)
                      } finally {
                        target.classList.remove('droppable--over')
                      }
                    }}
                    variant="outlined"
                    sx={{
                      minHeight: 36,
                      border: '1px dashed',
                      borderColor: 'divider',
                      my: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.secondary',
                      backgroundColor: 'background.default',
                    }}
                  >
                    Vazio
                  </Paper>
                ))
              })()}
            </ul>
            {/* Removed select/add/remove forms; use drag-and-drop or contextual actions only */}
            </Paper>
            </Grid>
          ))}
          </Grid>
        </Grid>
        <Grid size={12}>
          <Typography variant="h6">Disponíveis</Typography>
          <Grid
            container
            spacing={3}
            sx={{ mt: 1 }}
            alignItems="stretch"
            onDragOver={locked ? undefined : (event: DragEvent<HTMLElement>) => event.preventDefault()}
            onDragEnter={locked ? undefined : (event: DragEvent<HTMLElement>) => event.currentTarget.classList.add('droppable--over')}
            onDragLeave={locked ? undefined : (event: DragEvent<HTMLElement>) => event.currentTarget.classList.remove('droppable--over')}
            onDrop={locked ? undefined : async (event: DragEvent<HTMLElement>) => {
              event.preventDefault()
              event.stopPropagation()
              const target = event.currentTarget
              try {
                await dropToBench(event)
              } finally {
                target.classList.remove('droppable--over')
              }
            }}
            className={locked ? undefined : 'droppable'}
            role="listbox"
            aria-label="Jogadores disponíveis"
            tabIndex={0}
          >
            {benchPlayers.map((p) => (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 6, lg: 4, xl: 3 }}>
                <Paper
                  draggable={!locked}
                  onDragStart={locked ? undefined : (e) => onDragStartPlayer(e, p.id, null)}
                  tabIndex={0}
                  data-pid={p.id}
                  variant="outlined"
                  sx={{ p: 1, display: 'flex', alignItems: 'center' }}
                >
                  {(() => {
                    const name = p.user?.name ?? `Player #${p.id}` // Access user.name directly
                    const score = effectiveScores[p.id]
                    const val = (typeof score === 'number') ? score.toFixed(1) : (p.grade != null ? String(p.grade) : null)
                    return val ? `${name} (${val})` : name
                  })()}
                  {!locked && (
                    <Button size="small" variant="text" className="inline-form" sx={{ ml: 1 }} aria-haspopup="menu" aria-expanded={menu?.playerId === p.id && menu?.sourceTeamId === null} onClick={() => setMenu({ playerId: p.id, sourceTeamId: null })}>Mover</Button>
                  )}
                  {!locked && menu?.playerId === p.id && menu?.sourceTeamId === null && (
                    <Paper role="menu" aria-label={`Mover jogador #${p.id}`} sx={{ mt: 1, p: 1 }}>
                      <Stack className="stack">
                        {teams.map((tgt) => (
                          <Button key={tgt.id} role="menuitem" onClick={() => movePlayer(p.id, null, tgt.id)}>Para {tgt.name}</Button>
                        ))}
                        <Button role="menuitem" onClick={() => setMenu(null)}>Cancelar</Button>
                      </Stack>
                    </Paper>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </section>
  )
}