import { useEffect, useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { Container, Typography, Alert, Button, Stack, Box } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { api } from '../../../shared/api/client'
import { createApi, type Pelada, type Team, type Player, type VotingInfo, type User } from '../../../shared/api/endpoints'
import { useAuth } from '../../../app/providers/AuthContext'
import PeladaActions from '../components/PeladaActions'
import TeamsSection from '../components/TeamsSection'

const endpoints = createApi(api)

type TeamWithPlayers = Team & { players: (Player & { user: User })[] }

export default function PeladaDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const peladaId = Number(id)
  const [pelada, setPelada] = useState<Pelada | null>(null)
  const [teams, setTeams] = useState<TeamWithPlayers[]>([])
  const [teamPlayers, setTeamPlayers] = useState<Record<number, (Player & { user: User })[]>>({})
  const [availablePlayers, setAvailablePlayers] = useState<(Player & { user: User })[]>([])
  const [userIdToName, setUserIdToName] = useState<Record<number, string>>({})
  const [orgPlayerIdToUserId, setOrgPlayerIdToUserId] = useState<Record<number, number>>({})
  const [orgPlayerIdToPlayer, setOrgPlayerIdToPlayer] = useState<Record<number, Player>>({})
  const [error, setError] = useState<string | null>(null)
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const [live, setLive] = useState('')
  const [menu, setMenu] = useState<{ playerId: number; sourceTeamId: number | null } | null>(null)
  const [votingInfo, setVotingInfo] = useState<VotingInfo | null>(null)

  const assignedIds = useMemo(() => new Set(Object.values(teamPlayers).flat().map((tp) => tp.id)), [teamPlayers])
  const benchPlayers = useMemo(() => availablePlayers.filter((p) => !assignedIds.has(p.id)), [availablePlayers, assignedIds])

  async function fetchPeladaData() {
    if (!peladaId) return
    try {
      const data = await endpoints.getPeladaFullDetails(peladaId)
      setPelada(data.pelada)
      setTeams(data.teams)
      setAvailablePlayers(data.available_players)
      setVotingInfo(data.voting_info)

      const nameMap: Record<number, string> = {}
      for (const u of Object.values(data.users_map)) {
        nameMap[u.id] = u.name
      }
      setUserIdToName(nameMap)

      const relMap: Record<number, number> = {}
      const playerMap: Record<number, Player> = {}
      for (const pl of Object.values(data.org_players_map)) {
        relMap[pl.id] = pl.user_id
        playerMap[pl.id] = pl
      }
      setOrgPlayerIdToUserId(relMap)
      setOrgPlayerIdToPlayer(playerMap)

      const playersByTeam: Record<number, (Player & { user: User })[]> = {}
      for (const t of data.teams) {
        playersByTeam[t.id] = t.players
      }
      setTeamPlayers(playersByTeam)

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar pelada'
      setError(message)
    }
  }

  useEffect(() => {
    fetchPeladaData()
  }, [peladaId, user])

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
      await fetchPeladaData() // Refresh all data
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
      await fetchPeladaData() // Refresh all data
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
        setLive(`Jogador #${playerId} movido para banco`)
      } else if (targetTeamId != null && sourceTeamId == null) {
        await endpoints.addPlayerToTeam(targetTeamId, playerId)
        const tName = teams.find((t) => t.id === targetTeamId)?.name || String(targetTeamId)
        setLive(`Jogador #${playerId} adicionado ao time ${tName}`)
      } else if (targetTeamId != null && sourceTeamId != null && targetTeamId !== sourceTeamId) {
        await endpoints.removePlayerFromTeam(sourceTeamId, playerId)
        await endpoints.addPlayerToTeam(targetTeamId, playerId)
        const tName = teams.find((t) => t.id === targetTeamId)?.name || String(targetTeamId)
        setLive(`Jogador #${playerId} movido para time ${tName}`)
      }
      await fetchPeladaData() // Refresh all data after any move operation
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao mover jogador'
      setError(message)
    } finally {
      setMenu(null)
    }
  }

  async function handleRandomizeTeams() {
    if (!peladaId || !pelada?.players_per_team) return
    try {
      const playerIds = benchPlayers.map(p => p.id)
      await api.post(`/api/peladas/${peladaId}/teams/randomize`, {
        player_ids: playerIds,
        players_per_team: pelada.players_per_team
      })
      await fetchPeladaData() // Refresh all data after randomization
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao randomizar times'
      setError(message)
    }
  }

  if (error) return <Container><Alert severity="error">{error}</Alert></Container>
  if (!pelada) return <Container><Typography>Carregando...</Typography></Container>

  return (
    <Container>
      <Box sx={{ mb: 2 }}>
        <Button
          component={RouterLink}
          to={`/organizations/${pelada.organization_id}`}
          startIcon={<ArrowBackIcon />}
          variant="text"
        >
          Voltar para Organização
        </Button>
      </Box>
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
            await fetchPeladaData() // Refresh pelada data
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao iniciar pelada'
            setError(message)
          } finally {
            setChangingStatus(false)
          }
        }}
      />
      <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 2 }}>
        <Button component={RouterLink} to={`/peladas/${peladaId}/matches`} variant="outlined">
          Ver partidas da pelada
        </Button>
        {votingInfo?.can_vote && (
          <Button
            component={RouterLink}
            to={`/peladas/${peladaId}/voting`}
            variant="contained"
            color={votingInfo.has_voted ? "success" : "primary"}
          >
            {votingInfo.has_voted ? 'Alterar Votos' : 'Votar nos Jogadores'}
          </Button>
        )}
      </Stack>
      {pelada.status === 'closed' && votingInfo && !votingInfo.can_vote && votingInfo.message && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {votingInfo.message}
        </Alert>
      )}
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
        onCreateTeam={async (name) => {
          setCreatingTeam(true)
          try {
            await endpoints.createTeam({ pelada_id: peladaId, name })
            await fetchPeladaData() // Refresh all data
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
        onRandomizeTeams={handleRandomizeTeams}
        menu={menu}
        setMenu={setMenu}
      />
    </Container>
  )
}

