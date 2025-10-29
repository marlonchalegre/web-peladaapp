import { useState } from 'react'
import type { DragEvent } from 'react'
import { Button, Paper, Typography, Stack } from '@mui/material'
import Grid from '@mui/material/Grid'
import type { Player, Team, TeamPlayer } from '../../../shared/api/endpoints'

export type TeamsSectionProps = {
  teams: Team[]
  teamPlayers: Record<number, TeamPlayer[]>
  playersPerTeam?: number | null
  benchPlayers: Player[]
  creatingTeam: boolean
  locked?: boolean
  onCreateTeam: (name: string) => Promise<void>
  onDragStartPlayer: (e: DragEvent<HTMLElement>, playerId: number, sourceTeamId: number | null) => void
  dropToBench: (e: DragEvent<HTMLElement>) => Promise<void>
  dropToTeam: (e: DragEvent<HTMLElement>, targetTeamId: number) => Promise<void>
  movePlayer: (playerId: number, sourceTeamId: number | null, targetTeamId: number | null) => Promise<void>
  menu: { playerId: number; sourceTeamId: number | null } | null
  setMenu: (v: { playerId: number; sourceTeamId: number | null } | null) => void
  orgPlayerIdToUserId: Record<number, number>
  userIdToName: Record<number, string>
  orgPlayerIdToPlayer: Record<number, Player>
  orgPlayerIdToScore?: Record<number, number>
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
    onDragStartPlayer,
    dropToBench,
    dropToTeam,
    movePlayer,
    menu,
    setMenu,
  } = props
  const { orgPlayerIdToUserId, userIdToName, orgPlayerIdToPlayer, orgPlayerIdToScore = {} } = props
  const [filling, setFilling] = useState(false)

  const maxSlots = typeof playersPerTeam === 'number' ? Math.max(playersPerTeam, 0) : 0
  const openSlots = teams.reduce((sum, t) => sum + Math.max(0, maxSlots - ((teamPlayers[t.id] || []).length)), 0)
  const disabled = filling || maxSlots <= 0 || openSlots === 0 || benchPlayers.length === 0

  async function randomFillTeams() {
    if (disabled) return
    setFilling(true)
    try {
      const remainingPerTeam: Record<number, number> = {}
      for (const t of teams) {
        const currentCount = (teamPlayers[t.id] || []).length
        remainingPerTeam[t.id] = Math.max(0, maxSlots - currentCount)
      }
      const targetSlots: number[] = []
      for (const t of teams) {
        for (let i = 0; i < remainingPerTeam[t.id]; i += 1) targetSlots.push(t.id)
      }
      function shuffle<T>(arr: T[]): T[] {
        const a = arr.slice()
        for (let i = a.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1))
          const tmp = a[i]; a[i] = a[j]; a[j] = tmp
        }
        return a
      }
      const shuffledPlayers = shuffle(benchPlayers.map(p => p.id))
      const shuffledTargets = shuffle(targetSlots)
      const moves = Math.min(shuffledPlayers.length, shuffledTargets.length)
      for (let i = 0; i < moves; i += 1) {
        const pid = shuffledPlayers[i]
        const tid = shuffledTargets[i]
        await movePlayer(pid, null, tid)
      }
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
              <Typography variant="h6">
                {t.name}
                {(() => {
                  const tps = teamPlayers[t.id] || []
                  const vals = tps.map(tp => (typeof orgPlayerIdToScore[tp.player_id] === 'number' ? orgPlayerIdToScore[tp.player_id] : orgPlayerIdToPlayer[tp.player_id]?.grade)).filter((g): g is number => typeof g === 'number')
                  if (!vals.length) return null
                  const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                  return <span style={{ marginLeft: 8, color: '#666', fontWeight: 400 }}>(média {avg})</span>
                })()}
              </Typography>
            <ul style={{ padding: 0, listStyle: 'none' }}>
              {(teamPlayers[t.id] || []).map((tp) => (
                <Paper
                  key={`${t.id}-${tp.player_id}`}
                  component="li"
                  draggable={!locked}
                  onDragStart={locked ? undefined : (e) => onDragStartPlayer(e, tp.player_id, t.id)}
                  tabIndex={0}
                  variant="outlined"
                  sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center' }}
                >
                {(() => {
                  const userId = orgPlayerIdToUserId[tp.player_id]
                  const name = userIdToName[userId] ?? `Player #${tp.player_id}`
                  const score = orgPlayerIdToScore[tp.player_id]
                  const grade = orgPlayerIdToPlayer[tp.player_id]?.grade
                  const val = (typeof score === 'number') ? score.toFixed(1) : (grade != null ? String(grade) : null)
                  return val ? `${name} (${val})` : name
                })()}
                  {!locked && (
                    <Button size="small" variant="text" className="inline-form" sx={{ ml: 1 }} aria-haspopup="menu" aria-expanded={menu?.playerId === tp.player_id && menu?.sourceTeamId === t.id} onClick={() => setMenu({ playerId: tp.player_id, sourceTeamId: t.id })}>Mover</Button>
                  )}
                  {!locked && menu?.playerId === tp.player_id && menu?.sourceTeamId === t.id && (
                    <Paper role="menu" aria-label={`Mover jogador #${tp.player_id}`} sx={{ mt: 1, p: 1 }}>
                      <Stack className="stack">
                        <Button role="menuitem" onClick={() => movePlayer(tp.player_id, t.id, null)}>Para banco</Button>
                        {teams.filter((x) => x.id !== t.id).map((tgt) => (
                          <Button key={tgt.id} role="menuitem" onClick={() => movePlayer(tp.player_id, t.id, tgt.id)}>Para {tgt.name}</Button>
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
                    const name = userIdToName[p.user_id] ?? `Player #${p.id}`
                    const score = orgPlayerIdToScore[p.id]
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
