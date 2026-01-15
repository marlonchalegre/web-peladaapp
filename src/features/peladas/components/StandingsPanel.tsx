import { Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Box } from '@mui/material'

export type StandingRow = { teamId: number; name: string; wins: number; draws: number; losses: number }

type Props = { standings: StandingRow[] }

export default function StandingsPanel({ standings }: Props) {
  return (
    <Paper variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
      <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
         <Typography variant="subtitle1" fontWeight="bold">Classificação</Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>V</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>E</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>D</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {standings.map((row, index) => (
              <TableRow 
                key={`stand-${row.teamId}`} 
                hover
                sx={{ bgcolor: index % 2 === 1 ? 'action.hover' : 'inherit' }}
              >
                <TableCell>{row.name || `Time ${row.teamId}`}</TableCell>
                <TableCell align="center">{row.wins}</TableCell>
                <TableCell align="center">{row.draws}</TableCell>
                <TableCell align="center">{row.losses}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
