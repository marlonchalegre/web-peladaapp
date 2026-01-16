import { useState, useMemo } from 'react'
import { Paper, Typography, Box, TextField, InputAdornment, IconButton, Chip, Avatar, Stack, Button, LinearProgress } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import AutoGraphIcon from '@mui/icons-material/AutoGraph'
import type { DragEvent } from 'react'
import type { Player, User } from '../../../shared/api/endpoints'

type PlayerWithUser = Player & { user: User }

type AvailablePlayersPanelProps = {
  players: PlayerWithUser[]
  scores: Record<number, number>
  onDropToBench: (e: DragEvent<HTMLElement>) => void
  onDragStartPlayer: (e: DragEvent<HTMLElement>, playerId: number) => void
  locked?: boolean
  totalPlayersInPelada: number
  averagePelada: number
  balance: number
}

function TechnicalSummary({ totalPlayers, averagePelada, balance }: { totalPlayers: number; averagePelada: number; balance: number }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: '#1a44c2', // Deep blue
        color: 'white',
        borderRadius: 4,
        mt: 3
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <AutoGraphIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Resumo Técnico
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>Equilíbrio Geral</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{balance}%</Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={balance} 
          sx={{ 
            height: 8, 
            borderRadius: 4, 
            bgcolor: 'rgba(255,255,255,0.2)',
            '& .MuiLinearProgress-bar': {
              bgcolor: 'white'
            }
          }} 
        />
      </Box>

      <Stack direction="row" spacing={4}>
        <Box>
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, fontSize: '0.7rem', fontWeight: 'bold' }}>
            TOTAL JOGADORES
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {totalPlayers}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, fontSize: '0.7rem', fontWeight: 'bold' }}>
            MÉDIA PELADA
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {averagePelada.toFixed(1)}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

export default function AvailablePlayersPanel({
  players,
  scores,
  onDropToBench,
  onDragStartPlayer,
  locked,
  totalPlayersInPelada,
  averagePelada,
  balance
}: AvailablePlayersPanelProps) {
  const [search, setSearch] = useState('')

  const filteredPlayers = useMemo(() => {
    if (!search) return players
    const lower = search.toLowerCase()
    return players.filter(p => p.user.name.toLowerCase().includes(lower))
  }, [players, search])

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: 'white',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider'
        }}
        className={locked ? undefined : 'droppable'}
        onDragOver={locked ? undefined : (e) => e.preventDefault()}
        onDragEnter={locked ? undefined : (e) => (e.currentTarget.classList.add('droppable--over'))}
        onDragLeave={locked ? undefined : (e) => (e.currentTarget.classList.remove('droppable--over'))}
        onDrop={locked ? undefined : async (e) => {
          e.preventDefault()
          e.stopPropagation()
          const target = e.currentTarget
          try {
            await onDropToBench(e)
          } finally {
            target.classList.remove('droppable--over')
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 1 }}>
              Disponíveis
            </Typography>
            <Chip label={players.length} size="small" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }} />
          </Box>
        </Box>

        <TextField
          fullWidth
          placeholder="Filtrar jogadores..."
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ 
            mb: 2, 
            bgcolor: '#f8f9fa',
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' } 
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="disabled" fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Stack spacing={1}>
          {filteredPlayers.map((p) => {
            const score = scores[p.id] ?? p.grade
            const scoreVal = typeof score === 'number' ? score.toFixed(1) : '-'
            
            return (
              <Paper
                key={p.id}
                elevation={0}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  cursor: locked ? 'default' : 'grab',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: '#f5faff'
                  }
                }}
                draggable={!locked}
                onDragStart={locked ? undefined : (e) => onDragStartPlayer(e, p.id)}
              >
                <Avatar 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    fontSize: 16, 
                    bgcolor: '#ffe0b2', // Light orange/yellow
                    color: '#e65100',
                    mr: 2,
                    fontWeight: 'bold'
                  }}
                >
                  {getInitials(p.user.name)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {p.user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {/* Position placeholder */}
                    {p.position_id ? 'JOGADOR' : 'DESCONHECIDO'} 
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1, color: 'text.primary' }}>
                    {scoreVal}
                  </Typography>
                  {!locked && (
                     <IconButton 
                       size="small" 
                       sx={{ 
                         color: '#1976d2',
                         padding: '4px'
                       }}
                     >
                       <AddIcon sx={{ fontSize: 18 }} />
                     </IconButton>
                  )}
                </Box>
              </Paper>
            )
          })}
        </Stack>

        <Button 
          fullWidth 
          variant="outlined" 
          sx={{ mt: 3, borderStyle: 'dashed', textTransform: 'none', color: 'text.secondary' }}
        >
          + Convidar mais jogadores
        </Button>
      </Paper>

      <TechnicalSummary 
        totalPlayers={totalPlayersInPelada} 
        averagePelada={averagePelada}
        balance={balance}
      />
    </Box>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
