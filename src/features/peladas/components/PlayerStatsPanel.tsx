import React from 'react'
import { Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Tooltip } from '@mui/material'
import SwapVertIcon from '@mui/icons-material/SwapVert'

export type PlayerStatRow = { playerId: number; name: string; goals: number; assists: number; ownGoals: number }
export type SortState = { by: 'default' | 'goals' | 'assists'; dir: 'asc' | 'desc' }

type Props = {
  playerStats: PlayerStatRow[]
  playerSort: SortState
  onToggleSort: (by: 'goals' | 'assists') => void
}

export default function PlayerStatsPanel({ playerStats, playerSort, onToggleSort }: Props) {
  return (
    <Paper>
      <Typography variant="h6" sx={{ px: 2, pt: 2 }}>Estatísticas dos jogadores</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Jogador</TableCell>
              <TableCell align="right">
                G
                <Tooltip title="Ordenar por gols">
                  <IconButton size="small" onClick={() => onToggleSort('goals')} sx={{ ml: 0.5 }}>
                    <SwapVertIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {playerSort.by === 'goals' ? (playerSort.dir === 'desc' ? '↓' : '↑') : ''}
              </TableCell>
              <TableCell align="right">
                A
                <Tooltip title="Ordenar por assistências">
                  <IconButton size="small" onClick={() => onToggleSort('assists')} sx={{ ml: 0.5 }}>
                    <SwapVertIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {playerSort.by === 'assists' ? (playerSort.dir === 'desc' ? '↓' : '↑') : ''}
              </TableCell>
              <TableCell align="right">GC</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {playerStats.map((p) => (
              <TableRow key={`pst-${p.playerId}`}>
                <TableCell>{p.name}</TableCell>
                <TableCell align="right">{p.goals}</TableCell>
                <TableCell align="right">{p.assists}</TableCell>
                <TableCell align="right">{p.ownGoals}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
