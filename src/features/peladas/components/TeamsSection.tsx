import { Button, Typography, Stack, Box } from '@mui/material'
import Grid from '@mui/material/Grid'
import AddIcon from '@mui/icons-material/Add'
import ShuffleIcon from '@mui/icons-material/Shuffle'
import type { DragEvent } from 'react'
import type { Player, Team, User } from '../../../shared/api/endpoints'
import TeamCard from './TeamCard'

type PlayerWithUser = Player & { user: User }

export type TeamsSectionProps = {
  teams: Team[]
  teamPlayers: Record<number, PlayerWithUser[]>
  playersPerTeam?: number | null
  creatingTeam: boolean
  locked?: boolean
  onCreateTeam: (name: string) => Promise<void>
  onDeleteTeam: (teamId: number) => Promise<void>
  onDragStartPlayer: (e: DragEvent<HTMLElement>, playerId: number, sourceTeamId: number | null) => void
  dropToTeam: (e: DragEvent<HTMLElement>, targetTeamId: number) => Promise<void>
  onRandomizeTeams: () => Promise<void>
  scores: Record<number, number>
}

export default function TeamsSection(props: TeamsSectionProps) {
  const {
    teams,
    teamPlayers,
    playersPerTeam,
    creatingTeam,
    locked = false,
    onCreateTeam,
    onDeleteTeam,
    onDragStartPlayer,
    dropToTeam,
    onRandomizeTeams,
    scores,
  } = props

  return (
    <section>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
           {/* Icon could go here */}
           {/* <GroupIcon sx={{ mr: 1, color: 'primary.main' }} /> */}
           <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Times da Partida</Typography>
        </Box>
        
        {!locked && (
          <Stack direction="row" spacing={2}>
            <Button 
              variant="outlined" 
              startIcon={<ShuffleIcon />}
              onClick={async () => { await onRandomizeTeams() }}
              disabled={creatingTeam}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Randomizar Times
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={async () => { await onCreateTeam(`Time ${teams.length + 1}`) }} 
              disabled={creatingTeam}
              sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#e3f2fd', color: '#1976d2', boxShadow: 'none', '&:hover': { bgcolor: '#bbdefb', boxShadow: 'none' } }}
            >
              Criar Time
            </Button>
          </Stack>
        )}
      </Box>

      <Grid container spacing={3} alignItems="stretch">
        {teams.map((t) => {
          const players = teamPlayers[t.id] || []
          
          // Calculate average
          let avg: number | null = null
          const vals = players
            .map(p => (typeof scores[p.id] === 'number' ? scores[p.id] : p.grade))
            .filter((g): g is number => typeof g === 'number')
          
          if (vals.length > 0) {
            avg = vals.reduce((a, b) => a + b, 0) / vals.length
          }

          // Map players with display properties if needed, but TeamCard handles basic mapping.
          // We assume TeamCard will use `scores` if passed or we inject it into player objects? 
          // TeamCard currently expects `players` and uses `p.grade`. 
          // I updated TeamCard to render scores. I need to make sure I pass the scores correctly or modify TeamCard to take `scores` map.
          // In my TeamCard implementation, I used: `const score = scores[p.id] ?? p.grade` logic INSIDE AvailablePlayersPanel but in TeamCard I put a placeholder comment.
          // I should verify TeamCard implementation I wrote.
          
          /*
            In TeamCard I wrote:
            <Chip 
                 label={(p as any).displayScore ?? '-'} 
            ...
          */
         
          // So I need to inject `displayScore` into the players array passed to TeamCard.
          const playersWithScores = players.map(p => {
             const s = scores[p.id] ?? p.grade
             return {
               ...p,
               displayScore: typeof s === 'number' ? s.toFixed(1) : '-'
             }
          })

          return (
            <Grid key={t.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <TeamCard
                team={t}
                players={playersWithScores}
                averageScore={avg}
                maxPlayers={playersPerTeam ?? 5}
                onDelete={() => onDeleteTeam(t.id)}
                onDrop={(e) => dropToTeam(e, t.id)}
                onDragStartPlayer={(e, pid) => onDragStartPlayer(e, pid, t.id)}
                locked={locked}
                // Optional props for menu if I want to keep that functionality
              />
            </Grid>
          )
        })}

        {/* Add Team Placeholder */}
        {!locked && (
           <Grid size={{ xs: 12, md: 6, lg: 4 }}>
             <Button
               fullWidth
               onClick={async () => { await onCreateTeam(`Time ${teams.length + 1}`) }}
               disabled={creatingTeam}
               sx={{
                 height: '100%',
                 minHeight: 200,
                 border: '2px dashed',
                 borderColor: 'divider',
                 borderRadius: 3,
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 justifyContent: 'center',
                 color: 'text.secondary',
                 textTransform: 'none'
               }}
             >
               <Box 
                 sx={{ 
                   width: 40, 
                   height: 40, 
                   borderRadius: '50%', 
                   border: '2px solid', 
                   borderColor: 'inherit',
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center',
                   mb: 1
                 }}
               >
                 <AddIcon />
               </Box>
               <Typography variant="h6">Adicionar Time</Typography>
             </Button>
           </Grid>
        )}
      </Grid>
    </section>
  )
}
