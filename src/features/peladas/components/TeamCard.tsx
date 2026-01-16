import { Paper, Typography, Box, IconButton, Chip, Avatar, Stack } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import type { DragEvent } from 'react'
import type { Player, Team, User } from '../../../shared/api/endpoints'

type PlayerWithUser = Player & { user: User; displayScore?: string }

type TeamCardProps = {
  team: Team
  players: PlayerWithUser[]
  averageScore: number | null
  maxPlayers?: number
  onDelete: () => void
  onDrop: (e: DragEvent<HTMLElement>) => void
  onDragStartPlayer: (e: DragEvent<HTMLElement>, playerId: number) => void
  locked?: boolean
  movePlayerMenu?: {
    menu: { playerId: number; sourceTeamId: number | null } | null
    setMenu: (v: { playerId: number; sourceTeamId: number | null } | null) => void
    movePlayer: (playerId: number, sourceTeamId: number | null, targetTeamId: number | null) => Promise<void>
  }
}

export default function TeamCard({
  team,
  players,
  averageScore,
  maxPlayers = 5,
  onDelete,
  onDrop,
  onDragStartPlayer,
  locked,
}: TeamCardProps) {

  const emptySlots = Math.max(0, maxPlayers - players.length)

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
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
          await onDrop(e)
        } finally {
          target.classList.remove('droppable--over')
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            {team.name}
          </Typography>
          {averageScore !== null && (
            <Chip 
              label={`MÉDIA: ${averageScore.toFixed(1)}`} 
              size="small" 
              sx={{ 
                mt: 0.5, 
                height: 22, 
                fontSize: '0.65rem', 
                fontWeight: 'bold',
                bgcolor: '#e3f2fd',
                color: '#1976d2',
                borderRadius: 1
              }} 
            />
          )}
        </Box>
        {!locked && (
          <IconButton size="small" onClick={onDelete} aria-label="Excluir time" sx={{ color: 'text.secondary' }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
        {players.map((p) => {
          return (
            <Paper
              key={p.id}
              elevation={0}
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#f8f9fa',
                borderRadius: 3,
                cursor: locked ? 'default' : 'grab',
                border: '1px solid transparent',
                '&:hover': {
                    borderColor: 'divider'
                }
              }}
              draggable={!locked}
              onDragStart={locked ? undefined : (e) => onDragStartPlayer(e, p.id)}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  fontSize: 12, 
                  bgcolor: stringToColor(p.user.name),
                  mr: 1.5,
                  fontWeight: 'bold'
                }}
              >
                {getInitials(p.user.name)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {p.user.name}
                </Typography>
              </Box>
               <Chip 
                 label={p.displayScore ?? '-'} 
                 size="small" 
                 sx={{ 
                   height: 24, 
                   bgcolor: '#e8f5e9', 
                   color: '#2e7d32', 
                   fontWeight: 'bold',
                   borderRadius: 1
                 }} 
               />
            </Paper>
          )
        })}
        
        {/* Placeholder for "Arraste um jogador" */}
        {!locked && Array.from({ length: emptySlots }).map((_, i) => (
           <Box
             key={`placeholder-${i}`}
             sx={{
               p: 2,
               borderRadius: 3,
               background: 'linear-gradient(135deg, #a395a3 0%, #8c7b8c 100%)',
               color: 'rgba(255,255,255,0.8)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               height: 52,
               fontSize: '0.85rem',
               fontWeight: 500,
               boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
             }}
           >
             Arraste um jogador
           </Box>
        ))}
      </Stack>
    </Paper>
  )
}

// Helpers
function stringToColor(string: string) {
  let hash = 0
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash)
  }
  let color = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    color += `00${value.toString(16)}`.slice(-2)
  }
  return color
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
