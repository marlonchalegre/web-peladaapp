import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Typography, Alert, Card, CardContent, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { api } from '../../../shared/api/client'
import { createApi, type Organization } from '../../../shared/api/endpoints'

const endpoints = createApi(api)

type Stats = {
  goal: number;
  assist: number;
  own_goal: number;
}

export default function OrganizationStatisticsPage() {
  const { id } = useParams()
  const orgId = Number(id)
  const [org, setOrg] = useState<Organization | null>(null)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  if (error) return <Container><Alert severity="error">{error}</Alert></Container>
  if (!org) return <Container><Typography>Carregando...</Typography></Container>

  return (
    <Container>
      <Typography variant="h4" gutterBottom>{org.name} - Estatísticas</Typography>
      
      <FormControl sx={{ minWidth: 120, mb: 4 }}>
        <InputLabel id="year-select-label">Ano</InputLabel>
        <Select
          labelId="year-select-label"
          value={year}
          label="Ano"
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {stats && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Gols
                </Typography>
                <Typography variant="h3">
                  {stats.goal}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: '#e8f5e9' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Assistências
                </Typography>
                <Typography variant="h3">
                  {stats.assist}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: '#ffebee' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Gols Contra
                </Typography>
                <Typography variant="h3">
                  {stats.own_goal}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  )
}
