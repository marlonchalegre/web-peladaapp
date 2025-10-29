import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import { 
  Container, 
  Typography, 
  Alert, 
  Button, 
  Stack, 
  Card, 
  CardContent,
  Rating,
  Box,
  CircularProgress
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { api } from '../../../shared/api/client'
import { createApi, type VotingInfo, type Player } from '../../../shared/api/endpoints'
import { useAuth } from '../../../app/providers/AuthContext'

const endpoints = createApi(api)

type PlayerVote = {
  playerId: number
  playerName: string
  stars: number | null
}

export default function PeladaVotingPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const peladaId = Number(id)
  
  const [votingInfo, setVotingInfo] = useState<VotingInfo | null>(null)
  const [_players, setPlayers] = useState<Player[]>([])
  const [_userIdToName, setUserIdToName] = useState<Record<number, string>>({})
  const [playerVotes, setPlayerVotes] = useState<PlayerVote[]>([])
  const [_currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [_currentPlayerOrgId, setCurrentPlayerOrgId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!peladaId) return

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if user is authenticated
        if (!user) {
          setError('Usuário não autenticado')
          return
        }
        setCurrentUserId(user.id)

        // Get all users for name mapping
        const users = await endpoints.listUsers()
        const nameMap: Record<number, string> = {}
        for (const u of users) nameMap[u.id] = u.name
        setUserIdToName(nameMap)

        // Get pelada to find organization
        const pelada = await endpoints.getPelada(peladaId)
        const orgId = pelada.organization_id

        // Get all organization players
        const orgPlayers = await endpoints.listPlayersByOrg(orgId)
        setPlayers(orgPlayers)

        // Find current user's player ID in this organization
        const currentPlayer = orgPlayers.find(p => p.user_id === user.id)
        if (!currentPlayer) {
          setError('Você não ? um jogador desta organização')
          return
        }
        setCurrentPlayerOrgId(currentPlayer.id)

        // Get voting info
        const info = await endpoints.getVotingInfo(peladaId, currentPlayer.id)
        setVotingInfo(info)

        if (!info.can_vote) {
          setError(info.message || 'Não ? possível votar nesta pelada')
          return
        }

        // Initialize player votes for eligible players
        const votes: PlayerVote[] = info.eligible_players.map(playerId => {
          const player = orgPlayers.find(p => p.id === playerId)
          const playerName = player ? nameMap[player.user_id] || `Jogador ${playerId}` : `Jogador ${playerId}`
          return {
            playerId,
            playerName,
            stars: null
          }
        })
        setPlayerVotes(votes)

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar dados de votação'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [peladaId, user])

  const handleVoteChange = (playerId: number, stars: number | null) => {
    setPlayerVotes(prev => 
      prev.map(pv => pv.playerId === playerId ? { ...pv, stars } : pv)
    )
  }

  const allVotesComplete = playerVotes.length > 0 && playerVotes.every(pv => pv.stars !== null)

  const handleSubmit = async () => {
    if (!allVotesComplete || !_currentPlayerOrgId) return

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      const votes = playerVotes.map(pv => ({
        target_id: pv.playerId,
        stars: pv.stars as number
      }))

      await endpoints.batchCastVotes(peladaId, {
        voter_id: _currentPlayerOrgId,
        votes
      })

      setSuccess('Votos registrados com sucesso!')
      
      // Redirect to pelada detail page after 2 seconds
      setTimeout(() => {
        navigate(`/peladas/${peladaId}`)
      }, 2000)

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao registrar votos'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error && !votingInfo) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        <Button variant="outlined" onClick={() => navigate(`/peladas/${peladaId}`)} sx={{ mt: 2 }}>
          Voltar para a pelada
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 2, mb: 2 }}>
        <Button
          component={RouterLink}
          to={`/peladas/${peladaId}`}
          startIcon={<ArrowBackIcon />}
          variant="text"
        >
          Voltar para Pelada
        </Button>
      </Box>
      <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>
        Votação da Pelada #{peladaId}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {votingInfo?.has_voted && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Você já votou nesta pelada. Você pode alterar seus votos até o fim do período de votação.
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Vote em todos os jogadores que participaram da pelada (exceto você mesmo). 
        O voto é obrigatório para todos os jogadores listados. Use de 1 a 5 estrelas.
      </Alert>

      <Stack spacing={2} sx={{ mb: 3 }}>
        {playerVotes.map(pv => (
          <Card key={pv.playerId} variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{pv.playerName}</Typography>
                <Box>
                  <Rating
                    name={`player-${pv.playerId}`}
                    value={pv.stars}
                    onChange={(_, newValue) => handleVoteChange(pv.playerId, newValue)}
                    size="large"
                    max={5}
                  />
                  {pv.stars !== null && (
                    <Typography variant="caption" display="block" textAlign="center">
                      {pv.stars} {pv.stars === 1 ? 'estrela' : 'estrelas'}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {playerVotes.length === 0 && (
        <Alert severity="warning">
          Não há jogadores elegíveis para votação nesta pelada.
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/peladas/${peladaId}`)}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!allVotesComplete || submitting}
          fullWidth
        >
          {submitting ? 'Enviando...' : 'Salvar Votos'}
        </Button>
      </Stack>

      {!allVotesComplete && playerVotes.length > 0 && (
        <Alert severity="warning">
          Você precisa votar em todos os jogadores antes de salvar.
        </Alert>
      )}
    </Container>
  )
}
