import { useEffect, useState, useCallback } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { Container, Typography, Alert, TablePagination, Box, Button } from '@mui/material'
import { api } from '../../../shared/api/client'
import { createApi, type Pelada, type Organization } from '../../../shared/api/endpoints'
import { useAuth } from '../../../app/providers/AuthContext'
import CreatePeladaForm from '../components/CreatePeladaForm'
import PeladasTable from '../components/PeladasTable'

const endpoints = createApi(api)

export default function OrganizationDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const orgId = Number(id)
  const [org, setOrg] = useState<Organization | null>(null)
  const [peladas, setPeladas] = useState<Pelada[]>([])
  const [totalPeladas, setTotalPeladas] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId || !user) return
    
    // Load org details and admin status
    Promise.all([
      endpoints.getOrganization(orgId),
      endpoints.checkIsAdmin(orgId, user.id),
    ])
      .then(([o, adminCheck]) => {
        setOrg(o)
        setIsAdmin(adminCheck.is_admin)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Erro ao carregar organização'
        setError(message)
      })
  }, [orgId, user])

  const fetchPeladas = useCallback(async () => {
    if (!orgId) return
    try {
      // API uses 1-based page index, MUI uses 0-based
      const response = await endpoints.listPeladasByOrg(orgId, page + 1, rowsPerPage)
      setPeladas(response.data)
      setTotalPeladas(response.total)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar peladas'
      setError(message)
    }
  }, [orgId, page, rowsPerPage])

  useEffect(() => {
    fetchPeladas()
  }, [fetchPeladas])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  if (error) return <Container><Alert severity="error">{error}</Alert></Container>
  if (!org) return <Container><Typography>Carregando...</Typography></Container>

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">{org.name}</Typography>
        <Button component={RouterLink} to={`/organizations/${orgId}/statistics`} variant="outlined">
          Estatísticas
        </Button>
      </Box>
      <Typography variant="h6" gutterBottom>Peladas</Typography>
      {isAdmin && (
        <CreatePeladaForm
          organizationId={orgId}
          onCreate={async (payload) => {
            try {
              await endpoints.createPelada(payload)
              fetchPeladas()
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : 'Erro ao criar pelada'
              setError(message)
            }
          }}
        />
      )}
      <PeladasTable
        peladas={peladas}
        onDelete={isAdmin ? async (id) => {
          try {
            await endpoints.deletePelada(id)
            fetchPeladas()
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao excluir pelada'
            setError(message)
          }
        } : undefined}
      />
      <TablePagination
        component="div"
        count={totalPeladas}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Itens por página"
      />
    </Container>
  )
}
