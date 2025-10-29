import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Typography, Alert } from '@mui/material'
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
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId || !user) return
    Promise.all([
      endpoints.getOrganization(orgId),
      endpoints.listPeladasByOrg(orgId),
      endpoints.checkIsAdmin(orgId, user.id),
    ])
      .then(([o, ps, adminCheck]) => {
        setOrg(o)
        const seen = new Set<number>()
        const unique = ps.filter((p) => {
          if (p?.id == null) return false
          if (seen.has(p.id)) return false
          seen.add(p.id)
          return true
        })
        setPeladas(unique)
        setIsAdmin(adminCheck.is_admin)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Erro ao carregar organização'
        setError(message)
      })
  }, [orgId, user])

  if (error) return <Container><Alert severity="error">{error}</Alert></Container>
  if (!org) return <Container><Typography>Carregando...</Typography></Container>

  return (
    <Container>
      <Typography variant="h4" gutterBottom>{org.name}</Typography>
      <Typography variant="h6" gutterBottom>Peladas</Typography>
      {isAdmin && (
        <CreatePeladaForm
          organizationId={orgId}
          onCreate={async (payload) => {
            try {
              await endpoints.createPelada(payload)
              const list = await endpoints.listPeladasByOrg(orgId)
              const seen = new Set<number>()
              const unique = list.filter((p) => {
                if (p?.id == null) return false
                if (seen.has(p.id)) return false
                seen.add(p.id)
                return true
              })
              setPeladas(unique)
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
            setPeladas((prev) => prev.filter((x) => x.id !== id))
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao excluir pelada'
            setError(message)
          }
        } : undefined}
      />
    </Container>
  )
}
