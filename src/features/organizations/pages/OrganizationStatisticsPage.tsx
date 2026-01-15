import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { Container, Typography, Alert, FormControl, InputLabel, Select, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Box, Button, TextField, Grid } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { api } from '../../../shared/api/client'
import { createApi, type Organization } from '../../../shared/api/endpoints'

const endpoints = createApi(api)

type PlayerStats = {
  player_id: number;
  player_name: string;
  peladas_played: number;
  goal: number;
  assist: number;
  own_goal: number;
}

type Order = 'asc' | 'desc';

export default function OrganizationStatisticsPage() {
  const { id } = useParams()
  const orgId = Number(id)
  const [org, setOrg] = useState<Organization | null>(null)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [stats, setStats] = useState<PlayerStats[]>([])
  const [error, setError] = useState<string | null>(null)
  const [orderBy, setOrderBy] = useState<keyof PlayerStats>('goal')
  const [order, setOrder] = useState<Order>('desc')

  // Filters
  const [nameFilter, setNameFilter] = useState('')
  const [minPeladas, setMinPeladas] = useState<string>('')
  const [minGoals, setMinGoals] = useState<string>('')
  const [minAssists, setMinAssists] = useState<string>('')
  const [minOwnGoals, setMinOwnGoals] = useState<string>('')

  useEffect(() => {
    if (!orgId) return
    endpoints.getOrganization(orgId)
      .then(setOrg)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Erro ao carregar organização'
        setError(message)
      })
  }, [orgId])

  const fetchStats = useCallback(async () => {
    if (!orgId) return
    try {
      const response = await endpoints.getOrganizationStatistics(orgId, year)
      setStats(response)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar estatísticas'
      setError(message)
    }
  }, [orgId, year])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleRequestSort = (property: keyof PlayerStats) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredStats = useMemo(() => {
    return stats.filter(row => {
      const matchesName = row.player_name.toLowerCase().includes(nameFilter.toLowerCase())
      const matchesPeladas = minPeladas === '' || row.peladas_played >= Number(minPeladas)
      const matchesGoals = minGoals === '' || row.goal >= Number(minGoals)
      const matchesAssists = minAssists === '' || row.assist >= Number(minAssists)
      const matchesOwnGoals = minOwnGoals === '' || row.own_goal >= Number(minOwnGoals)
      return matchesName && matchesPeladas && matchesGoals && matchesAssists && matchesOwnGoals
    })
  }, [stats, nameFilter, minPeladas, minGoals, minAssists, minOwnGoals])

  const sortedStats = useMemo(() => {
    return [...filteredStats].sort((a, b) => {
      const valA = a[orderBy];
      const valB = b[orderBy];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      const numA = valA as number;
      const numB = valB as number;

      if (numA < numB) {
        return order === 'asc' ? -1 : 1;
      }
      if (numA > numB) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredStats, order, orderBy]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  if (error) return <Container><Alert severity="error">{error}</Alert></Container>
  if (!org) return <Container><Typography>Carregando...</Typography></Container>

  return (
    <Container>
      <Box sx={{ mb: 2 }}>
        <Button
          component={RouterLink}
          to={`/organizations/${orgId}`}
          startIcon={<ArrowBackIcon />}
          variant="text"
        >
          Voltar para Organização
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{org.name} - Estatísticas</Typography>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="year-select-label">Ano</InputLabel>
          <Select
            labelId="year-select-label"
            value={year}
            label="Ano"
            onChange={(e) => setYear(Number(e.target.value))}
            size="small"
          >
            {years.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filtros</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="Nome do Jogador"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              fullWidth
              label="Mínimo de Peladas"
              type="number"
              value={minPeladas}
              onChange={(e) => setMinPeladas(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              fullWidth
              label="Mínimo de Gols"
              type="number"
              value={minGoals}
              onChange={(e) => setMinGoals(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              fullWidth
              label="Mínimo de Assistências"
              type="number"
              value={minAssists}
              onChange={(e) => setMinAssists(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="Mínimo de Gols Contra"
              type="number"
              value={minOwnGoals}
              onChange={(e) => setMinOwnGoals(e.target.value)}
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'player_name'}
                  direction={orderBy === 'player_name' ? order : 'asc'}
                  onClick={() => handleRequestSort('player_name')}
                >
                  Jogador
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'peladas_played'}
                  direction={orderBy === 'peladas_played' ? order : 'asc'}
                  onClick={() => handleRequestSort('peladas_played')}
                >
                  Peladas
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'goal'}
                  direction={orderBy === 'goal' ? order : 'asc'}
                  onClick={() => handleRequestSort('goal')}
                >
                  Gols
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'assist'}
                  direction={orderBy === 'assist' ? order : 'asc'}
                  onClick={() => handleRequestSort('assist')}
                >
                  Assistências
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'own_goal'}
                  direction={orderBy === 'own_goal' ? order : 'asc'}
                  onClick={() => handleRequestSort('own_goal')}
                >
                  Gols Contra
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedStats.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} align="center">
                   Nenhuma estatística encontrada para os filtros aplicados.
                 </TableCell>
               </TableRow>
            ) : (
              sortedStats.map((row) => (
                <TableRow
                  key={row.player_id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.player_name}
                  </TableCell>
                  <TableCell align="right">{row.peladas_played}</TableCell>
                  <TableCell align="right">{row.goal}</TableCell>
                  <TableCell align="right">{row.assist}</TableCell>
                  <TableCell align="right">{row.own_goal}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  )
}