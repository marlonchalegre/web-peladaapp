import { useEffect, useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { Container, Typography, Alert, Button, Stack } from '@mui/material'
import { api } from '../../../shared/api/client'
import { createApi, type Pelada, type Team, type TeamPlayer, type Player } from '../../../shared/api/endpoints'
import PeladaActions from '../components/PeladaActions'
import TeamsSection from '../components/TeamsSection'

const endpoints = createApi(api)

export default function PeladaDetailPage() {
  const { id } = useParams()
  const peladaId = Number(id)
  const [pelada, setPelada] = useState<Pelada | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [teamPlayers, setTeamPlayers] = useState<Record<number, TeamPlayer[]>>({})
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [userIdToName, setUserIdToName] = useState<Record<number, string>>({})
  const [orgPlayerIdToUserId, setOrgPlayerIdToUserId] = useState<Record<number, number>>({})
  const [orgPlayerIdToPlayer, setOrgPlayerIdToPlayer] = useState<Record<number, Player>>({})
  const [orgPlayerIdToScore, setOrgPlayerIdToScore] = useState<Record<number, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const [live, setLive] = useState('')
  const [menu, setMenu] = useState<{ playerId: number; sourceTeamId: number | null } | null>(null)

  const assignedIds = useMemo(() => new Set(Object.values(teamPlayers).flat().map((tp) => tp.player_id)), [teamPlayers])
  const benchPlayers = useMemo(() => availablePlayers.filter((p) => !assignedIds.has(p.id)), [availablePlayers, assignedIds])

  function onDragStartPlayer(e: DragEvent<HTMLElement>, playerId: number, sourceTeamId: number | null) {
    e.dataTransfer.setData('application/json', JSON.stringify({ playerId, sourceTeamId }))
    e.dataTransfer.effectAllowed = 'move'
  }

  function parseDrag(e: DragEvent<HTMLElement>): { playerId: number; sourceTeamId: number | null } | null {
    try {
      const data = e.dataTransfer.getData('application/json')
      if (!data) return null
      const obj = JSON.parse(data)
      return { playerId: Number(obj.playerId), sourceTeamId: obj.sourceTeamId == null ? null : Number(obj.sourceTeamId) }
    } catch {
      return null
    }
  }

  async function dropToBench(e: DragEvent<HTMLElement>) {
    e.preventDefault()
    const data = parseDrag(e)
    if (!data) return
    const { playerId, sourceTeamId } = data
    if (sourceTeamId == null) return // already bench
    try {
      await endpoints.removePlayerFromTeam(sourceTeamId, playerId)
      const list = await endpoints.listTeamPlayers(sourceTeamId)
      setTeamPlayers((prev) => ({ ...prev, [sourceTeamId]: list }))
      setLive(`Jogador #${playerId} movido para banco`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao mover para banco'
      setError(message)
    }
  }

  async function dropToTeam(e: DragEvent<HTMLElement>, targetTeamId: number) {
    e.preventDefault()
    const data = parseDrag(e)
    if (!data) return
    const { playerId, sourceTeamId } = data
    if (sourceTeamId === targetTeamId) return
    try {
      if (sourceTeamId != null) {
        await endpoints.removePlayerFromTeam(sourceTeamId, playerId)
      }
      await endpoints.addPlayerToTeam(targetTeamId, playerId)
      const targetList = await endpoints.listTeamPlayers(targetTeamId)
      setTeamPlayers((prev) => ({ ...prev, [targetTeamId]: targetList }))
      if (sourceTeamId != null) {
        const srcList = await endpoints.listTeamPlayers(sourceTeamId)
        setTeamPlayers((prev) => ({ ...prev, [sourceTeamId]: srcList }))
      }
      const tName = teams.find((t) => t.id === targetTeamId)?.name || String(targetTeamId)
      setLive(`Jogador #${playerId} movido para time ${tName}`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao mover jogador'
      setError(message)
    }
  }

  async function movePlayer(playerId: number, sourceTeamId: number | null, targetTeamId: number | null) {
    try {
      if (targetTeamId == null && sourceTeamId != null) {
        await endpoints.removePlayerFromTeam(sourceTeamId, playerId)
        const srcList = await endpoints.listTeamPlayers(sourceTeamId)
        setTeamPlayers((prev) => ({ ...prev, [sourceTeamId]: srcList }))
        setLive(`Jogador #${playerId} movido para banco`)
      } else if (targetTeamId != null && sourceTeamId == null) {
        await endpoints.addPlayerToTeam(targetTeamId, playerId)
        const tgt = await endpoints.listTeamPlayers(targetTeamId)
        setTeamPlayers((prev) => ({ ...prev, [targetTeamId]: tgt }))
        const tName = teams.find((t) => t.id === targetTeamId)?.name || String(targetTeamId)
        setLive(`Jogador #${playerId} adicionado ao time ${tName}`)
      } else if (targetTeamId != null && sourceTeamId != null && targetTeamId !== sourceTeamId) {
        await endpoints.removePlayerFromTeam(sourceTeamId, playerId)
        await endpoints.addPlayerToTeam(targetTeamId, playerId)
        const [srcList, tgtList] = await Promise.all([
          endpoints.listTeamPlayers(sourceTeamId),
          endpoints.listTeamPlayers(targetTeamId),
        ])
        setTeamPlayers((prev) => ({ ...prev, [sourceTeamId]: srcList, [targetTeamId]: tgtList }))
        const tName = teams.find((t) => t.id === targetTeamId)?.name || String(targetTeamId)
        setLive(`Jogador #${playerId} movido para time ${tName}`)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao mover jogador'
      setError(message)
    } finally {
      setMenu(null)
    }
  }

  useEffect(() => {
    if (!peladaId) return
    Promise.all([
      endpoints.getPelada(peladaId),
      endpoints.listTeamsByPelada(peladaId),
      endpoints.listUsers(),
    ])
      .then(async ([p, ts, users]) => {
        setPelada(p)
        setTeams(ts)
        const orgId = p.organization_id
        const av = await endpoints.listPlayersByOrg(orgId)
        setAvailablePlayers(av)
        // Build maps for name resolution
        const nameMap: Record<number, string> = {}
        for (const u of users) nameMap[u.id] = u.name
        setUserIdToName(nameMap)
        const relMap: Record<number, number> = {}
        const playerMap: Record<number, Player> = {}
        for (const pl of av) { relMap[pl.id] = pl.user_id; playerMap[pl.id] = pl }
        setOrgPlayerIdToUserId(relMap)
        setOrgPlayerIdToPlayer(playerMap)
        const playersByTeam: Record<number, TeamPlayer[]> = {}
        for (const t of ts) {
          playersByTeam[t.id] = await endpoints.listTeamPlayers(t.id)
        }
        setTeamPlayers(playersByTeam)
        // Fetch normalized scores for all organization players in this pelada
        const ids = av.map(p => p.id)
        const scorePairs = await Promise.all(ids.map(async (pid) => {
          try {
            const s = await endpoints.getNormalizedScore(peladaId, pid)
            return [pid, s.score as number] as const
          } catch {
            return [pid, NaN] as const
          }
        }))
        const scoreMap: Record<number, number> = {}
        for (const [pid, s] of scorePairs) if (!Number.isNaN(s)) scoreMap[pid] = s
        setOrgPlayerIdToScore(scoreMap)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Erro ao carregar pelada'
        setError(message)
      })
  }, [peladaId])

  if (error) return <Container><Alert severity="error">{error}</Alert></Container>
  if (!pelada) return <Container><Typography>Carregando...</Typography></Container>

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Pelada #{pelada.id}</Typography>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{live}</div>
      <PeladaActions
        peladaId={peladaId}
        changingStatus={changingStatus}
        canBegin={pelada.status === 'open'}
        onBegin={async (matchesPerTeam) => {
          if (!peladaId) return
          setChangingStatus(true)
          try {
            await endpoints.beginPelada(peladaId, matchesPerTeam)
            const p = await endpoints.getPelada(peladaId)
            setPelada(p)
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao iniciar pelada'
            setError(message)
          } finally {
            setChangingStatus(false)
          }
        }}
      />
      <Stack direction="row" sx={{ mt: 2, mb: 2 }}>
        <Button component={RouterLink} to={`/peladas/${peladaId}/matches`} variant="outlined">
          Ver partidas da pelada
        </Button>
      </Stack>
      <TeamsSection
        teams={teams}
        teamPlayers={teamPlayers}
        playersPerTeam={pelada.players_per_team ?? undefined}
        benchPlayers={benchPlayers}
        creatingTeam={creatingTeam}
        locked={pelada.status !== 'open'}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        userIdToName={userIdToName}
        orgPlayerIdToPlayer={orgPlayerIdToPlayer}
        orgPlayerIdToScore={orgPlayerIdToScore}
        onCreateTeam={async (name) => {
          setCreatingTeam(true)
          try {
            const team = await endpoints.createTeam({ pelada_id: peladaId, name })
            setTeams((prev) => [...prev, team])
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao criar time'
            setError(message)
          } finally {
            setCreatingTeam(false)
          }
        }}
        onDragStartPlayer={onDragStartPlayer}
        dropToBench={dropToBench}
        dropToTeam={dropToTeam}
        movePlayer={movePlayer}
        menu={menu}
        setMenu={setMenu}
      />
    </Container>
  )
}
