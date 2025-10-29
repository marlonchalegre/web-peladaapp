import React from 'react'
import { Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'

export type StandingRow = { teamId: number; name: string; wins: number; draws: number; losses: number }

type Props = { standings: StandingRow[] }

export default function StandingsPanel({ standings }: Props) {
  return (
    <Paper sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ px: 2, pt: 2 }}>Classificação</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell align="right">V</TableCell>
              <TableCell align="right">E</TableCell>
              <TableCell align="right">D</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {standings.map((row) => (
              <TableRow key={`stand-${row.teamId}`}>
                <TableCell>{row.name || `Time ${row.teamId}`}</TableCell>
                <TableCell align="right">{row.wins}</TableCell>
                <TableCell align="right">{row.draws}</TableCell>
                <TableCell align="right">{row.losses}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
