import { useEffect, useState } from 'react'
import { Typography, Container, Paper, Table, TableHead, TableRow, TableCell, TableBody, Box, Alert, Link } from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import GroupsIcon from '@mui/icons-material/Groups'
import { useAuth } from '../../../app/providers/AuthContext'
import { api } from '../../../shared/api/client'
import { createApi } from '../../../shared/api/endpoints'

const endpoints = createApi(api)

type OrganizationWithRole = {
  id: number
  name: string
  role: 'admin' | 'player'
}

export default function HomePage() {
  const { user } = useAuth()
  const [adminOrgs, setAdminOrgs] = useState<OrganizationWithRole[]>([])
  const [memberOrgs, setMemberOrgs] = useState<OrganizationWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchOrganizations = async () => {
      try {
        setLoading(true)
        
        // Fetch organizations where user is admin
        const adminData = await endpoints.listUserAdminOrganizations(user.id)
        const adminOrgIds = new Set(adminData.map((a) => a.organization_id))
        
        // Fetch all organizations and their players
        const allOrgs = await endpoints.listOrganizations()
        
        // Build admin organizations list
        const adminOrgsList: OrganizationWithRole[] = allOrgs
          .filter((org) => adminOrgIds.has(org.id))
          .map((org) => ({ ...org, role: 'admin' as const }))
        
        // For member organizations, we need to check which orgs the user is a player in
        const playerChecks = await Promise.all(
          allOrgs
            .filter((org) => !adminOrgIds.has(org.id))
            .map(async (org) => {
              try {
                const players = await endpoints.listPlayersByOrg(org.id)
                const isPlayer = players.some((p) => p.user_id === user.id)
                return isPlayer ? { ...org, role: 'player' as const } : null
              } catch {
                return null
              }
            })
        )
        
        const memberOrgsList = playerChecks.filter((org) => org !== null) as OrganizationWithRole[]
        
        setAdminOrgs(adminOrgsList)
        setMemberOrgs(memberOrgsList)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar organizações'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [user])

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h3" gutterBottom>Pelada App</Typography>
        <Typography variant="body1">Por favor, faça login.</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h3" gutterBottom>
        Bem-vindo, {user.name}!
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography>Carregando...</Typography>
      ) : (
        <>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AdminPanelSettingsIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h5">
                Minhas Organizações (Administrador)
              </Typography>
            </Box>
            
            {adminOrgs.length === 0 ? (
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Você não é administrador de nenhuma organização.
                </Typography>
              </Paper>
            ) : (
              <Paper elevation={1}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome da Organização</TableCell>
                      <TableCell>Função</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminOrgs.map((org) => (
                      <TableRow key={`admin-${org.id}`}>
                        <TableCell>
                          <Link href={`/organizations/${org.id}`} underline="hover">
                            {org.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 0.5 }} color="primary" />
                            Administrador
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <GroupsIcon sx={{ mr: 1 }} color="action" />
              <Typography variant="h5">
                Organizações que faço parte (Jogador)
              </Typography>
            </Box>
            
            {memberOrgs.length === 0 ? (
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Você não faz parte de nenhuma organização como jogador.
                </Typography>
              </Paper>
            ) : (
              <Paper elevation={1}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome da Organização</TableCell>
                      <TableCell>Função</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {memberOrgs.map((org) => (
                      <TableRow key={`member-${org.id}`}>
                        <TableCell>
                          <Link href={`/organizations/${org.id}`} underline="hover">
                            {org.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <GroupsIcon fontSize="small" sx={{ mr: 0.5 }} />
                            Jogador
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        </>
      )}
    </Container>
  )
}
